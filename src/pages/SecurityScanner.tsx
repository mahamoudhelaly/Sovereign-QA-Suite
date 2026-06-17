import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Play,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";

const severityConfig: Record<string, { color: string; icon: typeof AlertTriangle }> = {
  critical: { color: "text-red-400 bg-red-500/10 border-red-500/20", icon: AlertTriangle },
  high: { color: "text-orange-400 bg-orange-500/10 border-orange-500/20", icon: AlertTriangle },
  medium: { color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: AlertTriangle },
  low: { color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: CheckCircle2 },
  info: { color: "text-slate-400 bg-slate-500/10 border-slate-500/20", icon: CheckCircle2 },
};

export default function SecurityScanner() {
  const [targetUrl, setTargetUrl] = useState("");
  const [scanName, setScanName] = useState("");
  const [selectedScan, setSelectedScan] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const utils = trpc.useUtils();
  const { data: scans } = trpc.scan.list.useQuery({ orgId: 1 });
  const { data: scanDetails } = trpc.scan.get.useQuery(
    { id: selectedScan! },
    { enabled: !!selectedScan }
  );

  const createScan = trpc.scan.create.useMutation({
    onSuccess: () => {
      utils.scan.list.invalidate();
      setTargetUrl("");
      setScanName("");
    },
  });

  const analyzeScan = trpc.ai.analyze.useMutation({
    onSuccess: () => {
      utils.scan.get.invalidate({ id: selectedScan! });
    },
  });

  const handleStartScan = () => {
    if (!targetUrl || !scanName) return;
    createScan.mutate({
      orgId: 1,
      targetId: 1, // Default target
      name: scanName,
      type: "security",
      config: { url: targetUrl },
    });
  };

  const handleCopyConfig = (config: string) => {
    navigator.clipboard.writeText(config);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Security Scanner
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Automated vulnerability scanning powered by ZAP/Burp Suite integration.
            Scan web applications for OWASP Top 10, misconfigurations, and security headers.
          </p>
        </div>
      </div>

      {/* New Scan Form */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Play className="h-4.5 w-4.5 text-primary" />
            New Security Scan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Scan name (e.g., Production API Scan)"
              value={scanName}
              onChange={(e) => setScanName(e.target.value)}
              className="flex-1 bg-secondary border-border"
            />
            <Input
              placeholder="https://example.com"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="flex-[2] bg-secondary border-border"
            />
            <Button
              onClick={handleStartScan}
              disabled={!targetUrl || !scanName || createScan.isPending}
              className="bg-primary hover:bg-primary/90 gap-2"
            >
              {createScan.isPending ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Start Scan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scans List & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scans List */}
        <Card className="lg:col-span-1 bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Scan History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="space-y-1 px-4 pb-4">
                {scans?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No scans yet. Start your first scan above!
                  </div>
                )}
                {scans?.map((scan) => (
                  <button
                    key={scan.id}
                    onClick={() => setSelectedScan(scan.id)}
                    className={`w-full text-left rounded-lg p-3 transition-all ${
                      selectedScan === scan.id
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-secondary/50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-foreground truncate">
                        {scan.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          scan.status === "completed"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : scan.status === "running"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : scan.status === "failed"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        }
                      >
                        {scan.status}
                      </Badge>
                    </div>
                    {scan.status === "running" && (
                      <Progress value={scan.progress} className="h-1.5 mb-2" />
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="capitalize">{scan.type}</span>
                      <span>
                        {scan.createdAt
                          ? new Date(scan.createdAt).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Scan Details */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Scan Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedScan ? (
              <div className="flex flex-col items-center justify-center h-[500px] text-center">
                <Shield className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  Select a scan to view detailed results
                </p>
              </div>
            ) : scanDetails?.status === "running" ? (
              <div className="flex flex-col items-center justify-center h-[500px] text-center">
                <Progress value={scanDetails.progress} className="w-64 h-3 mb-6" />
                <p className="text-foreground font-medium">
                  Scan in progress... {scanDetails.progress}%
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  Analyzing target for vulnerabilities
                </p>
              </div>
            ) : (
              <Tabs defaultValue="vulnerabilities" className="w-full">
                <TabsList className="bg-secondary border border-border mb-4">
                  <TabsTrigger value="vulnerabilities" className="gap-2">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Vulnerabilities ({scanDetails?.vulnerabilities?.length ?? 0})
                  </TabsTrigger>
                  <TabsTrigger value="hardening" className="gap-2">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Hardening
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="gap-2">
                    <Shield className="h-3.5 w-3.5" />
                    AI Analysis
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="vulnerabilities" className="mt-0">
                  <ScrollArea className="h-[450px]">
                    <div className="space-y-3">
                      {scanDetails?.vulnerabilities?.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          No vulnerabilities found
                        </div>
                      )}
                      {scanDetails?.vulnerabilities?.map((vuln) => {
                        const config = severityConfig[vuln.severity];
                        const Icon = config?.icon ?? AlertTriangle;
                        return (
                          <div
                            key={vuln.id}
                            className="rounded-lg border border-border/50 bg-secondary/20 p-4 hover:bg-secondary/40 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Icon
                                  className={`h-4 w-4 ${
                                    vuln.severity === "critical" ||
                                    vuln.severity === "high"
                                      ? "text-red-400"
                                      : "text-yellow-400"
                                  }`}
                                />
                                <h4 className="text-sm font-semibold text-foreground">
                                  {vuln.title}
                                </h4>
                              </div>
                              <Badge
                                variant="outline"
                                className={config?.color ?? ""}
                              >
                                {vuln.severity}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-3">
                              {vuln.description}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {vuln.cweId && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-secondary/50"
                                >
                                  {vuln.cweId}
                                </Badge>
                              )}
                              {vuln.owaspCategory && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-secondary/50"
                                >
                                  {vuln.owaspCategory}
                                </Badge>
                              )}
                              {vuln.category && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-secondary/50"
                                >
                                  {vuln.category}
                                </Badge>
                              )}
                            </div>
                            {vuln.evidence && (
                              <div className="rounded bg-background/50 p-2 mb-2">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                                  Evidence
                                </p>
                                <p className="text-xs text-foreground font-mono">
                                  {vuln.evidence}
                                </p>
                              </div>
                            )}
                            {vuln.remediation && (
                              <div className="rounded bg-green-500/5 border border-green-500/10 p-2">
                                <p className="text-[10px] text-green-400 uppercase tracking-wider mb-1">
                                  Remediation
                                </p>
                                <p className="text-xs text-foreground">
                                  {vuln.remediation}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="hardening" className="mt-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-foreground">
                        Apache Security Hardening Configuration
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCopyConfig(
                            (scanDetails?.results as any)?.security
                              ?.hardeningConfig ?? ""
                          )
                        }
                        className="gap-2"
                      >
                        {copied ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {copied ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                    <ScrollArea className="h-[400px]">
                      <pre className="rounded-lg bg-background/80 border border-border p-4 text-xs font-mono text-foreground overflow-x-auto">
                        {(scanDetails?.results as any)?.security
                          ?.hardeningConfig ??
                          "Run a security scan to generate hardening configuration"}
                      </pre>
                    </ScrollArea>
                  </div>
                </TabsContent>

                <TabsContent value="ai" className="mt-0">
                  <div className="space-y-4">
                    {!scanDetails?.aiAnalysis ? (
                      <div className="flex flex-col items-center justify-center h-[400px] text-center">
                        <Shield className="h-12 w-12 text-primary/30 mb-4" />
                        <p className="text-foreground font-medium mb-2">
                          AI Analysis Not Generated
                        </p>
                        <p className="text-muted-foreground text-sm mb-4 max-w-md">
                          Generate an AI-powered analysis to get prioritized
                          remediation recommendations and risk assessment.
                        </p>
                        <Button
                          onClick={() =>
                            analyzeScan.mutate({ scanId: selectedScan })
                          }
                          disabled={analyzeScan.isPending}
                          className="gap-2"
                        >
                          {analyzeScan.isPending ? (
                            <Clock className="h-4 w-4 animate-spin" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                          Generate AI Analysis
                        </Button>
                      </div>
                    ) : (
                      <ScrollArea className="h-[450px]">
                        <div className="prose prose-invert prose-sm max-w-none">
                          {scanDetails.aiAnalysis
                            .split("\n")
                            .map((line, i) => {
                              if (line.startsWith("# ")) {
                                return (
                                  <h1
                                    key={i}
                                    className="text-xl font-bold text-foreground mt-4 mb-2"
                                  >
                                    {line.replace("# ", "")}
                                  </h1>
                                );
                              }
                              if (line.startsWith("## ")) {
                                return (
                                  <h2
                                    key={i}
                                    className="text-lg font-semibold text-foreground mt-4 mb-2"
                                  >
                                    {line.replace("## ", "")}
                                  </h2>
                                );
                              }
                              if (line.startsWith("### ")) {
                                return (
                                  <h3
                                    key={i}
                                    className="text-base font-medium text-primary mt-3 mb-1"
                                  >
                                    {line.replace("### ", "")}
                                  </h3>
                                );
                              }
                              if (line.startsWith("- ")) {
                                return (
                                  <li
                                    key={i}
                                    className="text-sm text-muted-foreground ml-4"
                                  >
                                    {line.replace("- ", "")}
                                  </li>
                                );
                              }
                              if (line.startsWith("**") && line.endsWith("**")) {
                                return (
                                  <p
                                    key={i}
                                    className="text-sm font-semibold text-foreground my-2"
                                  >
                                    {line.replace(/\*\*/g, "")}
                                  </p>
                                );
                              }
                              if (line.trim() === "") {
                                return <div key={i} className="h-2" />;
                              }
                              if (line.startsWith("---")) {
                                return (
                                  <Separator
                                    key={i}
                                    className="my-4 bg-border"
                                  />
                                );
                              }
                              return (
                                <p
                                  key={i}
                                  className="text-sm text-muted-foreground leading-relaxed"
                                >
                                  {line.replace(/\*\*/g, "").replace(/\*/g, "")}
                                </p>
                              );
                            })}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
