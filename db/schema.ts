import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  bigint,
  json,
  boolean,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const organizations = mysqlTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  ownerId: bigint("ownerId", { mode: "number", unsigned: true }).notNull(),
  apiKey: varchar("apiKey", { length: 512 }),
  claudeApiKey: varchar("claudeApiKey", { length: 512 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Organization = typeof organizations.$inferSelect;

export const organizationMembers = mysqlTable("organization_members", {
  id: serial("id").primaryKey(),
  organizationId: bigint("organizationId", { mode: "number", unsigned: true }).notNull(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  role: mysqlEnum("role", ["owner", "admin", "member"]).default("member").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrganizationMember = typeof organizationMembers.$inferSelect;

export const targets = mysqlTable("targets", {
  id: serial("id").primaryKey(),
  organizationId: bigint("organizationId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 2048 }).notNull(),
  type: mysqlEnum("type", ["web", "api", "infrastructure", "docker"]).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  lastScanAt: timestamp("lastScanAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Target = typeof targets.$inferSelect;

export const scans = mysqlTable("scans", {
  id: serial("id").primaryKey(),
  organizationId: bigint("organizationId", { mode: "number", unsigned: true }).notNull(),
  targetId: bigint("targetId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", [
    "security",
    "performance",
    "infrastructure",
    "chaos",
    "comprehensive"
  ]).notNull(),
  status: mysqlEnum("status", [
    "pending",
    "running",
    "completed",
    "failed",
    "cancelled"
  ]).default("pending").notNull(),
  progress: int("progress").default(0).notNull(),
  config: json("config").$type<Record<string, unknown>>(),
  results: json("results").$type<Record<string, unknown>>(),
  aiAnalysis: text("aiAnalysis"),
  summary: text("summary"),
  severityCounts: json("severityCounts").$type<{
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  }>(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Scan = typeof scans.$inferSelect;

export const vulnerabilities = mysqlTable("vulnerabilities", {
  id: serial("id").primaryKey(),
  scanId: bigint("scanId", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low", "info"]).notNull(),
  category: varchar("category", { length: 255 }),
  cweId: varchar("cweId", { length: 50 }),
  owaspCategory: varchar("owaspCategory", { length: 255 }),
  evidence: text("evidence"),
  remediation: text("remediation"),
  cvssScore: int("cvssScore"),
  location: varchar("location", { length: 2048 }),
  status: mysqlEnum("status", ["open", "fixed", "false_positive", "accepted"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Vulnerability = typeof vulnerabilities.$inferSelect;

export const findings = mysqlTable("findings", {
  id: serial("id").primaryKey(),
  scanId: bigint("scanId", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 255 }),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low", "info"]).notNull(),
  details: json("details").$type<Record<string, unknown>>(),
  recommendation: text("recommendation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Finding = typeof findings.$inferSelect;

export const reports = mysqlTable("reports", {
  id: serial("id").primaryKey(),
  organizationId: bigint("organizationId", { mode: "number", unsigned: true }).notNull(),
  scanId: bigint("scanId", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["executive", "technical", "compliance"]).notNull(),
  content: text("content"),
  pdfUrl: varchar("pdfUrl", { length: 2048 }),
  generatedBy: bigint("generatedBy", { mode: "number", unsigned: true }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;

export const apiTokens = mysqlTable("api_tokens", {
  id: serial("id").primaryKey(),
  organizationId: bigint("organizationId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  token: varchar("token", { length: 512 }).notNull().unique(),
  scopes: json("scopes").$type<string[]>(),
  lastUsedAt: timestamp("lastUsedAt"),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApiToken = typeof apiTokens.$inferSelect;

export const activityLogs = mysqlTable("activity_logs", {
  id: serial("id").primaryKey(),
  organizationId: bigint("organizationId", { mode: "number", unsigned: true }),
  userId: bigint("userId", { mode: "number", unsigned: true }),
  action: varchar("action", { length: 255 }).notNull(),
  entityType: varchar("entityType", { length: 100 }),
  entityId: bigint("entityId", { mode: "number", unsigned: true }),
  details: json("details").$type<Record<string, unknown>>(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
