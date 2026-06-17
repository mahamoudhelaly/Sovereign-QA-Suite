import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { scans, vulnerabilities, targets } from "@db/schema";
import { eq, and, count, desc, sql } from "drizzle-orm";

export const dashboardRouter = createRouter({
  stats: authedQuery
    .input(z.object({ orgId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const totalScans = await db
        .select({ count: count() })
        .from(scans)
        .where(eq(scans.organizationId, input.orgId));

      const activeScans = await db
        .select({ count: count() })
        .from(scans)
        .where(
          and(
            eq(scans.organizationId, input.orgId),
            eq(scans.status, "running")
          )
        );

      const totalTargets = await db
        .select({ count: count() })
        .from(targets)
        .where(eq(targets.organizationId, input.orgId));

      const vulnsCount = await db
        .select({ count: count() })
        .from(vulnerabilities)
        .innerJoin(scans, eq(vulnerabilities.scanId, scans.id))
        .where(eq(scans.organizationId, input.orgId));

      const recentScans = await db
        .select()
        .from(scans)
        .where(eq(scans.organizationId, input.orgId))
        .orderBy(desc(scans.createdAt))
        .limit(10);

      // Severity breakdown
      const severityData = await db
        .select({
          severity: vulnerabilities.severity,
          count: count(),
        })
        .from(vulnerabilities)
        .innerJoin(scans, eq(vulnerabilities.scanId, scans.id))
        .where(eq(scans.organizationId, input.orgId))
        .groupBy(vulnerabilities.severity);

      // Scan type distribution
      const scanTypeData = await db
        .select({
          type: scans.type,
          count: count(),
        })
        .from(scans)
        .where(eq(scans.organizationId, input.orgId))
        .groupBy(scans.type);

      // Monthly scan activity (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyActivity = await db
        .select({
          month: sql<string>`DATE_FORMAT(${scans.createdAt}, '%Y-%m')`,
          count: count(),
        })
        .from(scans)
        .where(
          and(
            eq(scans.organizationId, input.orgId),
            sql`${scans.createdAt} >= ${sixMonthsAgo}`
          )
        )
        .groupBy(sql`DATE_FORMAT(${scans.createdAt}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${scans.createdAt}, '%Y-%m')`);

      return {
        totalScans: totalScans[0]?.count ?? 0,
        activeScans: activeScans[0]?.count ?? 0,
        totalTargets: totalTargets[0]?.count ?? 0,
        totalVulnerabilities: vulnsCount[0]?.count ?? 0,
        recentScans,
        severityBreakdown: severityData.reduce(
          (acc, curr) => ({ ...acc, [curr.severity]: curr.count }),
          {}
        ),
        scanTypeDistribution: scanTypeData.reduce(
          (acc, curr) => ({ ...acc, [curr.type]: curr.count }),
          {}
        ),
        monthlyActivity,
      };
    }),
});
