import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Edit, MessageSquare, Send } from 'lucide-react';
import { Incident } from '@/hooks/incidents/useIncidents';
import { useIncidentComments } from '@/hooks/incidents/useIncidentComments';
import { useAuth } from '@/contexts/AuthContext';

interface IncidentDetailDialogProps {
  incident: Incident;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (incident: Incident) => void;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'technical': return 'bg-blue-100 text-blue-800';
    case 'behavioral': return 'bg-purple-100 text-purple-800';
    case 'safety': return 'bg-red-100 text-red-800';
    case 'other': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const IncidentDetailDialog: React.FC<IncidentDetailDialogProps> = ({
  incident,
  open,
  onOpenChange,
  onEdit,
}) => {
  const { userProfile } = useAuth();
  const { comments, addComment, isAddingComment } = useIncidentComments(incident.id);
  const [newComment, setNewComment] = useState('');

  const isAdmin = userProfile?.role === 'admin';
  const canEditIncident = isAdmin || incident.submitted_by === userProfile?.id;

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
              {incident.incident_number} - {incident.title}
            </DialogTitle>
            {canEditIncident && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(incident)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Incident Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Category</h3>
              <Badge variant="secondary" className={getCategoryColor(incident.category)}>
                {incident.category.charAt(0).toUpperCase() + incident.category.slice(1)}
              </Badge>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Severity</h3>
              <Badge variant="secondary" className={getSeverityColor(incident.severity)}>
                {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
              </Badge>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Status</h3>
              <Badge variant="outline">
                {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
              </Badge>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Priority</h3>
              <Badge variant="outline">
                {incident.priority.charAt(0).toUpperCase() + incident.priority.slice(1)}
              </Badge>
            </div>
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
              <p className="text-sm">
                {incident.assigned_to_profile 
                  ? `${incident.assigned_to_profile.first_name} ${incident.assigned_to_profile.last_name}`
                  : 'Unassigned'
                }
              </p>
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
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {incident.description || 'No description provided.'}
            </p>
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