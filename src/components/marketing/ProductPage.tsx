import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface ProductPageProps {
  module: string;
}

const ProductPage = ({ module }: ProductPageProps) => {
  const moduleData = {
    cadet: {
      icon: Users,
      title: "Cadet Management",
      subtitle: "Comprehensive cadet tracking and development system",
      description: "Track every aspect of your cadets' journey from enrollment to graduation. Monitor progress, maintain PT records, track achievements, and support their leadership development with our comprehensive cadet management system.",
      features: [
        {
          title: "Profile Management",
          description: "Complete cadet profiles with rank, fight, & year.",
          benefits: ["Centralized cadet information", "Quick access to critical data", "Historical tracking"]
        },
        {
          title: "Progress Tracking",
          description: "Monitor leadership development, physical fitness, and skill acquisition.",
          benefits: ["PT tracking", "LDR tracking"]
        },
      ],
      integrations: ["Task Management", "Team Management", "Email Management"],
      testimonial: {
        content: "The cadet management system has revolutionized how we track our 200+ cadets. Everything is organized and accessible.",
        author: "MSgt Jennifer Rodriguez",
        title: "Senior Army Instructor"
      }
    },
    task: {
      icon: ClipboardList,
      title: "Task Management",
      subtitle: "Streamlined assignment and progress tracking",
      description: "Create, assign, and monitor tasks efficiently with automated reminders, progress tracking, and completion verification. Perfect for managing everything from daily assignments to major projects.",
      features: [
        {
          title: "Assignment Creation",
          description: "Create detailed tasks with due dates, priorities, and specific instructions.",
          benefits: ["Standardized task formats", "Clear expectations", "Reduced confusion"]
        },
        {
          title: "Progress Monitoring",
          description: "Real-time tracking of task completion, submission status, and quality assessment.",
          benefits: ["Live progress updates", "Early intervention alerts", "Template notifications"]
        },
        {
          title: "Automated Reminders",
          description: "Smart notification system for upcoming deadlines and overdue assignments.",
          benefits: ["Improved completion rates", "Reduced missed deadlines", "Better time management"]
        }
      ],
      integrations: ["Cadet Management", "Calendar Management", "Email Management"],
      testimonial: {
        content: "Task management has eliminated the chaos of tracking assignments. Our completion rates improved by 40%.",
        author: "Colonel Sarah Thompson",
        title: "JROTC Program Director"
      }
    },
    competition: {
      icon: Trophy,
      title: "Competition Management",
      subtitle: "Competition scoring system",
      description: "Track and analyze JROTC competitions from drill meets to academic bowls!",
      features: [
//        {
//          title: "Event Planning",
//          description: "Complete event management from registration to awards ceremony with timeline tracking.",
//          benefits: ["Streamlined organization", "Automated scheduling", "Resource coordination"]
//        },
        {
          title: "Scoring System",
          description: "Digital scoring with multiple judge support, real-time calculations, and instant results.",
          benefits: ["Accurate scoring", "Transparent results", "Reduced errors"]
        },
        {
          title: "Performance Analytics",
          description: "Detailed analysis of individual and team performance with trend identification.",
          benefits: ["Data-driven improvements", "Strength identification", "Training optimization"]
        },
        {
          title: "Award Management",
          description: "Track each award you achieved in the competition.",
          benefits: ["Award tracking"]
        }
      ],
      integrations: ["Cadet Management", "Team Management", "Calendar Management"],
      testimonial: {
        content: "Our drill meets run smoother than ever. The scoring system eliminated disputes and saves hours of work.",
        author: "Major Robert Kim",
        title: "Competition Coordinator"
      }
    },
    // ... continue for other modules
  };

  const currentModule = moduleData[module as keyof typeof moduleData];
  
  if (!currentModule) {
    return <div>Module not found</div>;
  }

  const Icon = currentModule.icon;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-primary/10 text-primary">
                <Icon className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
              {currentModule.title}
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {currentModule.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link to="/contact">Get Started</Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8" asChild>
                <Link to="/contact">Schedule Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Description Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              {currentModule.description}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-8">
              <Badge variant="secondary">JROTC Optimized</Badge>
              <Badge variant="secondary">Real-time Updates</Badge>
              <Badge variant="secondary">Mobile Friendly</Badge>
              <Badge variant="secondary">Cloud Based</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Powerful Features for Complete {currentModule.title}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to efficiently manage this aspect of your JROTC program
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {currentModule.features.map((feature, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">
              Seamlessly Integrates with Other Modules
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {currentModule.title} works together with other JROTC Pro modules to provide a complete management solution.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {currentModule.integrations.map((integration, index) => (
                <Badge key={index} variant="outline" className="text-sm py-2 px-4">
                  {integration}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="text-center">
              <CardContent className="pt-8 pb-8">
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-xl mb-6 italic">
                  "{currentModule.testimonial.content}"
                </blockquote>
                <div>
                  <div className="font-semibold text-lg">{currentModule.testimonial.author}</div>
                  <div className="text-muted-foreground">{currentModule.testimonial.title}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Streamline Your {currentModule.title}?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join hundreds of JROTC instructors who have already transformed their program management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
              <Link to="/contact">Get Started Today</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link to="/">Explore All Features</Link>
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

export default ProductPage;