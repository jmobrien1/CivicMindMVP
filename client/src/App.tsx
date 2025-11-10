// Reference: javascript_log_in_with_replit integration
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Landing} />
      <Route path="/transparency" component={Transparency} />

      {/* Admin routes - require authentication */}
      {isLoading || !isAuthenticated ? null : (
        <>
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/documents" component={AdminDocuments} />
          <Route path="/admin/faqs" component={AdminFaqs} />
          <Route path="/admin/tickets" component={AdminTickets} />
          <Route path="/admin/analytics" component={AdminAnalytics} />
        </>
      )}

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AdminLayout() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");

  if (!isAdminRoute) {
    return <Router />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center gap-2 p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-auto p-8">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AdminLayout />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
