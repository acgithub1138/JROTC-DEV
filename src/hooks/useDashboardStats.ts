import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [
        cadetsResult,
        tasksResult,
        budgetResult,
        inventoryResult
      ] = await Promise.all([
        // Total cadets count
        supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .in('role', ['cadet', 'command_staff'])
          .eq('active', true),
        
        // Active tasks count and overdue count
        supabase
          .from('tasks')
          .select('id, status, due_date', { count: 'exact' })
          .neq('status', 'completed'),
        
        // Budget transactions for current year (non-archived only)
        supabase
          .from('budget_transactions')
          .select('amount, type')
          .eq('archive', false),
        
        // Inventory items count and issued count
        supabase
          .from('inventory_items')
          .select('id, qty_total, qty_issued, qty_available', { count: 'exact' })
      ]);

      // Calculate overdue tasks
      const now = new Date();
      const overdueTasks = tasksResult.data?.filter(task => 
        task.due_date && new Date(task.due_date) < now
      ) || [];

      // Calculate budget - using same calculation as budget page
      const totalIncome = budgetResult.data?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const totalExpenses = budgetResult.data?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      const netBudget = totalIncome - totalExpenses;

      // Calculate inventory stats
      const totalInventory = inventoryResult.count || 0;
      const totalIssued = inventoryResult.data?.reduce((sum, item) => 
        sum + (item.qty_issued || 0), 0
      ) || 0;

      return {
        cadets: {
          total: cadetsResult.count || 0,
          change: '+8 this month' // TODO: Calculate actual monthly change
        },
        tasks: {
          active: tasksResult.count || 0,
          overdue: overdueTasks.length
        },
        budget: {
          netBudget: netBudget,
          totalIncome: totalIncome,
          totalExpenses: totalExpenses
        },
        inventory: {
          total: totalInventory,
          issued: totalIssued
        }
      };
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};