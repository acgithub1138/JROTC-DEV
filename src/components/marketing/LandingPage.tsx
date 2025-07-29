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
  Star
} from "lucide-react";

const LandingPage = () => {
  const modules = [
    {
      icon: Users,
      title: "Cadet Management",
      description: "Track cadet profiles, progress, discipline records, and achievements in one centralized system.",
      href: "/products/cadet-management",
      features: ["Profile tracking", "Progress monitoring", "Discipline records", "Achievement tracking"]
    },
    {
      icon: ClipboardList,
      title: "Task Management",
      description: "Create, assign, and monitor tasks with automated progress tracking and deadline management.",
      href: "/products/task-management",
      features: ["Assignment creation", "Progress tracking", "Deadline monitoring", "Automated reminders"]
    },
    {
      icon: Trophy,
      title: "Competition Management",
      description: "Plan events, manage scoring, track performance analytics, and celebrate achievements.",
      href: "/products/competition-management",
      features: ["Event planning", "Scoring system", "Performance analytics", "Achievement tracking"]
    },
    {
      icon: UserCheck,
      title: "Team Management",
      description: "Organize units, define leadership structures, and manage team communications effectively.",
      href: "/products/team-management",
      features: ["Unit organization", "Leadership tracking", "Team communications", "Role assignments"]
    },
    {
      icon: DollarSign,
      title: "Budget Management",
      description: "Track expenses, monitor budgets, manage financial resources with detailed reporting.",
      href: "/products/budget-management",
      features: ["Expense tracking", "Budget monitoring", "Financial reporting", "Resource allocation"]
    },
    {
      icon: Package,
      title: "Inventory Management",
      description: "Manage equipment, track maintenance schedules, and ensure resource availability.",
      href: "/products/inventory-management",
      features: ["Equipment tracking", "Maintenance schedules", "Resource monitoring", "Usage analytics"]
    },
    {
      icon: Calendar,
      title: "Calendar Management",
      description: "Schedule events, track deadlines, coordinate activities with integrated calendar system.",
      href: "/products/calendar-management",
      features: ["Event scheduling", "Deadline tracking", "Activity coordination", "Automated notifications"]
    },
    {
      icon: Mail,
      title: "Email Management",
      description: "Automated communications, template management, and targeted messaging for all stakeholders.",
      href: "/products/email-management",
      features: ["Automated emails", "Template library", "Targeted messaging", "Communication tracking"]
    }
  ];

  const testimonials = [
    {
      name: "Colonel Sarah Martinez",
      title: "JROTC Instructor, Lincoln High",
      content: "JROTC Pro has transformed how we manage our program. What used to take hours now takes minutes.",
      rating: 5
    },
    {
      name: "Major Robert Chen",
      title: "Senior Army Instructor",
      content: "The cadet tracking and competition management features are game-changers for our unit.",
      rating: 5
    },
    {
      name: "MSG Jennifer Williams",
      title: "JROTC Administrator",
      content: "Finally, a system that understands the unique needs of JROTC programs. Highly recommended!",
      rating: 5
    }
  ];

  const benefits = [
    "Save 10+ hours per week on administrative tasks",
    "Improve cadet engagement and tracking by 300%",
    "Streamline communication with automated systems",
    "Reduce paperwork and manual processes by 80%",
    "Enhanced competition planning and scoring",
    "Better budget and inventory management"
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
              Streamline Your <span className="text-primary">JROTC Program</span> Management
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The comprehensive platform designed specifically for JROTC instructors to manage cadets, 
              competitions, tasks, and communications in one powerful system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link to="/contact">Get Started</Link>
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Full support included</span>
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
              Stop Struggling with WINGS & Outdated <span className="text-destructive">Manual Processes</span>
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
                  <li>• Automated tracking and reporting</li>
                  <li>• All information centralized in one platform</li>
                  <li>• Streamlined competition management</li>
                  <li>• Automated communication systems</li>
                  <li>• More time for what matters: developing leaders</li>
                </ul>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {benefits.slice(0, 4).map((benefit, index) => (
                <div key={index} className="space-y-2">
                  <div className="text-2xl font-bold text-primary">{index === 0 ? "10+" : index === 1 ? "300%" : index === 2 ? "24/7" : "80%"}</div>
                  <div className="text-sm text-muted-foreground">{benefit}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Everything You Need to Manage Your JROTC Program
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive modules designed specifically for JROTC program management,
              from cadet tracking to competition scoring.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {modules.map((module, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/20">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <module.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl">{module.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {module.description}
                  </CardDescription>
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
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground" asChild>
                    <Link to={module.href}>
                      Learn More <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Trusted by JROTC Instructors Nationwide
            </h2>
            <p className="text-xl text-muted-foreground">
              See what military educators are saying about JROTC Pro
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-lg mb-4 italic">
                    "{testimonial.content}"
                  </blockquote>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.title}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Transform Your JROTC Program?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join hundreds of JROTC instructors who have already streamlined their program management 
            with our comprehensive platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
              <Link to="/contact">Get Started Today</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>
          <p className="text-sm mt-4 opacity-75">
            Full support included • Custom setup available • Training provided
          </p>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;