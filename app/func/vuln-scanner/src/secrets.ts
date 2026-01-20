import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";

const ssm = new SSMClient({});
const cache = new Map<string, { value: string; expiry: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const getSecret = async (name: string): Promise<string> => {
  const cacheKey = name;
  const cached = cache.get(cacheKey);

  if (cached && cached.expiry > Date.now()) {
    return cached.value;
  }

  const command = new GetParameterCommand({
    Name: `/vuln-scanner/${name}`,
    WithDecryption: true,
  });

  const response = await ssm.send(command);
  const value = response.Parameter?.Value;

  if (!value) {
    throw new Error(`Secret not found: ${name}`);
  }

  cache.set(cacheKey, {
    value,
    expiry: Date.now() + CACHE_TTL_MS,
  });

  return value;
};
