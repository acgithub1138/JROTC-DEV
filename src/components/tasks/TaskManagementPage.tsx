
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TaskForm } from './TaskForm';
import { TaskDetailDialog } from './TaskDetailDialog';
import { TaskFilters } from './components/TaskFilters';
import { TaskTabs } from './components/TaskTabs';
import { useTaskManagement } from './hooks/useTaskManagement';
import { Task } from '@/hooks/useTasks';
import { Subtask } from '@/hooks/tasks/types';

const TaskManagementPage: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const {
    searchTerm,
    setSearchTerm,
    overdueFilter,
    setOverdueFilter,
    myActiveTasks,
    allSchoolTasks,
    completedTasks,
    currentPageMyTasks,
    currentPageAllTasks,
    currentPageCompleted,
    myTasksPages,
    allTasksPages,
    completedTasksPages,
    setCurrentPageMyTasks,
    setCurrentPageAllTasks,
    setCurrentPageCompleted,
    myActiveTasksCount,
    allSchoolTasksCount,
    completedTasksCount
  } = useTaskManagement();

  const handleTaskSelect = (task: Task | Subtask) => {
    setSelectedTask(task as Task);
    setIsDetailDialogOpen(true);
  };

  const handleEditTask = (task: Task | Subtask) => {
    setEditingTask(task as Task);
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Task Management</h1>
        <Button onClick={handleCreateTask} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Task
        </Button>
      </div>

      <TaskFilters 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <TaskTabs
        myActiveTasks={myActiveTasks}
        allSchoolTasks={allSchoolTasks}
        completedTasks={completedTasks}
        currentPageMyTasks={currentPageMyTasks}
        currentPageAllTasks={currentPageAllTasks}
        currentPageCompleted={currentPageCompleted}
        myTasksPages={myTasksPages}
        allTasksPages={allTasksPages}
        completedTasksPages={completedTasksPages}
        onTaskSelect={handleTaskSelect}
        onEditTask={handleEditTask}
        onPageChangeMyTasks={setCurrentPageMyTasks}
        onPageChangeAllTasks={setCurrentPageAllTasks}
        onPageChangeCompleted={setCurrentPageCompleted}
        overdueFilter={overdueFilter}
        onOverdueFilterChange={setOverdueFilter}
      />

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
