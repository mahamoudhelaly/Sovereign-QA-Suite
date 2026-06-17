import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Flame,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Zap,
  Wifi,
  HardDrive,
  Timer,
  Database,
  XCircle,
} from "lucide-react";

const chaosTests = [
  {
    id: "latency_injection",
    name: "Latency Injection",
    description: "Introduce network delays to test system response under slow conditions",
    icon: Timer,
    category: "Network",
    defaultEnabled: true,
  },
  {
    id: "connection_pool_stress",
    name: "Connection Pool Exhaustion",
    description: "Overload database connection pools to test resource limits",
    icon: Database,
    category: "Resource",
    defaultEnabled: true,
  },
  {
    id: "network_partition",
    name: "Network Partition",
    description: "Simulate network splits between services",
    icon: Wifi,
    category: "Network",
    defaultEnabled: true,
  },
  {
    id: "memory_stress",
    name: "Memory Stress",
    description: "Gradually increase memory pressure to detect leaks",
    icon: HardDrive,
    category: "Resource",
    defaultEnabled: true,
  },
  {
    id: "timeout_injection",
    name: "Timeout Cascade",
    description: "Trigger cascading timeouts across service dependencies",
    icon: Zap,
    category: "Timeout",
    defaultEnabled: true,
  },
  {
    id: "disk_stress",
    name: "Disk I/O Saturation",
    description: "Saturate disk I/O to test logging and file operations",
    icon: HardDrive,
    category: "Resource",
    defaultEnabled: false,
  },
  {
    id: "dns_failure",
    name: "DNS Resolution Failure",
    description: "Simulate DNS failures to test fallback mechanisms",
    icon: Wifi,
    category: "Network",
    defaultEnabled: false,
  },
  {
    id: "cpu_stress",
    name: "CPU Pressure",
    description: "Apply sustained CPU load to test auto-scaling",
    icon: Activity,
    category: "Resource",
    defaultEnabled: false,
  },
];

const resultIcons: Record<string, typeof CheckCircle2> = {
  Latency: Timer,
  "Resource Exhaustion": Database,
  Network: Wifi,
  Memory: HardDrive,
  Timeout: Zap,
  Disk: HardDrive,
  DNS: Wifi,
};

export default function ChaosEngineering() {
  const [targetUrl, setTargetUrl] = useState("");
  const [scanName, setScanName] = useState("");
  const [selectedScan, setSelectedScan] = useState<number | null>(null);
  const [enabledTests, setEnabledTests] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(chaosTests.map((t) => [t.id, t.defaultEnabled]))
  );

  const utils = trpc.useUtils();
  const { data: scans } = trpc.scan.list.useQuery({ orgId: 1 });
  const chaosScans = scans?.filter((s) => s.type === "chaos" || s.type === "comprehensive");

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

  const toggleTest = (testId: string) => {
    setEnabledTests((prev) => ({ ...prev, [testId]: !prev[testId] }));
  };

  const handleStartExperiment = () => {
    if (!targetUrl || !scanName) return;
    createScan.mutate({
      orgId: 1,
      targetId: 1,
      name: scanName,
      type: "chaos",
      config: {
        url: targetUrl,
        enabledTests: Object.entries(enabledTests)
          .filter(([, v]) => v)
          .map(([k]) => k),
      },
    });
  };

  const findings = scanDetails?.findings ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Flame className="h-8 w-8 text-primary" />
          Chaos Engineering
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Test system resilience against real-world failure scenarios. Simulate
          latency spikes, resource exhaustion, network partitions, and cascading failures.
        </p>
      </div>

      {/* Experiment Configuration */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-primary" />
            Experiment Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Experiment name (e.g., Weekly Resilience Test)"
              value={scanName}
              onChange={(e) => setScanName(e.target.value)}
              className="bg-secondary border-border"
            />
            <Input
              placeholder="https://api.example.com"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          {/* Test Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {chaosTests.map((test) => {
              const Icon = test.icon;
              return (
                <div
                  key={test.id}
                  className={`flex items-center justify-between rounded-lg border p-3 transition-all ${
                    enabledTests[test.id]
                      ? "bg-primary/5 border-primary/30"
                      : "bg-secondary/20 border-border/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        enabledTests[test.id]
                          ? "bg-primary/10"
                          : "bg-secondary"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          enabledTests[test.id]
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {test.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {test.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={enabledTests[test.id] ?? false}
                    onCheckedChange={() => toggleTest(test.id)}
                  />
                </div>
              );
            })}
          </div>

          <Button
            onClick={handleStartExperiment}
            disabled={!targetUrl || !scanName || createScan.isPending}
            className="bg-primary hover:bg-primary/90 gap-2"
          >
            {createScan.isPending ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : (
              <Flame className="h-4 w-4" />
            )}
            Run Chaos Experiment
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {selectedScan && scanDetails?.status === "completed" && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard
              title="Tests Run"
              value={findings.length}
              icon={<Flame className="h-5 w-5 text-primary" />}
            />
            <SummaryCard
              title="Tests Passed"
              value={findings.filter((f) => f.severity === "info").length}
              icon={<CheckCircle2 className="h-5 w-5 text-green-400" />}
            />
            <SummaryCard
              title="Failures"
              value={findings.filter((f) => f.severity !== "info").length}
              icon={<XCircle className="h-5 w-5 text-red-400" />}
            />
          </div>

          {/* Findings */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Experiment Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px]">
                <div className="space-y-3">
                  {findings.map((finding) => {
                    const Icon = resultIcons[finding.category ?? ""] ?? AlertTriangle;
                    const isPass = finding.severity === "info";
                    return (
                      <div
                        key={finding.id}
                        className={`rounded-lg border p-4 ${
                          isPass
                            ? "bg-green-500/5 border-green-500/10"
                            : finding.severity === "critical"
                            ? "bg-red-500/5 border-red-500/10"
                            : finding.severity === "high"
                            ? "bg-orange-500/5 border-orange-500/10"
                            : "bg-yellow-500/5 border-yellow-500/10"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon
                              className={`h-4 w-4 ${
                                isPass ? "text-green-400" : "text-primary"
                              }`}
                            />
                            <h4 className="text-sm font-semibold text-foreground">
                              {finding.title}
                            </h4>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              isPass
                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                : finding.severity === "critical"
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : finding.severity === "high"
                                ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            }
                          >
                            {finding.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
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
                          <div className="rounded bg-primary/5 border border-primary/10 p-2">
                            <p className="text-[10px] text-primary uppercase tracking-wider mb-1">
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
            </CardContent>
          </Card>
        </div>
      )}

      {/* Experiment History */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Experiment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {chaosScans?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No experiments yet. Start your first chaos test above!
              </div>
            )}
            {chaosScans?.map((scan) => (
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
                  <Flame className="h-4 w-4 text-primary" />
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

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{title}</span>
          {icon}
        </div>
        <p className="text-3xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
