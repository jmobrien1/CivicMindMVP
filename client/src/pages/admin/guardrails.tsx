import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, CheckCircle, Edit3, Eye, Ban } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface GuardrailsStats {
  totalFlagged: number;
  pendingReview: number;
  blockedResponses: number;
  autoRewrites: number;
  severityBreakdown: {
    high: number;
    medium: number;
    low: number;
  };
  biasTypeBreakdown: Record<string, number>;
  recentEvents: Array<{
    id: string;
    eventType: string;
    severity: string;
    createdAt: Date;
  }>;
}

const SEVERITY_COLORS = {
  high: "#ef4444",    // red
  medium: "#f59e0b",  // amber
  low: "#10b981",     // green
};

export default function GuardrailsDashboard() {
  const { data: stats, isLoading } = useQuery<GuardrailsStats>({
    queryKey: ["/api/admin/stats"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading guardrails data...</p>
        </div>
      </div>
    );
  }

  const severityData = [
    { name: "High", value: stats?.severityBreakdown.high || 0, color: SEVERITY_COLORS.high },
    { name: "Medium", value: stats?.severityBreakdown.medium || 0, color: SEVERITY_COLORS.medium },
    { name: "Low", value: stats?.severityBreakdown.low || 0, color: SEVERITY_COLORS.low },
  ];

  const biasTypeData = Object.entries(stats?.biasTypeBreakdown || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium mb-2" data-testid="heading-guardrails">Content Guardrails</h1>
          <p className="text-muted-foreground">AI response monitoring, bias detection, and policy enforcement</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/flagged-responses">
            <Button variant="outline" data-testid="button-flagged-responses">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Review Flags
            </Button>
          </Link>
          <Link href="/admin/audit-logs">
            <Button variant="outline" data-testid="button-audit-logs">
              <Eye className="h-4 w-4 mr-2" />
              Audit Logs
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flagged</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-flagged">
              {stats?.totalFlagged || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All time detections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-pending-review">
              {stats?.pendingReview || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting staff review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Responses</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-blocked-responses">
              {stats?.blockedResponses || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Prevented from delivery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Rewrites</CardTitle>
            <Edit3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-auto-rewrites">
              {stats?.autoRewrites || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Automatically corrected
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
            <CardDescription>Breakdown of flagged content by severity level</CardDescription>
          </CardHeader>
          <CardContent>
            {severityData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No flagged content yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bias Types Detected</CardTitle>
            <CardDescription>Most common types of bias identified</CardDescription>
          </CardHeader>
          <CardContent>
            {biasTypeData.length > 0 ? (
              <div className="space-y-4">
                {biasTypeData.map((bias) => (
                  <div key={bias.name} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium capitalize">{bias.name.replace('_', ' ')}</span>
                        <span className="text-sm text-muted-foreground">{bias.value}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(bias.value / Math.max(...biasTypeData.map(b => b.value))) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No bias detected yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Guardrail Events</CardTitle>
          <CardDescription>Latest bias detections and policy violations</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.recentEvents && stats.recentEvents.length > 0 ? (
            <div className="space-y-3">
              {stats.recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 rounded-md border"
                  data-testid={`event-${event.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: SEVERITY_COLORS[event.severity as keyof typeof SEVERITY_COLORS] || "#6b7280"
                      }}
                    />
                    <div>
                      <p className="font-medium text-sm capitalize">
                        {event.eventType.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary capitalize">
                    {event.severity}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No recent events</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
