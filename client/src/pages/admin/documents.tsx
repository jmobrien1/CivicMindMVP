import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Upload, Trash2, Search, Filter, ChevronDown, ChevronRight, Sparkles, History, Calendar, AlertTriangle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Document } from "@shared/schema";

export default function AdminDocuments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [expirationDate, setExpirationDate] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  const { data: documents = [], isLoading, isError, error } = useQuery<Document[]>({
    queryKey: ["/api/documents", categoryFilter],
    queryFn: async () => {
      const url = categoryFilter === "all" 
        ? "/api/documents"
        : `/api/documents?category=${categoryFilter}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to load documents: ${res.status} ${errorText}`);
      }
      return await res.json();
    },
  });

  if (isError) {
    toast({
      title: "Error loading documents",
      description: error?.message || "Failed to load documents",
      variant: "destructive",
    });
  }

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest("POST", "/api/documents", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/documents" });
      setUploadFile(null);
      toast({
        title: "Success",
        description: "Document uploaded and indexed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/documents/${id}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/documents" });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
  });

  const regenerateSummaryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/documents/${id}/regenerate-summary`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/documents" });
      toast({
        title: "Success",
        description: "Summary regenerated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to regenerate summary",
        variant: "destructive",
      });
    },
  });

  const updateExpirationMutation = useMutation({
    mutationFn: async ({ id, expiresAt }: { id: string; expiresAt: string | null }) => {
      return await apiRequest("PATCH", `/api/documents/${id}/expiration`, { expiresAt });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/documents" });
      toast({
        title: "Success",
        description: "Expiration date updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update expiration date",
        variant: "destructive",
      });
    },
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    const formData = new FormData();
    formData.append("file", uploadFile);
    uploadMutation.mutate(formData);
  };

  const filteredDocuments = (documents || []).filter((doc: Document) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-medium mb-2" data-testid="heading-documents">Knowledge Base</h1>
        <p className="text-muted-foreground">Manage documents that power the AI assistant</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>Add PDF, Word, or text files to the knowledge base</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Document File</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    data-testid="input-file-upload"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!uploadFile || uploadMutation.isPending}
                  data-testid="button-upload"
                >
                  {uploadMutation.isPending ? (
                    "Uploading..."
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Max 50MB. Supported formats: PDF, Word, TXT
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Documents</CardTitle>
              <CardDescription>{(documents || []).length} documents in knowledge base</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                  data-testid="input-search-documents"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-category-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Budget">Budget</SelectItem>
                  <SelectItem value="Bylaws">Bylaws</SelectItem>
                  <SelectItem value="Permits">Permits</SelectItem>
                  <SelectItem value="Meeting Minutes">Meeting Minutes</SelectItem>
                  <SelectItem value="Schedules">Schedules</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-muted-foreground">Failed to load documents</p>
              <p className="text-sm text-muted-foreground mt-1">
                Check your connection and try again
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <FileText className="h-8 w-8 text-muted-foreground animate-pulse" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No documents found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload a document to get started
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocuments.map((doc: Document) => (
                <Card key={doc.id} data-testid={`document-card-${doc.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                            data-testid={`button-expand-${doc.id}`}
                          >
                            {expandedDoc === doc.id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h3 className="font-medium text-lg">{doc.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {doc.filename} • {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "—"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-9 mt-2 flex-wrap">
                          {doc.category && <Badge variant="secondary">{doc.category}</Badge>}
                          {doc.department && <Badge variant="outline">{doc.department}</Badge>}
                          {doc.ocrProcessed && (
                            <Badge variant="outline" className="text-xs" data-testid={`badge-ocr-${doc.id}`}>
                              OCR{doc.ocrConfidence ? ` ${doc.ocrConfidence}%` : ''}
                            </Badge>
                          )}
                          {doc.tags && doc.tags.length > 0 && doc.tags.slice(0, 3).map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>

                        {doc.summary && (
                          <div className="ml-9 mt-3 p-3 bg-muted/50 rounded-md">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">AI Summary</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{doc.summary}</p>
                          </div>
                        )}

                        {expandedDoc === doc.id && doc.keyInsights && Array.isArray(doc.keyInsights) && doc.keyInsights.length > 0 && (
                          <div className="ml-9 mt-3 space-y-2">
                            <h4 className="text-sm font-medium">Key Insights</h4>
                            <ul className="space-y-1">
                              {doc.keyInsights.map((insight: string, idx: number) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span>{insight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {expandedDoc === doc.id && (
                          <div className="ml-9 mt-4 space-y-3 p-3 bg-muted/30 rounded-md">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <History className="h-3 w-3" />
                                <span>Version {doc.version || 1}</span>
                              </div>
                              {doc.expiresAt && (
                                <div className="flex items-center gap-2 text-xs">
                                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                                  <span className="text-amber-600">
                                    Expires {new Date(doc.expiresAt).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-end gap-2">
                              <div className="flex-1">
                                <Label htmlFor={`expiration-${doc.id}`} className="text-xs">Expiration Date</Label>
                                <div className="flex gap-2 mt-1">
                                  <Input
                                    id={`expiration-${doc.id}`}
                                    type="date"
                                    value={expirationDate[doc.id] || (doc.expiresAt ? new Date(doc.expiresAt).toISOString().split('T')[0] : '')}
                                    onChange={(e) => setExpirationDate({ ...expirationDate, [doc.id]: e.target.value })}
                                    className="text-xs"
                                  />
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => updateExpirationMutation.mutate({ 
                                      id: doc.id, 
                                      expiresAt: expirationDate[doc.id] || null 
                                    })}
                                    disabled={updateExpirationMutation.isPending}
                                  >
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Set
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1">
                        {doc.summary && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => regenerateSummaryMutation.mutate(doc.id)}
                            disabled={regenerateSummaryMutation.isPending}
                            data-testid={`button-regenerate-${doc.id}`}
                            title="Regenerate Summary"
                          >
                            <Sparkles className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(doc.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${doc.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
