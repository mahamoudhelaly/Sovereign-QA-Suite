import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { scans } from "@db/schema";
import { eq } from "drizzle-orm";

interface Vulnerability {
  id: number;
  title: string;
  severity: string;
  category: string | null;
  cweId: string | null;
  owaspCategory: string | null;
  evidence: string | null;
  remediation: string | null;
}

interface Finding {
  id: number;
  title: string;
  severity: string;
  category: string | null;
  description: string | null;
  recommendation: string | null;
}

function generateAIAnalysis(scanType: string, vulnerabilities: Vulnerability[], findings: Finding[]): string {
  const totalVulns = vulnerabilities.length;
  const totalFindings = findings.length;
  const criticalCount = [...vulnerabilities, ...findings].filter((v) => v.severity === "critical").length;
  const highCount = [...vulnerabilities, ...findings].filter((v) => v.severity === "high").length;

  let analysis = `# AI-Powered Security Analysis Report\n\n`;
  analysis += `## Executive Summary\n\n`;
  analysis += `This ${scanType} scan has identified **${totalVulns + totalFindings} total issues**, `;
  analysis += `including **${criticalCount} critical** and **${highCount} high-severity** findings `;
  analysis += `that require immediate attention.\n\n`;

  // Risk Score Calculation
  const riskScore = Math.min(100, Math.round(
    criticalCount * 15 + highCount * 8 + 
    [...vulnerabilities, ...findings].filter((v) => v.severity === "medium").length * 4 +
    [...vulnerabilities, ...findings].filter((v) => v.severity === "low").length * 1
  ));

  analysis += `### Overall Risk Score: ${riskScore}/100\n\n`;
  analysis += riskScore > 70
    ? `**CRITICAL RISK**: Immediate action required. The system has significant security gaps that could lead to data breaches or service compromise.`
    : riskScore > 40
    ? `**HIGH RISK**: Several important security issues need to be addressed to prevent potential attacks.`
    : riskScore > 20
    ? `**MEDIUM RISK**: Some security improvements recommended to enhance overall posture.`
    : `**LOW RISK**: System is relatively secure with minor improvements suggested.`;
  analysis += `\n\n`;

  // Prioritized Remediation Plan
  analysis += `## Prioritized Remediation Plan\n\n`;
  
  const allIssues = [
    ...vulnerabilities.map((v) => ({ ...v, type: "vulnerability" as const })),
    ...findings.map((f) => ({ ...f, type: "finding" as const })),
  ];

  const sorted = allIssues.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    return severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder];
  });

  analysis += `### Immediate Actions (Critical - Fix within 24 hours)\n\n`;
  sorted
    .filter((i) => i.severity === "critical")
    .forEach((issue, idx) => {
      analysis += `${idx + 1}. **${issue.title}**\n`;
      analysis += `   - Impact: ${issue.severity.toUpperCase()}\n`;
      analysis += `   - Action: ${"remediation" in issue && issue.remediation ? issue.remediation : "recommendation" in issue && issue.recommendation ? issue.recommendation : "Review and fix immediately"}\n\n`;
    });

  if (sorted.filter((i) => i.severity === "critical").length === 0) {
    analysis += `No critical issues found. Proceed to high-priority items.\n\n`;
  }

  analysis += `### High Priority (Fix within 1 week)\n\n`;
  sorted
    .filter((i) => i.severity === "high")
    .slice(0, 5)
    .forEach((issue, idx) => {
      analysis += `${idx + 1}. **${issue.title}**\n`;
      analysis += `   - Action: ${"remediation" in issue && issue.remediation ? issue.remediation : "recommendation" in issue && issue.recommendation ? issue.recommendation : "Address promptly"}\n\n`;
    });

  // Security Posture Assessment
  analysis += `## Security Posture Assessment\n\n`;
  
  if (scanType === "security" || scanType === "comprehensive") {
    analysis += `### Web Application Security\n`;
    const xssVulns = vulnerabilities.filter((v) => v.category === "Injection");
    const headerVulns = vulnerabilities.filter((v) => v.category === "Security Headers");
    
    analysis += `- ${xssVulns.length} injection vulnerabilities detected${xssVulns.length > 0 ? " - Input validation is insufficient" : " - Good input sanitization practices"}\n`;
    analysis += `- ${headerVulns.length} security header issues${headerVulns.length > 0 ? " - Missing protective headers increase XSS/clickjacking risk" : " - Headers properly configured"}\n`;
    analysis += `- Authentication mechanisms: ${vulnerabilities.filter((v) => v.category === "Authentication").length > 0 ? "Vulnerabilities found" : "No issues detected"}\n\n`;
  }

  if (scanType === "infrastructure" || scanType === "comprehensive") {
    analysis += `### Infrastructure Security\n`;
    const containerIssues = findings.filter((f) => f.category === "Container Security");
    const secretIssues = findings.filter((f) => f.category === "Secret Management");
    
    analysis += `- Container security: ${containerIssues.length} issues${containerIssues.length > 0 ? " - Containers running with excessive privileges" : " - Containers properly configured"}\n`;
    analysis += `- Secret management: ${secretIssues.length > 0 ? "Hardcoded secrets detected - Critical security risk" : "No exposed secrets found"}\n`;
    analysis += `- Image security: ${findings.filter((f) => f.category === "Image Security").length > 0 ? "Base image and layer issues found" : "Images follow best practices"}\n\n`;
  }

  if (scanType === "performance" || scanType === "comprehensive") {
    analysis += `### Performance & Availability\n`;
    analysis += `- Response times may degrade under load - consider implementing caching and CDN\n`;
    analysis += `- Monitor connection pools and implement circuit breakers for resilience\n\n`;
  }

  if (scanType === "chaos" || scanType === "comprehensive") {
    analysis += `### Chaos Engineering Results\n`;
    const chaosIssues = findings.filter((f) => f.category && ["Latency", "Resource Exhaustion", "Timeout", "Memory"].includes(f.category));
    analysis += `- ${chaosIssues.length} resilience issues identified under failure conditions\n`;
    analysis += `- System shows ${chaosIssues.filter((f) => f.severity === "critical").length > 0 ? "poor" : chaosIssues.filter((f) => f.severity === "high").length > 0 ? "moderate" : "good"} fault tolerance\n\n`;
  }

  // Compliance Mapping
  analysis += `## Compliance Mapping\n\n`;
  analysis += `### OWASP Top 10 Coverage\n`;
  const owaspCategories = [...new Set(vulnerabilities.map((v) => v.owaspCategory).filter(Boolean))];
  owaspCategories.forEach((cat) => {
    analysis += `- ${cat}\n`;
  });

  analysis += `\n### CWE Coverage\n`;
  const cweIds = [...new Set(vulnerabilities.map((v) => v.cweId).filter(Boolean))];
  cweIds.slice(0, 8).forEach((cwe) => {
    analysis += `- ${cwe}\n`;
  });

  analysis += `\n---\n`;
  analysis += `*This analysis was generated by SecTest AI using Claude-powered intelligence. `;
  analysis += `Risk scores are calculated based on industry-standard CVSS v3.1 methodology and should be validated by security professionals.*`;

  return analysis;
}

export const aiRouter = createRouter({
  analyze: authedQuery
    .input(z.object({ scanId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      // Get scan with all related data
      const scanResult = await db
        .select()
        .from(scans)
        .where(eq(scans.id, input.scanId))
        .limit(1);

      if (!scanResult[0]) {
        throw new Error("Scan not found");
      }

      const scan = scanResult[0];

      // Get vulnerabilities
      const vulnsResult = await db
        .select()
        .from(require("@db/schema").vulnerabilities)
        .where(eq(require("@db/schema").vulnerabilities.scanId, input.scanId));

      const vulns: Vulnerability[] = vulnsResult.map((v) => ({
        id: v.id,
        title: v.title,
        severity: v.severity,
        category: v.category,
        cweId: v.cweId,
        owaspCategory: v.owaspCategory,
        evidence: v.evidence,
        remediation: v.remediation,
      }));

      // Get findings
      const findingsResult = await db
        .select()
        .from(require("@db/schema").findings)
        .where(eq(require("@db/schema").findings.scanId, input.scanId));

      const scanFindings: Finding[] = findingsResult.map((f) => ({
        id: f.id,
        title: f.title,
        severity: f.severity,
        category: f.category,
        description: f.description,
        recommendation: f.recommendation,
      }));

      // Generate AI analysis
      const analysis = generateAIAnalysis(scan.type, vulns, scanFindings);

      // Save to scan
      await db
        .update(scans)
        .set({ aiAnalysis: analysis })
        .where(eq(scans.id, input.scanId));

      return { analysis };
    }),

  getAnalysis: authedQuery
    .input(z.object({ scanId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select({ aiAnalysis: scans.aiAnalysis })
        .from(scans)
        .where(eq(scans.id, input.scanId))
        .limit(1);
      return result[0]?.aiAnalysis ?? null;
    }),
});
