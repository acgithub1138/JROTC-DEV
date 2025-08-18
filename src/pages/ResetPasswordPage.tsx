import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getBuildConfig } from '@/config/build-config';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    const type = searchParams.get('type');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const errorCode = searchParams.get('error_code');
    
    // Check for URL error parameters first
    if (error) {
      setIsAuthenticated(false);
      setIsAuthenticating(false);
      
      let errorMessage = "The password reset link is invalid or has expired.";
      
      if (error === 'access_denied') {
        if (errorCode === 'otp_expired') {
          errorMessage = "The password reset link has expired. Please request a new one.";
        } else {
          errorMessage = "The password reset link is invalid or has already been used.";
        }
      } else if (errorDescription) {
        errorMessage = errorDescription.replace(/\+/g, ' ');
      }
      
      toast({
        title: "Reset Link Error",
        description: errorMessage,
        variant: "destructive",
      });
      navigate('/app/auth');
      return;
    }
    
    // If no code, this isn't a valid reset link
    if (!code) {
      setIsAuthenticated(false);
      setIsAuthenticating(false);
      toast({
        title: "Invalid Reset Link",
        description: "No reset code found in URL.",
        variant: "destructive",
      });
      navigate('/app/auth');
      return;
    }

    // Handle password reset verification
    const handlePasswordResetVerification = async () => {
      try {
        // For password reset, we should use exchangeCodeForSession, not verifyOtp
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          setIsAuthenticated(false);
          setIsAuthenticating(false);
          
          let errorMessage = "The password reset link is invalid or has expired.";
          if (error.message.includes("expired")) {
            errorMessage = "The password reset link has expired. Please request a new one.";
          } else if (error.message.includes("invalid") || error.message.includes("not found")) {
            errorMessage = "The password reset link is invalid or has already been used.";
          }
          
          toast({
            title: "Invalid Reset Link",
            description: errorMessage,
            variant: "destructive",
          });
          navigate('/app/auth');
          return;
        }
        
        if (data.session) {
          setIsAuthenticated(true);
          setIsAuthenticating(false);
        } else {
          setIsAuthenticated(false);
          setIsAuthenticating(false);
          toast({
            title: "Reset Link Error",
            description: "Unable to authenticate with the reset link. Please try again.",
            variant: "destructive",
          });
          navigate('/app/auth');
        }
      } catch (err: any) {
        setIsAuthenticated(false);
        setIsAuthenticating(false);
        toast({
          title: "Reset Link Error",
          description: "An unexpected error occurred. Please try requesting a new reset link.",
          variant: "destructive",
        });
        navigate('/app/auth');
      }
    };

    handlePasswordResetVerification();
  }, [searchParams, navigate, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        toast({
          title: "Reset Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password Updated",
          description: "Your password has been successfully updated.",
        });
        navigate('/app/auth');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">JROTC</h1>
          <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-gray-800">
              {isAuthenticating ? 'Verifying Reset Link...' : 'Create New Password'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAuthenticating ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Please wait while we verify your reset link...</p>
              </div>
            ) : isAuthenticated ? (
              <>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                    {loading ? 'Updating Password...' : 'Update Password'}
                  </Button>
                </form>
                
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => navigate('/app/auth')}
                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    Back to Sign In
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">Invalid or expired reset link</p>
                <Button 
                  onClick={() => navigate('/app/auth')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Return to Sign In
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;