import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { targets } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const targetRouter = createRouter({
  list: authedQuery
    .input(z.object({ orgId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(targets)
        .where(eq(targets.organizationId, input.orgId))
        .orderBy(desc(targets.createdAt));
    }),

  get: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(targets)
        .where(eq(targets.id, input.id))
        .limit(1);
      return result[0] ?? null;
    }),

  create: authedQuery
    .input(
      z.object({
        orgId: z.number(),
        name: z.string().min(1).max(255),
        url: z.string().url().max(2048),
        type: z.enum(["web", "api", "infrastructure", "docker"]),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(targets).values({
        organizationId: input.orgId,
        name: input.name,
        url: input.url,
        type: input.type,
        description: input.description,
      });
      return { id: Number(result.insertId) };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        url: z.string().url().max(2048).optional(),
        type: z.enum(["web", "api", "infrastructure", "docker"]).optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db
        .update(targets)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(targets.id, id));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(targets).where(eq(targets.id, input.id));
      return { success: true };
    }),
});
