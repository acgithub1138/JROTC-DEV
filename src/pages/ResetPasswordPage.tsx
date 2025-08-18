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

  useEffect(() => {
    // Check if we have the necessary tokens in the URL
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const code = searchParams.get('code');
    
    if (accessToken && refreshToken) {
      // Handle direct token approach
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } else if (code) {
      // Handle code exchange approach (more common for password reset)
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          toast({
            title: "Invalid Reset Link",
            description: "The password reset link is invalid or has expired.",
            variant: "destructive",
          });
          navigate('/app/auth');
        }
      });
    } else {
      toast({
        title: "Invalid Reset Link",
        description: "The password reset link is invalid or has expired.",
        variant: "destructive",
      });
      navigate('/app/auth');
      return;
    }
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
            <CardTitle className="text-center text-gray-800">Create New Password</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;