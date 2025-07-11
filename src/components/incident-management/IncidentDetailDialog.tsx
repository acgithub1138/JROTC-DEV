import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, MessageSquare, Send, Save, X, ArrowUp, ArrowDown, Flag, User, Calendar as CalendarIcon, Bell } from 'lucide-react';
import { Incident, useIncidents } from '@/hooks/incidents/useIncidents';
import { useIncidentComments } from '@/hooks/incidents/useIncidentComments';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useIncidentStatusOptions } from '@/hooks/incidents/useIncidentStatusOptions';
import { useIncidentCategoryOptions } from '@/hooks/incidents/useIncidentCategoryOptions';
import { useIncidentEmailTemplates } from '@/hooks/incidents/useIncidentEmailTemplates';
import { useIncidentNotifications } from '@/hooks/incidents/useIncidentNotifications';
import { useModulePermissions } from '@/hooks/usePermissions';
import { Checkbox } from '@/components/ui/checkbox';

interface IncidentDetailDialogProps {
  incident: Incident;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}





const getCategoryColor = (category: string) => {
  switch (category) {
    case 'technical': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'behavioral': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    case 'safety': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    case 'other': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

const formatDisplayText = (text: string) => {
  return text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export const IncidentDetailDialog: React.FC<IncidentDetailDialogProps> = ({
  incident,
  open,
  onOpenChange,
}) => {
  const { userProfile } = useAuth();
  const { comments, addComment, isAddingComment } = useIncidentComments(incident.id);
  const { updateIncident, isUpdating } = useIncidents();
  const { priorityOptions } = useTaskPriorityOptions();
  const { users } = useSchoolUsers();
  const { statusOptions } = useIncidentStatusOptions();
  const { categoryOptions } = useIncidentCategoryOptions();
  const { templates } = useIncidentEmailTemplates();
  const { sendNotification, isSending } = useIncidentNotifications();
  const { canUpdate, canDelete } = useModulePermissions('incidents');
  const canAssign = canUpdate; // For now, use update permission for assign
  
  const [newComment, setNewComment] = useState('');
  const [commentsSortOrder, setCommentsSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sendNotificationChecked, setSendNotificationChecked] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [editData, setEditData] = useState({
    title: incident.title,
    description: incident.description || '',
    status: incident.status,
    priority: incident.priority,
    category: incident.category,
    assigned_to: incident.assigned_to || 'unassigned',
  });

  const canEditIncident = canUpdate;

  const handleSave = async () => {
    try {
      const updateData: any = {
        id: incident.id,
        title: editData.title,
        description: editData.description || null,
        status: editData.status,
        priority: editData.priority,
        category: editData.category,
        assigned_to: editData.assigned_to === 'unassigned' ? null : editData.assigned_to,
      };

      // If status is being changed to resolved, set active to false
      if (editData.status === 'resolved') {
        updateData.active = false;
      }

      // First save the incident
      await updateIncident(updateData);

      // Send notification if checked and template selected
      if (sendNotificationChecked && selectedTemplate && incident.submitted_by_profile?.email) {
        sendNotification({
          incidentId: incident.id,
          templateId: selectedTemplate,
          recipientEmail: incident.submitted_by_profile.email,
          incidentData: {
            ...incident,
            ...editData,
          },
        });
      }

      onOpenChange(false); // Close modal after successful save
    } catch (error) {
      console.error('Error updating incident:', error);
    }
  };

  // Update the form state when the incident prop changes (after successful save and refetch)
  React.useEffect(() => {
    setEditData({
      title: incident.title,
      description: incident.description || '',
      status: incident.status,
      priority: incident.priority,
      category: incident.category,
      assigned_to: incident.assigned_to || 'unassigned',
    });
    // Reset notification fields when incident changes
    setSendNotificationChecked(false);
    setSelectedTemplate('');
  }, [incident]);

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      addComment(newComment);
      setNewComment('');
    }
  };

  const toggleSortOrder = () => {
    setCommentsSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const sortedComments = [...comments].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return commentsSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {canEditIncident ? (
                <Input
                  value={editData.title}
                  onChange={(e) => setEditData({...editData, title: e.target.value})}
                  className="text-lg font-semibold"
                  disabled={!canEditIncident}
                />
              ) : (
                <span className="text-lg font-semibold">{editData.title}</span>
              )}
            </DialogTitle>
            {canEditIncident && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isUpdating}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                 <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isUpdating || isSending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Incident Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Incident Information Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Incident Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Category:</span>
                   {canEditIncident ? (
                    <Select value={editData.category} onValueChange={(value) => setEditData({...editData, category: value as any})}>
                      <SelectTrigger className="h-8 w-auto min-w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getCategoryColor(incident.category)}>
                      {formatDisplayText(incident.category)}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Priority:</span>
                   {canEditIncident ? (
                    <Select value={editData.priority} onValueChange={(value) => setEditData({...editData, priority: value})}>
                      <SelectTrigger className="h-8 w-auto min-w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline">
                      {formatDisplayText(incident.priority)}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Status:</span>
                   {canEditIncident ? (
                    <Select value={editData.status} onValueChange={(value) => setEditData({...editData, status: value})}>
                      <SelectTrigger className="h-8 w-auto min-w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getStatusColor(incident.status)}>
                      {formatDisplayText(incident.status)}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Assignment Details Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Assignment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Submitted By:</span>
                  <span className="text-sm font-medium">
                    {incident.submitted_by_profile 
                      ? `${incident.submitted_by_profile.first_name} ${incident.submitted_by_profile.last_name}`
                      : 'Unknown'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Assigned To:</span>
                  {canEditIncident && canAssign ? (
                    <Select value={editData.assigned_to} onValueChange={(value) => setEditData({...editData, assigned_to: value})}>
                      <SelectTrigger className="h-8 w-auto min-w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name} {user.last_name} ({user.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm font-medium">
                      {incident.assigned_to_profile 
                        ? `${incident.assigned_to_profile.first_name} ${incident.assigned_to_profile.last_name}`
                        : 'Unassigned'
                      }
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm font-medium">
                    {new Date(incident.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Last Updated:</span>
                  <span className="text-sm font-medium">
                    {new Date(incident.updated_at).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notifications Section */}
          {canEditIncident && incident.submitted_by_profile?.email && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="send-notification"
                    checked={sendNotificationChecked}
                    onCheckedChange={(checked) => {
                      setSendNotificationChecked(checked as boolean);
                      if (!checked) {
                        setSelectedTemplate('');
                      }
                    }}
                  />
                  <label
                    htmlFor="send-notification"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Send notification to submitter ({incident.submitted_by_profile.email})
                  </label>
                </div>
                
                {sendNotificationChecked && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Notification Template
                    </label>
                    <Select 
                      value={selectedTemplate} 
                      onValueChange={setSelectedTemplate}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a notification template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {templates.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No incident email templates available. Create one in Email Management first.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            {canEditIncident ? (
              <Textarea
                value={editData.description}
                onChange={(e) => setEditData({...editData, description: e.target.value})}
                rows={4}
                placeholder="Detailed description of what happened..."
              />
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {editData.description || 'No description'}
              </p>
            )}
          </div>

          {/* Comments Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                <h3 className="font-semibold">Comments ({comments.length})</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSortOrder}
                className="flex items-center gap-2"
              >
                {commentsSortOrder === 'asc' ? (
                  <>
                    <ArrowUp className="w-4 h-4" />
                    Old to New
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-4 h-4" />
                    New to Old
                  </>
                )}
              </Button>
            </div>

            {/* Add Comment */}
            <div className="space-y-2 mb-4">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isAddingComment}
                  size="sm"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Add Comment
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {sortedComments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-3 rounded-lg ${
                    comment.is_system_comment ? 'bg-blue-50 border-l-4 border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">
                      {comment.user_name || 'Unknown User'}
                      {comment.is_system_comment && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          System
                        </Badge>
                      )}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.comment_text}</p>
                </div>
              ))}
              {sortedComments.length === 0 && (
                <p className="text-center text-gray-500 py-4">No comments yet.</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};