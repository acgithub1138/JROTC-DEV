import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ParentSetupModalProps {
  open: boolean;
  onClose: () => void;
}

interface Cadet {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const ParentSetupModal: React.FC<ParentSetupModalProps> = ({ open, onClose }) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [selectedCadetId, setSelectedCadetId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    if (open && userProfile?.school_id) {
      fetchCadets();
    }
  }, [open, userProfile?.school_id]);

  const fetchCadets = async () => {
    if (!userProfile?.school_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('school_id', userProfile.school_id)
        .eq('active', true)
        .not('role', 'in', '(admin,instructor)')
        .order('last_name', { ascending: true });

      if (error) throw error;
      setCadets(data || []);
    } catch (error) {
      console.error('Error fetching cadets:', error);
      toast({
        title: "Error",
        description: "Failed to load students. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setPhoneNumber(formatted);
  };

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCadetId) {
      toast({
        title: "Validation Error",
        description: "Please select a student.",
        variant: "destructive",
      });
      return;
    }

    if (!validatePhone(phoneNumber)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create contact record
      const { error } = await supabase.from('contacts').insert({
        name: `${userProfile?.first_name} ${userProfile?.last_name}`,
        email: userProfile?.email,
        phone: phoneNumber,
        type: 'parent',
        status: 'active',
        cadet_id: selectedCadetId,
        school_id: userProfile?.school_id,
        created_by: userProfile?.id
      });

      if (error) throw error;

      toast({
        title: "Setup Complete",
        description: "Your parent account has been set up successfully.",
      });

      onClose();
    } catch (error: any) {
      console.error('Error creating contact:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to complete setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Parent Account Setup</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please select your cadet and provide your phone number to complete your account setup.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cadet">Select Your Student</Label>
              <Select value={selectedCadetId} onValueChange={setSelectedCadetId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your student" />
                </SelectTrigger>
                <SelectContent>
                  {cadets.map((cadet) => (
                    <SelectItem key={cadet.id} value={cadet.id}>
                      {cadet.last_name}, {cadet.first_name} ({cadet.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(xxx) xxx-xxxx"
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                maxLength={14}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Setting Up...' : 'Complete Setup'}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ParentSetupModal;