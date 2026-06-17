import { relations } from "drizzle-orm";
import {
  users,
  organizations,
  organizationMembers,
  targets,
  scans,
  vulnerabilities,
  findings,
  reports,
  apiTokens,
  activityLogs,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  organizationMembers: many(organizationMembers),
  activityLogs: many(activityLogs),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  targets: many(targets),
  scans: many(scans),
  reports: many(reports),
  apiTokens: many(apiTokens),
  activityLogs: many(activityLogs),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
}));

export const targetsRelations = relations(targets, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [targets.organizationId],
    references: [organizations.id],
  }),
  scans: many(scans),
}));

export const scansRelations = relations(scans, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [scans.organizationId],
    references: [organizations.id],
  }),
  target: one(targets, {
    fields: [scans.targetId],
    references: [targets.id],
  }),
  vulnerabilities: many(vulnerabilities),
  findings: many(findings),
  reports: many(reports),
}));

export const vulnerabilitiesRelations = relations(vulnerabilities, ({ one }) => ({
  scan: one(scans, {
    fields: [vulnerabilities.scanId],
    references: [scans.id],
  }),
}));

export const findingsRelations = relations(findings, ({ one }) => ({
  scan: one(scans, {
    fields: [findings.scanId],
    references: [scans.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  scan: one(scans, {
    fields: [reports.scanId],
    references: [scans.id],
  }),
  organization: one(organizations, {
    fields: [reports.organizationId],
    references: [organizations.id],
  }),
}));

export const apiTokensRelations = relations(apiTokens, ({ one }) => ({
  organization: one(organizations, {
    fields: [apiTokens.organizationId],
    references: [organizations.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [activityLogs.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));
