import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { scans, vulnerabilities, findings, targets } from "@db/schema";
import { eq, desc } from "drizzle-orm";

// Scan engine: simulates security, performance, infrastructure, and chaos testing
// In production, these would integrate with actual ZAP, k6, Docker, and chaos tools

function generateSecurityVulnerabilities(targetUrl: string): Array<{
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: string;
  cweId: string;
  owaspCategory: string;
  evidence: string;
  remediation: string;
  cvssScore: number;
  location: string;
}> {
  const vulns = [
    {
      title: "Missing Content Security Policy Header",
      description: "The application does not set the Content-Security-Policy header, which helps prevent XSS and data injection attacks.",
      severity: "high" as const,
      category: "Security Headers",
      cweId: "CWE-693",
      owaspCategory: "A05:2021 - Security Misconfiguration",
      evidence: "Header 'Content-Security-Policy' is not present in HTTP response",
      remediation: "Implement a strict CSP header: Content-Security-Policy: default-src 'self'; script-src 'self';",
      cvssScore: 74,
      location: `${targetUrl}/`,
    },
    {
      title: "Clickjacking - Missing X-Frame-Options",
      description: "The page can be embedded in an iframe, allowing clickjacking attacks where users are tricked into clicking hidden elements.",
      severity: "medium" as const,
      category: "Security Headers",
      cweId: "CWE-1021",
      owaspCategory: "A01:2021 - Broken Access Control",
      evidence: "Headers X-Frame-Options and Content-Security-Policy frame-ancestors directive are missing",
      remediation: "Add X-Frame-Options: DENY or SAMEORIGIN header to all responses",
      cvssScore: 43,
      location: `${targetUrl}/`,
    },
    {
      title: "Insecure SSL/TLS Configuration",
      description: "The server supports outdated TLS versions (1.0/1.1) or weak cipher suites that could allow eavesdropping.",
      severity: "high" as const,
      category: "Transport Layer",
      cweId: "CWE-326",
      owaspCategory: "A02:2021 - Cryptographic Failures",
      evidence: "TLS 1.0 and TLS 1.1 enabled; RC4 and 3DES cipher suites supported",
      remediation: "Disable TLS 1.0/1.1, enable only TLS 1.2+ with strong cipher suites",
      cvssScore: 71,
      location: targetUrl,
    },
    {
      title: "Directory Listing Enabled",
      description: "Web server is configured to show directory listings, exposing files and directories to unauthorized access.",
      severity: "medium" as const,
      category: "Information Disclosure",
      cweId: "CWE-548",
      owaspCategory: "A01:2021 - Broken Access Control",
      evidence: "GET /images/ returns HTML directory listing instead of 403 Forbidden",
      remediation: "Disable directory listing in web server configuration (Options -Indexes in Apache)",
      cvssScore: 35,
      location: `${targetUrl}/images/`,
    },
    {
      title: "Sensitive Information in URL Parameters",
      description: "Potentially sensitive data is being transmitted via URL parameters which may be logged in browser history and server logs.",
      severity: "medium" as const,
      category: "Information Disclosure",
      cweId: "CWE-598",
      owaspCategory: "A01:2021 - Broken Access Control",
      evidence: "Email parameter found in URL: /reset-password?email=user@example.com",
      remediation: "Use POST requests with body parameters for sensitive data transmission",
      cvssScore: 38,
      location: `${targetUrl}/reset-password`,
    },
    {
      title: "Missing HTTP Strict Transport Security (HSTS)",
      description: "No HSTS header is set, allowing the connection to be downgraded from HTTPS to HTTP.",
      severity: "low" as const,
      category: "Security Headers",
      cweId: "CWE-319",
      owaspCategory: "A02:2021 - Cryptographic Failures",
      evidence: "Strict-Transport-Security header not found in response",
      remediation: "Add Strict-Transport-Security: max-age=31536000; includeSubDomains header",
      cvssScore: 21,
      location: `${targetUrl}/`,
    },
    {
      title: "Server Version Disclosure",
      description: "The HTTP Server header reveals the exact version of the web server software being used.",
      severity: "low" as const,
      category: "Information Disclosure",
      cweId: "CWE-200",
      owaspCategory: "A05:2021 - Security Misconfiguration",
      evidence: "Server: Apache/2.4.41 (Ubuntu)",
      remediation: "Configure ServerTokens Prod and ServerSignature Off in Apache",
      cvssScore: 18,
      location: `${targetUrl}/`,
    },
    {
      title: "Cross-Site Scripting (XSS) - Reflected",
      description: "User input is reflected in the page response without proper sanitization, allowing script injection.",
      severity: "critical" as const,
      category: "Injection",
      cweId: "CWE-79",
      owaspCategory: "A03:2021 - Injection",
      evidence: "Payload <script>alert(1)</script> reflected in search results page",
      remediation: "Implement output encoding (HTML entity encoding) for all user-supplied data",
      cvssScore: 89,
      location: `${targetUrl}/search?q=<script>alert(1)</script>`,
    },
    {
      title: "SQL Injection in Login Form",
      description: "The login form is vulnerable to SQL injection, allowing authentication bypass and data extraction.",
      severity: "critical" as const,
      category: "Injection",
      cweId: "CWE-89",
      owaspCategory: "A03:2021 - Injection",
      evidence: "Username: admin' OR '1'='1' -- resulted in successful authentication",
      remediation: "Use parameterized queries/prepared statements for all database operations",
      cvssScore: 92,
      location: `${targetUrl}/login`,
    },
    {
      title: "Insecure Cookie Configuration",
      description: "Session cookies are missing the Secure, HttpOnly, and SameSite attributes.",
      severity: "high" as const,
      category: "Session Management",
      cweId: "CWE-1004",
      owaspCategory: "A07:2021 - Identification and Authentication Failures",
      evidence: "Set-Cookie: sessionid=abc123; (missing Secure, HttpOnly, SameSite flags)",
      remediation: "Set all cookies with Secure, HttpOnly, and SameSite=Strict attributes",
      cvssScore: 68,
      location: `${targetUrl}/login`,
    },
    {
      title: "Weak Password Policy",
      description: "The application allows weak passwords that can be easily guessed or brute-forced.",
      severity: "medium" as const,
      category: "Authentication",
      cweId: "CWE-521",
      owaspCategory: "A07:2021 - Identification and Authentication Failures",
      evidence: "Password '123456' accepted during registration",
      remediation: "Enforce minimum 12 characters with mixed case, numbers, and special characters",
      cvssScore: 42,
      location: `${targetUrl}/register`,
    },
    {
      title: "Missing Rate Limiting on Authentication",
      description: "No rate limiting on login attempts allows brute-force attacks against user accounts.",
      severity: "high" as const,
      category: "Authentication",
      cweId: "CWE-307",
      owaspCategory: "A07:2021 - Identification and Authentication Failures",
      evidence: "1000 login attempts completed in 30 seconds without any blocking",
      remediation: "Implement account lockout after 5 failed attempts and add CAPTCHA",
      cvssScore: 72,
      location: `${targetUrl}/login`,
    },
    {
      title: "Information Disclosure in Error Messages",
      description: "Error messages reveal stack traces and internal system details that aid attackers.",
      severity: "low" as const,
      category: "Information Disclosure",
      cweId: "CWE-209",
      owaspCategory: "A05:2021 - Security Misconfiguration",
      evidence: "500 error returned with full SQL query and file paths: /var/www/app/models/User.php",
      remediation: "Implement custom error pages that do not expose system information",
      cvssScore: 22,
      location: `${targetUrl}/api/users`,
    },
    {
      title: "Unvalidated Redirects and Forwards",
      description: "Open redirect vulnerability allows attackers to redirect users to malicious sites.",
      severity: "medium" as const,
      category: "Input Validation",
      cweId: "CWE-601",
      owaspCategory: "A01:2021 - Broken Access Control",
      evidence: "Parameter ?redirect=https://evil.com accepted and executed redirect",
      remediation: "Validate redirect URLs against an allowlist or use relative paths only",
      cvssScore: 45,
      location: `${targetUrl}/login?redirect=https://evil.com`,
    },
    {
      title: "Missing Anti-CSRF Tokens",
      description: "State-changing forms lack CSRF protection, allowing attackers to perform actions on behalf of authenticated users.",
      severity: "high" as const,
      category: "Session Management",
      cweId: "CWE-352",
      owaspCategory: "A01:2021 - Broken Access Control",
      evidence: "POST /change-email does not require any CSRF token",
      remediation: "Implement synchronizer token pattern or double-submit cookie pattern",
      cvssScore: 76,
      location: `${targetUrl}/change-email`,
    },
  ];

  // Return a random subset (8-12 vulns) for variety
  const shuffled = [...vulns].sort(() => Math.random() - 0.5);
  const count = 8 + Math.floor(Math.random() * 5);
  return shuffled.slice(0, count);
}

function generatePerformanceMetrics() {
  return {
    latency: {
      p50: 45 + Math.random() * 80,
      p95: 180 + Math.random() * 300,
      p99: 350 + Math.random() * 500,
      min: 12 + Math.random() * 20,
      max: 800 + Math.random() * 1200,
      mean: 60 + Math.random() * 100,
    },
    throughput: {
      rps: 150 + Math.random() * 850,
      rpm: 12000 + Math.random() * 48000,
    },
    errors: {
      rate: Math.random() * 2.5,
      count: Math.floor(Math.random() * 45),
      types: ["timeout", "connection_refused", "500_internal_error", "502_bad_gateway"],
    },
    saturation: {
      cpuPercent: 30 + Math.random() * 60,
      memoryPercent: 40 + Math.random() * 45,
      diskIO: 10 + Math.random() * 30,
      networkIO: 20 + Math.random() * 50,
    },
    apdex: 0.7 + Math.random() * 0.25,
    slaCompliance: 85 + Math.random() * 14,
  };
}

function generateInfrastructureFindings() {
  return [
    {
      title: "Container Running as Root User",
      description: "The Dockerfile does not specify a USER instruction, causing the container to run as root. This violates the principle of least privilege.",
      category: "Container Security",
      severity: "critical" as const,
      details: {
        line: 1,
        rule: "DS002",
        file: "Dockerfile",
      },
      recommendation: "Add 'USER appuser' after creating a non-root user with 'RUN useradd -m appuser'",
    },
    {
      title: "Sensitive Data Exposed in Environment Variables",
      description: "Hardcoded secrets (API keys, database passwords) found in Dockerfile ENV instructions.",
      category: "Secret Management",
      severity: "critical" as const,
      details: {
        line: 8,
        rule: "DS001",
        file: "Dockerfile",
        secret: "DATABASE_PASSWORD",
      },
      recommendation: "Use Docker secrets or external secret management (Vault, AWS Secrets Manager)",
    },
    {
      title: "Using Latest Tag for Base Image",
      description: "The FROM instruction uses 'latest' tag which can lead to unpredictable builds and security issues.",
      category: "Image Security",
      severity: "medium" as const,
      details: {
        line: 1,
        rule: "DL3007",
        file: "Dockerfile",
      },
      recommendation: "Pin to a specific version: FROM node:18.17.1-alpine3.18",
    },
    {
      title: "Missing HEALTHCHECK Instruction",
      description: "No health check defined to monitor container health status.",
      category: "Container Security",
      severity: "low" as const,
      details: {
        line: 0,
        rule: "DL3057",
        file: "Dockerfile",
      },
      recommendation: "Add: HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:8080/health",
    },
    {
      title: "Using ADD Instead of COPY",
      description: "ADD instruction has more complex behavior than COPY and can fetch remote URLs or auto-extract archives.",
      category: "Best Practices",
      severity: "info" as const,
      details: {
        line: 12,
        rule: "DL3020",
        file: "Dockerfile",
      },
      recommendation: "Replace ADD with COPY for local files: COPY . /app",
    },
    {
      title: "No .dockerignore File Present",
      description: "Without .dockerignore, sensitive files (.env, .git, node_modules) may be included in the build context.",
      category: "Image Security",
      severity: "high" as const,
      details: {
        line: 0,
        rule: "DS003",
        file: ".dockerignore",
      },
      recommendation: "Create .dockerignore with: .git, .env, node_modules, *.pem, .vscode",
    },
    {
      title: "apt-get update Without rm -rf /var/lib/apt/lists",
      description: "Layer caching leaves package lists in the image, increasing size and attack surface.",
      category: "Image Security",
      severity: "low" as const,
      details: {
        line: 15,
        rule: "DL3009",
        file: "Dockerfile",
      },
      recommendation: "Combine commands: RUN apt-get update && apt-get install -y ... && rm -rf /var/lib/apt/lists/*",
    },
    {
      title: "Writable /tmp Directory Without nosuid,noexec",
      description: "The /tmp directory is writable without restrictions, which could be exploited for privilege escalation.",
      category: "Filesystem Security",
      severity: "medium" as const,
      details: {
        line: 22,
        rule: "DS004",
        file: "Dockerfile",
      },
      recommendation: "Mount tmpfs with: --tmpfs /tmp:noexec,nosuid,size=100m",
    },
  ];
}

function generateChaosResults() {
  return [
    {
      title: "High Latency Under Load Spike",
      description: "System response time increased by 340% when traffic spiked to 5x normal load.",
      category: "Latency",
      severity: "high" as const,
      details: {
        test: "latency_injection",
        baseline: "45ms",
        result: "198ms",
        degradation: "340%",
      },
      recommendation: "Implement circuit breaker pattern and auto-scaling policies",
    },
    {
      title: "Connection Pool Exhaustion",
      description: "Database connections were exhausted under sustained 3x load, causing cascading failures.",
      category: "Resource Exhaustion",
      severity: "critical" as const,
      details: {
        test: "connection_pool_stress",
        poolSize: 20,
        peakConnections: 47,
        failedRequests: 234,
      },
      recommendation: "Increase connection pool size, implement connection retry with backoff",
    },
    {
      title: "Partial Degradation on Network Partition",
      description: "When network partition occurred between services, the system partially degraded instead of failing gracefully.",
      category: "Network",
      severity: "medium" as const,
      details: {
        test: "network_partition",
        partitionDuration: "30s",
        affectedServices: ["payment-service", "notification-service"],
      },
      recommendation: "Implement fallback mechanisms and retry policies for inter-service calls",
    },
    {
      title: "Memory Leak Detected Under Sustained Load",
      description: "Memory usage increased steadily from 180MB to 890MB over 2 hours without decreasing.",
      category: "Memory",
      severity: "high" as const,
      details: {
        test: "memory_stress",
        baselineMB: 180,
        peakMB: 890,
        duration: "2h",
      },
      recommendation: "Review code for unclosed connections, event listeners, or large object retention",
    },
    {
      title: "Timeout Cascade Failure",
      description: "Slow upstream service (5s delay) caused timeout cascade affecting 3 downstream services.",
      category: "Timeout",
      severity: "critical" as const,
      details: {
        test: "timeout_injection",
        timeout: "5s",
        affectedServices: 3,
        errorRate: "78%",
      },
      recommendation: "Implement bulkhead pattern with separate thread pools per dependency",
    },
    {
      title: "Disk I/O Saturation",
      description: "Disk I/O reached 98% saturation during log write operations under load.",
      category: "Disk",
      severity: "medium" as const,
      details: {
        test: "disk_stress",
        ioSaturation: "98%",
        affectedOperations: ["logging", "temp-file-creation"],
      },
      recommendation: "Implement async logging, log rotation, and separate log volumes",
    },
    {
      title: "DNS Resolution Failure Handling",
      description: "System handled DNS resolution failures gracefully with proper fallback to cached entries.",
      category: "DNS",
      severity: "info" as const,
      details: {
        test: "dns_failure",
        fallbackBehavior: "cache_hit",
        recoveryTime: "5s",
      },
      recommendation: "Maintain current DNS caching strategy; consider adding multiple DNS resolver endpoints",
    },
  ];
}

function generateApacheHardeningConfig(): string {
  return `# Apache 2.4 Security Hardening Configuration
# Generated by SecTest AI

# === Core Security ===
ServerTokens Prod
ServerSignature Off
TraceEnable Off

# === TLS Configuration ===
SSLEngine on
SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
SSLCipherSuite ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256
SSLHonorCipherOrder on
SSLCompression off

# === Headers ===
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"

# === Request Limits ===
LimitRequestBody 10485760
LimitRequestFields 50
LimitRequestFieldSize 8190
LimitRequestLine 8190

# === Timeout Settings ===
Timeout 30
KeepAliveTimeout 5
RequestReadTimeout header=20-40,MinRate=500 body=20,MinRate=500

# === DoS Protection ===
<IfModule mod_evasive24.c>
    DOSHashTableSize 2048
    DOSPageCount 20
    DOSSiteCount 100
    DOSPageInterval 1
    DOSSiteInterval 1
    DOSBlockingPeriod 10
    DOSEmailNotify admin@example.com
</IfModule>

# === Rate Limiting ===
<IfModule mod_ratelimit.c>
    SetOutputFilter RATE_LIMIT
    SetEnv rate-limit 400
</IfModule>

# === Directory Hardening ===
<Directory />
    Options -Indexes -FollowSymLinks
    AllowOverride None
    Require all denied
</Directory>

<Directory /var/www/html>
    Options -Indexes -FollowSymLinks
    AllowOverride None
    Require all granted
</Directory>

# === Disable Unnecessary Methods ===
<Location />
    <LimitExcept GET POST HEAD>
        Require all denied
    </LimitExcept>
</Location>`;
}

export const scanRouter = createRouter({
  list: authedQuery
    .input(z.object({ orgId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(scans)
        .where(eq(scans.organizationId, input.orgId))
        .orderBy(desc(scans.createdAt));
    }),

  get: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const scanResult = await db
        .select()
        .from(scans)
        .where(eq(scans.id, input.id))
        .limit(1);

      if (!scanResult[0]) return null;

      const vulns = await db
        .select()
        .from(vulnerabilities)
        .where(eq(vulnerabilities.scanId, input.id));

      const scanFindings = await db
        .select()
        .from(findings)
        .where(eq(findings.scanId, input.id));

      return {
        ...scanResult[0],
        vulnerabilities: vulns,
        findings: scanFindings,
      };
    }),

  create: authedQuery
    .input(
      z.object({
        orgId: z.number(),
        targetId: z.number(),
        name: z.string().min(1),
        type: z.enum(["security", "performance", "infrastructure", "chaos", "comprehensive"]),
        config: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(scans).values({
        organizationId: input.orgId,
        targetId: input.targetId,
        name: input.name,
        type: input.type,
        status: "pending",
        progress: 0,
        config: input.config ?? {},
      });

      const scanId = Number(result.insertId);

      // Start async scan simulation
      setTimeout(() => runScanSimulation(scanId, input.type), 100);

      return { id: scanId };
    }),

  cancel: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(scans)
        .set({ status: "cancelled" })
        .where(eq(scans.id, input.id));
      return { success: true };
    }),
});

async function runScanSimulation(scanId: number, scanType: string) {
  const db = getDb();

  try {
    await db
      .update(scans)
      .set({ status: "running", startedAt: new Date() })
      .where(eq(scans.id, scanId));

    // Get scan details to find target
    const scanResult = await db
      .select()
      .from(scans)
      .where(eq(scans.id, scanId))
      .limit(1);
    
    if (!scanResult[0]) return;
    const scan = scanResult[0];

    // Get target URL
    const targetResult = await db
      .select()
      .from(targets)
      .where(eq(targets.id, scan.targetId))
      .limit(1);
    
    const targetUrl = targetResult[0]?.url ?? "https://example.com";

    let progress = 0;
    const totalSteps = 10;

    for (let step = 0; step < totalSteps; step++) {
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 1000));
      progress = Math.round(((step + 1) / totalSteps) * 100);
      await db
        .update(scans)
        .set({ progress })
        .where(eq(scans.id, scanId));
    }

    let results: Record<string, unknown> = {};
    let severityCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };

    if (scanType === "security" || scanType === "comprehensive") {
      const vulns = generateSecurityVulnerabilities(targetUrl);
      for (const v of vulns) {
        await db.insert(vulnerabilities).values({
          scanId,
          ...v,
          status: "open",
        });
        severityCounts[v.severity]++;
      }
      results.security = {
        totalVulnerabilities: vulns.length,
        hardeningConfig: generateApacheHardeningConfig(),
      };
    }

    if (scanType === "performance" || scanType === "comprehensive") {
      const metrics = generatePerformanceMetrics();
      const perfFindings = [
        {
          title: metrics.latency.p95 > 200 ? "High P95 Latency Detected" : "Latency Within Acceptable Range",
          description: `P95 latency is ${metrics.latency.p95.toFixed(1)}ms. ${metrics.latency.p95 > 200 ? "This exceeds the recommended 200ms threshold for web applications." : "Performance is within acceptable parameters."}`,
          category: "Performance",
          severity: (metrics.latency.p95 > 200 ? "high" : metrics.latency.p95 > 100 ? "medium" : "info") as "critical" | "high" | "medium" | "low" | "info",
          details: { metrics },
          recommendation: metrics.latency.p95 > 200
            ? "Implement caching layer (Redis/Memcached), optimize database queries, and consider CDN for static assets"
            : "Continue monitoring and maintain current optimization strategies",
        },
      ];

      for (const f of perfFindings) {
        await db.insert(findings).values({ scanId, ...f });
        severityCounts[f.severity]++;
      }

      results.performance = metrics;
    }

    if (scanType === "infrastructure" || scanType === "comprehensive") {
      const infraFindings = generateInfrastructureFindings();
      for (const f of infraFindings) {
        await db.insert(findings).values({ scanId, ...f });
        severityCounts[f.severity]++;
      }
      results.infrastructure = {
        totalFindings: infraFindings.length,
        dockerfileCompliant: infraFindings.filter((f) => f.severity === "info" || f.severity === "low").length,
      };
    }

    if (scanType === "chaos" || scanType === "comprehensive") {
      const chaosFindings = generateChaosResults();
      for (const f of chaosFindings) {
        await db.insert(findings).values({ scanId, ...f });
        severityCounts[f.severity]++;
      }
      results.chaos = {
        totalTests: chaosFindings.length,
        passedTests: chaosFindings.filter((f) => f.severity === "info").length,
        failedTests: chaosFindings.filter((f) => f.severity !== "info").length,
      };
    }

    const summary = generateSummary(scanType, severityCounts, results);

    await db
      .update(scans)
      .set({
        status: "completed",
        progress: 100,
        results,
        severityCounts,
        summary,
        completedAt: new Date(),
      })
      .where(eq(scans.id, scanId));
  } catch (error) {
    await db
      .update(scans)
      .set({
        status: "failed",
        summary: `Scan failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        completedAt: new Date(),
      })
      .where(eq(scans.id, scanId));
  }
}

function generateSummary(
  scanType: string,
  severityCounts: Record<string, number>,
  results: Record<string, unknown>
): string {
  const totalIssues = Object.values(severityCounts).reduce((a, b) => a + b, 0);

  let summary = `Scan completed for ${scanType} assessment. `;
  summary += `Total findings: ${totalIssues}. `;
  summary += `Critical: ${severityCounts.critical}, High: ${severityCounts.high}, Medium: ${severityCounts.medium}, Low: ${severityCounts.low}, Info: ${severityCounts.info}. `;

  if (scanType === "security" || scanType === "comprehensive") {
    const sec = results.security as Record<string, unknown>;
    if (sec) summary += `Security scan identified ${sec.totalVulnerabilities} vulnerabilities. `;
  }

  if (scanType === "chaos" || scanType === "comprehensive") {
    const chaos = results.chaos as Record<string, unknown>;
    if (chaos) summary += `Chaos testing: ${chaos.passedTests}/${chaos.totalTests} tests passed. `;
  }

  return summary;
}
