import { logger } from "@packages/logger";
import type { NvdCveResponse } from "../types.js";

const NVD_API_BASE = "https://services.nvd.nist.gov/rest/json/cves/2.0";

export interface CveSearchResult {
  cveId: string;
  description: string;
  severity: string;
  cvssScore: number | null;
  affectedVersions: string[];
  published: string;
  lastModified: string;
}

export const searchCve = async (
  cveId: string,
): Promise<CveSearchResult | null> => {
  const url = `${NVD_API_BASE}?cveId=${encodeURIComponent(cveId)}`;

  logger.info({ event: "nvd_api_request", cveId, url });

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    logger.error({
      event: "nvd_api_error",
      status: response.status,
      statusText: response.statusText,
    });
    return null;
  }

  const data: NvdCveResponse = await response.json();

  if (data.totalResults === 0 || !data.vulnerabilities[0]) {
    logger.info({ event: "nvd_api_no_results", cveId });
    return null;
  }

  const vuln = data.vulnerabilities[0].cve;

  // Get English description
  const description =
    vuln.descriptions.find((d) => d.lang === "en")?.value ||
    vuln.descriptions[0]?.value ||
    "No description available";

  // Get CVSS score and severity
  const cvssMetric = vuln.metrics?.cvssMetricV31?.[0];
  const cvssScore = cvssMetric?.cvssData.baseScore ?? null;
  const severity = cvssMetric?.cvssData.baseSeverity ?? "UNKNOWN";

  // Extract affected versions from configurations
  const affectedVersions: string[] = [];
  if (vuln.configurations) {
    for (const config of vuln.configurations) {
      for (const node of config.nodes) {
        for (const match of node.cpeMatch) {
          if (match.vulnerable) {
            let versionInfo = match.criteria;
            if (match.versionEndExcluding) {
              versionInfo = `< ${match.versionEndExcluding}`;
            }
            if (match.versionStartIncluding && match.versionEndExcluding) {
              versionInfo = `${match.versionStartIncluding} - ${match.versionEndExcluding}`;
            }
            affectedVersions.push(versionInfo);
          }
        }
      }
    }
  }

  logger.info({
    event: "nvd_api_success",
    cveId,
    severity,
    cvssScore,
  });

  return {
    cveId: vuln.id,
    description,
    severity,
    cvssScore,
    affectedVersions: affectedVersions.slice(0, 10), // Limit to 10 entries
    published: vuln.published,
    lastModified: vuln.lastModified,
  };
};
