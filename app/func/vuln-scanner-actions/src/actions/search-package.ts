import { logger } from "@packages/logger";
import type {
  OsvQueryRequest,
  OsvQueryResponse,
  OsvVulnerability,
} from "../types.js";

const OSV_API_BASE = "https://api.osv.dev/v1/query";

export interface PackageVulnerability {
  id: string;
  summary: string;
  severity: string;
  affectedVersions: string[];
  fixedVersion: string | null;
}

export interface PackageSearchResult {
  packageName: string;
  ecosystem: string;
  vulnerabilities: PackageVulnerability[];
}

const extractSeverity = (vuln: OsvVulnerability): string => {
  if (vuln.severity && vuln.severity.length > 0) {
    const cvss = vuln.severity.find((s) => s.type === "CVSS_V3");
    if (cvss) {
      const score = parseFloat(cvss.score);
      if (score >= 9.0) return "CRITICAL";
      if (score >= 7.0) return "HIGH";
      if (score >= 4.0) return "MEDIUM";
      return "LOW";
    }
  }
  return "UNKNOWN";
};

const extractVersionInfo = (
  vuln: OsvVulnerability,
  packageName: string,
): { affected: string[]; fixed: string | null } => {
  const affected: string[] = [];
  let fixed: string | null = null;

  for (const affectedPkg of vuln.affected) {
    if (affectedPkg.package.name.toLowerCase() === packageName.toLowerCase()) {
      if (affectedPkg.versions) {
        affected.push(...affectedPkg.versions.slice(0, 5));
      }
      if (affectedPkg.ranges) {
        for (const range of affectedPkg.ranges) {
          for (const event of range.events) {
            if (event.fixed) {
              fixed = event.fixed;
            }
          }
        }
      }
    }
  }

  return { affected, fixed };
};

export const searchPackage = async (
  packageName: string,
  ecosystem = "npm",
): Promise<PackageSearchResult> => {
  const requestBody: OsvQueryRequest = {
    package: {
      name: packageName,
      ecosystem,
    },
  };

  logger.info({ event: "osv_api_request", packageName, ecosystem });

  const response = await fetch(OSV_API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    logger.error({
      event: "osv_api_error",
      status: response.status,
      statusText: response.statusText,
    });
    return {
      packageName,
      ecosystem,
      vulnerabilities: [],
    };
  }

  const data: OsvQueryResponse = await response.json();

  if (!data.vulns || data.vulns.length === 0) {
    logger.info({ event: "osv_api_no_results", packageName });
    return {
      packageName,
      ecosystem,
      vulnerabilities: [],
    };
  }

  const vulnerabilities: PackageVulnerability[] = data.vulns
    .slice(0, 10) // Limit to 10 vulnerabilities
    .map((vuln) => {
      const versionInfo = extractVersionInfo(vuln, packageName);
      return {
        id: vuln.id,
        summary: vuln.summary || vuln.details?.slice(0, 200) || "No summary",
        severity: extractSeverity(vuln),
        affectedVersions: versionInfo.affected,
        fixedVersion: versionInfo.fixed,
      };
    });

  logger.info({
    event: "osv_api_success",
    packageName,
    vulnerabilityCount: vulnerabilities.length,
  });

  return {
    packageName,
    ecosystem,
    vulnerabilities,
  };
};
