import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TaskFilters } from './components/TaskFilters';
import { TaskTabs } from './components/TaskTabs';
import { useTaskManagement } from './hooks/useTaskManagement';
import { Task } from '@/hooks/useTasks';
import { Subtask } from '@/hooks/tasks/types';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';
import { AccessDeniedDialog } from '../incident-management/AccessDeniedDialog';
import { PageContainer } from '@/components/ui/layout';

const TaskManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { canCreate, canView } = useTaskPermissions();
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [activeTab, setActiveTab] = useState('mytasks');

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

  // Read URL parameters and set initial state
  useEffect(() => {
    const tab = searchParams.get('tab');
    const overdueParam = searchParams.get('overdue');
    
    if (tab && ['mytasks', 'alltasks', 'completed'].includes(tab)) {
      setActiveTab(tab);
    }
    
    if (overdueParam === 'true') {
      setOverdueFilter(true);
    }
  }, [searchParams, setOverdueFilter]);

  const handleTaskSelect = (task: Task | Subtask) => {
    if (canView) {
      navigate(`/app/tasks/task_record?id=${task.id}`);
    } else {
      setShowAccessDenied(true);
    }
  };

  const handleEditTask = (task: Task | Subtask) => {
    navigate(`/app/tasks/task_record?mode=edit&id=${task.id}`);
  };

  const handleCreateTask = () => {
    navigate('/app/tasks/task_record?mode=create_task');
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <h1 className="text-3xl font-bold">Task Management</h1>
        {canCreate && (
          <Button onClick={handleCreateTask} className="flex items-center gap-2 w-full sm:w-auto">
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
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <AccessDeniedDialog
        isOpen={showAccessDenied}
        onClose={() => setShowAccessDenied(false)}
        message="You do not have permission to view task details."
      />
    </PageContainer>
  );
};

export default TaskManagementPage;