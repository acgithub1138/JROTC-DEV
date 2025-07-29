import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";

const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background py-12 px-4">
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
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@school.edu"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <Link to="/forgot-password" className="text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Button className="w-full" size="lg">
              Sign In
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/contact" className="text-primary hover:underline">
                Start your free trial
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Trial CTA */}
        <Card className="mt-6 bg-primary/5 border-primary/20">
          <CardContent className="pt-6 text-center">
            <h3 className="font-semibold mb-2">New to JROTC Pro?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start your 30-day free trial and see how we can transform your program management.
            </p>
            <Button variant="outline" asChild>
              <Link to="/contact">Start Free Trial</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Features reminder */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            JROTC Pro includes:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>• Cadet Management</div>
            <div>• Task Tracking</div>
            <div>• Competition Scoring</div>
            <div>• Email Automation</div>
            <div>• Budget Management</div>
            <div>• Calendar Integration</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;