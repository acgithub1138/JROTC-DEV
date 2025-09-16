import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Helper function to get current school year start (August 1st)
const getCurrentSchoolYearStart = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const schoolYearStart = now.getMonth() >= 7 ? currentYear : currentYear - 1; // August is month 7
  return `${schoolYearStart}-08-01`;
};

// Helper function to get current school year end (June 30th)
const getCurrentSchoolYearEnd = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const schoolYearEnd = now.getMonth() >= 7 ? currentYear + 1 : currentYear;
  return `${schoolYearEnd}-06-30`;
};

export const useDashboardStats = () => {
  const { userProfile } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard-stats', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.school_id) {
        throw new Error('User school ID not available');
      }

      // Use the optimized dashboard stats view for basic school statistics
      const { data: statsData, error: statsError } = await supabase
        .from('dashboard_stats')
        .select('*')
        .eq('school_id', userProfile.school_id)
        .maybeSingle();

      if (statsError) {
        console.error('Error fetching dashboard stats:', statsError);
        throw statsError;
      }

      // Fetch additional data that can't be pre-calculated in the view
      const [
        tasksResult,
        budgetResult,
        inventoryResult,
        incidentsResult,
        schoolsResult,
        communityServiceResult
      ] = await Promise.all([
        // Active tasks count and overdue count
        supabase
          .from('tasks')
          .select('id, status, due_date', { count: 'exact' })
          .eq('school_id', userProfile.school_id)
          .neq('status', 'completed'),
        
        // Budget transactions (active, non-archived only) for current user's school
        supabase
          .from('budget_transactions')
          .select('amount, category')
          .eq('archive', false)
          .eq('active', true)
          .eq('school_id', userProfile.school_id),
        
        // Inventory items count and issued count
        supabase
          .from('inventory_items')
          .select('id, qty_total, qty_issued, qty_available', { count: 'exact' })
          .eq('school_id', userProfile.school_id),
        
        // Incidents data
        supabase
          .from('incidents')
          .select('id, status, priority, created_at')
          .eq('school_id', userProfile.school_id),
        
        // Total schools count (for admin dashboard)
        supabase
          .from('schools')
          .select('id', { count: 'exact' }),
        
        // Community service hours for current user in current school year (Aug-June)
        supabase
          .from('community_service')
          .select('hours, date')
          .eq('cadet_id', userProfile?.id || '')
          .gte('date', getCurrentSchoolYearStart())
          .lte('date', getCurrentSchoolYearEnd())
      ]);

      // Calculate overdue tasks
      const now = new Date();
      const overdueTasks = tasksResult.data?.filter(task => 
        task.due_date && new Date(task.due_date) < now
      ) || [];

      // Calculate budget - using same calculation as budget page
      const totalIncome = budgetResult.data?.filter(t => t.category === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const totalExpenses = budgetResult.data?.filter(t => t.category === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      const netBudget = totalIncome - totalExpenses;

      // Calculate inventory stats
      const totalInventory = inventoryResult.count || 0;
      const totalIssued = inventoryResult.data?.reduce((sum, item) => 
        sum + (item.qty_issued || 0), 0
      ) || 0;
      
      // Calculate in-stock and out-of-stock counts
      const inStockCount = inventoryResult.data?.filter(item => 
        (item.qty_available || 0) > 0
      ).length || 0;
      const outOfStockCount = inventoryResult.data?.filter(item => 
        (item.qty_available || 0) === 0
      ).length || 0;

      // Calculate incident stats
      const activeIncidents = incidentsResult.data?.filter(incident => 
        incident.status !== 'resolved' && incident.status !== 'canceled'
      ) || [];
      
      const overdueIncidents = incidentsResult.data?.filter(incident => {
        const createdDate = new Date(incident.created_at);
        const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceCreated > 7 && incident.status !== 'resolved' && incident.status !== 'canceled';
      }) || [];
      
      const urgentCriticalIncidents = incidentsResult.data?.filter(incident => 
        (incident.priority === 'urgent' || incident.priority === 'critical') &&
        incident.status !== 'resolved' && incident.status !== 'canceled'
      ) || [];

      // Calculate community service hours
      const totalCommunityServiceHours = communityServiceResult.data?.reduce((sum, record) => 
        sum + (record.hours || 0), 0
      ) || 0;
      const totalRecords = communityServiceResult.data?.length || 0;

      return {
        cadets: {
          total: statsData?.total_cadets || 0,
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
          issued: totalIssued,
          inStock: inStockCount,
          outOfStock: outOfStockCount
        },
        incidents: {
          active: activeIncidents.length,
          overdue: overdueIncidents.length,
          urgentCritical: urgentCriticalIncidents.length
        },
        schools: {
          total: schoolsResult.count || 0
        },
        communityService: {
          totalHours: totalCommunityServiceHours,
          totalRecords: totalRecords
        }
      };
    },
    enabled: !!userProfile?.id, // Only run query when user profile is loaded
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false, // Prevent unnecessary refetches on focus
  });
};