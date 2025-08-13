import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Edit, Save, X, User, Calendar, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSubtasks } from '@/hooks/useSubtasks';
import { useSubtaskComments } from '@/hooks/useSubtaskComments';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export const MobileSubtaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation() as { state?: { parentTaskId?: string } };
  const parentTaskId = location.state?.parentTaskId;
  const navigate = useNavigate();

  const { userProfile } = useAuth();
  const { statusOptions } = useTaskStatusOptions();
  const { priorityOptions } = useTaskPriorityOptions();
  const { canView, canUpdate, canUpdateAssigned } = useTaskPermissions();
  const { users } = useSchoolUsers(true);
  const { comments, addComment, addSystemComment, isAddingComment } = useSubtaskComments(id || '');
  const { toast } = useToast();

  const { subtasks, updateSubtask } = useSubtasks(parentTaskId);

  const [loading, setLoading] = useState(false);
  const [subtask, setSubtask] = useState<any | null>(null);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    assigned_to: '',
    due_date: '' as string | ''
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
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

  // Initialize form when subtask changes
  useEffect(() => {
    if (!subtask) return;
    setFormState({
      title: subtask.title || '',
      description: subtask.description || '',
      status: subtask.status || '',
      priority: subtask.priority || 'medium',
      assigned_to: subtask.assigned_to || '',
      due_date: subtask.due_date ? new Date(subtask.due_date).toISOString().slice(0, 10) : ''
    });
    setHasUnsavedChanges(false);
  }, [subtask]);

  // Track changes
  useEffect(() => {
    if (!subtask) return;
    const changed = (
      formState.title !== (subtask.title || '') ||
      formState.description !== (subtask.description || '') ||
      formState.status !== (subtask.status || '') ||
      formState.priority !== (subtask.priority || 'medium') ||
      formState.assigned_to !== (subtask.assigned_to || '') ||
      (formState.due_date || '') !== (subtask.due_date ? new Date(subtask.due_date).toISOString().slice(0, 10) : '')
    );
    setHasUnsavedChanges(changed);
  }, [formState, subtask]);

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

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      setIsEditing(false);
    }
  };

  const confirmDiscard = () => {
    setShowConfirmDialog(false);
    // reset
    if (subtask) {
      setFormState({
        title: subtask.title || '',
        description: subtask.description || '',
        status: subtask.status || '',
        priority: subtask.priority || 'medium',
        assigned_to: subtask.assigned_to || '',
        due_date: subtask.due_date ? new Date(subtask.due_date).toISOString().slice(0, 10) : ''
      });
    }
    setIsEditing(false);
  };

  const saveEdits = async () => {
    if (!subtask) return;
    try {
      await updateSubtask({
        id: subtask.id,
        title: formState.title,
        description: formState.description,
        status: formState.status,
        priority: formState.priority,
        assigned_to: formState.assigned_to || null,
        due_date: formState.due_date ? new Date(formState.due_date).toISOString() : null
      } as any);
      addSystemComment('Subtask updated');
      toast({ title: 'Saved', description: 'Subtask updated successfully.' });
      setIsEditing(false);
    } catch (e) {
      console.error('Error updating subtask:', e);
      toast({ title: 'Error', description: 'Failed to update subtask.', variant: 'destructive' });
    }
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

  return (
    <>
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
              {canEdit && !isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canEdit && isEditing && (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={saveEdits}>
                    <Save className="h-4 w-4" />
                  </Button>
                </>
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
              {!isEditing ? (
                <>
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
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <input
                      className="mt-1 w-full p-2 border rounded-md bg-background"
                      value={formState.title}
                      onChange={(e) => setFormState(s => ({ ...s, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      className="mt-1 w-full p-2 border rounded-md bg-background min-h-[100px]"
                      value={formState.description}
                      onChange={(e) => setFormState(s => ({ ...s, description: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <select
                        className="mt-1 w-full p-2 border rounded-md bg-background"
                        value={formState.status}
                        onChange={(e) => setFormState(s => ({ ...s, status: e.target.value }))}
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Priority</label>
                      <select
                        className="mt-1 w-full p-2 border rounded-md bg-background"
                        value={formState.priority}
                        onChange={(e) => setFormState(s => ({ ...s, priority: e.target.value }))}
                      >
                        {priorityOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Assigned To</label>
                      <select
                        className="mt-1 w-full p-2 border rounded-md bg-background"
                        value={formState.assigned_to}
                        onChange={(e) => setFormState(s => ({ ...s, assigned_to: e.target.value }))}
                      >
                        <option value="">Unassigned</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{`${u.last_name}, ${u.first_name}`}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Due Date</label>
                      <input
                        type="date"
                        className="mt-1 w-full p-2 border rounded-md bg-background"
                        value={formState.due_date}
                        onChange={(e) => setFormState(s => ({ ...s, due_date: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}
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
                <div className="space-y-3">
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscard}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
