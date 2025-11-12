import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, TrendingUp, Clock, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface TransparencyData {
  totalQueries: number;
  totalQuestionsAnswered: number;
  averageResponseTime: number;
  satisfactionRate: number;
  topTopics: Array<{ topic: string; count: number; percentage: number }>;
  dailyQueries: Array<{ date: string; count: number }>;
  guardrailsStats: {
    totalFlagged: number;
    bySeverity: { low: number; medium: number; high: number };
    byAction: { blocked: number; rewritten: number; reviewed: number };
  };
  lastUpdated: string;
}

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function Transparency() {
  const { data, isLoading } = useQuery<TransparencyData>({
    queryKey: ["/api/transparency"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading transparency data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            <span className="font-medium text-lg">West Newbury Assistant</span>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <a href="/">Back to Home</a>
            </Button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-12">
          <h1 className="text-4xl font-medium mb-3">AI Transparency Report</h1>
          <p className="text-lg text-muted-foreground mb-2">
            Real-time statistics showing how our AI assistant serves West Newbury
          </p>
          <p className="text-sm text-muted-foreground" data-testid="text-last-updated">
            Last updated: {data?.lastUpdated || new Date().toLocaleString()}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-total-queries">
                {data?.totalQueries?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Questions asked by citizens
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Questions Answered</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-answered">
                {data?.totalQuestionsAnswered?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {data?.totalQueries ? Math.round((data.totalQuestionsAnswered / data.totalQueries) * 100) : 0}% success rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-response-time">
                {data?.averageResponseTime ? `${(data.averageResponseTime / 1000).toFixed(1)}s` : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Faster than phone calls
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfaction Rate</CardTitle>
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-satisfaction">
                {data?.satisfactionRate ? `${Math.round(data.satisfactionRate * 100)}%` : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on user feedback
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Query Topics</CardTitle>
              <CardDescription>Most common categories of questions</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.topTopics && data.topTopics.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.topTopics}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.topic} (${entry.percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.topTopics.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Query Volume (Last 7 Days)</CardTitle>
              <CardDescription>Daily question trends</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.dailyQueries && data.dailyQueries.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.dailyQueries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>AI Guardrails & Safety</CardTitle>
            <CardDescription>Automatic content moderation protecting against bias and inappropriate responses</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.guardrailsStats && data.guardrailsStats.totalFlagged > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{data.guardrailsStats.totalFlagged}</div>
                    <div className="text-xs text-muted-foreground mt-1">Total Flagged</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-destructive">{data.guardrailsStats.byAction.blocked}</div>
                    <div className="text-xs text-muted-foreground mt-1">Blocked</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{data.guardrailsStats.byAction.rewritten}</div>
                    <div className="text-xs text-muted-foreground mt-1">Rewritten</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{data.guardrailsStats.byAction.reviewed}</div>
                    <div className="text-xs text-muted-foreground mt-1">Reviewed & Approved</div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-3">Flags by Severity</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Low</span>
                      <span className="text-sm font-medium">{data.guardrailsStats.bySeverity.low}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Medium</span>
                      <span className="text-sm font-medium">{data.guardrailsStats.bySeverity.medium}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">High</span>
                      <span className="text-sm font-medium">{data.guardrailsStats.bySeverity.high}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Our AI guardrails automatically detect and mitigate potential bias in responses. High-severity flags are blocked, medium-severity are rewritten, and low-severity are reviewed by staff.
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No flagged responses in the last 30 days</p>
                <p className="text-xs mt-2">Our guardrails system is actively monitoring all responses</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>About This Report</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p className="text-muted-foreground">
              This transparency dashboard provides real-time statistics on how our AI assistant serves West Newbury. All data is aggregated and anonymized to protect citizen privacy. The AI assistant is designed with built-in safeguards including PII filtering, content moderation, and rate limiting to ensure responsible, trustworthy service.
            </p>
            <p className="text-muted-foreground mt-4">
              Every response includes citations to official town documents. If the AI cannot confidently answer a question, it offers to connect you with a town staff member who can help.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
