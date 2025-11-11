import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Shield, BarChart3, FileText, Clock, Users } from "lucide-react";
import { ChatWidget } from "@/components/chat-widget";

export default function Landing() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | undefined>();

  const handleOpenChat = (message?: string) => {
    setChatInitialMessage(message);
    setChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            <span className="font-medium text-lg">West Newbury Assistant</span>
          </div>
          <nav className="flex items-center gap-4">
            <a href="#features" className="text-sm hover:text-primary transition-colors">Features</a>
            <a href="/transparency" className="text-sm hover:text-primary transition-colors">Transparency</a>
            <Button asChild data-testid="button-login">
              <a href="/api/login">Admin Login</a>
            </Button>
          </nav>
        </div>
      </header>

      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-medium mb-4 text-foreground">
              West Newbury AI Assistant
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get instant answers to your questions about West Newbury town services, 24/7. Our AI assistant provides transparent, trustworthy assistance for all your municipal information needs.
            </p>
          </div>

          <div className="flex justify-center gap-4 mb-16">
            <Button 
              size="lg" 
              className="gap-2" 
              onClick={() => handleOpenChat()}
              data-testid="button-try-demo"
            >
              <MessageCircle className="h-5 w-5" />
              Try the Assistant
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/transparency">View Transparency Report</a>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" id="features">
            <Card className="hover-elevate">
              <CardHeader>
                <Clock className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-xl">24/7 Availability</CardTitle>
                <CardDescription>
                  Get answers about trash schedules, permits, office hours, and more - anytime, from any device.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-xl">Built-in Safeguards</CardTitle>
                <CardDescription>
                  PII protection, content moderation, and rate limiting ensure responsible, secure AI assistance.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <FileText className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-xl">Source Citations</CardTitle>
                <CardDescription>
                  Every answer includes clear citations to official town documents for full transparency.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-xl">Human Escalation</CardTitle>
                <CardDescription>
                  Complex questions route directly to the appropriate town department for personalized help.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-xl">Public Analytics</CardTitle>
                <CardDescription>
                  View real usage statistics updated daily. Full transparency in how AI serves your community.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <MessageCircle className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-xl">Natural Language</CardTitle>
                <CardDescription>
                  Ask questions in plain English. No need to navigate complex websites or menus.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-medium mb-3">Common Questions</h2>
            <p className="text-muted-foreground">See how our AI assistant can help you</p>
          </div>

          <div className="grid gap-4">
            {[
              { question: "When are Select Board meetings held?", category: "Town Government" },
              { question: "What are the town office hours?", category: "General Info" },
              { question: "When is trash and recycling pickup?", category: "Sanitation" },
              { question: "How do I contact the Board of Health?", category: "Health Services" },
            ].map((example, idx) => (
              <Card 
                key={idx} 
                className="hover-elevate active-elevate-2 cursor-pointer" 
                onClick={() => handleOpenChat(example.question)}
                data-testid={`example-question-${idx}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-5 w-5 text-primary" />
                      <span className="font-medium">{example.question}</span>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {example.category}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span>Town of West Newbury - AI Assistant</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="/transparency" className="text-muted-foreground hover:text-foreground transition-colors">
                AI Transparency Report
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </footer>

      <ChatWidget 
        isOpenExternal={chatOpen}
        onOpenChange={setChatOpen}
        initialMessage={chatInitialMessage}
      />
    </div>
  );
}
