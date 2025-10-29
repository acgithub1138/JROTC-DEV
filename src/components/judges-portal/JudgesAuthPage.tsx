import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Gavel } from "lucide-react";

export const JudgesAuthPage = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  });

  useEffect(() => {
    // Check if already authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/app/judges-portal");
      }
    });
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      toast.success("Signed in successfully");
      navigate("/app/judges-portal");
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast.error(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-judge-user", {
        body: {
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone || null,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success("Account created successfully! Please sign in.");
      setIsSignUp(false);
      setFormData({ email: "", password: "", firstName: "", lastName: "", phone: "" });
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast.error(error.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-judge/5 via-background to-judge/10 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-20 left-20 w-72 h-72 bg-judge/20 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      <Card className="w-full max-w-md shadow-2xl border-judge/20 backdrop-blur-sm bg-card/95 relative z-10">
        <CardHeader className="space-y-3 text-center pb-8">
          <div className="flex justify-center mb-2">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-judge to-judge/70 flex items-center justify-center shadow-lg shadow-judge/30 ring-4 ring-judge/10 transition-transform hover:scale-105">
              <Gavel className="h-8 w-8 text-black" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-br from-judge to-judge/70 bg-clip-text text-transparent">
            {isSignUp ? "Create Judge Account" : "Judge Sign In"}
          </CardTitle>
          <CardDescription className="text-base">
            {isSignUp ? "Register to apply for judging opportunities" : "Sign in to access your judge portal"}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-5">
            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2.5">
                    <Label htmlFor="firstName" className="text-sm font-semibold">
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="First"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      className="h-11 transition-all focus:ring-judge/50 focus:border-judge"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="lastName" className="text-sm font-semibold">
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Last"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      className="h-11 transition-all focus:ring-judge/50 focus:border-judge"
                    />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="phone" className="text-sm font-semibold">
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(555) 555-5555"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="h-11 transition-all focus:ring-judge/50 focus:border-judge"
                  />
                </div>
              </>
            )}

            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-sm font-semibold">
                Email *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="judge@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="h-11 transition-all focus:ring-judge/50 focus:border-judge"
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="password" className="text-sm font-semibold">
                Password *
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
                minLength={6}
                className="h-11 transition-all focus:ring-judge/50 focus:border-judge"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-judge to-judge/80 hover:from-judge/90 hover:to-judge/70 text-white font-semibold shadow-lg shadow-judge/30 transition-all hover:shadow-xl hover:shadow-judge/40 hover:scale-[1.02] mt-6"
              disabled={isLoading}
            >
              {isLoading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm font-medium text-judge hover:text-judge/80 transition-colors hover:underline"
              disabled={isLoading}
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
