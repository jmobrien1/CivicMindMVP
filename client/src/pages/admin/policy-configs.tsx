import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, Plus, X, AlertCircle, ShieldAlert } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface PolicyConfig {
  id: string;
  name: string;
  configType: string;
  configValue: any;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function PolicyConfigsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  
  const [blockSeverity, setBlockSeverity] = useState("high");
  const [rewriteSeverity, setRewriteSeverity] = useState("medium");
  const [allowSeverity, setAllowSeverity] = useState("low");
  const [blockedTopics, setBlockedTopics] = useState<string[]>([]);
  const [allowedTopics, setAllowedTopics] = useState<string[]>([]);
  const [newBlockedTopic, setNewBlockedTopic] = useState("");
  const [newAllowedTopic, setNewAllowedTopic] = useState("");

  const { data: configs = [], isLoading } = useQuery<PolicyConfig[]>({
    queryKey: ["/api/admin/policy-configs"],
  });

  // Load existing configs when data is available
  useEffect(() => {
    if (configs.length > 0) {
      const thresholdConfig = configs.find((c: PolicyConfig) => c.configType === 'bias_threshold');
      if (thresholdConfig) {
        setBlockSeverity(thresholdConfig.configValue.blockSeverity || 'high');
        setRewriteSeverity(thresholdConfig.configValue.rewriteSeverity || 'medium');
        setAllowSeverity(thresholdConfig.configValue.allowSeverity || 'low');
      }

      const blockedConfig = configs.find((c: PolicyConfig) => c.configType === 'blocked_topics');
      if (blockedConfig) {
        setBlockedTopics(blockedConfig.configValue || []);
      }

      const allowedConfig = configs.find((c: PolicyConfig) => c.configType === 'allowed_topics');
      if (allowedConfig) {
        setAllowedTopics(allowedConfig.configValue || []);
      }
    }
  }, [configs]);

  const saveMutation = useMutation({
    mutationFn: async (config: { name: string; configType: string; configValue: any; description: string }) => {
      return await apiRequest("POST", "/api/admin/policy-configs", config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/policy-configs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Configuration Saved",
        description: "Policy configuration has been updated successfully. Cache has been invalidated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save policy configuration",
        variant: "destructive",
      });
    },
  });

  const handleSaveThresholds = () => {
    saveMutation.mutate({
      name: "default_bias_threshold",
      configType: "bias_threshold",
      configValue: {
        blockSeverity,
        rewriteSeverity,
        allowSeverity,
      },
      description: "Bias severity thresholds for blocking, rewriting, and allowing responses",
    });
  };

  const handleSaveBlockedTopics = () => {
    saveMutation.mutate({
      name: "default_blocked_topics",
      configType: "blocked_topics",
      configValue: blockedTopics,
      description: "Topics that are blocked from AI responses",
    });
  };

  const handleSaveAllowedTopics = () => {
    saveMutation.mutate({
      name: "default_allowed_topics",
      configType: "allowed_topics",
      configValue: allowedTopics,
      description: "Topics that are explicitly allowed in AI responses",
    });
  };

  const addBlockedTopic = () => {
    if (newBlockedTopic.trim() && !blockedTopics.includes(newBlockedTopic.trim())) {
      setBlockedTopics([...blockedTopics, newBlockedTopic.trim()]);
      setNewBlockedTopic("");
    }
  };

  const removeBlockedTopic = (topic: string) => {
    setBlockedTopics(blockedTopics.filter(t => t !== topic));
  };

  const addAllowedTopic = () => {
    if (newAllowedTopic.trim() && !allowedTopics.includes(newAllowedTopic.trim())) {
      setAllowedTopics([...allowedTopics, newAllowedTopic.trim()]);
      setNewAllowedTopic("");
    }
  };

  const removeAllowedTopic = (topic: string) => {
    setAllowedTopics(allowedTopics.filter(t => t !== topic));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Settings className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading policy configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium mb-2" data-testid="heading-policy-configs">Policy Configuration</h1>
        <p className="text-muted-foreground">Configure bias detection thresholds and content policies</p>
      </div>

      {!isSuperAdmin && (
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-900 dark:text-amber-100">Super Admin Access Required</h3>
                <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
                  You can view policy configurations but only super administrators can modify them. 
                  Contact your system administrator to request changes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Bias Severity Thresholds</CardTitle>
          <CardDescription>
            Control how the system handles different levels of detected bias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-md bg-secondary/50 border-l-4 border-primary">
            <div className="flex gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">How Severity Thresholds Work</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Responses are checked for bias and assigned a severity (low, medium, high). 
                  Based on these thresholds, the system will block, rewrite, or flag responses for review.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="block-severity">Block Threshold</Label>
              <Select value={blockSeverity} onValueChange={setBlockSeverity}>
                <SelectTrigger id="block-severity" data-testid="select-block-severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High Only</SelectItem>
                  <SelectItem value="medium">Medium and Above</SelectItem>
                  <SelectItem value="low">Low and Above</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Block responses at this severity level and above
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rewrite-severity">Auto-Rewrite Threshold</Label>
              <Select value={rewriteSeverity} onValueChange={setRewriteSeverity}>
                <SelectTrigger id="rewrite-severity" data-testid="select-rewrite-severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High Only</SelectItem>
                  <SelectItem value="medium">Medium Only</SelectItem>
                  <SelectItem value="low">Low Only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Attempt automatic rewrite at this level
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allow-severity">Flag Only Threshold</Label>
              <Select value={allowSeverity} onValueChange={setAllowSeverity}>
                <SelectTrigger id="allow-severity" data-testid="select-allow-severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Allow but flag for review at this level
              </p>
            </div>
          </div>

          <Button 
            onClick={handleSaveThresholds} 
            disabled={saveMutation.isPending || !isSuperAdmin}
            data-testid="button-save-thresholds"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSuperAdmin ? 'Save Thresholds' : 'Super Admin Required'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Blocked Topics</CardTitle>
          <CardDescription>
            Topics that should trigger policy violations and block responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter topic to block (e.g., 'partisan politics')"
              value={newBlockedTopic}
              onChange={(e) => setNewBlockedTopic(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addBlockedTopic()}
              data-testid="input-blocked-topic"
            />
            <Button 
              onClick={addBlockedTopic} 
              disabled={!isSuperAdmin}
              data-testid="button-add-blocked-topic"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {blockedTopics.length > 0 ? (
              blockedTopics.map((topic) => (
                <Badge key={topic} variant="destructive" className="gap-1">
                  {topic}
                  {isSuperAdmin && (
                    <X
                      className="h-3 w-3 cursor-pointer hover:bg-destructive-foreground/20 rounded-sm"
                      onClick={() => removeBlockedTopic(topic)}
                      data-testid={`button-remove-blocked-topic-${topic}`}
                    />
                  )}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No blocked topics configured</p>
            )}
          </div>

          <Button 
            onClick={handleSaveBlockedTopics} 
            disabled={saveMutation.isPending || !isSuperAdmin}
            variant="destructive"
            data-testid="button-save-blocked-topics"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSuperAdmin ? 'Save Blocked Topics' : 'Super Admin Required'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Allowed Topics</CardTitle>
          <CardDescription>
            Topics that are explicitly permitted even if they might otherwise be flagged
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter allowed topic (e.g., 'public services')"
              value={newAllowedTopic}
              onChange={(e) => setNewAllowedTopic(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addAllowedTopic()}
              data-testid="input-allowed-topic"
            />
            <Button 
              onClick={addAllowedTopic} 
              disabled={!isSuperAdmin}
              data-testid="button-add-allowed-topic"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {allowedTopics.length > 0 ? (
              allowedTopics.map((topic) => (
                <Badge key={topic} variant="secondary" className="gap-1">
                  {topic}
                  {isSuperAdmin && (
                    <X
                      className="h-3 w-3 cursor-pointer hover:bg-secondary-foreground/20 rounded-sm"
                      onClick={() => removeAllowedTopic(topic)}
                      data-testid={`button-remove-allowed-topic-${topic}`}
                    />
                  )}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No allowed topics configured</p>
            )}
          </div>

          <Button 
            onClick={handleSaveAllowedTopics} 
            disabled={saveMutation.isPending || !isSuperAdmin}
            data-testid="button-save-allowed-topics"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSuperAdmin ? 'Save Allowed Topics' : 'Super Admin Required'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
