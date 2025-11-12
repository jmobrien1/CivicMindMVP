import { useDemo } from "@/contexts/DemoContext";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, FileSearch, Workflow, Shield, Building2, Phone, MapPin } from "lucide-react";

export default function Landing() {
  const { isDemoMode, setRole } = useDemo();
  const [, setLocation] = useLocation();

  const handleRoleSelect = (role: "resident" | "staff") => {
    setRole(role);
    setLocation(role === "resident" ? "/resident" : "/staff");
  };

  if (!isDemoMode) {
    // If not in demo mode, show traditional landing page
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-medium text-lg">West Newbury Assistant</span>
            </div>
            <nav className="flex items-center gap-4">
              <a href="/transparency" className="text-sm hover:text-primary transition-colors">Transparency</a>
              <Button asChild size="sm">
                <a href="/api/login">Staff Login</a>
              </Button>
            </nav>
          </div>
        </header>
        
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">West Newbury AI Assistant</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get instant answers to your questions about West Newbury town services, 24/7.
          </p>
          <Button size="lg" asChild>
            <a href="/resident">Get Started</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F0E9] to-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-[#004422]" />
            <span className="font-medium text-lg">West Newbury Assistant</span>
            <span className="text-xs bg-[#D4AF37] text-white px-2 py-1 rounded ml-2">DEMO</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#004422]">
            CivicMind – West Newbury Demo
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Experience the power of AI for municipal services. Choose your role to explore a complete demonstration of how AI lightens the burden on town staff while empowering residents with 24/7 answers and built-in oversight.
          </p>
        </div>

        {/* Role Selector - Two Panel */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Resident Panel */}
          <Card className="hover-elevate cursor-pointer border-2 hover:border-[#004422] transition-all" onClick={() => handleRoleSelect("resident")} data-testid="card-resident-role">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-[#004422]/10 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-[#004422]" />
              </div>
              <CardTitle className="text-2xl">I'm a Resident</CardTitle>
              <CardDescription className="text-base">
                Ask questions about West Newbury services, find meeting schedules, and see what's happening around town.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full bg-[#004422] hover:bg-[#003318]" size="lg" data-testid="button-start-resident">
                Start Resident Demo →
              </Button>
            </CardContent>
          </Card>

          {/* Staff Panel */}
          <Card className="hover-elevate cursor-pointer border-2 hover:border-[#D4AF37] transition-all" onClick={() => handleRoleSelect("staff")} data-testid="card-staff-role">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center">
                <Building2 className="h-8 w-8 text-[#D4AF37]" />
              </div>
              <CardTitle className="text-2xl">I'm Town Staff</CardTitle>
              <CardDescription className="text-base">
                Review tickets, see how the AI answered residents, and manage analytics & guardrails.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full bg-[#D4AF37] hover:bg-[#C39F32] text-white" size="lg" data-testid="button-start-staff">
                Start Staff Demo →
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Four CivicMind Pillars */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-[#004422]">
            Four CivicMind Pillars
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pillar 1: Citizen Engagement */}
            <Card data-testid="card-pillar-engagement">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#004422]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-6 w-6 text-[#004422]" />
                  </div>
                  <div>
                    <CardTitle className="text-xl mb-2">Citizen Engagement Assistant</CardTitle>
                    <CardDescription className="text-sm mb-3">
                      Real-time answers, escalation to humans, 24/7 availability
                    </CardDescription>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Trash & recycling schedules</li>
                      <li>• Tax deadlines & payment options</li>
                      <li>• Office hours & contact information</li>
                      <li>• Meeting schedules & agendas</li>
                    </ul>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Pillar 2: Document & Data Insights */}
            <Card data-testid="card-pillar-documents">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#004422]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileSearch className="h-6 w-6 text-[#004422]" />
                  </div>
                  <div>
                    <CardTitle className="text-xl mb-2">Document & Data Insights</CardTitle>
                    <CardDescription className="text-sm mb-3">
                      Summarize bylaws, permit requirements, meeting minutes with citations
                    </CardDescription>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• AI-powered document summaries</li>
                      <li>• Official source citations</li>
                      <li>• Document explorer for staff</li>
                    </ul>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Pillar 3: Smart Ticketing */}
            <Card data-testid="card-pillar-ticketing">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Workflow className="h-6 w-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <CardTitle className="text-xl mb-2">Smart Ticketing & Workflow</CardTitle>
                    <CardDescription className="text-sm mb-3">
                      Auto-create tickets, route to departments, track resolution
                    </CardDescription>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Automatic ticket creation</li>
                      <li>• Department routing (Board of Health, DPW, Clerk)</li>
                      <li>• Status tracking & resolution</li>
                    </ul>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Pillar 4: Transparency & Guardrails */}
            <Card data-testid="card-pillar-transparency">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#004422]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="h-6 w-6 text-[#004422]" />
                  </div>
                  <div>
                    <CardTitle className="text-xl mb-2">Transparency & Guardrails</CardTitle>
                    <CardDescription className="text-sm mb-3">
                      Public snapshot for residents, full operations dashboard for staff
                    </CardDescription>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• PII filtering & content moderation</li>
                      <li>• Emergency redirection (call 911)</li>
                      <li>• Anti-abuse policies & rate limiting</li>
                    </ul>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-[#004422]" />
                <span className="font-medium">Town of West Newbury</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered assistance for municipal services
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </h3>
              <p className="text-sm text-muted-foreground">
                381 Main Street<br />
                West Newbury, MA 01985
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact
              </h3>
              <p className="text-sm text-muted-foreground">
                Phone: (978) 363-1100<br />
                Mon-Thu: 8 AM-4:30 PM<br />
                Fri: 8 AM-Noon
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>West Newbury CivicMind Demo © 2025</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
