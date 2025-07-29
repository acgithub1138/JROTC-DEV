import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Target, Users, Award } from "lucide-react";

const AboutPage = () => {
  const values = [
    {
      icon: Shield,
      title: "Military Excellence",
      description: "Built by educators who understand the unique needs and standards of military education programs."
    },
    {
      icon: Target,
      title: "Purpose-Driven",
      description: "Every feature is designed specifically for JROTC programs, not adapted from generic solutions."
    },
    {
      icon: Users,
      title: "Community Focused",
      description: "We listen to our users and continuously improve based on real instructor feedback and needs."
    },
    {
      icon: Award,
      title: "Excellence in Service",
      description: "Committed to providing the highest quality platform and support for military educators."
    }
  ];

  const team = [
    {
      name: "Colonel (Ret.) Michael Johnson",
      title: "Founder & CEO",
      bio: "30 years of military service including 10 years as a JROTC instructor. Understands the challenges of program management firsthand."
    },
    {
      name: "Sarah Chen",
      title: "Head of Product",
      bio: "Former education technology specialist with expertise in building platforms that actually work for educators."
    },
    {
      name: "Major (Ret.) David Rodriguez",
      title: "Customer Success",
      bio: "15 years JROTC instruction experience, now dedicated to helping other instructors succeed with our platform."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
              Built by <span className="text-primary">Military Educators</span>,<br />
              for Military Educators
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              JROTC Pro was created by instructors who experienced the frustration of managing 
              programs with outdated tools. We built the solution we wished we had.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Our Story</h2>
            <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
              <p>
                It started with a simple frustration. Colonel Michael Johnson, after transitioning from active duty 
                to JROTC instruction, found himself spending more time on paperwork and administrative tasks than 
                actually teaching and mentoring cadets.
              </p>
              <p>
                Hours were wasted tracking cadet progress on spreadsheets, manually organizing competitions, 
                and coordinating communications through multiple disconnected systems. There had to be a better way.
              </p>
              <p>
                After talking with fellow instructors across the country, it became clear this wasn't an isolated 
                problem. Every JROTC program was struggling with the same inefficiencies, using tools that weren't 
                designed for military education.
              </p>
              <p>
                That's when we decided to build JROTC Pro – a platform designed specifically for JROTC programs, 
                by people who understand the unique challenges of military education. Every feature is built with 
                real instructor input, solving real problems that we've experienced ourselves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Mission & Values</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're committed to empowering JROTC instructors with tools that let them focus on 
              what matters most: developing the next generation of leaders.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      <value.icon className="h-8 w-8" />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {value.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-xl text-muted-foreground">
              Experienced military educators and technology professionals working together
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {team.map((member, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{member.name}</CardTitle>
                  <CardDescription className="text-primary font-medium">
                    {member.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">By the Numbers</h2>
            <p className="text-xl text-muted-foreground">
              The impact we're making in JROTC programs nationwide
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Programs Using JROTC Pro</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">25,000+</div>
              <div className="text-muted-foreground">Cadets Managed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10hrs</div>
              <div className="text-muted-foreground">Average Time Saved Weekly</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-muted-foreground">Uptime Guarantee</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Questions About Our Mission?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            We'd love to hear from you. Reach out to learn more about our story and how 
            we can help your JROTC program succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:hello@jrotcpro.com" 
              className="inline-flex items-center justify-center rounded-md bg-primary-foreground text-primary px-8 py-3 text-lg font-medium hover:bg-primary-foreground/90 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;