import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Contact } from '../ContactManagementPage';

export const useContacts = (searchValue: string = '') => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchContacts = async () => {
    if (!userProfile?.school_id) return;

    try {
      setIsLoading(true);
      
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('school_id', userProfile.school_id)
        .order('created_at', { ascending: false });

      if (searchValue.trim()) {
        query = query.or(`name.ilike.%${searchValue}%,email.ilike.%${searchValue}%,phone.ilike.%${searchValue}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setContacts((data || []) as Contact[]);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch contacts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile?.school_id) {
      fetchContacts();
    }
  }, [userProfile?.school_id, searchValue]);

  const createContact = async (contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'school_id' | 'created_by'>) => {
    if (!userProfile?.school_id) return;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          ...contactData,
          school_id: userProfile.school_id,
          created_by: userProfile.id,
        } as any)
        .select()
        .single();

      if (error) throw error;

      setContacts(prev => [data as Contact, ...prev]);
      toast({
        title: "Success",
        description: "Contact created successfully",
      });
    } catch (error) {
      console.error('Error creating contact:', error);
      toast({
        title: "Error",
        description: "Failed to create contact",
        variant: "destructive"
      });
    }
  };

  const updateContact = async (id: string, contactData: Partial<Contact>) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(contactData as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setContacts(prev => prev.map(contact => 
        contact.id === id ? { ...contact, ...data } : contact
      ));
      
      toast({
        title: "Success",
        description: "Contact updated successfully",
      });
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: "Error",
        description: "Failed to update contact",
        variant: "destructive"
      });
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContacts(prev => prev.filter(contact => contact.id !== id));
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive"
      });
    }
  };

  const refetch = () => {
    fetchContacts();
  };

  return {
    contacts,
    isLoading,
    createContact,
    updateContact,
    deleteContact,
    refetch
  };
};