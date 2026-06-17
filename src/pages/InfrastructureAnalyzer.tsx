import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Server,
  Play,
  AlertTriangle,
  CheckCircle2,
  Shield,
  FileCode2,
  Lock,
  Container,
  Clock,
  Copy,
  Check,
} from "lucide-react";

const severityConfig: Record<string, { color: string; bg: string }> = {
  critical: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  high: { color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  medium: { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  low: { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  info: { color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20" },
};

const categoryIcons: Record<string, typeof Server> = {
  "Container Security": Container,
  "Secret Management": Lock,
  "Image Security": Shield,
  "Best Practices": CheckCircle2,
  "Filesystem Security": Server,
};

export default function InfrastructureAnalyzer() {
  const [dockerfile, setDockerfile] = useState(`FROM node:latest

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
ENV DATABASE_PASSWORD=supersecret123
ENV API_KEY=sk-live-abcdef123456

RUN apt-get update && apt-get install -y curl

EXPOSE 3000
CMD ["node", "server.js"]`);
  const [scanName, setScanName] = useState("");
  const [selectedScan, setSelectedScan] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const utils = trpc.useUtils();
  const { data: scans } = trpc.scan.list.useQuery({ orgId: 1 });
  const infraScans = scans?.filter((s) => s.type === "infrastructure" || s.type === "comprehensive");

  const { data: scanDetails } = trpc.scan.get.useQuery(
    { id: selectedScan! },
    { enabled: !!selectedScan }
  );

  const createScan = trpc.scan.create.useMutation({
    onSuccess: (data) => {
      utils.scan.list.invalidate();
      setSelectedScan(data.id);
    },
  });

  const handleAnalyze = () => {
    if (!scanName) return;
    createScan.mutate({
      orgId: 1,
      targetId: 1,
      name: scanName,
      type: "infrastructure",
      config: { dockerfile },
    });
  };

  const findings = scanDetails?.findings ?? [];
  const groupedFindings = findings.reduce((acc, f) => {
    const cat = f.category ?? "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {} as Record<string, typeof findings>);

  const handleCopyDockerfile = () => {
    navigator.clipboard.writeText(dockerfile);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Server className="h-8 w-8 text-primary" />
          Infrastructure Analyzer
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Scan Dockerfiles and infrastructure configurations for security risks,
          secret leaks, privilege escalation, and compliance violations.
        </p>
      </div>

      {/* Dockerfile Input */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileCode2 className="h-4.5 w-4.5 text-primary" />
            Dockerfile Analysis
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyDockerfile}
            className="gap-2"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Analysis name (e.g., Production Dockerfile Audit)"
              value={scanName}
              onChange={(e) => setScanName(e.target.value)}
              className="flex-1 rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Button
              onClick={handleAnalyze}
              disabled={!scanName || createScan.isPending}
              className="bg-primary hover:bg-primary/90 gap-2"
            >
              {createScan.isPending ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Analyze
            </Button>
          </div>
          <Textarea
            value={dockerfile}
            onChange={(e) => setDockerfile(e.target.value)}
            className="min-h-[240px] font-mono text-xs bg-background border-border text-foreground leading-relaxed resize-y"
            spellCheck={false}
          />
        </CardContent>
      </Card>

      {/* Results */}
      {selectedScan && scanDetails?.status === "completed" && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(["critical", "high", "medium", "low", "info"] as const).map(
              (sev) => {
                const count = findings.filter((f) => f.severity === sev).length;
                const config = severityConfig[sev];
                return (
                  <Card
                    key={sev}
                    className={`bg-card border ${config.bg}`}
                  >
                    <CardContent className="p-3 text-center">
                      <p className={`text-2xl font-bold ${config.color}`}>
                        {count}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                        {sev}
                      </p>
                    </CardContent>
                  </Card>
                );
              }
            )}
          </div>

          {/* Findings by Category */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Findings by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={Object.keys(groupedFindings)[0]} className="w-full">
                <TabsList className="bg-secondary border border-border mb-4 flex-wrap h-auto">
                  {Object.keys(groupedFindings).map((cat) => {
                    const Icon = categoryIcons[cat] ?? Server;
                    return (
                      <TabsTrigger key={cat} value={cat} className="gap-2 text-xs">
                        <Icon className="h-3.5 w-3.5" />
                        {cat}
                        <Badge variant="outline" className="ml-1 text-[10px] h-4 px-1">
                          {groupedFindings[cat].length}
                        </Badge>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {Object.entries(groupedFindings).map(([cat, catFindings]) => (
                  <TabsContent key={cat} value={cat} className="mt-0">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {catFindings.map((finding) => {
                          const config = severityConfig[finding.severity];
                          return (
                            <div
                              key={finding.id}
                              className={`rounded-lg border p-4 ${config.bg}`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                  {finding.severity === "critical" ||
                                  finding.severity === "high" ? (
                                    <AlertTriangle className={`h-4 w-4 ${config.color}`} />
                                  ) : (
                                    <CheckCircle2 className={`h-4 w-4 ${config.color}`} />
                                  )}
                                  {finding.title}
                                </h4>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] ${config.bg}`}
                                >
                                  {finding.severity}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-3">
                                {finding.description}
                              </p>
                              {finding.details && (
                                <div className="rounded bg-background/50 p-2 mb-2">
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                                    Details
                                  </p>
                                  <pre className="text-xs font-mono text-foreground">
                                    {JSON.stringify(finding.details, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {finding.recommendation && (
                                <div className="rounded bg-green-500/5 border border-green-500/10 p-2">
                                  <p className="text-[10px] text-green-400 uppercase tracking-wider mb-1">
                                    Recommendation
                                  </p>
                                  <p className="text-xs text-foreground">
                                    {finding.recommendation}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scan History */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Analysis History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {infraScans?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No analyses yet. Start your first scan above!
              </div>
            )}
            {infraScans?.map((scan) => (
              <button
                key={scan.id}
                onClick={() => setSelectedScan(scan.id)}
                className={`w-full text-left rounded-lg p-3 transition-all flex items-center justify-between ${
                  selectedScan === scan.id
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-secondary/50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Server className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {scan.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {scan.createdAt
                        ? new Date(scan.createdAt).toLocaleDateString()
                        : ""}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    scan.status === "completed"
                      ? "bg-green-500/10 text-green-400"
                      : scan.status === "running"
                      ? "bg-blue-500/10 text-blue-400 animate-pulse"
                      : "bg-red-500/10 text-red-400"
                  }
                >
                  {scan.status}
                </Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
