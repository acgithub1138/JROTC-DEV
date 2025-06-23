
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { TaskList } from './TaskList';
import { TaskForm } from './TaskForm';
import { TaskDetail } from './TaskDetail';
import { Task } from '@/hooks/useTasks';

const TaskManagementPage = () => {
  const { userProfile } = useAuth();
  const { tasks, isLoading } = useTasks();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const canCreateTasks = userProfile?.role === 'instructor' || userProfile?.role === 'command_staff';

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setSelectedTask(null);
  };

  const handleCloseDetail = () => {
    setSelectedTask(null);
  };

  const handleCloseEdit = () => {
    setEditingTask(null);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600 mt-1">
            Manage and track tasks for your organization
          </p>
        </div>
        {canCreateTasks && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
        )}
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Tasks Yet</CardTitle>
            <CardDescription>
              {canCreateTasks
                ? "Get started by creating your first task."
                : "No tasks have been assigned to you yet."}
            </CardDescription>
          </CardHeader>
          {canCreateTasks && (
            <CardContent>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Task
              </Button>
            </CardContent>
          )}
        </Card>
      ) : (
        <TaskList
          tasks={tasks}
          onTaskSelect={handleTaskSelect}
          onEditTask={handleEditTask}
        />
      )}

      <TaskForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        mode="create"
      />

      {editingTask && (
        <TaskForm
          open={!!editingTask}
          onOpenChange={handleCloseEdit}
          mode="edit"
          task={editingTask}
        />
      )}

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={handleCloseDetail}
          onEdit={handleEditTask}
        />
      )}
    </div>
  );
};

export default TaskManagementPage;
