import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

        // Get the contacts for this parent user
        const { data: contacts, error: contactsError } = await supabase
          .from('contacts')
          .select('id, name, cadet_id')
          .eq('email', userProfile.email)
          .eq('type', 'parent')
          .not('cadet_id', 'is', null);

        if (contactsError) {
          console.error('Error fetching parent contacts:', contactsError);
          setError('Failed to fetch cadet information');
          return;
        }

        if (!contacts || contacts.length === 0) {
          setTasks([]);
          setTaskCounts({ total: 0, active: 0, overdue: 0, completed: 0 });
          return;
        }

        const cadetIds = contacts.map(c => c.cadet_id).filter(Boolean);
        if (cadetIds.length === 0) {
          setTasks([]);
          setTaskCounts({ total: 0, active: 0, overdue: 0, completed: 0 });
          return;
        }

        // Fetch tasks and subtasks assigned to these cadets
        const allTasks: CadetTask[] = [];
        
        for (const cadetId of cadetIds) {
          const contact = contacts.find(c => c.cadet_id === cadetId);
          
          try {
            // Fetch tasks assigned to this cadet
            const { data: tasks } = await supabase
              .from('tasks')
              .select('id, task_number, title, status, priority, due_date, assigned_to')
              .contains('assigned_to', [cadetId]);
              
            if (tasks) {
              tasks.forEach((task) => {
                allTasks.push({
                  id: task.id,
                  task_number: task.task_number || 'N/A',
                  title: task.title || 'Untitled Task',
                  status: task.status || 'assigned',
                  priority: task.priority || 'medium',
                  due_date: task.due_date,
                  cadet_name: contact?.name || 'Unknown Cadet',
                  cadet_id: cadetId,
                  is_subtask: false
                });
              });
            }
          } catch (taskError) {
            console.log('Error fetching tasks for cadet:', cadetId, taskError);
          }

          try {
            // Fetch subtasks assigned to this cadet
            const { data: subtasks } = await supabase
              .from('subtasks')
              .select('id, task_number, title, status, priority, due_date, assigned_to')
              .eq('assigned_to', cadetId);
              
            if (subtasks) {
              subtasks.forEach((subtask) => {
                allTasks.push({
                  id: subtask.id,
                  task_number: subtask.task_number || 'N/A',
                  title: subtask.title || 'Untitled Subtask',
                  status: subtask.status || 'assigned',
                  priority: subtask.priority || 'medium',
                  due_date: subtask.due_date,
                  cadet_name: contact?.name || 'Unknown Cadet',
                  cadet_id: cadetId,
                  is_subtask: true,
                  parent_task_title: 'Subtask'
                });
              });
            }
          } catch (subtaskError) {
            console.log('Error fetching subtasks for cadet:', cadetId, subtaskError);
          }
        }

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