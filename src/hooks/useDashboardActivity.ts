import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDashboardActivity = () => {
  return useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: async () => {
      const activities: Array<{
        action: string;
        details: string;
        time: string;
        created_at: string;
      }> = [];

      // Get recent cadets (last 5)
      const { data: recentCadets } = await supabase
        .from('profiles')
        .select('first_name, last_name, grade, created_at')
        .eq('role', 'cadet')
        .order('created_at', { ascending: false })
        .limit(3);

      // Get recent completed tasks (last 3)
      const { data: recentTasks } = await supabase
        .from('tasks')
        .select('title, completed_at')
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(2);

      // Get recent budget transactions (last 2)
      const { data: recentBudget } = await supabase
        .from('budget_transactions')
        .select('item, amount, type, created_at')
        .order('created_at', { ascending: false })
        .limit(2);

      // Add cadet activities
      recentCadets?.forEach(cadet => {
        activities.push({
          action: 'New cadet enrolled',
          details: `${cadet.first_name} ${cadet.last_name}${cadet.grade ? ` - Grade ${cadet.grade}` : ''}`,
          time: formatTimeAgo(cadet.created_at),
          created_at: cadet.created_at
        });
      });

      // Add task activities
      recentTasks?.forEach(task => {
        activities.push({
          action: 'Task completed',
          details: task.title,
          time: formatTimeAgo(task.completed_at!),
          created_at: task.completed_at!
        });
      });

      // Add budget activities
      recentBudget?.forEach(transaction => {
        activities.push({
          action: transaction.type === 'income' ? 'Income received' : 'Expense recorded',
          details: `${transaction.item} - $${Number(transaction.amount).toFixed(2)}`,
          time: formatTimeAgo(transaction.created_at),
          created_at: transaction.created_at
        });
      });

      // Sort by most recent and take top 5
      return activities
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(({ created_at, ...activity }) => activity);
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}