import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { organizations, organizationMembers } from "@db/schema";
import { eq, and } from "drizzle-orm";

export const organizationRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    const memberOrgs = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        description: organizations.description,
        role: organizationMembers.role,
        isActive: organizations.isActive,
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .innerJoin(
        organizationMembers,
        eq(organizationMembers.organizationId, organizations.id)
      )
      .where(eq(organizationMembers.userId, userId));

    return memberOrgs;
  }),

  getBySlug: authedQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const org = await db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, input.slug))
        .limit(1);

      if (!org[0]) return null;

      const member = await db
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, org[0].id),
            eq(organizationMembers.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!member[0]) return null;

      return {
        ...org[0],
        role: member[0].role,
      };
    }),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        slug: z.string().min(1).max(255),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const existing = await db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, input.slug))
        .limit(1);

      if (existing[0]) {
        throw new Error("Organization slug already exists");
      }

      const [org] = await db.insert(organizations).values({
        name: input.name,
        slug: input.slug,
        description: input.description,
        ownerId: ctx.user.id,
      });

      const orgId = Number(org.insertId);

      await db.insert(organizationMembers).values({
        organizationId: orgId,
        userId: ctx.user.id,
        role: "owner",
      });

      return { id: orgId, ...input };
    }),

  updateApiKeys: authedQuery
    .input(
      z.object({
        orgId: z.number(),
        claudeApiKey: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const member = await db
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, input.orgId),
            eq(organizationMembers.userId, ctx.user.id),
            and(
              eq(organizationMembers.role, "owner"),
              eq(organizationMembers.role, "admin")
            )
          )
        )
        .limit(1);

      if (!member[0]) {
        throw new Error("Not authorized to update API keys");
      }

      await db
        .update(organizations)
        .set({
          claudeApiKey: input.claudeApiKey,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, input.orgId));

      return { success: true };
    }),
});
