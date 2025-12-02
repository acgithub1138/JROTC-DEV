import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
const AuthPage = () => {
  const {
    signIn
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log("Attempting to sign in with:", formData.email);
    const result = await signIn(formData.email, formData.password);
    console.log("Sign in result:", result);
    if (!result?.error) {
      // Check if user is on mobile route and redirect accordingly
      const isMobileRoute = location.pathname.startsWith("/mobile");

      // Get user profile to check role - we need to wait for auth state to update
      setTimeout(async () => {
        try {
          const {
            data: profile
          } = await supabase.from("profiles").select("role").eq("id", (await supabase.auth.getUser()).data.user?.id).single();
          if (isMobileRoute) {
            // On mobile, parents go to calendar, others go to dashboard
            if (profile?.role === "parent") {
              navigate("/mobile/calendar", {
                replace: true
              });
            } else {
              navigate("/mobile/dashboard", {
                replace: true
              });
            }
          } else if (profile?.role === "parent") {
            navigate("/app/calendar", {
              replace: true
            });
          } else {
            navigate("/app", {
              replace: true
            });
          }
        } catch (error) {
          console.error("Error fetching profile for redirect:", error);
          // Fallback redirect
          const redirectPath = isMobileRoute ? "/mobile/dashboard" : "/app";
          navigate(redirectPath, {
            replace: true
          });
        }
      }, 100); // Small delay to allow auth state to update
    }
    setLoading(false);
  };
  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first.",
        variant: "destructive"
      });
      return;
    }
    setResetLoading(true);
    try {
      const {
        error
      } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password?email=${encodeURIComponent(formData.email)}`
      });
      if (error) {
        toast({
          title: "Reset Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Reset Email Sent",
          description: "Check your email for a 6-digit verification code and reset instructions."
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setResetLoading(false);
    }
  };
  const handleMagicLink = async () => {
    if (!formData.email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first.",
        variant: "destructive"
      });
      return;
    }
    setMagicLinkLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      if (error) {
        toast({
          title: "Magic Link Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Magic Link Sent",
          description: "Check your email for a magic link to sign in."
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send magic link. Please try again.",
        variant: "destructive"
      });
    } finally {
      setMagicLinkLoading(false);
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">JROTC</h1>
          <h2 className="text-3xl font-bold text-white mb-2">Command and Control Center</h2>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-gray-800">Sign In to Your Command Center</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" value={formData.email} onChange={e => setFormData({
                ...formData,
                email: e.target.value
              })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Enter your password" value={formData.password} onChange={e => setFormData({
                ...formData,
                password: e.target.value
              })} required />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? "Signing In..." : "Sign In"}
              </Button>
              <Button type="button" variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50">
                New Parent Sign Up
              </Button>
            </form>

            <div className="mt-4 text-center space-y-2">
              <button type="button" onClick={handleForgotPassword} disabled={resetLoading} className="text-blue-600 hover:text-blue-800 text-sm underline disabled:opacity-50 block">
                {resetLoading ? "Sending..." : "Forgot your password?"}
              </button>
            </div>

            <div className="mt-6 space-y-3">
              

              

              

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 text-center">
                  <strong>New Staff or Cadet?</strong>
                  <br />
                  Contact your administrator or instructor to create your account.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default AuthPage;