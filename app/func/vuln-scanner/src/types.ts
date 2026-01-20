export interface SlackSlashCommand {
  token: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  response_url: string;
  trigger_id: string;
}

export interface SlackResponse {
  response_type?: "in_channel" | "ephemeral";
  text?: string;
  blocks?: SlackBlock[];
}

export interface SlackBlock {
  type: string;
  text?: {
    type: "plain_text" | "mrkdwn";
    text: string;
    emoji?: boolean;
  };
  block_id?: string;
}

export type InputType = "cve" | "package" | "invalid";

export interface ValidationResult {
  type: InputType;
  value: string | null;
}

export interface VulnerabilityResult {
  cveId?: string;
  packageName?: string;
  summary: string;
  severity: string;
  cvssScore?: number;
  affectedVersions: string[];
  recommendation: string;
}
