import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

export const useOptimizedDashboardStats = () => {
  const { userProfile } = useAuth();
  const query = useQuery({
    queryKey: ['dashboard-stats-optimized', userProfile?.id],
    queryFn: async () => {
      // Use Promise.allSettled to handle partial failures gracefully
      const results = await Promise.allSettled([
        // Only select necessary columns for counts
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .neq('role', 'instructor')
          .eq('active', true),
        
        // Optimized task query with better filtering
        supabase
          .from('tasks')
          .select('id, status, due_date', { count: 'exact' })
          .neq('status', 'completed'),
        
        // Budget transactions (active, non-archived only) for current user's school
        supabase
          .from('budget_transactions')
          .select('amount, category')
          .eq('archive', false)
          .eq('active', true)
          .eq('school_id', userProfile?.school_id || ''),
        
        // Inventory with only needed fields
        supabase
          .from('inventory_items')
          .select('qty_total, qty_issued', { count: 'exact' }),
        
        // Incidents with optimized query
        supabase
          .from('incidents')
          .select('id, status, priority, created_at')
          .neq('status', 'resolved')
          .neq('status', 'canceled'),
        
        // Schools count
        supabase
          .from('schools')
          .select('id', { count: 'exact', head: true })
      ]);

      // Process results with error handling
      const [cadetsResult, tasksResult, budgetResult, inventoryResult, incidentsResult, schoolsResult] = results;

      // Calculate derived values efficiently using memoization-like approach
      const now = new Date();
      
      const overdueTasks = tasksResult.status === 'fulfilled' 
        ? tasksResult.value.data?.filter(task => 
            task.due_date && new Date(task.due_date) < now
          ) || []
        : [];

      // Optimized budget calculation
      const budgetData = budgetResult.status === 'fulfilled' ? budgetResult.value.data || [] : [];
      const totalIncome = budgetData
        .filter(t => t.category === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const totalExpenses = budgetData
        .filter(t => t.category === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Optimized inventory calculation
      const inventoryData = inventoryResult.status === 'fulfilled' ? inventoryResult.value.data || [] : [];
      const totalIssued = inventoryData.reduce((sum, item) => sum + (item.qty_issued || 0), 0);

      // Optimized incident calculations
      const incidentsData = incidentsResult.status === 'fulfilled' ? incidentsResult.value.data || [] : [];
      const overdueIncidents = incidentsData.filter(incident => {
        const createdDate = new Date(incident.created_at);
        const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceCreated > 7;
      });
      
      const urgentCriticalIncidents = incidentsData.filter(incident => 
        incident.priority === 'urgent' || incident.priority === 'critical'
      );

      return {
        cadets: {
          total: cadetsResult.status === 'fulfilled' ? cadetsResult.value.count || 0 : 0,
          change: '+8 this month'
        },
        tasks: {
          active: tasksResult.status === 'fulfilled' ? tasksResult.value.count || 0 : 0,
          overdue: overdueTasks.length
        },
        budget: {
          netBudget: totalIncome - totalExpenses,
          totalIncome,
          totalExpenses
        },
        inventory: {
          total: inventoryResult.status === 'fulfilled' ? inventoryResult.value.count || 0 : 0,
          issued: totalIssued
        },
        incidents: {
          active: incidentsData.length,
          overdue: overdueIncidents.length,
          urgentCritical: urgentCriticalIncidents.length
        },
        schools: {
          total: schoolsResult.status === 'fulfilled' ? schoolsResult.value.count || 0 : 0
        }
      };
    },
    enabled: !!userProfile?.id, // Only run query when user profile is loaded
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    refetchOnWindowFocus: false, // Prevent unnecessary refetches on focus
  });

  return query;
};