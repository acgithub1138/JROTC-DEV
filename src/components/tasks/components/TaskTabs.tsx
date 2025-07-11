import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { TaskList } from '../TaskList';
import { TaskTable } from '../TaskTable';
import { TaskCards } from './TaskCards';
import { TablePagination } from '@/components/ui/table-pagination';
import { Task } from '@/hooks/useTasks';
import { Subtask } from '@/hooks/tasks/types';

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
  onOverdueFilterChange
}) => {
  const isMobile = useIsMobile();

  const renderTaskContent = (tasks: (Task | Subtask)[], isAllTasksTab = false) => {
    if (isMobile) {
      return (
        <TaskCards 
          tasks={tasks}
          onView={onTaskSelect}
          onEdit={onEditTask}
          onDelete={() => {}}
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
      />
    );
  };

  return (
    <Tabs defaultValue="mytasks" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="mytasks">My Tasks</TabsTrigger>
        <TabsTrigger value="alltasks">All Tasks</TabsTrigger>
        <TabsTrigger value="completed">Completed Tasks</TabsTrigger>
      </TabsList>

      <TabsContent value="mytasks" className="space-y-4">
        {renderTaskContent(myActiveTasks)}
        <TablePagination
          currentPage={currentPageMyTasks}
          totalPages={myTasksPages}
          totalItems={myActiveTasks.length}
          onPageChange={onPageChangeMyTasks}
        />
      </TabsContent>

      <TabsContent value="alltasks" className="space-y-4">
        {renderTaskContent(allSchoolTasks, true)}
        <TablePagination
          currentPage={currentPageAllTasks}
          totalPages={allTasksPages}
          totalItems={allSchoolTasks.length}
          onPageChange={onPageChangeAllTasks}
        />
      </TabsContent>

      <TabsContent value="completed" className="space-y-4">
        {renderTaskContent(completedTasks)}
        <TablePagination
          currentPage={currentPageCompleted}
          totalPages={completedTasksPages}
          totalItems={completedTasks.length}
          onPageChange={onPageChangeCompleted}
        />
      </TabsContent>
    </Tabs>
  );
};