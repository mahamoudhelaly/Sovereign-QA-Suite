import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  Target,
  AlertTriangle,
  Activity,
  TrendingUp,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400",
  running: "bg-blue-500/15 text-blue-400 animate-pulse",
  completed: "bg-green-500/15 text-green-400",
  failed: "bg-red-500/15 text-red-400",
  cancelled: "bg-slate-500/15 text-slate-400",
};

export default function Dashboard() {
  // Use a default org ID for demo - in production this would come from context
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery({ orgId: 1 });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Overview of your security testing activity and findings
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Scans"
          value={stats?.totalScans ?? 0}
          icon={<Activity className="h-5 w-5 text-blue-400" />}
          trend="+12%"
        />
        <StatCard
          title="Active Scans"
          value={stats?.activeScans ?? 0}
          icon={<Clock className="h-5 w-5 text-yellow-400" />}
          subtitle="Currently running"
        />
        <StatCard
          title="Targets"
          value={stats?.totalTargets ?? 0}
          icon={<Target className="h-5 w-5 text-green-400" />}
          trend="+3 this week"
        />
        <StatCard
          title="Vulnerabilities"
          value={stats?.totalVulnerabilities ?? 0}
          icon={<AlertTriangle className="h-5 w-5 text-red-400" />}
          subtitle="Across all scans"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Breakdown */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-primary" />
              Severity Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats?.severityBreakdown ?? {}).map(
                ([severity, count]) => (
                  <div key={severity} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize text-muted-foreground">
                        {severity}
                      </span>
                      <span className="font-medium text-foreground">
                        {count as number}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          severity === "critical"
                            ? "bg-red-500"
                            : severity === "high"
                            ? "bg-orange-500"
                            : severity === "medium"
                            ? "bg-yellow-500"
                            : severity === "low"
                            ? "bg-blue-500"
                            : "bg-slate-500"
                        }`}
                        style={{
                          width: `${
                            stats?.totalVulnerabilities
                              ? (((count as number) /
                                  stats.totalVulnerabilities) *
                                  100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )
              )}
              {Object.keys(stats?.severityBreakdown ?? {}).length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No vulnerability data yet. Run your first security scan!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scan Type Distribution */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-primary" />
              Scan Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats?.scanTypeDistribution ?? {}).map(
                ([type, count]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-primary/60" />
                      <span className="text-sm capitalize text-foreground">
                        {type} Scan
                      </span>
                    </div>
                    <Badge variant="outline" className="bg-secondary/50">
                      {count as number}
                    </Badge>
                  </div>
                )
              )}
              {Object.keys(stats?.scanTypeDistribution ?? {}).length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No scans performed yet. Start scanning to see distribution!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Scans */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-primary" />
            Recent Scans
          </CardTitle>
          <Link
            to="/security"
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
          >
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats?.recentScans?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No scans yet. Create your first scan to get started!
              </div>
            )}
            {stats?.recentScans?.map((scan) => (
              <div
                key={scan.id}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/20 p-4 hover:bg-secondary/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {scan.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                      {scan.type} Scan
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {scan.status === "running" && (
                    <div className="w-32">
                      <Progress value={scan.progress} className="h-2" />
                      <p className="text-[10px] text-muted-foreground mt-1 text-center">
                        {scan.progress}%
                      </p>
                    </div>
                  )}
                  <Badge
                    variant="outline"
                    className={statusColors[scan.status] ?? ""}
                  >
                    {scan.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  trend,
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: string;
  subtitle?: string;
}) {
  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground tracking-tight">
              {value}
            </p>
            {trend && (
              <p className="text-xs text-green-400 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </p>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
