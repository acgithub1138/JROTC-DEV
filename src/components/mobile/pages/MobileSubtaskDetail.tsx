import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, User, Calendar, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSubtasks } from '@/hooks/useSubtasks';
import { useSubtaskComments } from '@/hooks/useSubtaskComments';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { MobileSubtaskForm } from './MobileSubtaskForm';

export const MobileSubtaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation() as { state?: { parentTaskId?: string } };
  const parentTaskId = location.state?.parentTaskId;
  const navigate = useNavigate();

  const { userProfile } = useAuth();
  const { statusOptions } = useTaskStatusOptions();
  const { priorityOptions } = useTaskPriorityOptions();
  const { canView, canUpdate, canUpdateAssigned } = useTaskPermissions();
  const { comments, addComment, isAddingComment } = useSubtaskComments(id || '');
  const { toast } = useToast();

  const { subtasks } = useSubtasks(parentTaskId);

  const [loading, setLoading] = useState(false);
  const [subtask, setSubtask] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newComment, setNewComment] = useState('');

  // Load subtask data
  useEffect(() => {
    const loadSubtask = async () => {
      if (!id) return;
      // Try to find it from loaded subtasks first
      const fromList = subtasks.find((s) => s.id === id);
      if (fromList) {
        setSubtask(fromList);
        return;
      }
      // Fallback to direct fetch
      setLoading(true);
      const { data, error } = await supabase
        .from('subtasks')
        .select(`*,
          assigned_to_profile:profiles!subtasks_assigned_to_fkey(id, first_name, last_name, email),
          assigned_by_profile:profiles!subtasks_assigned_by_fkey(id, first_name, last_name, email)
        `)
        .eq('id', id)
        .single();
      setLoading(false);
      if (error) {
        console.error('Error loading subtask:', error);
        toast({ title: 'Error', description: 'Failed to load subtask', variant: 'destructive' });
        return;
      }
      setSubtask(data);
    };
    loadSubtask();
  }, [id, subtasks, toast]);

  const canEdit = useMemo(() => {
    if (!subtask) return false;
    return canUpdate || (canUpdateAssigned && subtask.assigned_to === userProfile?.id);
  }, [subtask, canUpdate, canUpdateAssigned, userProfile?.id]);

  useEffect(() => {
    if (!canView) {
      toast({ title: 'Access Denied', description: "You don't have permission to view subtasks.", variant: 'destructive' });
      navigate('/mobile/tasks');
    }
  }, [canView, navigate, toast]);

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    if (!statusOption) return null;
    return (
      <Badge variant="outline" className={cn('text-xs', statusOption.color_class)}>
        {statusOption.label.toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityOption = priorityOptions.find(opt => opt.value === priority);
    if (!priorityOption) return null;
    return (
      <Badge className={cn('text-xs', priorityOption.color_class)}>
        {priorityOption.label.toUpperCase()}
      </Badge>
    );
  };

  const getAssignedToName = () => {
    if (subtask?.assigned_to_profile) {
      return `${subtask.assigned_to_profile.last_name}, ${subtask.assigned_to_profile.first_name}`;
    }
    return 'Unassigned';
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
  };

  if (loading || (!subtask && id)) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading subtask...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!subtask) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Subtask not found</p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/mobile/tasks')}
              className="mt-4"
            >
              Back to Tasks
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <MobileSubtaskForm 
        subtask={subtask}
        onCancel={() => setIsEditing(false)}
        onSuccess={handleEditSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/mobile/tasks')}
              className="mr-2 p-2 flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold truncate">
                {subtask.title}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        {/* Subtask Info Card */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Subtask Information</CardTitle>
              <div className="flex gap-2">
                {getPriorityBadge(subtask.priority)}
                {getStatusBadge(subtask.status)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {subtask.description && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                <p className="text-sm">{subtask.description}</p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Assigned to</p>
                  <p className="text-sm font-medium">{getAssignedToName()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  <p className="text-sm font-medium">
                    {subtask.due_date ? format(new Date(subtask.due_date), 'PPP') : 'No due date'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Add Comment Form - moved to top */}
              <div className="space-y-3 pb-4 border-b border-border">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full min-h-[80px] p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  onClick={() => {
                    if (newComment.trim()) {
                      addComment(newComment.trim());
                      setNewComment('');
                    }
                  }}
                  disabled={!newComment.trim() || isAddingComment}
                  className="w-full"
                >
                  {isAddingComment ? 'Adding...' : 'Add Comment'}
                </Button>
              </div>

              {/* Comments List */}
              {comments.map((comment) => (
                <div key={comment.id} className={cn(
                  'p-3 rounded-lg',
                  comment.is_system_comment ? 'bg-muted/50' : 'bg-background border'
                )}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-sm font-medium">
                      {comment.is_system_comment ? 'System' : 
                        comment.user_profile ? 
                          `${comment.user_profile.last_name}, ${comment.user_profile.first_name}` : 
                          'Unknown User'
                      }
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), 'MMM d, HH:mm')}
                    </div>
                  </div>
                  <div className="text-sm">
                    {comment.comment_text}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};