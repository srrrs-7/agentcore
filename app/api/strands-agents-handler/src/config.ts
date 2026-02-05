import { getAwsRegion } from "@packages/aws-config";

export const REGION = getAwsRegion();

export const AGENT_ID = process.env.BEDROCK_AGENT_ID || "";
export const AGENT_ALIAS_ID = process.env.BEDROCK_AGENT_ALIAS_ID || "";
export const EMBEDDING_MODEL_ID =
  process.env.BEDROCK_EMBEDDING_MODEL_ID || "amazon.titan-embed-text-v2:0";
