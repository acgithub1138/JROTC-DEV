
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Profile } from '../types';

export const useCadetMassOperations = () => {
  const { toast } = useToast();
  const [selectedCadets, setSelectedCadets] = useState<string[]>([]);
  const [massOperationLoading, setMassOperationLoading] = useState(false);

  const handleSelectCadet = (cadetId: string, checked: boolean) => {
    if (checked) {
      setSelectedCadets(prev => [...prev, cadetId]);
    } else {
      setSelectedCadets(prev => prev.filter(id => id !== cadetId));
    }
  };

  const handleSelectAll = (checked: boolean, profiles: Profile[]) => {
    if (checked) {
      setSelectedCadets(profiles.map(profile => profile.id));
    } else {
      setSelectedCadets([]);
    }
  };

  const clearSelection = () => {
    setSelectedCadets([]);
  };

  const handleBulkUpdateGrade = async (grade: string) => {
    if (selectedCadets.length === 0) return;

    setMassOperationLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          grade: grade || null,
          updated_at: new Date().toISOString()
        })
        .in('id', selectedCadets);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated grade for ${selectedCadets.length} cadet(s)`
      });

      clearSelection();
      return true;
    } catch (error) {
      console.error('Error updating grades:', error);
      toast({
        title: "Error",
        description: "Failed to update grades",
        variant: "destructive"
      });
      return false;
    } finally {
      setMassOperationLoading(false);
    }
  };

  const handleBulkUpdateRank = async (rank: string) => {
    if (selectedCadets.length === 0) return;

    setMassOperationLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          rank: rank || null,
          updated_at: new Date().toISOString()
        })
        .in('id', selectedCadets);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated rank for ${selectedCadets.length} cadet(s)`
      });

      clearSelection();
      return true;
    } catch (error) {
      console.error('Error updating ranks:', error);
      toast({
        title: "Error",
        description: "Failed to update ranks",
        variant: "destructive"
      });
      return false;
    } finally {
      setMassOperationLoading(false);
    }
  };

  const handleBulkUpdateFlight = async (flight: string) => {
    if (selectedCadets.length === 0) return;

    setMassOperationLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          flight: flight || null,
          updated_at: new Date().toISOString()
        })
        .in('id', selectedCadets);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated flight for ${selectedCadets.length} cadet(s)`
      });

      clearSelection();
      return true;
    } catch (error) {
      console.error('Error updating flights:', error);
      toast({
        title: "Error",
        description: "Failed to update flights",
        variant: "destructive"
      });
      return false;
    } finally {
      setMassOperationLoading(false);
    }
  };

  const handleBulkUpdateRole = async (roleId: string) => {
    if (selectedCadets.length === 0) return;

    setMassOperationLoading(true);
    try {
      // Get the role_name from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role_name')
        .eq('id', roleId)
        .single();

      if (roleError) throw roleError;

      const { error } = await supabase
        .from('profiles')
        .update({ 
          role_id: roleId || null,
          role: roleData?.role_name as any, // Update role field with role_name
          updated_at: new Date().toISOString()
        })
        .in('id', selectedCadets);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated role for ${selectedCadets.length} cadet(s)`
      });

      clearSelection();
      return true;
    } catch (error) {
      console.error('Error updating roles:', error);
      toast({
        title: "Error",
        description: "Failed to update roles",
        variant: "destructive"
      });
      return false;
    } finally {
      setMassOperationLoading(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedCadets.length === 0) return;

    setMassOperationLoading(true);
    try {
      const { error } = await supabase.functions.invoke('toggle-user-status', {
        body: {
          userIds: selectedCadets,
          active: false
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Deactivated ${selectedCadets.length} cadet(s)`
      });

      clearSelection();
      return true;
    } catch (error) {
      console.error('Error deactivating cadets:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate cadets",
        variant: "destructive"
      });
      return false;
    } finally {
      setMassOperationLoading(false);
    }
  };

  return {
    selectedCadets,
    massOperationLoading,
    handleSelectCadet,
    handleSelectAll,
    clearSelection,
    handleBulkUpdateGrade,
    handleBulkUpdateRank,
    handleBulkUpdateFlight,
    handleBulkUpdateRole,
    handleBulkDeactivate
  };
};
