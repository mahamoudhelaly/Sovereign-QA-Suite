import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  Shield,
  AlertTriangle,
  Clock,
  ChevronRight,
  Zap,
  FileText,
  Sparkles,
  TrendingUp,
  Target,
} from "lucide-react";

export default function AIAnalysis() {
  const [selectedScan, setSelectedScan] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: scans, isLoading } = trpc.scan.list.useQuery({ orgId: 1 });
  const completedScans = scans?.filter((s) => s.status === "completed");

  const { data: scanDetails } = trpc.scan.get.useQuery(
    { id: selectedScan! },
    { enabled: !!selectedScan }
  );

  const analyzeScan = trpc.ai.analyze.useMutation({
    onSuccess: () => {
      utils.scan.get.invalidate({ id: selectedScan! });
    },
  });

  const handleAnalyze = (scanId: number) => {
    setSelectedScan(scanId);
    analyzeScan.mutate({ scanId });
  };

  const handleViewAnalysis = (scanId: number) => {
    setSelectedScan(scanId);
  };

  // Parse severity counts for risk visualization
  const severityCounts = scanDetails?.severityCounts as Record<string, number> | undefined;
  const totalIssues = severityCounts
    ? Object.values(severityCounts).reduce((a, b) => a + b, 0)
    : 0;
  const riskScore = severityCounts
    ? Math.min(
        100,
        Math.round(
          (severityCounts.critical ?? 0) * 15 +
            (severityCounts.high ?? 0) * 8 +
            (severityCounts.medium ?? 0) * 4 +
            (severityCounts.low ?? 0) * 1
        )
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          AI Analysis
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Claude-powered intelligent analysis of your scan results. Get prioritized
          remediation recommendations, risk assessments, and executive summaries.
        </p>
      </div>

      {/* Info Banner */}
      <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Intelligent Security Analysis
            </p>
            <p className="text-xs text-muted-foreground">
              AI analyzes vulnerabilities, generates risk scores, and creates
              prioritized remediation plans based on industry best practices.
            </p>
          </div>
        </CardContent>
      </Card>

      {!selectedScan || !scanDetails ? (
        /* Scans Available for Analysis */
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Available Scans ({completedScans?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  Loading scans...
                </div>
              )}
              {!isLoading && completedScans?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No completed scans available. Run a scan first to generate AI analysis.
                </div>
              )}
              {completedScans?.map((scan) => (
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
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {scan.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {scan.createdAt
                            ? new Date(scan.createdAt).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {scan.aiAnalysis ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewAnalysis(scan.id)}
                        className="gap-2"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        View Analysis
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAnalyze(scan.id)}
                        disabled={
                          analyzeScan.isPending && selectedScan === scan.id
                        }
                        className="gap-2 bg-primary hover:bg-primary/90"
                      >
                        {analyzeScan.isPending && selectedScan === scan.id ? (
                          <Clock className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Brain className="h-3.5 w-3.5" />
                        )}
                        Analyze
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* AI Analysis Result */
        <div className="space-y-6">
          {/* Back Button */}
          <Button
            variant="outline"
            onClick={() => setSelectedScan(null)}
            className="gap-2"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back to Scans
          </Button>

          {/* Risk Score Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-border md:col-span-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Target className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Overall Risk Score
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Based on {totalIssues} findings
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-4xl font-bold ${
                        riskScore > 70
                          ? "text-red-400"
                          : riskScore > 40
                          ? "text-orange-400"
                          : riskScore > 20
                          ? "text-yellow-400"
                          : "text-green-400"
                      }`}
                    >
                      {riskScore}
                    </p>
                    <p className="text-xs text-muted-foreground">/100</p>
                  </div>
                </div>
                <div className="h-3 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      riskScore > 70
                        ? "bg-red-500"
                        : riskScore > 40
                        ? "bg-orange-500"
                        : riskScore > 20
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${riskScore}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {riskScore > 70
                    ? "CRITICAL: Immediate action required"
                    : riskScore > 40
                    ? "HIGH: Address within 1 week"
                    : riskScore > 20
                    ? "MEDIUM: Plan remediation within 1 month"
                    : "LOW: Continue monitoring"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-red-400">Critical</span>
                  <span className="text-sm font-bold text-foreground">
                    {severityCounts?.critical ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-orange-400">High</span>
                  <span className="text-sm font-bold text-foreground">
                    {severityCounts?.high ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-yellow-400">Medium</span>
                  <span className="text-sm font-bold text-foreground">
                    {severityCounts?.medium ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-400">Low</span>
                  <span className="text-sm font-bold text-foreground">
                    {severityCounts?.low ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Info</span>
                  <span className="text-sm font-bold text-foreground">
                    {severityCounts?.info ?? 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Analysis Content */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                {scanDetails.name} - AI Analysis
              </CardTitle>
              {!scanDetails.aiAnalysis && (
                <Button
                  size="sm"
                  onClick={() =>
                    analyzeScan.mutate({ scanId: selectedScan })
                  }
                  disabled={analyzeScan.isPending}
                  className="gap-2"
                >
                  {analyzeScan.isPending ? (
                    <Clock className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Zap className="h-3.5 w-3.5" />
                  )}
                  Generate Analysis
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {scanDetails.aiAnalysis ? (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-1">
                    {scanDetails.aiAnalysis
                      .split("\n")
                      .map((line, i) => {
                        if (line.startsWith("# ")) {
                          return (
                            <h1
                              key={i}
                              className="text-2xl font-bold text-foreground mt-6 mb-3"
                            >
                              {line.replace("# ", "")}
                            </h1>
                          );
                        }
                        if (line.startsWith("## ")) {
                          return (
                            <h2
                              key={i}
                              className="text-xl font-semibold text-foreground mt-5 mb-2 flex items-center gap-2"
                            >
                              {line.includes("Immediate") && (
                                <AlertTriangle className="h-5 w-5 text-red-400" />
                              )}
                              {line.includes("High Priority") && (
                                <TrendingUp className="h-5 w-5 text-orange-400" />
                              )}
                              {line.replace("## ", "")}
                            </h2>
                          );
                        }
                        if (line.startsWith("### ")) {
                          return (
                            <h3
                              key={i}
                              className="text-base font-medium text-primary mt-4 mb-2"
                            >
                              {line.replace("### ", "")}
                            </h3>
                          );
                        }
                        if (line.match(/^\d+\./)) {
                          return (
                            <div
                              key={i}
                              className="ml-4 my-1.5 text-sm text-foreground"
                            >
                              {line}
                            </div>
                          );
                        }
                        if (line.startsWith("- ")) {
                          return (
                            <li
                              key={i}
                              className="ml-6 my-1 text-sm text-muted-foreground list-disc"
                            >
                              {line.replace("- ", "")}
                            </li>
                          );
                        }
                        if (line.startsWith("**") && line.endsWith("**")) {
                          return (
                            <p
                              key={i}
                              className="text-sm font-semibold text-foreground my-2 bg-secondary/30 rounded px-2 py-1"
                            >
                              {line.replace(/\*\*/g, "")}
                            </p>
                          );
                        }
                        if (line.startsWith("---")) {
                          return (
                            <Separator
                              key={i}
                              className="my-4 bg-border"
                            />
                          );
                        }
                        if (line.trim() === "") {
                          return <div key={i} className="h-2" />;
                        }
                        return (
                          <p
                            key={i}
                            className="text-sm text-muted-foreground leading-relaxed my-1"
                          >
                            {line.replace(/\*\*/g, "").replace(/\*/g, "")}
                          </p>
                        );
                      })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                  <Brain className="h-16 w-16 text-muted-foreground/30 mb-4" />
                  <p className="text-foreground font-medium mb-2">
                    No AI Analysis Yet
                  </p>
                  <p className="text-muted-foreground text-sm max-w-md">
                    Click "Generate Analysis" to have Claude analyze this scan's
                    findings and provide prioritized recommendations.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
