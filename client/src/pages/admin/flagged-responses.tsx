import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Eye, CheckCircle, XCircle, Filter } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface FlaggedResponse {
  id: string;
  messageId: string;
  flagType: string;
  severity: string;
  biasTypes: string[] | null;
  violatedPolicies: string[] | null;
  explanation: string;
  suggestedRewrite: string | null;
  confidence: number | null;
  wasBlocked: boolean;
  status: string;
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

export default function FlaggedResponsesPage() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selectedFlag, setSelectedFlag] = useState<FlaggedResponse | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: flags = [], isLoading } = useQuery<FlaggedResponse[]>({
    queryKey: ["/api/admin/flagged-responses", { status: statusFilter, severity: severityFilter }],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      return await apiRequest("PATCH", `/api/admin/flagged-responses/${id}`, { status, reviewNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/flagged-responses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setSelectedFlag(null);
      setReviewNotes("");
    },
  });

  const handleReview = (status: string) => {
    if (!selectedFlag) return;
    updateStatusMutation.mutate({
      id: selectedFlag.id,
      status,
      notes: reviewNotes,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium mb-2" data-testid="heading-flagged-responses">Flagged Responses</h1>
        <p className="text-muted-foreground">Review and manage AI responses flagged for bias or policy violations</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Flagged Content</CardTitle>
              <CardDescription>Filter and review flagged responses</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2 animate-pulse" />
              <p>Loading flagged responses...</p>
            </div>
          ) : flags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No flagged responses found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {flags.map((flag) => (
                <div
                  key={flag.id}
                  className="flex items-center justify-between p-4 rounded-md border hover-elevate cursor-pointer"
                  onClick={() => setSelectedFlag(flag)}
                  data-testid={`flag-${flag.id}`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={SEVERITY_COLORS[flag.severity] as any}>
                        {flag.severity}
                      </Badge>
                      <span className="text-sm font-medium capitalize">
                        {flag.flagType.replace('_', ' ')}
                      </span>
                      {flag.wasBlocked && (
                        <Badge variant="destructive">Blocked</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {flag.explanation}
                    </p>
                    {flag.biasTypes && flag.biasTypes.length > 0 && (
                      <div className="flex gap-1">
                        {flag.biasTypes.map((type) => (
                          <span
                            key={type}
                            className="text-xs px-2 py-1 rounded-md bg-secondary capitalize"
                          >
                            {type.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">
                        {new Date(flag.createdAt).toLocaleDateString()}
                      </p>
                      {flag.confidence && (
                        <p className="text-xs text-muted-foreground">
                          {Math.round(flag.confidence * 100)}% confidence
                        </p>
                      )}
                    </div>
                    <Button variant="outline" size="sm" data-testid={`button-review-${flag.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedFlag} onOpenChange={() => setSelectedFlag(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Flagged Response Review</DialogTitle>
            <DialogDescription>
              Review flagged content and take appropriate action
            </DialogDescription>
          </DialogHeader>

          {selectedFlag && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant={SEVERITY_COLORS[selectedFlag.severity] as any}>
                  {selectedFlag.severity}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {selectedFlag.flagType.replace('_', ' ')}
                </Badge>
                {selectedFlag.wasBlocked && (
                  <Badge variant="destructive">Blocked from Delivery</Badge>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-2">Explanation</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedFlag.explanation}
                </p>
              </div>

              {selectedFlag.biasTypes && selectedFlag.biasTypes.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Bias Types Detected</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedFlag.biasTypes.map((type) => (
                      <Badge key={type} variant="secondary" className="capitalize">
                        {type.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedFlag.violatedPolicies && selectedFlag.violatedPolicies.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Policy Violations</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedFlag.violatedPolicies.map((policy) => (
                      <Badge key={policy} variant="destructive">
                        {policy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedFlag.suggestedRewrite && (
                <div>
                  <h4 className="font-medium mb-2">Suggested Rewrite</h4>
                  <p className="text-sm p-3 rounded-md bg-secondary">
                    {selectedFlag.suggestedRewrite}
                  </p>
                </div>
              )}

              {selectedFlag.confidence !== null && (
                <div>
                  <h4 className="font-medium mb-2">Confidence Score</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${selectedFlag.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {Math.round(selectedFlag.confidence * 100)}%
                    </span>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Review Notes</h4>
                <Textarea
                  placeholder="Add notes about your review decision..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="min-h-[100px]"
                  data-testid="textarea-review-notes"
                />
              </div>

              {selectedFlag.reviewedBy && (
                <div className="p-3 rounded-md bg-secondary">
                  <p className="text-sm font-medium mb-1">Previous Review</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Reviewed by {selectedFlag.reviewedBy} on{" "}
                    {new Date(selectedFlag.reviewedAt!).toLocaleString()}
                  </p>
                  {selectedFlag.reviewNotes && (
                    <p className="text-sm">{selectedFlag.reviewNotes}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedFlag(null)}
              data-testid="button-cancel-review"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleReview("rejected")}
              disabled={updateStatusMutation.isPending}
              data-testid="button-reject"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => handleReview("approved")}
              disabled={updateStatusMutation.isPending}
              data-testid="button-approve"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
