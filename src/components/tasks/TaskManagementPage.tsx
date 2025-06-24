
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskList } from './TaskList';
import { TaskTable } from './TaskTable';
import TaskOptionsManagement from './TaskOptionsManagement';
import { syncTaskOptions } from '@/utils/taskOptionValidator';
import { useTasks, Task } from '@/hooks/useTasks';
import { TaskDetailDialog } from './TaskDetailDialog';

const TaskManagementPage: React.FC = () => {
  const { tasks } = useTasks();
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Task Management</h1>
      </div>

      <Tabs defaultValue="table" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="table">Task Table</TabsTrigger>
          <TabsTrigger value="list">Task List</TabsTrigger>
          <TabsTrigger value="options">Options Management</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          <TaskTable 
            tasks={tasks}
            onTaskSelect={handleTaskSelect}
            onEditTask={handleEditTask}
          />
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <TaskList 
            tasks={tasks}
            onTaskSelect={handleTaskSelect}
            onEditTask={handleEditTask}
          />
        </TabsContent>

        <TabsContent value="options" className="space-y-4">
          <TaskOptionsManagement />
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
