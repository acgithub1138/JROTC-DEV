import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isTaskDone } from '@/utils/taskStatusUtils';

export interface CadetTask {
  id: string;
  task_number: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  cadet_name: string;
  cadet_id: string;
  is_subtask?: boolean;
  parent_task_title?: string;
}

export const useParentCadetTasks = () => {
  const { userProfile } = useAuth();
  const [tasks, setTasks] = useState<CadetTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskCounts, setTaskCounts] = useState({
    total: 0,
    active: 0,
    overdue: 0,
    completed: 0
  });

  useEffect(() => {
    const fetchParentCadetTasks = async () => {
      if (!userProfile?.email || userProfile.role !== 'parent') {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Use the optimized view to fetch all parent cadet tasks in one query
        const { data: tasksData, error: tasksError } = await supabase
          .from('parent_cadet_tasks')
          .select('*')
          .eq('parent_email', userProfile.email);

        if (tasksError) {
          console.error('Error fetching parent cadet tasks:', tasksError);
          setError('Failed to fetch cadet tasks');
          return;
        }

        if (!tasksData || tasksData.length === 0) {
          setTasks([]);
          setTaskCounts({ total: 0, active: 0, overdue: 0, completed: 0 });
          return;
        }

        // Transform the data to match the expected interface
        const allTasks: CadetTask[] = tasksData.map(task => ({
          id: task.id,
          task_number: task.task_number || 'N/A',
          title: task.title || 'Untitled Task',
          status: task.status || 'assigned',
          priority: task.priority || 'medium',
          due_date: task.due_date,
          cadet_name: task.cadet_name || 'Unknown Cadet',
          cadet_id: task.cadet_id,
          is_subtask: task.is_subtask,
          parent_task_title: task.parent_task_title
        }));

        console.log('Total tasks found:', allTasks.length);
        console.log('All tasks:', allTasks.map(t => ({ task_number: t.task_number, title: t.title })));

        // Calculate task counts
        const now = new Date();
        const counts = allTasks.reduce((acc, task) => {
          acc.total++;
          
          if (task.status === 'completed') {
            acc.completed++;
          } else {
            acc.active++;
            
            if (task.due_date && new Date(task.due_date) < now) {
              acc.overdue++;
            }
          }
          
          return acc;
        }, { total: 0, active: 0, overdue: 0, completed: 0 });

        setTasks(allTasks);
        setTaskCounts(counts);

      } catch (err) {
        console.error('Error in fetchParentCadetTasks:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchParentCadetTasks();
  }, [userProfile?.email, userProfile?.role]);

  return { tasks, taskCounts, isLoading, error };
};