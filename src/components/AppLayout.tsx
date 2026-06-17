import { Link, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Shield,
  Zap,
  Server,
  Flame,
  Brain,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  ScanLine,
} from "lucide-react";
import type { ReactNode } from "react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Shield, label: "Security Scanner", path: "/security" },
  { icon: Zap, label: "Performance Test", path: "/performance" },
  { icon: Server, label: "Infrastructure", path: "/infrastructure" },
  { icon: Flame, label: "Chaos Engineering", path: "/chaos" },
  { icon: Brain, label: "AI Analysis", path: "/ai-analysis" },
  { icon: FileText, label: "Reports", path: "/reports" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Sidebar */}
        <aside className="flex w-[260px] flex-col border-r border-border bg-sidebar">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 px-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <ScanLine className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground tracking-tight">
                SecTest AI
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Security Platform
              </span>
            </div>
          </div>

          <Separator className="bg-sidebar-border" />

          {/* Navigation */}
          <ScrollArea className="flex-1 py-3">
            <nav className="flex flex-col gap-1 px-3">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        }`}
                      >
                        <item.icon
                          className={`h-4.5 w-4.5 ${
                            isActive ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                        <span>{item.label}</span>
                        {isActive && (
                          <ChevronRight className="ml-auto h-4 w-4 text-primary/60" />
                        )}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="hidden lg:block">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </nav>
          </ScrollArea>

          <Separator className="bg-sidebar-border" />

          {/* User section */}
          <div className="p-3">
            <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarImage src={user?.avatar ?? ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.name ?? "User"}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.email ?? ""}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto p-8">
            <div className="mx-auto max-w-7xl animate-fadeIn">
              {children}
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
