import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';
import { JROTC_PROGRAM_OPTIONS } from '@/components/competition-portal/my-competitions/utils/constants';
interface SchoolFormData {
  name: string;
  initials: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  jrotc_program: string;
  timezone: string;
  referred_by: string;
}
export const ExternalSchoolRegistration = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [formData, setFormData] = useState<SchoolFormData>({
    name: '',
    initials: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    jrotc_program: 'army',
    timezone: '',
    referred_by: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const phoneNumber = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (phoneNumber.length >= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    } else if (phoneNumber.length >= 3) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return phoneNumber;
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Reset errors
    setErrors({});
    
    // Validate all required fields
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name) newErrors.name = 'School name is required';
    if (!formData.initials) newErrors.initials = 'School initials are required';
    if (!formData.contact_person) newErrors.contact_person = 'Contact person is required';
    if (!formData.contact_email) {
      newErrors.contact_email = 'Contact email is required';
    } else if (!validateEmail(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address';
    }
    if (!formData.contact_phone) newErrors.contact_phone = 'Contact phone is required';
    if (!formData.jrotc_program) newErrors.jrotc_program = 'JROTC program is required';
    if (!formData.timezone) newErrors.timezone = 'Time zone is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors below and try again.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('external-school-registration', {
        body: formData
      });
      
      if (error) {
        throw error;
      }
      
      // Check if the response indicates an error (even if no exception was thrown)
      if (data?.error) {
        throw new Error(data.error);
      }
      
      setShowSuccessMessage(true);

      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/app/auth');
      }, 3000);
    } catch (error: any) {
      console.error('Registration error:', error);
      
      let errorMessage = "Please try again later.";
      
      // Handle different types of errors
      if (error.message?.includes('A school with this name already exists')) {
        errorMessage = "Your school is already registered. Please contact support if you need assistance accessing your account.";
      } else if (error.message?.includes('Invalid email format')) {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message?.includes('Missing required fields')) {
        errorMessage = "Please fill in all required fields.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleInputChange = (field: keyof SchoolFormData, value: string) => {
    let processedValue = value;
    
    // Format phone number as user types
    if (field === 'contact_phone') {
      processedValue = formatPhoneNumber(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };
  if (showSuccessMessage) {
    return <div className="min-h-screen bg-gradient-to-br from-primary via-primary-foreground to-primary p-4 flex items-center justify-center">
        <Card className="bg-card/95 backdrop-blur-sm shadow-xl max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Registration Complete!</h2>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  Your school has been registered successfully.
                </p>
                <p className="text-foreground font-medium">
                  Please check your email for login instructions.
                </p>
                <p className="text-sm text-muted-foreground">
                  Redirecting to login page in a few seconds...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-primary via-primary-foreground to-primary p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/auth')} className="text-primary-foreground hover:text-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">Non-Subscriber Registration</h1>
          <p className="text-primary-foreground/80">
            Register your school to participate in JROTC competitions
          </p>
        </div>

        <Card className="bg-card/95 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">School Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">School Name *</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={e => handleInputChange('name', e.target.value)} 
                    placeholder="Enter school name" 
                    required 
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initials">School Initials *</Label>
                  <Input 
                    id="initials" 
                    value={formData.initials} 
                    onChange={e => handleInputChange('initials', e.target.value)} 
                    placeholder="e.g., MJHS" 
                    maxLength={10} 
                    required 
                    className={errors.initials ? 'border-red-500' : ''}
                  />
                  {errors.initials && <p className="text-sm text-red-500">{errors.initials}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contact Person *</Label>
                  <Input 
                    id="contact_person" 
                    value={formData.contact_person} 
                    onChange={e => handleInputChange('contact_person', e.target.value)} 
                    placeholder="Primary contact name" 
                    required 
                    className={errors.contact_person ? 'border-red-500' : ''}
                  />
                  {errors.contact_person && <p className="text-sm text-red-500">{errors.contact_person}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email *</Label>
                  <Input 
                    id="contact_email" 
                    type="email" 
                    value={formData.contact_email} 
                    onChange={e => handleInputChange('contact_email', e.target.value)} 
                    placeholder="contact@school.edu" 
                    required 
                    className={errors.contact_email ? 'border-red-500' : ''}
                  />
                  {errors.contact_email && <p className="text-sm text-red-500">{errors.contact_email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone *</Label>
                  <Input 
                    id="contact_phone" 
                    type="tel" 
                    value={formData.contact_phone} 
                    onChange={e => handleInputChange('contact_phone', e.target.value)} 
                    placeholder="(555) 123-4567" 
                    required 
                    className={errors.contact_phone ? 'border-red-500' : ''}
                  />
                  {errors.contact_phone && <p className="text-sm text-red-500">{errors.contact_phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jrotc_program">JROTC Program *</Label>
                  <Select value={formData.jrotc_program} onValueChange={value => handleInputChange('jrotc_program', value)} required>
                    <SelectTrigger className={`bg-background ${errors.jrotc_program ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select JROTC Program" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {JROTC_PROGRAM_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.jrotc_program && <p className="text-sm text-red-500">{errors.jrotc_program}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Time Zone *</Label>
                  <Select value={formData.timezone} onValueChange={value => handleInputChange('timezone', value)} required>
                    <SelectTrigger className={`bg-background ${errors.timezone ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select Time Zone" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50 max-h-60 overflow-y-auto">
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Phoenix">Mountain Time - Arizona (MST)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="America/Anchorage">Alaska Time (AKST)</SelectItem>
                      <SelectItem value="Pacific/Honolulu">Hawaii Time (HST)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.timezone && <p className="text-sm text-red-500">{errors.timezone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referred_by">Referred by</Label>
                  <Input id="referred_by" value={formData.referred_by} onChange={e => handleInputChange('referred_by', e.target.value)} placeholder="Who referred your school?" />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Registering...' : 'Register School'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>;
};