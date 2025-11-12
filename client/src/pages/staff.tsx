import { useDemo } from "@/contexts/DemoContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Building2, ArrowLeft, Users, BarChart3, RefreshCw, FileText } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function StaffPage() {
  const { setRole } = useDemo();
  const [, setLocation] = useLocation();
  const [isResetting, setIsResetting] = useState(false);

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["/api/tickets"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/transparency"],
  });

  const handleBackToHome = () => {
    setRole("staff");
    setLocation("/");
  };

  const handleSwitchToResident = () => {
    setRole("resident");
    setLocation("/resident");
  };

  const handleResetDemo = async () => {
    if (!confirm("Reset all demo data? This will clear conversations, tickets, and analytics, then reseed the knowledge base.")) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch("/api/demo/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to reset demo");
      }

      window.location.reload();
    } catch (error) {
      console.error("Reset error:", error);
      alert("Failed to reset demo. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8E7] to-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBackToHome} data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-[#D4AF37]" />
              <div>
                <h1 className="font-medium text-lg">West Newbury Assistant</h1>
                <p className="text-xs text-muted-foreground">Staff Portal</p>
              </div>
            </div>
            <span className="text-xs bg-[#D4AF37] text-white px-2 py-1 rounded">DEMO</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSwitchToResident} data-testid="button-switch-resident">
              Switch to Resident View →
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/admin">Full Admin Portal →</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Overview Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">Total Queries</CardDescription>
              <CardTitle className="text-2xl">{stats?.totalQueries || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">Questions Answered</CardDescription>
              <CardTitle className="text-2xl">{stats?.questionsAnswered || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">Open Tickets</CardDescription>
              <CardTitle className="text-2xl">
                {tickets?.filter((t: any) => t.status === "open").length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">Avg Response Time</CardDescription>
              <CardTitle className="text-2xl">{stats?.avgResponseTime || "0"}ms</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Staff Overview */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Staff Demo Overview
              </CardTitle>
              <CardDescription>
                Explore the capabilities of the West Newbury AI staff portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">1. Review Incoming Tickets</h4>
                  <p className="text-sm text-muted-foreground">
                    See citizen requests that need human assistance. Tickets include the original question, AI answer, and routing information.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">2. Inspect AI Answers</h4>
                  <p className="text-sm text-muted-foreground">
                    View how the AI responded to residents with source citations and confidence levels.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">3. View AI Operations Report</h4>
                  <p className="text-sm text-muted-foreground">
                    Access detailed analytics, guardrail activity, bias detection stats, and system performance metrics.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">4. Explore Document Repository</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload, view, and summarize town documents with AI-powered insights.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                AI Operations Report
              </CardTitle>
              <CardDescription>
                Detailed analytics and guardrails for staff oversight
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Total Queries</p>
                  <p className="text-2xl font-bold">{stats?.totalQueries || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Questions Answered</p>
                  <p className="text-2xl font-bold">{stats?.questionsAnswered || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Satisfaction Rate</p>
                  <p className="text-2xl font-bold">
                    {stats?.satisfactionRate ? `${(stats.satisfactionRate * 100).toFixed(1)}%` : "N/A"}
                  </p>
                </div>
                <Button className="w-full" variant="outline" asChild>
                  <a href="/admin/guardrails">View Full Operations Report →</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Tickets
            </CardTitle>
            <CardDescription>
              Citizen requests that need staff attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ticketsLoading ? (
              <p className="text-sm text-muted-foreground">Loading tickets...</p>
            ) : !tickets || tickets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-2">No tickets yet</p>
                <p className="text-sm text-muted-foreground">
                  Tickets are created when residents need human assistance. Try asking complex questions in the Resident Portal.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.slice(0, 5).map((ticket: any) => (
                  <div key={ticket.id} className="border-l-4 border-l-[#D4AF37] pl-4 py-2">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-sm">{ticket.question}</p>
                      <span className="text-xs px-2 py-1 rounded bg-muted">{ticket.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Department: {ticket.department || "General"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ticket.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
                <Button className="w-full" variant="outline" asChild>
                  <a href="/admin/tickets">View All Tickets →</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Demo Controls */}
        <Card className="mt-8 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Demo Controls
            </CardTitle>
            <CardDescription>
              Reset the demo to its initial state
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Click below to clear all demo data (conversations, tickets, analytics) and reseed the knowledge base with West Newbury information.
            </p>
            <Button
              onClick={handleResetDemo}
              disabled={isResetting}
              variant="outline"
              className="w-full"
              data-testid="button-reset-demo"
            >
              {isResetting ? "Resetting..." : "Reset Demo Data"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
