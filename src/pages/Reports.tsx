import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Plus,
  Clock,
  Trash2,
  ChevronRight,
  FileCode2,
  Shield,
  Award,
} from "lucide-react";

const reportTypeConfig: Record<string, { icon: typeof FileText; label: string; color: string }> = {
  executive: { icon: Award, label: "Executive Summary", color: "text-purple-400 bg-purple-500/10" },
  technical: { icon: FileCode2, label: "Technical Report", color: "text-blue-400 bg-blue-500/10" },
  compliance: { icon: Shield, label: "Compliance Report", color: "text-green-400 bg-green-500/10" },
};

export default function Reports() {
  const [showNewReport, setShowNewReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>("executive");
  const [scanId, setScanId] = useState<string>("");

  const utils = trpc.useUtils();
  const { data: reports } = trpc.report.list.useQuery({ orgId: 1 });
  const { data: scans } = trpc.scan.list.useQuery({ orgId: 1 });
  const completedScans = scans?.filter((s) => s.status === "completed");

  const { data: reportDetails } = trpc.report.get.useQuery(
    { id: selectedReport! },
    { enabled: !!selectedReport }
  );

  const generateReport = trpc.report.generate.useMutation({
    onSuccess: () => {
      utils.report.list.invalidate();
      setShowNewReport(false);
      setTitle("");
      setScanId("");
    },
  });

  const deleteReport = trpc.report.delete.useMutation({
    onSuccess: () => {
      utils.report.list.invalidate();
      if (selectedReport) setSelectedReport(null);
    },
  });

  const handleGenerate = () => {
    if (!title || !type || !scanId) return;
    generateReport.mutate({
      orgId: 1,
      scanId: parseInt(scanId),
      title,
      type: type as "executive" | "technical" | "compliance",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Reports
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Generate and manage security reports. Create executive summaries,
            technical detail reports, and compliance assessments.
          </p>
        </div>
        <Button
          onClick={() => setShowNewReport(!showNewReport)}
          className="bg-primary hover:bg-primary/90 gap-2"
        >
          {showNewReport ? (
            <>
              <ChevronRight className="h-4 w-4 rotate-90" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              New Report
            </>
          )}
        </Button>
      </div>

      {/* New Report Form */}
      {showNewReport && (
        <Card className="bg-card border-border animate-fadeIn">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4.5 w-4.5 text-primary" />
              Generate New Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Report title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-secondary border-border"
              />
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="executive">Executive Summary</SelectItem>
                  <SelectItem value="technical">Technical Detail</SelectItem>
                  <SelectItem value="compliance">Compliance Assessment</SelectItem>
                </SelectContent>
              </Select>
              <Select value={scanId} onValueChange={setScanId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select scan" />
                </SelectTrigger>
                <SelectContent>
                  {completedScans?.map((scan) => (
                    <SelectItem key={scan.id} value={scan.id.toString()}>
                      {scan.name} ({scan.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={!title || !type || !scanId || generateReport.isPending}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              {generateReport.isPending ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Generate Report
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reports List & Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <Card className="lg:col-span-1 bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Generated Reports ({reports?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="space-y-1 px-4 pb-4">
                {reports?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No reports yet. Generate your first report!
                  </div>
                )}
                {reports?.map((report) => {
                  const config = reportTypeConfig[report.type];
                  const Icon = config?.icon ?? FileText;
                  return (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report.id)}
                      className={`w-full text-left rounded-lg p-3 transition-all ${
                        selectedReport === report.id
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-secondary/50 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${config?.color ?? ""}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {report.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[10px]">
                              {config?.label ?? report.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground ml-11">
                        {report.createdAt
                          ? new Date(report.createdAt).toLocaleDateString()
                          : ""}
                      </p>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Report Viewer */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Report Preview
            </CardTitle>
            {selectedReport && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteReport.mutate({ id: selectedReport })}
                disabled={deleteReport.isPending}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!selectedReport ? (
              <div className="flex flex-col items-center justify-center h-[600px] text-center">
                <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  Select a report to view its contents
                </p>
              </div>
            ) : reportDetails?.content ? (
              <ScrollArea className="h-[600px]">
                <div className="prose prose-invert prose-sm max-w-none">
                  {reportDetails.content.split("\n").map((line, i) => {
                    if (line.startsWith("# ")) {
                      return (
                        <h1
                          key={i}
                          className="text-2xl font-bold text-foreground mt-6 mb-4"
                        >
                          {line.replace("# ", "")}
                        </h1>
                      );
                    }
                    if (line.startsWith("## ")) {
                      return (
                        <h2
                          key={i}
                          className="text-xl font-semibold text-foreground mt-5 mb-3"
                        >
                          {line.replace("## ", "")}
                        </h2>
                      );
                    }
                    if (line.startsWith("### ")) {
                      return (
                        <h3
                          key={i}
                          className="text-lg font-medium text-primary mt-4 mb-2"
                        >
                          {line.replace("### ", "")}
                        </h3>
                      );
                    }
                    if (line.startsWith("| ") || line.startsWith("|---")) {
                      return null; // Skip table rows for now
                    }
                    if (line.startsWith("```")) {
                      return (
                        <div
                          key={i}
                          className="text-xs text-muted-foreground font-mono"
                        >
                          {line}
                        </div>
                      );
                    }
                    if (line.match(/^\d+\./)) {
                      return (
                        <div
                          key={i}
                          className="ml-4 my-2 text-sm text-foreground"
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
                          className="text-sm font-semibold text-foreground my-2"
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
              <div className="flex flex-col items-center justify-center h-[600px] text-center">
                <Clock className="h-12 w-12 text-muted-foreground/30 mb-4 animate-spin" />
                <p className="text-muted-foreground">Loading report...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
