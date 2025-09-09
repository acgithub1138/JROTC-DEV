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
  notes: string;
  jrotc_program: string;
}

export const ExternalSchoolRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SchoolFormData>({
    name: '',
    initials: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    notes: '',
    jrotc_program: 'army'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('external-school-registration', {
        body: formData
      });

      if (error) {
        throw error;
      }

      toast({
        title: "School Registered Successfully",
        description: "You can now browse and register for competitions."
      });

      // Navigate to competitions page with school ID
      navigate(`/external/competitions?school_id=${data.schoolId}`);
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SchoolFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-foreground to-primary p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/app/auth')}
            className="text-primary-foreground hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">
            Competition Registration
          </h1>
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
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter school name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initials">School Initials</Label>
                  <Input
                    id="initials"
                    value={formData.initials}
                    onChange={(e) => handleInputChange('initials', e.target.value)}
                    placeholder="e.g., MJHS"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contact Person *</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => handleInputChange('contact_person', e.target.value)}
                    placeholder="Primary contact name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    placeholder="contact@school.edu"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jrotc_program">JROTC Program *</Label>
                <Select
                  value={formData.jrotc_program}
                  onValueChange={(value) => handleInputChange('jrotc_program', value)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select JROTC Program" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {JROTC_PROGRAM_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional information about your school"
                  rows={3}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Register School & Continue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};