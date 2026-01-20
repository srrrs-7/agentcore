import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_TIMESTAMP_DIFF_SECONDS = 300; // 5 minutes

export const verifySlackSignature = (
  signingSecret: string,
  signature: string,
  timestamp: string,
  body: string,
): boolean => {
  // Replay attack prevention
  const now = Math.floor(Date.now() / 1000);
  const requestTimestamp = parseInt(timestamp, 10);

  if (Number.isNaN(requestTimestamp)) {
    return false;
  }

  if (Math.abs(now - requestTimestamp) > MAX_TIMESTAMP_DIFF_SECONDS) {
    return false;
  }

  // Generate signature
  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature = `v0=${createHmac("sha256", signingSecret)
    .update(sigBasestring)
    .digest("hex")}`;

  // Timing-safe comparison
  try {
    return timingSafeEqual(
      Buffer.from(mySignature, "utf8"),
      Buffer.from(signature, "utf8"),
    );
  } catch {
    return false;
  }
};
