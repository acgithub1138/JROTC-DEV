import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ContactInfo {
  id: string;
  name: string;
  type: string;
  type_other: string | null;
  status: string;
  phone: string | null;
  email: string | null;
  cadet_id: string | null;
}

export const useParentContact = () => {
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const fetchParentContact = useCallback(async () => {
    if (!userProfile?.id || !userProfile?.email) return;

    try {
      setIsLoading(true);
      
      // Fetch contact info for the current user (parent) by matching email
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, type, type_other, status, phone, email, cadet_id')
        .eq('email', userProfile.email)
        .eq('school_id', userProfile.school_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching parent contact:', error);
        toast({
          title: 'Error',
          description: 'Failed to load contact information',
          variant: 'destructive',
        });
        return;
      }

      setContact(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.id, userProfile?.email, userProfile?.school_id, toast]);

  useEffect(() => {
    fetchParentContact();
  }, [fetchParentContact]);

  return { contact, isLoading, refetch: fetchParentContact };
};
