import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Filter, 
  Clock,
  User,
  Calendar
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MobileTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string;
  assignedTo: string;
  category: string;
}

const mockTasks: MobileTask[] = [
  {
    id: '1',
    title: 'Equipment Inventory Check',
    description: 'Complete monthly inventory of all drill equipment',
    priority: 'high',
    status: 'pending',
    dueDate: '2025-01-13',
    assignedTo: 'Johnson, Sarah',
    category: 'Equipment'
  },
  {
    id: '2',
    title: 'Uniform Inspection Prep',
    description: 'Prepare materials for weekly uniform inspection',
    priority: 'medium',
    status: 'in_progress',
    dueDate: '2025-01-14',
    assignedTo: 'Smith, Michael',
    category: 'Inspection'
  },
  {
    id: '3',
    title: 'Competition Registration',
    description: 'Submit team registration for upcoming drill competition',
    priority: 'high',
    status: 'pending',
    dueDate: '2025-01-15',
    assignedTo: 'Williams, Ashley',
    category: 'Competition'
  },
];

const priorityColors = {
  high: 'bg-destructive text-destructive-foreground',
  medium: 'bg-orange-500 text-white',
  low: 'bg-green-600 text-white'
};

const statusColors = {
  pending: 'bg-muted text-muted-foreground',
  in_progress: 'bg-blue-600 text-white',
  completed: 'bg-green-600 text-white'
};

export const MobileTaskList: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'mine' | 'today' | 'overdue'>('all');

  const getPriorityBadge = (priority: string) => (
    <Badge className={cn('text-xs', priorityColors[priority as keyof typeof priorityColors])}>
      {priority.toUpperCase()}
    </Badge>
  );

  const getStatusBadge = (status: string) => (
    <Badge variant="outline" className={cn('text-xs', statusColors[status as keyof typeof statusColors])}>
      {status.replace('_', ' ').toUpperCase()}
    </Badge>
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    return `${diffDays} days`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filter Bar */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex gap-2 overflow-x-auto">
          {['all', 'mine', 'today', 'overdue'].map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? 'default' : 'outline'}
              size="sm"
              className="flex-shrink-0 capitalize"
              onClick={() => setFilter(filterType as any)}
            >
              {filterType === 'all' ? 'All Tasks' : filterType}
            </Button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {mockTasks.map((task) => (
          <Card 
            key={task.id} 
            className="bg-card border-border cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate(`/mobile/tasks/${task.id}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-foreground text-sm line-clamp-2 flex-1 mr-2">
                  {task.title}
                </h3>
                {getPriorityBadge(task.priority)}
              </div>
              
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {task.description}
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  {getStatusBadge(task.status)}
                  <Badge variant="outline" className="text-xs">
                    {task.category}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <User className="mr-1 h-3 w-3" />
                    {task.assignedTo}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    {formatDate(task.dueDate)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        onClick={() => navigate('/mobile/tasks/create')}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};