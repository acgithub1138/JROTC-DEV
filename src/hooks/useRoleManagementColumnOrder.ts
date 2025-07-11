import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useRoleManagementColumnOrder = (defaultActions: string[]) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [actionOrder, setActionOrder] = useState<string[]>(defaultActions);
  const [isLoading, setIsLoading] = useState(true);

  // Load column order from database
  useEffect(() => {
    const loadColumnOrder = async () => {
      if (!userProfile?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_sidebar_preferences')
          .select('role_management_columns')
          .eq('user_id', userProfile.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading role management column order:', error);
          return;
        }

        if (data?.role_management_columns && Array.isArray(data.role_management_columns)) {
          // Ensure all default actions are included and filter out any invalid ones
          const savedOrder = data.role_management_columns.filter(action => 
            defaultActions.includes(action)
          );
          
          // Add any missing actions to the end
          const missingActions = defaultActions.filter(action => 
            !savedOrder.includes(action)
          );
          
          setActionOrder([...savedOrder, ...missingActions]);
        }
      } catch (error) {
        console.error('Error loading role management column order:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadColumnOrder();
  }, [userProfile?.id, defaultActions.join(',')]);

  // Save column order to database
  const saveColumnOrder = async (newOrder: string[]) => {
    if (!userProfile?.id) return;

    try {
      const { error } = await supabase
        .from('user_sidebar_preferences')
        .upsert({
          user_id: userProfile.id,
          role_management_columns: newOrder
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        throw error;
      }

      setActionOrder(newOrder);
      toast({
        title: "Success",
        description: "Column order saved successfully",
      });
    } catch (error) {
      console.error('Error saving role management column order:', error);
      toast({
        title: "Error",
        description: "Failed to save column order",
        variant: "destructive",
      });
    }
  };

  return {
    actionOrder,
    setActionOrder: saveColumnOrder,
    isLoading
  };
};