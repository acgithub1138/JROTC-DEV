import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface MyTask {
  id: string;
  title: string;
  task_number: string;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
}

export const useMyTasks = () => {
  const { userProfile } = useAuth();
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyTasks = async () => {
      if (!userProfile?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('id, title, task_number, status, priority, due_date, created_at')
          .eq('assigned_to', userProfile.id)
          .eq('school_id', userProfile.school_id)
          .not('status', 'in', '(done,completed,canceled)')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        setTasks(data || []);
      } catch (err) {
        console.error('Error fetching my tasks:', err);
        setError('Failed to fetch tasks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyTasks();
  }, [userProfile?.id, userProfile?.school_id]);

  const getTaskCounts = () => {
    const total = tasks.length;
    const overdue = tasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dueDate < today && task.status !== 'completed';
    }).length;

    return { total, overdue };
  };

  return {
    tasks,
    isLoading,
    error,
    taskCounts: getTaskCounts(),
  };
};