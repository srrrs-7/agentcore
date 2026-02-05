export const getAwsRegion = (): string =>
  process.env.AWS_REGION || "ap-northeast-1";
