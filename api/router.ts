import { authRouter } from "./auth-router";
import { createRouter, publicQuery } from "./middleware";
import { organizationRouter } from "./routers/organization";
import { targetRouter } from "./routers/target";
import { scanRouter } from "./routers/scan";
import { aiRouter } from "./routers/ai";
import { dashboardRouter } from "./routers/dashboard";
import { reportRouter } from "./routers/report";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  organization: organizationRouter,
  target: targetRouter,
  scan: scanRouter,
  ai: aiRouter,
  dashboard: dashboardRouter,
  report: reportRouter,
});

export type AppRouter = typeof appRouter;
