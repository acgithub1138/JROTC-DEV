
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TaskList } from './TaskList';
import { TaskTable } from './TaskTable';
import { TaskCards } from './components/TaskCards';
import { TaskForm } from './TaskForm';
import { useIsMobile } from '@/hooks/use-mobile';
import { TablePagination } from '@/components/ui/table-pagination';
import { syncTaskOptions } from '@/utils/taskOptionValidator';
import { useTasks, Task } from '@/hooks/useTasks';
import { TaskDetailDialog } from './TaskDetailDialog';
import { useAuth } from '@/contexts/AuthContext';
import { getMyActiveTasks, getAllSchoolTasks, getCompletedTasks } from '@/utils/taskFilters';
import { getPaginatedItems, getTotalPages } from '@/utils/pagination';

const TaskManagementPage: React.FC = () => {
  const { tasks } = useTasks();
  const { userProfile } = useAuth();
  const isMobile = useIsMobile();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPageMyTasks, setCurrentPageMyTasks] = useState(1);
  const [currentPageAllTasks, setCurrentPageAllTasks] = useState(1);
  const [currentPageCompleted, setCurrentPageCompleted] = useState(1);

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

  // Pagination logic for each tab
  const myTasksPages = getTotalPages(myActiveTasks.length);
  const allTasksPages = getTotalPages(allSchoolTasks.length);
  const completedTasksPages = getTotalPages(completedTasks.length);

  const paginatedMyTasks = getPaginatedItems(myActiveTasks, currentPageMyTasks);
  const paginatedAllTasks = getPaginatedItems(allSchoolTasks, currentPageAllTasks);
  const paginatedCompletedTasks = getPaginatedItems(completedTasks, currentPageCompleted);

  // Reset pagination when search changes
  React.useEffect(() => {
    setCurrentPageMyTasks(1);
    setCurrentPageAllTasks(1);
    setCurrentPageCompleted(1);
  }, [searchTerm]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Task Management</h1>
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
          {isMobile ? (
            <TaskCards 
              tasks={paginatedMyTasks}
              onView={handleTaskSelect}
              onEdit={handleEditTask}
              onDelete={() => {}}
            />
          ) : (
            <TaskTable 
              tasks={paginatedMyTasks}
              onTaskSelect={handleTaskSelect}
              onEditTask={handleEditTask}
            />
          )}
          <TablePagination
            currentPage={currentPageMyTasks}
            totalPages={myTasksPages}
            totalItems={myActiveTasks.length}
            onPageChange={setCurrentPageMyTasks}
          />
        </TabsContent>

        <TabsContent value="alltasks" className="space-y-4">
          {isMobile ? (
            <TaskCards 
              tasks={paginatedAllTasks}
              onView={handleTaskSelect}
              onEdit={handleEditTask}
              onDelete={() => {}}
            />
          ) : (
            <TaskTable 
              tasks={paginatedAllTasks}
              onTaskSelect={handleTaskSelect}
              onEditTask={handleEditTask}
            />
          )}
          <TablePagination
            currentPage={currentPageAllTasks}
            totalPages={allTasksPages}
            totalItems={allSchoolTasks.length}
            onPageChange={setCurrentPageAllTasks}
          />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {isMobile ? (
            <TaskCards 
              tasks={paginatedCompletedTasks}
              onView={handleTaskSelect}
              onEdit={handleEditTask}
              onDelete={() => {}}
            />
          ) : (
            <TaskTable 
              tasks={paginatedCompletedTasks}
              onTaskSelect={handleTaskSelect}
              onEditTask={handleEditTask}
            />
          )}
          <TablePagination
            currentPage={currentPageCompleted}
            totalPages={completedTasksPages}
            totalItems={completedTasks.length}
            onPageChange={setCurrentPageCompleted}
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
