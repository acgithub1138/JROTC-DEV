import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { BudgetTransaction, BudgetFilters } from '../BudgetManagementPage';

export const useBudgetYears = () => {
  const { userProfile } = useAuth();
  
  return useQuery({
    queryKey: ['budget-years', userProfile?.school_id],
    queryFn: async () => {
      if (!userProfile?.school_id) return [];

      const { data, error } = await supabase
        .from('budget_transactions')
        .select('budget_year')
        .eq('school_id', userProfile.school_id)
        .eq('active', true)
        .eq('archive', true)
        .not('budget_year', 'is', null)
        .order('budget_year', { ascending: false });

      if (error) throw error;
      
      // Get unique budget years
      const uniqueYears = [...new Set(data.map(item => item.budget_year))].filter(Boolean);
      return uniqueYears as string[];
    },
    enabled: !!userProfile?.school_id,
  });
};

export const useBudgetTransactions = (filters: BudgetFilters) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['budget-transactions', userProfile?.school_id, filters],
    queryFn: async () => {
      if (!userProfile?.school_id) return [];

      let query = supabase
        .from('budget_transactions')
        .select('*')
        .eq('school_id', userProfile.school_id)
        .eq('active', true);

      // Apply filters
      if (!filters.showArchived) {
        query = query.eq('archive', false);
      }

      if (filters.category) {
        query = query.eq('category', filters.category as any);
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.paymentMethod) {
        query = query.eq('payment_method', filters.paymentMethod as any);
      }

      if (filters.status) {
        query = query.eq('status', filters.status as any);
      }

      if (filters.budgetYear) {
        query = query.eq('budget_year', filters.budgetYear);
      }

      // Apply search filter
      if (filters.search) {
        query = query.or(`item.ilike.%${filters.search}%,description.ilike.%${filters.search}%,amount.eq.${parseFloat(filters.search) || 0}`);
      }

      query = query.order('date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data as BudgetTransaction[];
    },
    enabled: !!userProfile?.school_id,
  });

  const createMutation = useMutation({
    mutationFn: async (newTransaction: Omit<BudgetTransaction, 'id' | 'created_at' | 'updated_at' | 'school_id' | 'created_by'>) => {
      if (!userProfile?.school_id || !userProfile?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('budget_transactions')
        .insert({
          ...newTransaction,
          school_id: userProfile.school_id,
          created_by: userProfile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-transactions'] });
      toast({
        title: 'Success',
        description: 'Transaction created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create transaction.',
        variant: 'destructive',
      });
    },
  });

  const createTransaction = async (newTransaction: Omit<BudgetTransaction, 'id' | 'created_at' | 'updated_at' | 'school_id' | 'created_by'>) => {
    return await createMutation.mutateAsync(newTransaction);
  };

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BudgetTransaction> }) => {
      const { data, error } = await supabase
        .from('budget_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-transactions'] });
      toast({
        title: 'Success',
        description: 'Transaction updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update transaction.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budget_transactions')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-transactions'] });
      toast({
        title: 'Success',
        description: 'Transaction deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete transaction.',
        variant: 'destructive',
      });
    },
  });

  const archiveAllMutation = useMutation({
    mutationFn: async (budgetYear: string) => {
      if (!userProfile?.school_id) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('budget_transactions')
        .update({
          archive: true,
          budget_year: budgetYear,
        })
        .eq('school_id', userProfile.school_id)
        .eq('archive', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-transactions'] });
      toast({
        title: 'Success',
        description: 'All transactions archived successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to archive transactions.',
        variant: 'destructive',
      });
    },
  });

  return {
    transactions,
    isLoading,
    createTransaction,
    updateTransaction: (id: string, updates: Partial<BudgetTransaction>) =>
      updateMutation.mutate({ id, updates }),
    deleteTransaction: deleteMutation.mutate,
    archiveAllTransactions: archiveAllMutation.mutate,
    isCreating: createMutation.isPending,
  };
};