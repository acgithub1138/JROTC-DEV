
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskList } from './TaskList';
import { TaskTable } from './TaskTable';
import { syncTaskOptions } from '@/utils/taskOptionValidator';
import { useTasks, Task } from '@/hooks/useTasks';
import { TaskDetailDialog } from './TaskDetailDialog';
import { useAuth } from '@/contexts/AuthContext';
import { getMyActiveTasks, getAllSchoolTasks, getCompletedTasks } from '@/utils/taskFilters';

const TaskManagementPage: React.FC = () => {
  const { tasks } = useTasks();
  const { userProfile } = useAuth();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    // Automatically sync task options when the page loads
    syncTaskOptions().catch(console.error);
  }, []);

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setIsDetailDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  // Filter tasks based on tab selection
  const myActiveTasks = getMyActiveTasks(tasks, userProfile?.id);
  const allSchoolTasks = getAllSchoolTasks(tasks);
  const completedTasks = getCompletedTasks(tasks);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Task Management</h1>
      </div>

      <Tabs defaultValue="mytasks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mytasks">My Tasks</TabsTrigger>
          <TabsTrigger value="alltasks">All Tasks</TabsTrigger>
          <TabsTrigger value="completed">Completed Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="mytasks" className="space-y-4">
          <TaskList 
            tasks={myActiveTasks}
            onTaskSelect={handleTaskSelect}
            onEditTask={handleEditTask}
          />
        </TabsContent>

        <TabsContent value="alltasks" className="space-y-4">
          <TaskTable 
            tasks={allSchoolTasks}
            onTaskSelect={handleTaskSelect}
            onEditTask={handleEditTask}
          />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <TaskTable 
            tasks={completedTasks}
            onTaskSelect={handleTaskSelect}
            onEditTask={handleEditTask}
          />
        </TabsContent>
      </Tabs>

      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          onEdit={handleEditTask}
        />
      )}
    </div>
  );
};

export default TaskManagementPage;
