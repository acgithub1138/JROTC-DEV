import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X } from "lucide-react";
const PricingPage = () => {
  const plans = [{
    name: "Basic",
    price: "$2,000",
    period: "per year",
    description: "Perfect for JROTC programs",
    features: ["Unlimited cadets", "Full cadet management", "Task assignment", "Email communications", "Budget & inventory tracking", "Events Calendar"],
    notIncluded: [],
    popular: false,
    cta: "Get Started"
  }, {
    name: "Competition Tracking",
    price: "$2,500",
    period: "per year",
    description: "Most popular for competitive programs",
    features: ["All Basic features", "Competition Tracking", "Competition Analytics"],
    notIncluded: [],
    popular: true,
    cta: "Get Started"
  }, {
    name: "Competition Management",
    price: "$2,500",
    period: "per year",
    description: "Perfect for JORTC programs that host competitions",
    features: ["All Basic features", "All Competition Tracking features", "Competition Event Management (Coming soon...)"],
    notIncluded: [],
    popular: false,
    cta: "Get Started"
  }];
  const faqs = [{
    question: "What's your pricing model?",
    answer: "We offer transparent annual pricing with no hidden fees. Choose from our Basic or Competitions plans based on whether you need competition management features."
  }, {
    question: "Can I change plans later?",
    answer: "Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle."
  }, {
    question: "What kind of support do you provide?",
    answer: "We offer email support for both plans."
  }, {
    question: "Is my data secure?",
    answer: "Yes. We use industry-standard encryption and security measures. Your data is backed up regularly and stored securely in the cloud."
  }];
  return <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-10 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
              Simple, Transparent <span className="text-primary">Pricing</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Choose the plan that fits your JROTC program size and needs. 
              All plans include full support and training.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, index) => <Card key={index} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : 'border-border'}`}>
                {plan.popular && <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>}
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
                    {plan.features.map((feature, featureIndex) => <li key={featureIndex} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>)}
                    {plan.notIncluded.map((feature, featureIndex) => <li key={featureIndex} className="flex items-center gap-2">
                        <X className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>)}
                  </ul>
                  <Button className={`w-full ${plan.popular ? '' : 'variant-outline'}`} variant={plan.popular ? 'default' : 'outline'} size="lg" asChild>
                    <Link to="/contact">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>)}
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
            <p className="text-xl text-muted-foreground">
              Every JROTC Pro plan comes with these essential features
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {["Cloud-based access", "Mobile browser support", "Data backup & security", "Regular updates", "Email notifications", "User training materials"].map((feature, index) => <div key={index} className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="text-sm">{feature}</span>
              </div>)}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground">Get answers to common questions about JROTC CCC pricing and features</p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-6">
            {faqs.map((faq, index) => <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Start your JROTC Pro subscription today and see how our platform can transform your program management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
              <Link to="/contact">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link to="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>;
};
export default PricingPage;