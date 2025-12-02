import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  ClipboardList,
  Trophy,
  HelpCircle,
  UserCheck,
  DollarSign,
  Package,
  Calendar,
  Contact,
  Mail,
  Shield,
  Building,
  Settings,
  ArrowRight,
  CheckCircle,
  Star,
} from "lucide-react";
const LandingPage = () => {
  const modules = [
    //  {
    //    icon: Users,
    //    title: "Cadet Management",
    //    description: "Keep rosters up to date, make bulk changes, and track ranks and PT scores with just a few clicks.",
    //    href: "/products/cadet-management",
    //    features: ["Profile tracking", "PT tracking", "Leadership Development tracking"]
    //  }, {
    //    icon: ClipboardList,
    //    title: "Task Management",
    //    description: "No more missed texts or confusing email threads.  Assign, track, and complete cadet tasks – all in one central place.",
    //    href: "/products/task-management",
    //    features: ["Assignment creation", "Progress tracking", "Deadline monitoring", "Automated reminders"]
    //  }, {
    //    icon: UserCheck,
    //    title: "Chain of Command",
    //    description: "Keep your chain of command organized and see your structure visually.",
    //    href: "/products/team-management",
    //    features: ["Unit organization", "Leadership tracking", "Team communications", "Role assignments", "Visual Hierarchy Chart"]
    //  }, {
    //    icon: DollarSign,
    //    title: "Budget Management",
    //    description: "Keep your budget under control and manage financial records with ease.",
    //    href: "/products/budget-management",
    //    features: ["Income tracking", "Expense tracking", "Budget monitoring", "Yearly Archiving"]
    //  }, {
    //    icon: Package,
    //    title: "Inventory Management",
    //    description: "Stay on top of your equipment and supplies with powerful tracking tools.",
    //    href: "/products/inventory-management",
    //    features: ["Equipment tracking", "Resource monitoring"]
    //  }, {
    //    icon: Calendar,
    //    title: "Calendar Management",
    //    description: "Plan events, set recurring meetings, and keep everyone informed about what's going on and when.",
    //    href: "/products/calendar-management",
    //    features: ["Event scheduling", "Meetings scheduling", "Activity coordination"]
    //  }, {
    //    icon: Contact,
    //    title: "JROTC Contacts",
    //    description: "Keep parents, relatives, vendors, and supporters organized and accessible.",
    //    href: "/products/contacts-management",
    //    features: ["Contact management"]
    //  }, {
    //    icon: Mail,
    //    title: "Email Management",
    //    description: "Set up email notifications for the cadet tasks to keep them informed on what needs to be done.",
    //    href: "/products/email-management",
    //    features: ["Automated emails", "Template library", "Targeted messaging", "Communication tracking"]
    //  }, {
    //    icon: Users,
    //    title: "Parent Portal",
    //    description: "Parents of cadets can stay informed with announcements and program calendar.",
    //    href: "/products/email-management",
    //    features: ["Announcements", "Calendar of events"]
    //  },
    {
      icon: Trophy,
      title: "Competition - Basic",
      description: "Register for competitions.",
      href: "/products/competition-management",
      features: ["Register for Competitions", "Competition Scoring"],
    },
    {
      icon: Trophy,
      title: "Competition - Analytics",
      description: "Track your competitions and review your performance over time.",
      href: "/products/competition-management",
      features: [
        "Register for Competitions",
        "Event time selection",
        "Competition Scoring",
        "Performance analytics",
        "Achievement tracking",
      ],
    },
    {
      icon: Trophy,
      title: "Competition - Hosting",
      description: "Keep your competition events running smoothly from start to finish.",
      href: "/products/competition-management",
      features: [
        "Competition Planning",
        "Casdet Management",
        "Resource Management",
        "Participant Management",
        "Judges Portal",
        "Schedule Management",
        "Custom Score Sheets",
        "Real-Time Scoring",
      ],
    },
  ];
  const testimonials = [
    //    {
    //      name: "Colonel Sarah Martinez",
    //      title: "JROTC Instructor, Lincoln High",
    //      content: "JROTC Pro has transformed how we manage our program. What used to take hours now takes minutes.",
    //      rating: 5
    //    },
    //    {
    //      name: "Major Robert Chen",
    //      title: "Senior Army Instructor",
    //      content: "The cadet tracking and competition management features are game-changers for our unit.",
    //      rating: 5
    //    },
    //    {
    //      name: "MSG Jennifer Williams",
    //      title: "JROTC Administrator",
    //      content: "Finally, a system that understands the unique needs of JROTC programs. Highly recommended!",
    //      rating: 5
    //    }
  ];
  const benefits = [
    "Save 10+ hours per week on administrative tasks",
    "Improve cadet engagement and tracking by 300%",
    "Streamline communication with automated systems",
    "Reduce paperwork and manual processes by 80%",
    "Enhanced competition planning and scoring",
    "Better budget and inventory management",
  ];
  return (
    <div className="min-h-screen">
      {/* Hero Section - Critical content rendered first */}
      <section className="relative py-10 lg:py-16 bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
              Streamline Your <span className="text-primary">JROTC Competition</span> Management
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              This comprehensive platform is designed specifically for JROTC Competition instructors to manage every
              aspect of your competitions in one powerful system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link to="/contact">Get Started</Link>
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Email support included</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Custom setup available</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Training provided</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">
              Stop struggling with legacy systems & outdated <span className="text-destructive">manual processes</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-destructive">Before JROTC CCC:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Hours spent on paperwork and manual tracking</li>
                  <li>• Scattered information across multiple systems</li>
                  <li>• Difficulty coordinating competitions and events</li>
                  <li>• Inefficient communication with cadets and parents</li>
                  <li>• Lost time that could be spent training cadets</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary">After JROTC CCC:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• All information centralized in one platform</li>
                  <li>• Competition tracking and reporting</li>
                  <li>• Streamlined competition management</li>
                  <li>• Automated communications</li>
                  <li>• More time for what matters: developing leaders!</li>
                </ul>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {benefits.slice(0, 4).map((benefit, index) => (
                <div key={index} className="space-y-2">
                  <div className="text-2xl font-bold text-primary">
                    {index === 0 ? "10+" : index === 1 ? "300%" : index === 2 ? "24/7" : "80%"}
                  </div>
                  <div className="text-sm text-muted-foreground">{benefit}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Deferred rendering */}
      <section
        className="py-20"
        style={{
          contentVisibility: "auto",
        }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Everything You Need to Manage Your JROTC Competitions
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive modules designed specifically for JROTC Competition Management, from events & judges to
              scheduling.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {modules.map((module, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/20"
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <module.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl">{module.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base">{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {module.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to Transform Your JROTC Program?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join now and help streamline your competition management with our comprehensive platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
              <Link to="/contact">Get Started Today</Link>
            </Button>
            <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>
          <p className="text-sm mt-4 opacity-75">Email support included • Custom setup available • Training provided</p>
        </div>
      </section>
    </div>
  );
};
export default LandingPage;
