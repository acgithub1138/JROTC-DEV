import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Shield, ArrowLeft, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
const ParentRegistrationPage = () => {
  const navigate = useNavigate();
  const {
    signUp
  } = useAuth();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [cadetInfo, setCadetInfo] = useState<{
    email: string;
  } | null>(null);
  const [cadetEmail, setCadetEmail] = useState('');
  const [parentData, setParentData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  const [validationErrors, setValidationErrors] = useState({
    email: ''
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (value: string) => {
    setParentData({ ...parentData, email: value });
    
    if (value && !validateEmail(value)) {
      setValidationErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      setValidationErrors(prev => ({ ...prev, email: '' }));
    }
  };
  const handleCadetEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Use secure function to verify cadet email exists (excludes admin/instructor roles)
      const {
        data: emailExists,
        error
      } = await supabase.rpc('verify_cadet_email_exists', {
        email_param: cadetEmail
      });
      if (error) {
        console.error("Error verifying cadet email:", error);
        toast({
          title: "Error",
          description: "An error occurred while verifying the email",
          variant: "destructive"
        });
        return;
      }
      if (!emailExists) {
        toast({
          title: "Student Not Found",
          description: "No active student found with that email address. Please check the email and try again.",
          variant: "destructive"
        });
        return;
      }

      // Store cadet email and proceed to next step
      setCadetInfo({
        email: cadetEmail
      });
      setStep(2);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to verify cadet email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleParentRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for validation errors before submitting
    if (validationErrors.email) {
      toast({
        title: "Validation Error",
        description: "Please fix the validation errors before submitting.",
        variant: "destructive"
      });
      return;
    }

    // Validate required fields
    if (!validateEmail(parentData.email)) {
      setValidationErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return;
    }

    console.log("Parent registration data:", parentData);
    console.log("Cadet info from step 1:", cadetInfo);
    
    setLoading(true);
    try {
      // Get cadet info using the secure database function
      const {
        data: cadetProfileData,
        error: cadetError
      } = await supabase.rpc('get_cadet_info_for_parent_registration', {
        email_param: cadetInfo.email
      });
      
      console.log("Database response:", { cadetProfileData, cadetError });
      
      if (cadetError) {
        console.error("Error getting cadet info:", cadetError);
        toast({
          title: "Error",
          description: "An error occurred while verifying student information. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      // Check if cadet was found
      if (!cadetProfileData || cadetProfileData.length === 0 || !cadetProfileData[0]?.cadet_exists) {
        toast({
          title: "Student Not Found",
          description: "Could not find an active student with that email address. Please go back and verify the email.",
          variant: "destructive"
        });
        return;
      }

      const cadetProfile = cadetProfileData[0];

      // Hardcoded parent role ID (never changes)  
      const parentRoleId = 'f8134411-7778-4c37-a39a-e727cfa197c8';

      // Create parent user account
      const result = await signUp(parentData.email, 'Sh0wc@se', {
        first_name: parentData.firstName,
        last_name: parentData.lastName,
        school_id: cadetProfile.school_id,
        role: 'parent',
        role_id: parentRoleId
      });
      if (result?.error) {
        toast({
          title: "Registration Failed",
          description: result.error.message,
          variant: "destructive"
        });
        return;
      }

      // Sign out immediately after account creation to prevent auto-login
      await supabase.auth.signOut();

      // Get the created parent profile
      const {
        data: newParentProfile
      } = await supabase.from('profiles').select('id').eq('email', parentData.email).single();
      if (newParentProfile) {
        // Create contact record linking parent to cadet
        const {
          error: contactError
        } = await supabase.from('contacts').insert({
          name: `${parentData.firstName} ${parentData.lastName}`,
          email: parentData.email,
          type: 'parent',
          status: 'active',
          cadet_id: cadetProfile.cadet_id,
          school_id: cadetProfile.school_id,
          created_by: newParentProfile.id
        });
        if (contactError) {
          console.error('Failed to create contact record:', contactError);
        }
      }
      toast({
        title: "Registration Successful",
        description: "Your parent account has been created. Please check your email for your password. Please sign in to access your cadet's school calendar."
      });
      navigate('/app/auth');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create parent account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">JROTC CCC</h1>
          <h2 className="text-2xl font-bold text-white mb-2">Parent Registration</h2>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" onClick={() => step === 1 ? navigate('/app/auth') : setStep(1)} className="p-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <CardTitle className="text-gray-800">
                {step === 1 ? 'Find Your Cadet' : 'Create Parent Account'}
              </CardTitle>
            </div>
            <p className="text-sm text-gray-600">
              {step === 1 ? 'Enter your cadet\'s email address to get started' : `Your password will be sent to the email address below after creating an account.`}
            </p>
          </CardHeader>
          <CardContent>
            {step === 1 ? <form onSubmit={handleCadetEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cadetEmail">Cadet's Email Address</Label>
                  <Input id="cadetEmail" type="email" placeholder="Enter your cadet's email" value={cadetEmail} onChange={e => setCadetEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                  {loading ? 'Searching...' : 'Find Cadet'}
                </Button>
              </form> : <form onSubmit={handleParentRegistration} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" type="text" placeholder="First name" value={parentData.firstName} onChange={e => setParentData({
                  ...parentData,
                  firstName: e.target.value
                })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" type="text" placeholder="Last name" value={parentData.lastName} onChange={e => setParentData({
                  ...parentData,
                  lastName: e.target.value
                })} required />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Your email address" 
                    value={parentData.email} 
                    onChange={e => handleEmailChange(e.target.value)} 
                    required 
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-red-500">{validationErrors.email}</p>
                  )}
                </div>
                
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Parent Account'}
                </Button>
              </form>}
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default ParentRegistrationPage;