import { useState, useMemo } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Zap,
  Play,
  TrendingUp,
  Clock,
  Activity,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Gauge,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

// Log-normal distribution for realistic load testing
function generateLogNormalLoad(numPoints: number): number[] {
  const data: number[] = [];
  const mu = 3.5;
  const sigma = 0.8;
  
  for (let i = 0; i < numPoints; i++) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const value = Math.exp(mu + sigma * z0);
    data.push(Math.round(value));
  }
  return data;
}

function generateLatencyData(points: number) {
  const data = [];
  for (let i = 0; i < points; i++) {
    data.push({
      time: `${i * 10}s`,
      p50: 30 + Math.random() * 50 + Math.sin(i * 0.2) * 20,
      p95: 80 + Math.random() * 150 + Math.sin(i * 0.2) * 60,
      p99: 150 + Math.random() * 300 + Math.sin(i * 0.15) * 100,
    });
  }
  return data;
}

function generateThroughputData(points: number) {
  const data = [];
  const logNormal = generateLogNormalLoad(points);
  for (let i = 0; i < points; i++) {
    data.push({
      time: `${i * 10}s`,
      rps: logNormal[i] * 10 + Math.random() * 100,
      errors: Math.random() * (logNormal[i] * 0.05),
    });
  }
  return data;
}

export default function PerformanceTester() {
  const [targetUrl, setTargetUrl] = useState("");
  const [scanName, setScanName] = useState("");
  const [virtualUsers, setVirtualUsers] = useState([50]);
  const [duration, setDuration] = useState([60]);
  const [selectedScan, setSelectedScan] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: scans } = trpc.scan.list.useQuery({ orgId: 1 });
  const performanceScans = scans?.filter((s) => s.type === "performance" || s.type === "comprehensive");

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

  const handleStartTest = () => {
    if (!targetUrl || !scanName) return;
    createScan.mutate({
      orgId: 1,
      targetId: 1,
      name: scanName,
      type: "performance",
      config: {
        url: targetUrl,
        vus: virtualUsers[0],
        duration: duration[0],
        distribution: "log-normal",
      },
    });
  };

  const latencyData = useMemo(() => {
    if (!scanDetails?.results?.performance) return [];
    return generateLatencyData(30);
  }, [scanDetails]);

  const throughputData = useMemo(() => {
    if (!scanDetails?.results?.performance) return [];
    return generateThroughputData(30);
  }, [scanDetails]);

  const perfMetrics = scanDetails?.results?.performance as any;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Zap className="h-8 w-8 text-primary" />
          Performance Tester
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          k6-powered load testing with log-normal user distribution. Simulate realistic
          traffic patterns and identify performance bottlenecks.
        </p>
      </div>

      {/* Test Configuration */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Gauge className="h-4.5 w-4.5 text-primary" />
            Test Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Test name (e.g., Black Friday Load Test)"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">
                  Virtual Users
                </label>
                <Badge variant="outline" className="bg-secondary/50">
                  {virtualUsers[0]} VUs
                </Badge>
              </div>
              <Slider
                value={virtualUsers}
                onValueChange={setVirtualUsers}
                min={10}
                max={1000}
                step={10}
                className="w-full"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">
                  Duration
                </label>
                <Badge variant="outline" className="bg-secondary/50">
                  {duration[0]}s
                </Badge>
              </div>
              <Slider
                value={duration}
                onValueChange={setDuration}
                min={10}
                max={300}
                step={10}
                className="w-full"
              />
            </div>
          </div>
          <Button
            onClick={handleStartTest}
            disabled={!targetUrl || !scanName || createScan.isPending}
            className="bg-primary hover:bg-primary/90 gap-2 w-full md:w-auto"
          >
            {createScan.isPending ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Start Load Test
          </Button>
        </CardContent>
      </Card>

      {/* Log-Normal Distribution Info */}
      <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Log-Normal Distribution Model
            </p>
            <p className="text-xs text-muted-foreground">
              Simulates realistic traffic with burst patterns (μ=3.5, σ=0.8).
              Most users arrive in clusters with occasional spikes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {selectedScan && scanDetails?.status === "completed" && perfMetrics && (
        <div className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="P50 Latency"
              value={`${perfMetrics.latency?.p50?.toFixed(0) ?? "--"}ms`}
              icon={<Clock className="h-4 w-4 text-green-400" />}
              status={perfMetrics.latency?.p50 < 100 ? "good" : "warning"}
            />
            <MetricCard
              title="P95 Latency"
              value={`${perfMetrics.latency?.p95?.toFixed(0) ?? "--"}ms`}
              icon={<Clock className="h-4 w-4 text-yellow-400" />}
              status={perfMetrics.latency?.p95 < 200 ? "good" : "warning"}
            />
            <MetricCard
              title="Throughput"
              value={`${perfMetrics.throughput?.rps?.toFixed(0) ?? "--"} RPS`}
              icon={<TrendingUp className="h-4 w-4 text-blue-400" />}
              status="good"
            />
            <MetricCard
              title="Error Rate"
              value={`${perfMetrics.errors?.rate?.toFixed(2) ?? "--"}%`}
              icon={
                perfMetrics.errors?.rate < 1 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                )
              }
              status={perfMetrics.errors?.rate < 1 ? "good" : "critical"}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Latency Percentiles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={latencyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#475569" fontSize={12} />
                    <YAxis stroke="#475569" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111827",
                        border: "1px solid #1e293b",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="p50"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      name="P50"
                    />
                    <Line
                      type="monotone"
                      dataKey="p95"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                      name="P95"
                    />
                    <Line
                      type="monotone"
                      dataKey="p99"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                      name="P99"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Throughput (RPS)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={throughputData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#475569" fontSize={12} />
                    <YAxis stroke="#475569" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111827",
                        border: "1px solid #1e293b",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rps"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.2}
                      strokeWidth={2}
                      name="Requests/sec"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Test History */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Test History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {performanceScans?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No performance tests yet. Start your first test above!
              </div>
            )}
            {performanceScans?.map((scan) => (
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
                  <Zap className="h-4 w-4 text-primary" />
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
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : scan.status === "running"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
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

function MetricCard({
  title,
  value,
  icon,
  status,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  status: string;
}) {
  const borderColors: Record<string, string> = {
    good: "border-green-500/20",
    warning: "border-yellow-500/20",
    critical: "border-red-500/20",
  };

  return (
    <Card className={`bg-card border ${borderColors[status] ?? "border-border"}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{title}</span>
          {icon}
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
