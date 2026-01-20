import type {
  SlackBlock,
  SlackResponse,
  VulnerabilityResult,
} from "../types.js";

const severityEmoji: Record<string, string> = {
  CRITICAL: "🔴",
  HIGH: "🟠",
  MEDIUM: "🟡",
  LOW: "🟢",
  UNKNOWN: "⚪",
};

export const createLoadingResponse = (): SlackResponse => ({
  response_type: "ephemeral",
  text: "🔍 調査中です...",
});

export const createErrorResponse = (message: string): SlackResponse => ({
  response_type: "ephemeral",
  text: `❌ エラー: ${message}`,
});

export const createInvalidInputResponse = (): SlackResponse => ({
  response_type: "ephemeral",
  text: "❌ 無効な入力です。CVE-ID（例: CVE-2024-1234）またはパッケージ名を入力してください。",
});

export const createResultResponse = (
  result: VulnerabilityResult,
): SlackResponse => {
  const emoji =
    severityEmoji[result.severity.toUpperCase()] || severityEmoji.UNKNOWN;
  const title = result.cveId || result.packageName || "脆弱性調査結果";

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `🔍 ${title}`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*📋 概要:*\n${result.summary}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${emoji} 影響度:* ${result.severity}${result.cvssScore ? ` (CVSS: ${result.cvssScore})` : ""}`,
      },
    },
  ];

  if (result.affectedVersions.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*📦 影響バージョン:*\n${result.affectedVersions.map((v) => `• ${v}`).join("\n")}`,
      },
    });
  }

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*✅ 推奨対策:*\n${result.recommendation}`,
    },
  });

  return {
    response_type: "in_channel",
    blocks,
  };
};

export const createAgentResponse = (agentOutput: string): SlackResponse => ({
  response_type: "in_channel",
  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: agentOutput,
      },
    },
  ],
});
