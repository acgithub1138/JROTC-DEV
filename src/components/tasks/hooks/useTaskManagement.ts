import { useState, useEffect } from 'react';
import { Task, useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { syncTaskOptions } from '@/utils/taskOptionValidator';
import { getMyActiveTasks, getAllSchoolTasks, getCompletedTasks } from '@/utils/taskFilters';
import { getPaginatedItems, getTotalPages } from '@/utils/pagination';
import { filterTasks } from '../components/TaskFilters';

export const useTaskManagement = () => {
  const { tasks } = useTasks();
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [overdueFilter, setOverdueFilter] = useState(false);
  const [currentPageMyTasks, setCurrentPageMyTasks] = useState(1);
  const [currentPageAllTasks, setCurrentPageAllTasks] = useState(1);
  const [currentPageCompleted, setCurrentPageCompleted] = useState(1);

  useEffect(() => {
    // Automatically sync task options when the page loads
    syncTaskOptions().catch(console.error);
  }, []);

  // Helper function to filter overdue tasks
  const filterOverdueTasks = (taskList: Task[]) => {
    if (!overdueFilter) return taskList;
    const now = new Date();
    return taskList.filter(task => 
      task.due_date && new Date(task.due_date) < now
    );
  };

  // Filter tasks based on search term and overdue filter
  const myActiveTasks = filterTasks(getMyActiveTasks(tasks, userProfile?.id), searchTerm);
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

  return {
    searchTerm,
    setSearchTerm,
    overdueFilter,
    setOverdueFilter,
    myActiveTasks: paginatedMyTasks,
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
    completedTasksCount: completedTasks.length
  };
};