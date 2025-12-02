import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X } from "lucide-react";
const PricingPage = () => {
  const plans = [
    {
      name: "Competitions - Basic",
      price: "Free",
      period: "",
      description: "Best For JROTC Programs that want to register for competitions",
      features: ["Register for Competitions", "Competition Schedule", "Instant Access to Event Scores"],
      notIncluded: [],
      popular: false,
      cta: "Get Started",
    },
    {
      name: "Competitions - Analytics",
      price: "$199",
      period: "per year",
      description: "Best for JROTC programs that participate in competitions",
      features: [
        "All Basic features +",
        "My Competition Tracking",
        "Score Sheet Templates",
        "Competition Registration",
        "Event Time Selection",
        "Competition Analytics",
      ],
      notIncluded: [],
      popular: true,
      cta: "Get Started",
    },
    {
      name: "Competitions - Hosting (per meet)",
      price: "$199",
      period: "per-meet",
      description: "Best for JORTC programs that host 1-3 competitions",
      features: [
        "All Competition - Analytics features +",
        "Competition Dashboard",
        "Host Competitions",
        "Event Management",
        "Resource Management",
        "Judges Portal",
        "Schedule Management",
        "Real-Time Score Tracking",
        "Real-Time Ranks",
      ],
      notIncluded: [],
      popular: false,
      cta: "Get Started",
    },
    {
      name: "Competitions - Hosting (Unlimited)",
      price: "$799",
      period: "per year",
      description: "Best for JORTC programs that host 4+ competitions",
      features: [
        "All Competition - Analytics features +",
        "Competition Dashboard",
        "Host Competitions",
        "Event Management",
        "Resource Management",
        "Judges Portal",
        "Schedule Management",
        "Real-Time Score Tracking",
        "Real-Time Ranks",
      ],
      notIncluded: [],
      popular: false,
      cta: "Get Started",
    },
  ];
  const faqs = [
    {
      question: "What's your pricing model?",
      answer: "We offer transparent annual or per meet pricing with no extra hidden fees.",
    },
    {
      question: "Can I change plans later?",
      answer:
        "Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.",
    },
    {
      question: "What kind of support do you provide?",
      answer: "We offer email support for non hosting plans, and email and phone support for hosting plans.",
    },
    {
      question: "Is my data secure?",
      answer:
        "Yes. We use industry-standard encryption and security measures. Your data is backed up regularly and stored securely in the cloud.",
    },
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-10 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
              Simple, Transparent <span className="text-primary">Pricing</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Choose the plan that fits your JROTC program size and needs. All plans include full support and training.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto pt-8">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative ${plan.popular ? "border-primary shadow-lg scale-105" : "border-border"}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                    {plan.notIncluded.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <X className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${plan.popular ? "" : "variant-outline"}`}
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                    asChild
                  >
                    <Link to="/contact">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Money Back Guarantee */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center gap-2 bg-muted/50 rounded-lg px-6 py-3">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="text-sm">Professional support • Custom setup • No setup fees</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">All Plans Include</h2>
            <p className="text-xl text-muted-foreground">Every JROTC Pro plan comes with these essential features</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              "Cloud-based access",
              "Mobile browser support",
              "Data backup & security",
              "Regular updates",
              "Email notifications",
              "User training materials",
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground">
              Get answers to common questions about JROTC CCC pricing and features
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Start your JROTC Pro subscription today and see how our platform can transform your program management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
              <Link to="/contact">Get Started</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              asChild
            ></Button>
          </div>
        </div>
      </section>
    </div>
  );
};
export default PricingPage;
