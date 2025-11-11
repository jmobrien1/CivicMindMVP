import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, TrendingUp, TrendingDown, Clock, ThumbsUp, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface AnalyticsData {
  overview: {
    totalQueries: number;
    queriesChange: number;
    avgResponseTime: number;
    responseTimeChange: number;
    satisfactionRate: number;
    satisfactionChange: number;
    answerRate: number;
    answerRateChange: number;
    avgSentimentScore?: number;
  };
  queryTrends: Array<{ date: string; queries: number; answered: number }>;
  topCategories: Array<{ category: string; count: number; color: string }>;
  hourlyDistribution: Array<{ hour: string; count: number }>;
  responseTimeDistribution: Array<{ range: string; count: number }>;
  feedbackDistribution: Array<{ name: string; value: number }>;
  sentimentDistribution?: Array<{ name: string; value: number; color: string }>;
}

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function AdminAnalytics() {
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const TrendIndicator = ({ value }: { value: number }) => {
    if (value > 0) {
      return (
        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
          <TrendingUp className="h-3 w-3" />
          <span>+{value}%</span>
        </div>
      );
    }
    if (value < 0) {
      return (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <TrendingDown className="h-3 w-3" />
          <span>{value}%</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-medium mb-2" data-testid="heading-analytics">Analytics</h1>
        <p className="text-muted-foreground">Detailed insights into AI assistant performance</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-queries">
              {data?.overview.totalQueries?.toLocaleString() || 0}
            </div>
            <TrendIndicator value={data?.overview.queriesChange || 0} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Answer Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-answer-rate">
              {data?.overview.answerRate ? `${Math.round(data.overview.answerRate * 100)}%` : "N/A"}
            </div>
            <TrendIndicator value={data?.overview.answerRateChange || 0} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-response-time">
              {data?.overview.avgResponseTime ? `${(data.overview.avgResponseTime / 1000).toFixed(1)}s` : "N/A"}
            </div>
            <TrendIndicator value={data?.overview.responseTimeChange || 0} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-satisfaction">
              {data?.overview.satisfactionRate ? `${Math.round(data.overview.satisfactionRate * 100)}%` : "N/A"}
            </div>
            <TrendIndicator value={data?.overview.satisfactionChange || 0} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Query Trends (30 Days)</CardTitle>
            <CardDescription>Total vs successfully answered queries</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.queryTrends && data.queryTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.queryTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="queries" stroke="hsl(var(--primary))" name="Total Queries" />
                  <Line type="monotone" dataKey="answered" stroke="hsl(var(--chart-2))" name="Answered" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
            <CardDescription>Most common query topics</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.topCategories && data.topCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.topCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.category}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {data.topCategories.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hourly Distribution</CardTitle>
            <CardDescription>Queries by hour of day</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.hourlyDistribution && data.hourlyDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.hourlyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Time Distribution</CardTitle>
            <CardDescription>Query response times</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.responseTimeDistribution && data.responseTimeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.responseTimeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--chart-3))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Citizen Sentiment Analysis</CardTitle>
            <CardDescription>Sentiment from citizen feedback</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.sentimentDistribution && data.sentimentDistribution.length > 0 && data.sentimentDistribution.some(d => d.value > 0) ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.sentimentDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.sentimentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                {data.overview.avgSentimentScore !== undefined && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Average Sentiment Score</p>
                    <p className="text-2xl font-bold" data-testid="stat-sentiment-score">
                      {data.overview.avgSentimentScore.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">Scale: -100 (negative) to +100 (positive)</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No sentiment data available yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
