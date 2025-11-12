import { useState, useEffect, useRef } from "react";
import { useDemo } from "@/contexts/DemoContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, Send, HelpCircle, Loader2, ArrowLeft, FileText, UserRound } from "lucide-react";
import { useLocation } from "wouter";
import { nanoid } from "nanoid";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Citation {
  documentId: string;
  documentTitle: string;
  excerpt: string;
  sourceUrl?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  citations?: Citation[];
}

const SAMPLE_QUESTIONS = [
  "When is trash and recycling pickup for my house, and are there any holiday delays?",
  "When are property taxes due and how can I pay?",
  "What are town office hours and where is Town Hall?",
  "How do I contact the Board of Health about trash and recycling?",
  "When does the Select Board usually meet?",
];

export default function ResidentPage() {
  const { setRole, residentSessionId, setResidentSessionId, isDemoMode } = useDemo();
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalationDialogOpen, setEscalationDialogOpen] = useState(false);
  const [selectedMessagePair, setSelectedMessagePair] = useState<{
    userQuestion: string;
    aiResponse: string;
    messageId: string;
  } | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [sessionId] = useState(() => residentSessionId || nanoid());
  const { toast } = useToast();

  useEffect(() => {
    if (!residentSessionId) {
      setResidentSessionId(sessionId);
    }
  }, [sessionId, residentSessionId, setResidentSessionId]);

  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      const container = messagesContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: nanoid(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMessage: Message = {
        id: nanoid(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        citations: data.citations || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: nanoid(),
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again or contact town staff at (978) 363-1100.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleQuestion = (question: string) => {
    setInput(question);
    handleSendMessage(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  const handleBackToHome = () => {
    setRole("resident");
    setLocation("/");
  };

  const handleEscalateToStaff = (messageId: string) => {
    // Find the assistant message and the preceding user message
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1 || messages[messageIndex].role !== "assistant") return;

    const assistantMessage = messages[messageIndex];
    const userMessage = messages[messageIndex - 1];

    if (!userMessage || userMessage.role !== "user") return;

    setSelectedMessagePair({
      userQuestion: userMessage.content,
      aiResponse: assistantMessage.content,
      messageId: assistantMessage.id,
    });
    setEscalationDialogOpen(true);
  };

  const handleConfirmEscalation = async () => {
    if (!selectedMessagePair) return;

    setIsEscalating(true);
    try {
      const response = await fetch("/api/tickets/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          userQuestion: selectedMessagePair.userQuestion,
          aiResponse: selectedMessagePair.aiResponse,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to forward request");
      }

      toast({
        title: "Request forwarded to staff",
        description: data.message || "Your request has been forwarded to town staff.",
      });

      setEscalationDialogOpen(false);
      setSelectedMessagePair(null);
    } catch (error: any) {
      console.error("Escalation error:", error);
      toast({
        title: "Failed to forward request",
        description: error.message || "Please try again or call (978) 363-1100",
        variant: "destructive",
      });
    } finally {
      setIsEscalating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F0E9] to-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBackToHome} data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-[#004422]" />
              <div>
                <h1 className="font-medium text-lg">West Newbury Assistant</h1>
                <p className="text-xs text-muted-foreground">Resident Portal</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDemoMode && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setRole("staff");
                  setLocation("/staff");
                }}
                data-testid="button-switch-staff"
              >
                Switch to Staff View →
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <a href="/transparency">How this AI works →</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8 h-full">
          {/* Chat Area */}
          <div className="lg:col-span-2 flex flex-col h-full">
            <Card className="flex-1 flex flex-col p-6 min-h-[600px]">
              {/* Welcome Message */}
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-[#004422]/10 rounded-full flex items-center justify-center mb-4">
                    <HelpCircle className="h-8 w-8 text-[#004422]" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Ask about West Newbury Services</h2>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Get instant answers about trash schedules, office hours, tax deadlines, meeting schedules, and more.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try a sample question from the right, or type your own below.
                  </p>
                </div>
              )}

              {/* Messages */}
              {messages.length > 0 && (
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      data-testid={`message-${message.role}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === "user"
                            ? "bg-[#004422] text-white"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap">
                          {message.content}
                          {message.role === "assistant" && message.citations && message.citations.length > 0 && (
                            <>
                              {message.citations.map((_citation, idx) => (
                                <sup key={idx} className="ml-0.5">
                                  <a
                                    href={`#citation-${message.id}-${idx}`}
                                    className="text-[10px] text-primary hover:underline font-medium"
                                    data-testid={`inline-citation-${idx}`}
                                  >
                                    [{idx + 1}]
                                  </a>
                                </sup>
                              ))}
                            </>
                          )}
                        </div>

                        {message.role === "assistant" && message.citations && message.citations.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <div className="flex items-start gap-1.5">
                              <FileText className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                              <div className="text-xs text-muted-foreground space-y-1.5 flex-1">
                                <div className="font-medium">Sources:</div>
                                {message.citations.map((citation, idx) => (
                                  <div key={idx} id={`citation-${message.id}-${idx}`} className="flex items-start gap-1.5">
                                    <span className="font-mono text-[10px] text-primary flex-shrink-0 font-medium">[{idx + 1}]</span>
                                    <a
                                      href={citation.sourceUrl || `https://wnewbury.org`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline hover:text-foreground break-words leading-relaxed"
                                      data-testid={`citation-${idx}`}
                                    >
                                      {citation.documentTitle}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {message.role === "assistant" && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEscalateToStaff(message.id)}
                              className="text-xs hover-elevate"
                              data-testid={`button-escalate-${message.id}`}
                            >
                              <UserRound className="h-3 w-3 mr-1.5" />
                              Speak to a person
                            </Button>
                          </div>
                        )}

                        <p
                          className={`text-xs mt-2 ${
                            message.role === "user" ? "text-white/70" : "text-muted-foreground"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Input Area */}
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question... (Enter to send, Shift+Enter for new line)"
                  className="resize-none"
                  rows={2}
                  disabled={isLoading}
                  data-testid="input-chat"
                />
                <Button
                  onClick={() => handleSendMessage(input)}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="flex-shrink-0 h-[72px] w-[72px] bg-[#004422] hover:bg-[#003318]"
                  data-testid="button-chat-send"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </Card>
          </div>

          {/* Sample Questions Sidebar */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-3">Common Questions</h3>
              <div className="space-y-2">
                {SAMPLE_QUESTIONS.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full text-left h-auto py-3 px-4 whitespace-normal justify-start hover-elevate"
                    onClick={() => handleSampleQuestion(question)}
                    disabled={isLoading}
                    data-testid={`button-sample-question-${index}`}
                  >
                    <span className="text-sm">{question}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Help Section */}
            <Card className="p-4">
              <h3 className="font-medium mb-2 text-sm">Need More Help?</h3>
              <p className="text-xs text-muted-foreground mb-3">
                For complex issues or urgent matters, contact town staff directly.
              </p>
              <div className="space-y-2 text-xs">
                <div>
                  <p className="font-medium">Town Hall</p>
                  <p className="text-muted-foreground">(978) 363-1100</p>
                </div>
                <div>
                  <p className="font-medium">Hours</p>
                  <p className="text-muted-foreground">Mon-Thu: 8 AM-4:30 PM<br />Fri: 8 AM-Noon</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Escalation Dialog */}
      <Dialog open={escalationDialogOpen} onOpenChange={setEscalationDialogOpen}>
        <DialogContent data-testid="dialog-escalation">
          <DialogHeader>
            <DialogTitle>Speak to a Person</DialogTitle>
            <DialogDescription>
              Your question and the AI's response will be forwarded to town staff for personalized assistance.
              You'll receive a response within 1-2 business days.
            </DialogDescription>
          </DialogHeader>

          {selectedMessagePair && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm font-medium mb-1">Your Question:</p>
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {selectedMessagePair.userQuestion}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">AI Response:</p>
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md max-h-40 overflow-y-auto">
                  {selectedMessagePair.aiResponse}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEscalationDialogOpen(false)}
              disabled={isEscalating}
              data-testid="button-cancel-escalation"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmEscalation}
              disabled={isEscalating}
              className="bg-[#004422] hover:bg-[#003318]"
              data-testid="button-confirm-escalation"
            >
              {isEscalating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Forwarding...
                </>
              ) : (
                "Forward to Staff"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
