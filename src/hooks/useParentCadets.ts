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
            // Debug: Log the cadet ID we're searching for
            console.log('Searching for tasks assigned to cadet ID:', cadetId);
            
            // Fetch tasks - try different query approaches
            const { data: tasks, error: tasksError } = await supabase
              .from('tasks')
              .select('id, task_number, title, status, priority, due_date, assigned_to')
              .or(`assigned_to.cs.{${cadetId}},assigned_to.eq.${cadetId}`);
            
            console.log('Tasks query result:', { tasks, tasksError, cadetId });
              
            if (tasksError) {
              console.error('Tasks query error:', tasksError);
            } else if (tasks) {
              console.log(`Found ${tasks.length} tasks for cadet ${cadetId}`);
              tasks.forEach((task) => {
                console.log('Adding task:', task.task_number, task.title);
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
            console.error('Error fetching tasks for cadet:', cadetId, taskError);
          }

          try {
            // Fetch subtasks assigned to this cadet
            const { data: subtasks, error: subtasksError } = await supabase
              .from('subtasks')
              .select('id, task_number, title, status, priority, due_date, assigned_to')
              .eq('assigned_to', cadetId);
            
            console.log('Subtasks query result:', { subtasks, subtasksError, cadetId });
              
            if (subtasksError) {
              console.error('Subtasks query error:', subtasksError);
            } else if (subtasks) {
              console.log(`Found ${subtasks.length} subtasks for cadet ${cadetId}`);
              subtasks.forEach((subtask) => {
                console.log('Adding subtask:', subtask.task_number, subtask.title);
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
            console.error('Error fetching subtasks for cadet:', cadetId, subtaskError);
          }
        }

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