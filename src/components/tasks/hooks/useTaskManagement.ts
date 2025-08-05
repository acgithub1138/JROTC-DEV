import { useState, useEffect, useMemo, useCallback } from 'react';
import { Task, useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { getMyActiveTasksAndSubtasks, getAllSchoolTasks, getAllSchoolTasksAndSubtasks, getCompletedTasks } from '@/utils/taskFilters';
import { getPaginatedItems, getTotalPages } from '@/utils/pagination';
import { filterTasks } from '../components/TaskFilters';
import { useMySubtasksQuery } from '@/hooks/subtasks/useMySubtasksQuery';
import { Subtask } from '@/hooks/tasks/types';
import { useQueryClient } from '@tanstack/react-query';
import { useDebouncedValue } from '@/hooks/useDebounce';

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

  // Debounce search term to reduce filtering frequency
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  // Memoize expensive filtering operations
  const filteredTasks = useMemo(() => {
    const myActiveTasksAndSubtasks = getMyActiveTasksAndSubtasks(tasks, mySubtasks, userProfile?.id);
    const allSchoolTasksAndSubtasks = getAllSchoolTasksAndSubtasks(tasks, mySubtasks);
    const completedTasks = getCompletedTasks(tasks);

    return {
      myActive: filterTasks(myActiveTasksAndSubtasks, debouncedSearchTerm) as (Task | Subtask)[],
      allSchool: filterTasks(allSchoolTasksAndSubtasks, debouncedSearchTerm) as (Task | Subtask)[],
      completed: filterTasks(completedTasks, debouncedSearchTerm)
    };
  }, [tasks, mySubtasks, userProfile?.id, debouncedSearchTerm]);

  // Memoize overdue filtering
  const overdueFilteredTasks = useMemo(() => {
    if (!overdueFilter) return filteredTasks.allSchool;
    
    const now = new Date();
    return filteredTasks.allSchool.filter(task => 
      task.due_date && new Date(task.due_date) < now
    );
  }, [filteredTasks.allSchool, overdueFilter]);

  // Memoize pagination calculations
  const paginationData = useMemo(() => {
    const myTasksPages = getTotalPages(filteredTasks.myActive.length);
    const allTasksPages = getTotalPages(overdueFilteredTasks.length);
    const completedTasksPages = getTotalPages(filteredTasks.completed.length);

    return {
      myTasks: getPaginatedItems(filteredTasks.myActive, currentPageMyTasks),
      allTasks: getPaginatedItems(overdueFilteredTasks, currentPageAllTasks),
      completedTasks: getPaginatedItems(filteredTasks.completed, currentPageCompleted),
      myTasksPages,
      allTasksPages,
      completedTasksPages
    };
  }, [
    filteredTasks, 
    overdueFilteredTasks, 
    currentPageMyTasks, 
    currentPageAllTasks, 
    currentPageCompleted
  ]);

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPageMyTasks(1);
    setCurrentPageAllTasks(1);
    setCurrentPageCompleted(1);
  }, [debouncedSearchTerm, overdueFilter]);

  // Optimized refresh function with debouncing
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refetchTasks(),
      refetchSubtasks(),
      queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['subtasks'] })
    ]);
  }, [refetchTasks, refetchSubtasks, queryClient]);

  return {
    searchTerm,
    setSearchTerm,
    overdueFilter,
    setOverdueFilter,
    myActiveTasks: paginationData.myTasks as (Task | Subtask)[],
    allSchoolTasks: paginationData.allTasks as (Task | Subtask)[],
    completedTasks: paginationData.completedTasks,
    currentPageMyTasks,
    currentPageAllTasks,
    currentPageCompleted,
    myTasksPages: paginationData.myTasksPages,
    allTasksPages: paginationData.allTasksPages,
    completedTasksPages: paginationData.completedTasksPages,
    setCurrentPageMyTasks,
    setCurrentPageAllTasks,
    setCurrentPageCompleted,
    myActiveTasksCount: filteredTasks.myActive.length,
    allSchoolTasksCount: overdueFilteredTasks.length,
    completedTasksCount: filteredTasks.completed.length,
    handleRefresh
  };
};