import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, HelpCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Faq, InsertFaq } from "@shared/schema";

export default function AdminFaqs() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("");
  const { toast } = useToast();

  const { data: faqs = [], isLoading } = useQuery<Faq[]>({
    queryKey: ["/api/faqs"],
  });

  const createMutation = useMutation({
    mutationFn: async (faq: InsertFaq) => {
      return await apiRequest("POST", "/api/faqs", faq);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faqs"] });
      resetForm();
      setIsOpen(false);
      toast({
        title: "Success",
        description: "FAQ created successfully",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Faq> }) => {
      return await apiRequest("PATCH", `/api/faqs/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faqs"] });
      resetForm();
      setIsOpen(false);
      toast({
        title: "Success",
        description: "FAQ updated successfully",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/faqs/${id}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faqs"] });
      toast({
        title: "Success",
        description: "FAQ deleted successfully",
      });
    },
  });

  const resetForm = () => {
    setQuestion("");
    setAnswer("");
    setCategory("");
    setEditingFaq(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFaq) {
      updateMutation.mutate({
        id: editingFaq.id,
        data: { question, answer, category, isActive: true },
      });
    } else {
      createMutation.mutate({ question, answer, category, isActive: true, order: 0 });
    }
  };

  const handleEdit = (faq: Faq) => {
    setEditingFaq(faq);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setCategory(faq.category || "");
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-medium mb-2" data-testid="heading-faqs">FAQs</h1>
        <p className="text-muted-foreground">Manually curated question and answer pairs</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>{faqs.length} curated FAQs</CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingFaq(null)} data-testid="button-add-faq">
                <Plus className="h-4 w-4 mr-2" />
                Add FAQ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingFaq ? "Edit FAQ" : "Add New FAQ"}</DialogTitle>
                <DialogDescription>
                  Create a curated answer for a common question
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  <Input
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="When is trash pickup?"
                    required
                    data-testid="input-faq-question"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="answer">Answer</Label>
                  <Textarea
                    id="answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Trash pickup is every Tuesday and Friday..."
                    rows={6}
                    required
                    data-testid="input-faq-answer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category" data-testid="select-faq-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Trash">Trash & Recycling</SelectItem>
                      <SelectItem value="Permits">Permits</SelectItem>
                      <SelectItem value="Taxes">Taxes</SelectItem>
                      <SelectItem value="Schools">Schools</SelectItem>
                      <SelectItem value="General">General Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-faq"
                  >
                    {editingFaq ? "Update" : "Create"} FAQ
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <HelpCircle className="h-8 w-8 text-muted-foreground animate-pulse" />
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No FAQs yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first FAQ to provide curated answers
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq) => (
                <Card key={faq.id} className="hover-elevate" data-testid={`faq-card-${faq.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{faq.question}</CardTitle>
                        <CardDescription className="whitespace-pre-wrap">
                          {faq.answer}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(faq)}
                          data-testid={`button-edit-${faq.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(faq.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${faq.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {faq.category && (
                      <div className="mt-2">
                        <Badge variant="secondary">{faq.category}</Badge>
                      </div>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
