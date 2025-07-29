import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
const LoginPage = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/app");
    }
  }, [user, navigate]);
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });
      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have been successfully signed in."
        });
        navigate("/app");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">JROTC Pro</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">
            Sign in to access your JROTC program management dashboard
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="your.email@school.edu" value={formData.email} onChange={e => handleChange("email", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={formData.password} onChange={e => handleChange("password", e.target.value)} required />
              </div>
              <div className="flex items-center justify-between text-sm">
                <Link to="/forgot-password" className="text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
            
            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/contact" className="text-primary hover:underline">
                Contact us to get started
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Trial CTA */}
        <Card className="mt-6 bg-primary/5 border-primary/20">
          <CardContent className="pt-6 text-center">
            <h3 className="font-semibold mb-2">New to JROTC CCC?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Contact our team to learn more about how we can transform your program management.
            </p>
            <Button variant="outline" asChild>
              <Link to="/contact">Get Started</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Features reminder */}
        
      </div>
    </div>;
};
export default LoginPage;