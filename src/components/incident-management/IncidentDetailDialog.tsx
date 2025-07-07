import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, MessageSquare, Send, Save, X } from 'lucide-react';
import { Incident, useIncidents } from '@/hooks/incidents/useIncidents';
import { useIncidentComments } from '@/hooks/incidents/useIncidentComments';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';

interface IncidentDetailDialogProps {
  incident: Incident;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const severityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const statusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const categoryOptions = [
  { value: 'technical', label: 'Technical' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'safety', label: 'Safety' },
  { value: 'other', label: 'Other' },
];

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

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
  
  const [newComment, setNewComment] = useState('');
  const [editData, setEditData] = useState({
    title: incident.title,
    description: incident.description || '',
    status: incident.status,
    priority: incident.priority,
    severity: incident.severity,
    category: incident.category,
    assigned_to: incident.assigned_to || 'unassigned',
  });

  const isAdmin = userProfile?.role === 'admin';
  const isInstructor = userProfile?.role === 'instructor' || userProfile?.role === 'command_staff';
  const canEditIncident = isAdmin || isInstructor || incident.submitted_by === userProfile?.id;
  const canEditCategorySeverity = isAdmin; // Only admins can edit category/severity

  const handleSave = async () => {
    try {
      await updateIncident({
        id: incident.id,
        title: editData.title,
        description: editData.description || null,
        status: editData.status,
        priority: editData.priority,
        severity: editData.severity,
        category: editData.category,
        assigned_to: editData.assigned_to === 'unassigned' ? null : editData.assigned_to,
      });
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
      severity: incident.severity,
      category: incident.category,
      assigned_to: incident.assigned_to || 'unassigned',
    });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              <Input
                value={editData.title}
                onChange={(e) => setEditData({...editData, title: e.target.value})}
                className="text-lg font-semibold"
              />
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
                  disabled={isUpdating}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Incident Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Category</h3>
              {canEditCategorySeverity ? (
                <Select value={editData.category} onValueChange={(value) => setEditData({...editData, category: value as any})}>
                  <SelectTrigger>
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
            <div>
              <h3 className="font-semibold mb-2">Severity</h3>
              {canEditCategorySeverity ? (
                <Select value={editData.severity} onValueChange={(value) => setEditData({...editData, severity: value as any})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {severityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={getSeverityColor(incident.severity)}>
                  {formatDisplayText(incident.severity)}
                </Badge>
              )}
            </div>
            {isAdmin && (
              <>
                <div>
                  <h3 className="font-semibold mb-2">Status</h3>
                  <Select value={editData.status} onValueChange={(value) => setEditData({...editData, status: value})}>
                    <SelectTrigger>
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
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Priority</h3>
                  <Select value={editData.priority} onValueChange={(value) => setEditData({...editData, priority: value})}>
                    <SelectTrigger>
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
                </div>
              </>
            )}
            {!isAdmin && (
              <>
                <div>
                  <h3 className="font-semibold mb-2">Status</h3>
                  <Badge className={getStatusColor(incident.status)}>
                    {formatDisplayText(incident.status)}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Priority</h3>
                  <Badge variant="outline">
                    {formatDisplayText(incident.priority)}
                  </Badge>
                </div>
              </>
            )}
            <div>
              <h3 className="font-semibold mb-2">Submitted By</h3>
              <p className="text-sm">
                {incident.submitted_by_profile 
                  ? `${incident.submitted_by_profile.first_name} ${incident.submitted_by_profile.last_name}`
                  : 'Unknown'
                }
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Assigned To</h3>
              {isAdmin ? (
                <Select value={editData.assigned_to} onValueChange={(value) => setEditData({...editData, assigned_to: value})}>
                  <SelectTrigger>
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
                <p className="text-sm">
                  {incident.assigned_to_profile 
                    ? `${incident.assigned_to_profile.first_name} ${incident.assigned_to_profile.last_name}`
                    : 'Unassigned'
                  }
                </p>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-2">Created</h3>
              <p className="text-sm">{new Date(incident.created_at).toLocaleString()}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Last Updated</h3>
              <p className="text-sm">{new Date(incident.updated_at).toLocaleString()}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <Textarea
              value={editData.description}
              onChange={(e) => setEditData({...editData, description: e.target.value})}
              rows={4}
              placeholder="Detailed description of what happened..."
            />
          </div>

          {/* Comments Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5" />
              <h3 className="font-semibold">Comments ({comments.length})</h3>
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
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-3 rounded-lg ${
                    comment.is_system_comment ? 'bg-blue-50 border-l-4 border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">
                      {comment.user_profile.first_name} {comment.user_profile.last_name}
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
              {comments.length === 0 && (
                <p className="text-center text-gray-500 py-4">No comments yet.</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};