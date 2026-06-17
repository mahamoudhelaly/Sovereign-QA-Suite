import { Routes, Route } from "react-router";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import SecurityScanner from "./pages/SecurityScanner";
import PerformanceTester from "./pages/PerformanceTester";
import InfrastructureAnalyzer from "./pages/InfrastructureAnalyzer";
import ChaosEngineering from "./pages/ChaosEngineering";
import AIAnalysis from "./pages/AIAnalysis";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <AppLayout>
            <Dashboard />
          </AppLayout>
        }
      />
      <Route
        path="/security"
        element={
          <AppLayout>
            <SecurityScanner />
          </AppLayout>
        }
      />
      <Route
        path="/performance"
        element={
          <AppLayout>
            <PerformanceTester />
          </AppLayout>
        }
      />
      <Route
        path="/infrastructure"
        element={
          <AppLayout>
            <InfrastructureAnalyzer />
          </AppLayout>
        }
      />
      <Route
        path="/chaos"
        element={
          <AppLayout>
            <ChaosEngineering />
          </AppLayout>
        }
      />
      <Route
        path="/ai-analysis"
        element={
          <AppLayout>
            <AIAnalysis />
          </AppLayout>
        }
      />
      <Route
        path="/reports"
        element={
          <AppLayout>
            <Reports />
          </AppLayout>
        }
      />
      <Route
        path="/settings"
        element={
          <AppLayout>
            <SettingsPage />
          </AppLayout>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
