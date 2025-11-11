import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, AlertCircle, CheckCircle } from "lucide-react";

interface AuditLog {
  id: string;
  eventType: string;
  severity: string;
  messageId: string | null;
  conversationId: string | null;
  details: any;
  reviewedBy: string | null;
  reviewNotes: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

const SEVERITY_COLORS: Record<string, string> = {
  high: "destructive",
  medium: "default",
  low: "secondary",
};

const EVENT_ICONS: Record<string, any> = {
  bias_detected: AlertCircle,
  policy_violation: AlertCircle,
  bias_auto_rewrite: FileText,
  guardrails_fallback_block: AlertCircle,
};

export default function AuditLogsPage() {
  const [severityFilter, setSeverityFilter] = useState("all");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");

  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/admin/audit-logs", { severity: severityFilter, eventType: eventTypeFilter }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium mb-2" data-testid="heading-audit-logs">Audit Logs</h1>
        <p className="text-muted-foreground">Complete audit trail of all guardrail events and decisions</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Events</CardTitle>
              <CardDescription>Filter and review audit trail</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-severity-filter">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-event-type-filter">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="bias_detected">Bias Detected</SelectItem>
                  <SelectItem value="policy_violation">Policy Violation</SelectItem>
                  <SelectItem value="bias_auto_rewrite">Auto Rewrite</SelectItem>
                  <SelectItem value="guardrails_fallback_block">Fallback Block</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 animate-pulse" />
              <p>Loading audit logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const EventIcon = EVENT_ICONS[log.eventType] || FileText;
                return (
                  <div
                    key={log.id}
                    className="p-4 rounded-md border"
                    data-testid={`log-${log.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <EventIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={SEVERITY_COLORS[log.severity] as any}>
                              {log.severity}
                            </Badge>
                            <span className="text-sm font-medium capitalize">
                              {log.eventType.replace(/_/g, ' ')}
                            </span>
                            {log.reviewedBy && (
                              <Badge variant="secondary">Reviewed</Badge>
                            )}
                          </div>

                          {log.details && (
                            <div className="text-sm space-y-1">
                              {log.details.explanation && (
                                <p className="text-muted-foreground">{log.details.explanation}</p>
                              )}
                              {log.details.biasTypes && (
                                <div className="flex flex-wrap gap-1">
                                  <span className="text-muted-foreground">Bias types:</span>
                                  {log.details.biasTypes.map((type: string) => (
                                    <span
                                      key={type}
                                      className="text-xs px-2 py-0.5 rounded-md bg-secondary capitalize"
                                    >
                                      {type.replace('_', ' ')}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {log.details.violatedPolicies && (
                                <div className="flex flex-wrap gap-1">
                                  <span className="text-muted-foreground">Policies:</span>
                                  {log.details.violatedPolicies.map((policy: string) => (
                                    <span
                                      key={policy}
                                      className="text-xs px-2 py-0.5 rounded-md bg-destructive/10 text-destructive"
                                    >
                                      {policy}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {log.details.rewriteAttemptFailed && (
                                <p className="text-xs text-destructive">
                                  Auto-rewrite validation failed
                                </p>
                              )}
                            </div>
                          )}

                          {log.reviewNotes && (
                            <div className="text-sm p-2 rounded-md bg-secondary">
                              <p className="font-medium mb-1">Review Notes</p>
                              <p className="text-muted-foreground">{log.reviewNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right text-sm shrink-0">
                        <p className="text-muted-foreground">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </p>
                        {log.reviewedAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Reviewed {new Date(log.reviewedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
