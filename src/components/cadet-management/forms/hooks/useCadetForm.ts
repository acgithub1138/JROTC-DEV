import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { createCadetSchema, CadetFormData } from '../schemas/cadetFormSchema';
import { Profile } from '../../types';
import { useCadetRoles } from '@/hooks/useCadetRoles';

interface UseCadetFormProps {
  mode: 'create' | 'edit';
  cadet?: Profile;
  onSuccess: (cadet: Profile) => void;
}

export const useCadetForm = ({ mode, cadet, onSuccess }: UseCadetFormProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const { roleOptions } = useCadetRoles();

  // Create form schema with available options
  const schema = createCadetSchema();

  // Initialize form with default values
  const form = useForm<CadetFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: cadet?.first_name || '',
      last_name: cadet?.last_name || '',
      email: cadet?.email || '',
      grade: cadet?.grade || '',
      rank: cadet?.rank || '',
      flight: cadet?.flight || '',
      cadet_year: cadet?.cadet_year || '',
      role_id: cadet?.role_id || '',
      start_year: cadet?.start_year?.toString() || ''
    }
  });

  // Reset form when cadet changes or when in create mode
  useEffect(() => {
    if (mode === 'create') {
      form.reset({
        first_name: '',
        last_name: '',
        email: '',
        grade: '',
        rank: '',
        flight: '',
        cadet_year: '',
        role_id: '',
        start_year: ''
      });
    } else if (cadet) {
      form.reset({
        first_name: cadet.first_name || '',
        last_name: cadet.last_name || '',
        email: cadet.email || '',
        grade: cadet.grade || '',
        rank: cadet.rank || '',
        flight: cadet.flight || '',
        cadet_year: cadet.cadet_year || '',
        role_id: cadet.role_id || '',
        start_year: cadet.start_year?.toString() || ''
      });
    }
  }, [mode, cadet, form]);

  const onSubmit = async (data: CadetFormData) => {
    try {
      if (mode === 'create') {
        // Find the selected role to get the role_name
        const selectedRole = roleOptions.find(r => r.value === data.role_id);
        const roleName = selectedRole ? selectedRole.role_name : null;

        const cadetCreateData = {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          grade: data.grade === 'none' ? null : data.grade || null,
          rank: data.rank === 'none' ? null : data.rank || null,
          flight: data.flight === 'none' ? null : data.flight || null,
          cadet_year: data.cadet_year === 'none' ? null : data.cadet_year || null,
          role_id: data.role_id === 'none' ? null : data.role_id || null,
          role: roleName,
          start_year: data.start_year === 'none' ? null : (data.start_year ? parseInt(data.start_year) : null),
          school_id: userProfile?.school_id
        };

        // Use the create-cadet-user function instead of direct database insertion
        const { data: result, error } = await supabase.functions.invoke('create-cadet-user', {
          body: cadetCreateData
        });

        if (error) throw error;
        if (result?.error) {
          // Check for specific duplicate email error
          if (result.code === 'duplicate_email' || result.error.includes('already exists')) {
            toast({
              title: "Email Already Exists",
              description: "This email address is already registered. Please use a different email address.",
              variant: "destructive"
            });
            return;
          }
          throw new Error(result.error);
        }

        const createdCadet = result?.profile || result;

        toast({
          title: "Success",
          description: "Cadet has been created successfully."
        });

        onSuccess(createdCadet as Profile);
      } else if (mode === 'edit' && cadet) {
        // Find the selected role to get the role_name
        const selectedRole = roleOptions.find(r => r.value === data.role_id);
        const roleName = selectedRole ? selectedRole.role_name : null;

        const updateData = {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          grade: data.grade === 'none' ? null : data.grade || null,
          rank: data.rank === 'none' ? null : data.rank || null,
          flight: data.flight === 'none' ? null : data.flight || null,
          cadet_year: data.cadet_year === 'none' ? null : data.cadet_year || null,
          role_id: data.role_id === 'none' ? null : data.role_id || null,
          role: roleName,
          start_year: data.start_year === 'none' ? null : (data.start_year ? parseInt(data.start_year) : null),
          updated_at: new Date().toISOString()
        } as any;

        const { data: updatedCadet, error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', cadet.id)
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Success",
          description: "Cadet has been updated successfully."
        });

        onSuccess(updatedCadet as Profile);
      }
    } catch (error) {
      console.error('Error saving cadet:', error);
      toast({
        title: "Error",
        description: `Failed to ${mode === 'create' ? 'create' : 'update'} cadet. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const onError = (errors: any) => {
    console.error('Form validation errors:', errors);
    toast({
      title: "Validation Error",
      description: "Please check the form for errors and try again.",
      variant: "destructive"
    });
  };

  return {
    form,
    onSubmit,
    onError,
    isSubmitting: form.formState.isSubmitting,
    isLoading: false
  };
};