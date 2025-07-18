import { useState, useEffect } from 'react';
import { Task, useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { syncTaskOptions } from '@/utils/taskOptionValidator';
import { getMyActiveTasksAndSubtasks, getAllSchoolTasks, getCompletedTasks } from '@/utils/taskFilters';
import { getPaginatedItems, getTotalPages } from '@/utils/pagination';
import { filterTasks } from '../components/TaskFilters';
import { useMySubtasksQuery } from '@/hooks/subtasks/useMySubtasksQuery';
import { Subtask } from '@/hooks/tasks/types';
import { useQueryClient } from '@tanstack/react-query';

export const useTaskManagement = () => {
  const { tasks, refetch: refetchTasks } = useTasks();
  const { data: mySubtasks = [], refetch: refetchSubtasks } = useMySubtasksQuery();
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [overdueFilter, setOverdueFilter] = useState(false);
  const [currentPageMyTasks, setCurrentPageMyTasks] = useState(1);
  const [currentPageAllTasks, setCurrentPageAllTasks] = useState(1);
  const [currentPageCompleted, setCurrentPageCompleted] = useState(1);

  // Removed automatic sync to allow dynamic status/priority management from database

  // Helper function to filter overdue tasks
  const filterOverdueTasks = (taskList: Task[]) => {
    if (!overdueFilter) return taskList;
    const now = new Date();
    return taskList.filter(task => 
      task.due_date && new Date(task.due_date) < now
    );
  };

  // Filter tasks and subtasks based on search term and overdue filter
  const myActiveTasksAndSubtasks = getMyActiveTasksAndSubtasks(tasks, mySubtasks, userProfile?.id);
  const myActiveTasks = filterTasks(myActiveTasksAndSubtasks, searchTerm) as (Task | Subtask)[];
  const allSchoolTasksFiltered = filterTasks(getAllSchoolTasks(tasks), searchTerm);
  const allSchoolTasks = filterOverdueTasks(allSchoolTasksFiltered);
  const completedTasks = filterTasks(getCompletedTasks(tasks), searchTerm);

  // Pagination logic for each tab
  const myTasksPages = getTotalPages(myActiveTasks.length);
  const allTasksPages = getTotalPages(allSchoolTasks.length);
  const completedTasksPages = getTotalPages(completedTasks.length);

  const paginatedMyTasks = getPaginatedItems(myActiveTasks, currentPageMyTasks);
  const paginatedAllTasks = getPaginatedItems(allSchoolTasks, currentPageAllTasks);
  const paginatedCompletedTasks = getPaginatedItems(completedTasks, currentPageCompleted);

  // Reset pagination when search or overdue filter changes
  useEffect(() => {
    setCurrentPageMyTasks(1);
    setCurrentPageAllTasks(1);
    setCurrentPageCompleted(1);
  }, [searchTerm, overdueFilter]);

  const handleRefresh = async () => {
    await Promise.all([
      refetchTasks(),
      refetchSubtasks(),
      queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['subtasks'] })
    ]);
  };

  return {
    searchTerm,
    setSearchTerm,
    overdueFilter,
    setOverdueFilter,
    myActiveTasks: paginatedMyTasks as (Task | Subtask)[],
    allSchoolTasks: paginatedAllTasks,
    completedTasks: paginatedCompletedTasks,
    currentPageMyTasks,
    currentPageAllTasks,
    currentPageCompleted,
    myTasksPages,
    allTasksPages,
    completedTasksPages,
    setCurrentPageMyTasks,
    setCurrentPageAllTasks,
    setCurrentPageCompleted,
    // Original filtered counts for pagination
    myActiveTasksCount: myActiveTasks.length,
    allSchoolTasksCount: allSchoolTasks.length,
    completedTasksCount: completedTasks.length,
    handleRefresh
  };
};