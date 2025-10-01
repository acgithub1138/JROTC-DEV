import React, { useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCapacitor } from '@/hooks/useCapacitor';
import { TaskList } from '../TaskList';
import { TaskTable } from '../TaskTable';
import { TaskCards } from './TaskCards';
import { TablePagination } from '@/components/ui/table-pagination';
import { Task } from '@/hooks/useTasks';
import { Subtask } from '@/hooks/tasks/types';
import { useSortableTable } from '@/hooks/useSortableTable';
import { useTaskSorting } from '@/hooks/useTaskSorting';
import { getPaginatedItems } from '@/utils/pagination';

interface TaskTabsProps {
  myActiveTasks: (Task | Subtask)[];
  allSchoolTasks: Task[];
  completedTasks: Task[];
  currentPageMyTasks: number;
  currentPageAllTasks: number;
  currentPageCompleted: number;
  myTasksPages: number;
  allTasksPages: number;
  completedTasksPages: number;
  onTaskSelect: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onPageChangeMyTasks: (page: number) => void;
  onPageChangeAllTasks: (page: number) => void;
  onPageChangeCompleted: (page: number) => void;
  overdueFilter: boolean;
  onOverdueFilterChange: (checked: boolean) => void;
  onRefresh?: () => void;
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

export const TaskTabs: React.FC<TaskTabsProps> = ({
  myActiveTasks,
  allSchoolTasks,
  completedTasks,
  currentPageMyTasks,
  currentPageAllTasks,
  currentPageCompleted,
  myTasksPages,
  allTasksPages,
  completedTasksPages,
  onTaskSelect,
  onEditTask,
  onPageChangeMyTasks,
  onPageChangeAllTasks,
  onPageChangeCompleted,
  overdueFilter,
  onOverdueFilterChange,
  onRefresh,
  activeTab = 'mytasks',
  onTabChange
}) => {
  const isMobile = useIsMobile();
  const { isNative } = useCapacitor();
  const { customSortFn } = useTaskSorting();
  
  // Sort myActiveTasks BEFORE pagination
  const { sortedData: sortedMyActiveTasks } = useSortableTable({
    data: myActiveTasks,
    customSortFn
  });
  
  // Sort allSchoolTasks BEFORE pagination  
  const { sortedData: sortedAllSchoolTasks } = useSortableTable({
    data: allSchoolTasks,
    customSortFn
  });
  
  // Sort completedTasks BEFORE pagination
  const { sortedData: sortedCompletedTasks } = useSortableTable({
    data: completedTasks,
    customSortFn
  });
  
  // Paginate sorted tasks
  const paginatedMyTasks = useMemo(() => 
    getPaginatedItems(sortedMyActiveTasks, currentPageMyTasks),
    [sortedMyActiveTasks, currentPageMyTasks]
  );
  
  const paginatedAllTasks = useMemo(() => 
    getPaginatedItems(sortedAllSchoolTasks, currentPageAllTasks),
    [sortedAllSchoolTasks, currentPageAllTasks]
  );
  
  const paginatedCompletedTasks = useMemo(() => 
    getPaginatedItems(sortedCompletedTasks, currentPageCompleted),
    [sortedCompletedTasks, currentPageCompleted]
  );
  
  // Memoize the rendering logic to prevent unnecessary re-renders
  const renderTaskContent = useCallback((tasks: (Task | Subtask)[], isAllTasksTab = false) => {
    if (isNative || isMobile) {
      return (
        <TaskCards 
          tasks={tasks}
          onView={onTaskSelect}
          onEdit={onEditTask}
          onDelete={() => {}}
          isMobile={isMobile}
          isNative={isNative}
        />
      );
    }
    
    return (
      <TaskTable 
        tasks={tasks}
        onTaskSelect={onTaskSelect}
        showOverdueFilter={isAllTasksTab}
        overdueFilterChecked={overdueFilter}
        onOverdueFilterChange={onOverdueFilterChange}
        onRefresh={onRefresh}
      />
    );
  }, [isMobile, isNative, onTaskSelect, onEditTask, overdueFilter, onOverdueFilterChange, onRefresh]);

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="mytasks">My Tasks</TabsTrigger>
        <TabsTrigger value="alltasks">All Tasks</TabsTrigger>
        <TabsTrigger value="completed">Completed Tasks</TabsTrigger>
      </TabsList>

      <TabsContent value="mytasks" className="space-y-4">
        {renderTaskContent(paginatedMyTasks)}
        <TablePagination
          currentPage={currentPageMyTasks}
          totalPages={myTasksPages}
          totalItems={sortedMyActiveTasks.length}
          onPageChange={onPageChangeMyTasks}
        />
      </TabsContent>

      <TabsContent value="alltasks" className="space-y-4">
        {renderTaskContent(paginatedAllTasks, true)}
        <TablePagination
          currentPage={currentPageAllTasks}
          totalPages={allTasksPages}
          totalItems={sortedAllSchoolTasks.length}
          onPageChange={onPageChangeAllTasks}
        />
      </TabsContent>

      <TabsContent value="completed" className="space-y-4">
        {renderTaskContent(paginatedCompletedTasks)}
        <TablePagination
          currentPage={currentPageCompleted}
          totalPages={completedTasksPages}
          totalItems={sortedCompletedTasks.length}
          onPageChange={onPageChangeCompleted}
        />
      </TabsContent>
    </Tabs>
  );
};