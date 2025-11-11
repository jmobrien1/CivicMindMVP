// Reference: javascript_log_in_with_replit integration
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Transparency from "@/pages/transparency";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminDocuments from "@/pages/admin/documents";
import AdminFaqs from "@/pages/admin/faqs";
import AdminTickets from "@/pages/admin/tickets";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminGuardrails from "@/pages/admin/guardrails";
import AdminFlaggedResponses from "@/pages/admin/flagged-responses";
import AdminAuditLogs from "@/pages/admin/audit-logs";
import AdminPolicyConfigs from "@/pages/admin/policy-configs";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "/api/login";
    return null;
  }

  return <Component />;
}

function App() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
        {isAdminRoute ? (
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1">
                <header className="flex items-center gap-2 p-4 border-b">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                </header>
                <main className="flex-1 overflow-auto p-8">
                  <Switch>
                    <Route path="/admin/dashboard" component={() => <ProtectedRoute component={AdminDashboard} />} />
                    <Route path="/admin/documents" component={() => <ProtectedRoute component={AdminDocuments} />} />
                    <Route path="/admin/faqs" component={() => <ProtectedRoute component={AdminFaqs} />} />
                    <Route path="/admin/tickets" component={() => <ProtectedRoute component={AdminTickets} />} />
                    <Route path="/admin/analytics" component={() => <ProtectedRoute component={AdminAnalytics} />} />
                    <Route path="/admin/guardrails" component={() => <ProtectedRoute component={AdminGuardrails} />} />
                    <Route path="/admin/flagged-responses" component={() => <ProtectedRoute component={AdminFlaggedResponses} />} />
                    <Route path="/admin/audit-logs" component={() => <ProtectedRoute component={AdminAuditLogs} />} />
                    <Route path="/admin/policy-configs" component={() => <ProtectedRoute component={AdminPolicyConfigs} />} />
                    <Route component={NotFound} />
                  </Switch>
                </main>
              </div>
            </div>
          </SidebarProvider>
        ) : (
          <Switch>
            <Route path="/" component={Landing} />
            <Route path="/transparency" component={Transparency} />
            <Route component={NotFound} />
          </Switch>
        )}
          <Toaster />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
