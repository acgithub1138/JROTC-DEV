import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Edit, MessageSquare } from "lucide-react";
import { useIncidentComments } from "@/hooks/incidents/useIncidentComments";
import { useIncidentPermissions } from "@/hooks/useModuleSpecificPermissions";
import type { Incident } from "@/hooks/incidents/types";

interface IncidentDetailDialogProps {
  incident: Incident;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (incident: Incident) => void;
}

const getStatusBadgeClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open':
      return 'bg-blue-100 text-blue-800';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'resolved':
      return 'bg-green-100 text-green-800';
    case 'closed':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityBadgeClass = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'low':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'critical':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const IncidentDetailDialog: React.FC<IncidentDetailDialogProps> = ({
  incident,
  isOpen,
  onClose,
  onEdit,
}) => {
  const { comments, isLoading: commentsLoading } = useIncidentComments(incident.id);
  const { canUpdate } = useIncidentPermissions();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl">
            {incident.incident_number} - {incident.title}
          </DialogTitle>
          {canUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(incident)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Priority */}
          <div className="flex gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge className={getStatusBadgeClass(incident.status)}>
                  {incident.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Priority</label>
              <div className="mt-1">
                <Badge className={getPriorityBadgeClass(incident.priority)}>
                  {incident.priority}
                </Badge>
              </div>
            </div>
          </div>

          {/* Description */}
          {incident.description && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <div className="mt-1 p-3 bg-muted rounded-md">
                <p className="whitespace-pre-wrap">{incident.description}</p>
              </div>
            </div>
          )}

          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created By</label>
              <p className="mt-1">
                {(incident as any).created_by_profile
                  ? `${(incident as any).created_by_profile.first_name} ${(incident as any).created_by_profile.last_name}`
                  : 'Unknown'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">School</label>
              <p className="mt-1">{(incident as any).school?.name || 'Unknown'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <p className="mt-1">{format(new Date(incident.created_at), "PPpp")}</p>
            </div>
            {incident.due_date && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                <p className="mt-1">{format(new Date(incident.due_date), "PPP")}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Comments Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5" />
              <h3 className="text-lg font-medium">Comments</h3>
              <span className="text-sm text-muted-foreground">
                ({comments.length})
              </span>
            </div>

            {commentsLoading ? (
              <p className="text-muted-foreground">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-muted-foreground">No comments yet.</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {(comment as any).user
                            ? `${(comment as any).user.first_name} ${(comment as any).user.last_name}`
                            : 'Unknown User'}
                        </span>
                        {comment.is_system_comment && (
                          <Badge variant="secondary" className="text-xs">
                            System
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{comment.comment_text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IncidentDetailDialog;