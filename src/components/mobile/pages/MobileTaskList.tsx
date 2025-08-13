import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Filter, 
  Clock,
  User,
  Calendar,
  CornerDownRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTasks } from '@/hooks/useTasks';
import { useTaskStatusOptions } from '@/hooks/useTaskStatusOptions';
import { useTaskPriorityOptions } from '@/hooks/useTaskPriorityOptions';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useSubtasks } from '@/hooks/useSubtasks';

export const MobileTaskList: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, isLoading } = useTasks();
  const { statusOptions } = useTaskStatusOptions();
  const { priorityOptions } = useTaskPriorityOptions();
  const { userProfile } = useAuth();
  const { canCreate, canViewDetails } = useTaskPermissions();
  const [filter, setFilter] = useState<'all' | 'mine' | 'today' | 'overdue'>('all');

  // Filter tasks based on current filter
  const filteredTasks = tasks.filter(task => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const dueDate = task.due_date ? new Date(task.due_date) : null;

    // Helper function to check if task is active (not completed or canceled)
    const isActiveTask = !task.completed_at && task.status !== 'completed' && task.status !== 'canceled';

    switch (filter) {
      case 'mine':
        return task.assigned_to === userProfile?.id && isActiveTask;
      case 'all':
        return isActiveTask;
      case 'today':
        return dueDate && dueDate <= today;
      case 'overdue':
        return dueDate && dueDate < new Date() && !task.completed_at;
      default:
        return true;
    }
  });

  const getPriorityBadge = (priority: string) => {
    const priorityOption = priorityOptions.find(opt => opt.value === priority);
    if (!priorityOption) return null;
    
    return (
      <Badge className={cn('text-xs', priorityOption.color_class)}>
        {priorityOption.label.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    if (!statusOption) return null;
    
    return (
      <Badge variant="outline" className={cn('text-xs', statusOption.color_class)}>
        {statusOption.label.toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    return `${diffDays} days`;
  };

  const getAssignedToName = (task: any) => {
    if (task.assigned_to_profile) {
      return `${task.assigned_to_profile.last_name}, ${task.assigned_to_profile.first_name}`;
    }
    return 'Unassigned';
  };

const openSubtask = (subtaskId: string, parentTaskId: string) => {
  navigate(`/mobile/subtasks/${subtaskId}`, { state: { parentTaskId } });
};

const SubtasksForTask: React.FC<{ parentTaskId: string }> = ({ parentTaskId }) => {
  const { subtasks, isLoading } = useSubtasks(parentTaskId);
  if (isLoading || subtasks.length === 0) return null;

  return (
    <div className="space-y-3">
      {subtasks.map((st) => (
        <Card
          key={st.id}
          className="bg-card border-border/70 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            openSubtask(st.id, parentTaskId);
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <CornerDownRight className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-foreground text-sm line-clamp-2">
                    {st.title}
                  </h3>
                </div>
              </div>
              {st.task_number && (
                <Badge variant="outline" className="text-xs">
                  #{st.task_number}
                </Badge>
              )}
            </div>
            
            {st.description && (
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {st.description}
              </p>
            )}
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                {getStatusBadge(st.status)}
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center">
                  <User className="mr-1 h-3 w-3" />
                  {st.assigned_to_profile
                    ? `${st.assigned_to_profile.last_name}, ${st.assigned_to_profile.first_name}`
                    : 'Unassigned'}
                </div>
                <div className="flex items-center gap-2">
                  {getPriorityBadge(st.priority)}
                </div>
              </div>
              
              <div className="flex items-center justify-end text-xs text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="mr-1 h-3 w-3" />
                  {formatDate(st.due_date || null)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        {/* Filter Bar */}
        <div className="p-4 border-b border-border bg-card">
          <div className="flex gap-2 overflow-x-auto">
            {['all', 'mine', 'today', 'overdue'].map((filterType) => (
              <div key={filterType} className="flex-shrink-0 h-8 bg-muted rounded animate-pulse w-20" />
            ))}
          </div>
        </div>

        {/* Loading Tasks */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {[...Array(5)].map((_, index) => (
            <Card key={index} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                  <div className="flex justify-between">
                    <div className="h-6 bg-muted rounded animate-pulse w-16" />
                    <div className="h-6 bg-muted rounded animate-pulse w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter Bar */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex gap-2 overflow-x-auto">
          {['mine', 'all', 'today', 'overdue'].map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? 'default' : 'outline'}
              size="sm"
              className="flex-shrink-0 capitalize"
              onClick={() => setFilter(filterType as any)}
            >
              {filterType === 'mine' ? 'My Tasks' : filterType === 'all' ? 'All' : filterType}
            </Button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No tasks found for "{filter}"</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className="space-y-2">
              <Card 
                className={cn(
                  "bg-card border-border transition-colors",
                  canViewDetails && "cursor-pointer hover:bg-muted/50"
                )}
                onClick={() => canViewDetails && navigate(`/mobile/tasks/${task.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-foreground text-sm line-clamp-2 flex-1 mr-2">
                      {task.title}
                    </h3>
                    {task.task_number && (
                      <Badge variant="outline" className="text-xs">
                        #{task.task_number}
                      </Badge>
                    )}
                  </div>
                  
                  {task.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <User className="mr-1 h-3 w-3" />
                        {getAssignedToName(task)}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        {formatDate(task.due_date)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <SubtasksForTask parentTaskId={task.id} />
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button - Only show if user can create tasks */}
      {canCreate && (
        <Button
          className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          onClick={() => navigate('/mobile/tasks/create')}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};