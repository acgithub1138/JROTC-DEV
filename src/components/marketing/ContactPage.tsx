import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Validation functions
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
const formatPhoneNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};
const isValidPhoneNumber = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 0 || digits.length === 10;
};
const ContactPage = () => {
  const {
    toast
  } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    school: "",
    cadets: "",
    message: "",
    type: "demo"
  });
  const [errors, setErrors] = useState({
    email: "",
    phone: ""
  });
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const handleSubmit = async () => {
    // Validation
    const newErrors = {
      email: "",
      phone: ""
    };
    let hasErrors = false;
    if (!formData.name || !formData.email || !formData.school) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Name, Email, School)",
        variant: "destructive"
      });
      return;
    }
    if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      hasErrors = true;
    }
    if (formData.phone && !isValidPhoneNumber(formData.phone)) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
      hasErrors = true;
    }
    setErrors(newErrors);
    if (hasErrors) {
      toast({
        title: "Validation Errors",
        description: "Please correct the errors below",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('contact-form', {
        body: formData
      });
      if (error) throw error;
      toast({
        title: "Message Sent Successfully!",
        description: "Thank you for contacting us. We'll get back to you soon."
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        school: "",
        cadets: "",
        message: "",
        type: "demo"
      });
      setErrors({
        email: "",
        phone: ""
      });
    } catch (error) {
      console.error('Error sending contact form:', error);
      toast({
        title: "Failed to Send Message",
        description: "There was an error sending your message. Please try again or contact us directly.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleChange = (field: string, value: string) => {
    let processedValue = value;

    // Format phone number as user types
    if (field === "phone") {
      processedValue = formatPhoneNumber(value);
    }
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));

    // Clear errors when user starts typing
    if (field === "email" || field === "phone") {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };
  const contactInfo = [{
    icon: Mail,
    title: "Email Us",
    content: "jortc_ccc@careyunlimited.com",
    description: "We are here to help!"
  }, {
    icon: MapPin,
    title: "Office",
    content: "Flower Mound, TX",
    description: "Home base"
  }];
  return <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
              Get Started with <span className="text-primary">JROTC CCC</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Ready to transform your JROTC program management? Get in touch with our team 
              to learn more or schedule a personalized demo.
            </p>
          </div>

          <div className="grid lg:grid-cols-1 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Contact Us</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you or schedule a demo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input id="name" value={formData.name} onChange={e => handleChange("name", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input id="email" type="email" value={formData.email} onChange={e => handleChange("email", e.target.value)} className={errors.email ? "border-destructive" : ""} required />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" value={formData.phone} onChange={e => handleChange("phone", e.target.value)} placeholder="(555) 123-4567" className={errors.phone ? "border-destructive" : ""} />
                      {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="school">School/Institution *</Label>
                      <Input id="school" value={formData.school} onChange={e => handleChange("school", e.target.value)} required />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cadets">Number of Cadets</Label>
                      <Select value={formData.cadets} onValueChange={value => handleChange("cadets", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-50">1-50 cadets</SelectItem>
                          <SelectItem value="51-100">51-100 cadets</SelectItem>
                          <SelectItem value="101-200">101-200 cadets</SelectItem>
                          <SelectItem value="201-500">201-500 cadets</SelectItem>
                          <SelectItem value="500+">500+ cadets</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">I'm Interested In</Label>
                      <Select value={formData.type} onValueChange={value => handleChange("type", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="demo">Schedule Demo</SelectItem>
                          <SelectItem value="pricing">Pricing Information</SelectItem>
                          <SelectItem value="setup">Get Started</SelectItem>
                          <SelectItem value="support">Technical Support</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Additional Information</Label>
                    <Textarea id="message" placeholder="Tell us about your current challenges or specific needs..." value={formData.message} onChange={e => handleChange("message", e.target.value)} rows={4} />
                  </div>

                  <Button onClick={handleSubmit} size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Common Questions</h2>
            <p className="text-xl text-muted-foreground">
              Quick answers to questions about getting started
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How quickly can I get started?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Most programs are up and running within 3-5 days. We provide setup 
                  assistance and training to ensure a smooth transition.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is training provided?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! We offer comprehensive training for all users, including video tutorials, 
                  documentation, and live training sessions for larger programs.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I import existing data?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Absolutely. We can help you import cadet records, WINGS Inventory data, 
                  and other information from spreadsheets or existing systems.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What if I need help later?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our support team is available via email.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>;
};
export default ContactPage;