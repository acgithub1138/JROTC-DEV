import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { School } from 'lucide-react';

const JROTC_PROGRAMS = [
  'Air Force',
  'Army',
  'Marine Corps',
  'Navy',
  'Space Force',
  'Coast Guard',
  'Other'
];

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu'
];

export const ExternalSchoolAuthPage = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    schoolName: '',
    schoolInitials: '',
    phone: '',
    jrotcProgram: '',
    timezone: '',
    referredBy: ''
  });

  useEffect(() => {
    // Check if already authenticated as external user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Check if user is external role
        supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.role === 'external') {
              navigate('/app/competition-portal/open-competitions');
            }
          });
      }
    });
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
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

      toast.success('Signed in successfully');
      navigate('/app/competition-portal/open-competitions');
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.firstName || 
        !formData.lastName || !formData.schoolName) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-school-admin', {
        body: {
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          school_name: formData.schoolName,
          school_initials: formData.schoolInitials || null,
          phone: formData.phone || null,
          jrotc_program: formData.jrotcProgram || null,
          timezone: formData.timezone || null,
          referred_by: formData.referredBy || null
        }
      });

      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success("Account created successfully! Please sign in.");
      setIsSignUp(false);
      setFormData({ 
        email: '', 
        password: '', 
        confirmPassword: '',
        firstName: '', 
        lastName: '', 
        schoolName: '',
        schoolInitials: '',
        phone: '',
        jrotcProgram: '',
        timezone: '',
        referredBy: ''
      });
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <Card className="w-full max-w-md shadow-2xl border-primary/20 backdrop-blur-sm bg-card/95 relative z-10">
        <CardHeader className="space-y-3 text-center pb-8">
          <div className="flex justify-center mb-2">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30 ring-4 ring-primary/10 transition-transform hover:scale-105">
              <School className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent">
            {isSignUp ? 'Register Your School' : 'External School Portal'}
          </CardTitle>
          <CardDescription className="text-base">
            {isSignUp 
              ? 'Create an account to register for competitions' 
              : 'Sign in to access competition registration'}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-5">
            {isSignUp && (
              <>
                <div className="space-y-2.5">
                  <Label htmlFor="schoolName" className="text-sm font-semibold">School Name *</Label>
                  <Input
                    id="schoolName"
                    name="schoolName"
                    type="text"
                    placeholder="Lincoln High School"
                    value={formData.schoolName}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="h-11 transition-all focus:ring-primary/50 focus:border-primary"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="schoolInitials" className="text-sm font-semibold">School Initials</Label>
                  <Input
                    id="schoolInitials"
                    name="schoolInitials"
                    type="text"
                    placeholder="LHS"
                    value={formData.schoolInitials}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="h-11 transition-all focus:ring-primary/50 focus:border-primary"
                    maxLength={10}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2.5">
                    <Label htmlFor="firstName" className="text-sm font-semibold">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="First"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      className="h-11 transition-all focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="lastName" className="text-sm font-semibold">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Last"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      className="h-11 transition-all focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="phone" className="text-sm font-semibold">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(555) 555-5555"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="h-11 transition-all focus:ring-primary/50 focus:border-primary"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="jrotcProgram" className="text-sm font-semibold">JROTC Program</Label>
                  <Select 
                    value={formData.jrotcProgram} 
                    onValueChange={(value) => handleSelectChange('jrotcProgram', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      {JROTC_PROGRAMS.map(program => (
                        <SelectItem key={program} value={program}>
                          {program}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="timezone" className="text-sm font-semibold">Timezone</Label>
                  <Select 
                    value={formData.timezone} 
                    onValueChange={(value) => handleSelectChange('timezone', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map(tz => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="referredBy" className="text-sm font-semibold">How did you hear about us?</Label>
                  <Input
                    id="referredBy"
                    name="referredBy"
                    type="text"
                    placeholder="Optional"
                    value={formData.referredBy}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="h-11 transition-all focus:ring-primary/50 focus:border-primary"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-sm font-semibold">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="contact@school.edu"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="h-11 transition-all focus:ring-primary/50 focus:border-primary"
              />
            </div>
            
            <div className="space-y-2.5">
              <Label htmlFor="password" className="text-sm font-semibold">Password *</Label>
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
                className="h-11 transition-all focus:ring-primary/50 focus:border-primary"
              />
            </div>

            {isSignUp && (
              <div className="space-y-2.5">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  minLength={6}
                  className="h-11 transition-all focus:ring-primary/50 focus:border-primary"
                />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] mt-6"
              disabled={isLoading}
            >
              {isLoading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
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
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors hover:underline"
              disabled={isLoading}
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
