
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TaskList } from './TaskList';
import { TaskTable } from './TaskTable';
import { TaskForm } from './TaskForm';
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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleCreateTask = () => {
    setShowCreateForm(true);
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
  };

  const handleCloseEditForm = () => {
    setEditingTask(null);
  };

  // Filter tasks based on search term
  const filterTasks = (taskList: Task[]) => {
    if (!searchTerm) return taskList;
    
    return taskList.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.task_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assigned_to_profile?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assigned_to_profile?.last_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Filter tasks based on tab selection
  const myActiveTasks = filterTasks(getMyActiveTasks(tasks, userProfile?.id));
  const allSchoolTasks = filterTasks(getAllSchoolTasks(tasks));
  const completedTasks = filterTasks(getCompletedTasks(tasks));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-end items-center">
        <Button onClick={handleCreateTask} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Task
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="mytasks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mytasks">My Tasks</TabsTrigger>
          <TabsTrigger value="alltasks">All Tasks</TabsTrigger>
          <TabsTrigger value="completed">Completed Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="mytasks" className="space-y-4">
          <TaskTable 
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

      {/* Create Task Form */}
      <TaskForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        mode="create"
      />

      {/* Edit Task Form */}
      {editingTask && (
        <TaskForm
          open={!!editingTask}
          onOpenChange={handleCloseEditForm}
          mode="edit"
          task={editingTask}
        />
      )}

      {/* Task Detail Dialog */}
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
