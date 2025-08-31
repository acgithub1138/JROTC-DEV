
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TaskFilters } from './components/TaskFilters';
import { TaskTabs } from './components/TaskTabs';
import { useTaskManagement } from './hooks/useTaskManagement';
import { Task } from '@/hooks/useTasks';
import { Subtask } from '@/hooks/tasks/types';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';
import { AccessDeniedDialog } from '../incident-management/AccessDeniedDialog';
import { useNavigate } from 'react-router-dom';

const TaskManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { canCreate, canView } = useTaskPermissions();
  const [showAccessDenied, setShowAccessDenied] = useState(false);

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
    completedTasksCount,
    handleRefresh
  } = useTaskManagement();
  
  // Removed console.log to prevent excessive rendering logs

  const handleTaskSelect = (task: Task | Subtask) => {
    // Check if user has view permissions
    if (canView) {
      // Navigate to view page for both tasks and subtasks using their own ID
      navigate(`/app/tasks/task_record?id=${task.id}`);
    } else {
      setShowAccessDenied(true);
    }
  };

  const handleEditTask = (task: Task | Subtask) => {
    // Navigate to edit page using the record's own ID
    navigate(`/app/tasks/task_record?mode=edit&id=${task.id}`);
  };

  const handleCreateTask = () => {
    navigate('/app/tasks/task_record?mode=create');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Task Management</h1>
        {canCreate && (
          <Button onClick={handleCreateTask} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Task
          </Button>
        )}
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
          onRefresh={handleRefresh}
        />

      {/* All modals removed - now using dedicated task record page */}

      <AccessDeniedDialog
        isOpen={showAccessDenied}
        onClose={() => setShowAccessDenied(false)}
        message="You do not have permission to view task details."
      />
    </div>
  );
};

export default TaskManagementPage;
