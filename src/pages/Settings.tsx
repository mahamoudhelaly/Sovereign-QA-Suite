import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  Key,
  Shield,
  Bell,
  Users,
  Globe,
  Clock,
  Save,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";

export default function SettingsPage() {
  const [claudeKey, setClaudeKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    slack: false,
    critical: true,
    weekly: true,
  });

  const handleSaveApiKey = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your organization settings, API keys, and notification preferences.
        </p>
      </div>

      <Tabs defaultValue="api" className="w-full">
        <TabsList className="bg-secondary border border-border mb-6">
          <TabsTrigger value="api" className="gap-2">
            <Key className="h-3.5 w-3.5" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-3.5 w-3.5" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="organization" className="gap-2">
            <Users className="h-3.5 w-3.5" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-3.5 w-3.5" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="api" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="h-4.5 w-4.5 text-primary" />
                Claude AI API Key
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground mb-2 block">
                    API Key for Claude AI-powered analysis
                  </label>
                  <div className="relative">
                    <Input
                      type={showKey ? "text" : "password"}
                      placeholder="sk-ant-api03-..."
                      value={claudeKey}
                      onChange={(e) => setClaudeKey(e.target.value)}
                      className="bg-secondary border-border pr-10"
                    />
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSaveApiKey}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  {saved ? (
                    <>
                      <Check className="h-4 w-4" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Key
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Your API key is encrypted and stored securely.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4.5 w-4.5 text-primary" />
                API Tokens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Key className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Default API Token
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created on {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-400 border-green-500/20"
                  >
                    Active
                  </Badge>
                  <Button variant="outline" size="sm">
                    Regenerate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4.5 w-4.5 text-primary" />
                Notification Channels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <Bell className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Email Notifications
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Receive scan completion and critical alerts via email
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(v) =>
                    setNotifications((prev) => ({ ...prev, email: v }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                    <Globe className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Slack Integration
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Send alerts to your Slack workspace
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications.slack}
                  onCheckedChange={(v) =>
                    setNotifications((prev) => ({ ...prev, slack: v }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 text-primary" />
                Alert Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Critical Alerts
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Immediate notification for critical vulnerabilities
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications.critical}
                  onCheckedChange={(v) =>
                    setNotifications((prev) => ({ ...prev, critical: v }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <Clock className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Weekly Summary
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Receive a weekly digest of all scan activities
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications.weekly}
                  onCheckedChange={(v) =>
                    setNotifications((prev) => ({ ...prev, weekly: v }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value="organization" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-primary" />
                Organization Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    Organization Name
                  </label>
                  <Input
                    defaultValue="Acme Corp"
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    Slug
                  </label>
                  <Input
                    defaultValue="acme-corp"
                    className="bg-secondary border-border"
                    disabled
                  />
                </div>
              </div>
              <Button className="gap-2 bg-primary hover:bg-primary/90">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4.5 w-4.5 text-primary" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                    <Shield className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Two-Factor Authentication
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-green-500/10 text-green-400 border-green-500/20"
                >
                  Enabled
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <Clock className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Session Timeout
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Automatically log out after 30 minutes of inactivity
                    </p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
