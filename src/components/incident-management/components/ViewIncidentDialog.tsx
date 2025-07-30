import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { CalendarIcon, User, Flag, AlertTriangle } from "lucide-react";
import { IncidentCommentsSection } from "./IncidentCommentsSection";
import { useIncidentComments } from "@/hooks/incidents/useIncidentComments";
import { useIncidentPermissions } from "@/hooks/useModuleSpecificPermissions";
import { useAuth } from "@/contexts/AuthContext";
import type { Incident } from "@/hooks/incidents/types";

interface ViewIncidentDialogProps {
  incident: Incident;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (incident: Incident) => void;
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

const getCategoryBadgeClass = (category: string) => {
  switch (category.toLowerCase()) {
    case 'issue':
      return 'bg-red-100 text-red-800';
    case 'request':
      return 'bg-blue-100 text-blue-800';
    case 'enhancement':
      return 'bg-green-100 text-green-800';
    case 'maintenance':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const ViewIncidentDialog: React.FC<ViewIncidentDialogProps> = ({
  incident,
  isOpen,
  onClose,
  onEdit,
}) => {
  const { userProfile } = useAuth();
  const { canUpdate } = useIncidentPermissions();
  const { comments, addComment } = useIncidentComments(incident.id);

  const handleEdit = () => {
    onEdit?.(incident);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl flex items-center">
              {incident.incident_number && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono mr-3">
                  #{incident.incident_number}
                </span>
              )}
              {incident.title}
            </DialogTitle>
            <div className="flex gap-2">
              {canUpdate && (
                <Button onClick={handleEdit}>
                  Edit
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Incident Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status and Priority Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Status & Priority</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge variant="secondary" className={getStatusBadgeClass(incident.status)}>
                    {incident.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Priority:</span>
                  <Badge variant="secondary" className={getPriorityBadgeClass(incident.priority)}>
                    {incident.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Category:</span>
                  <Badge variant="secondary" className={getCategoryBadgeClass(incident.category)}>
                    {incident.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Due Date:</span>
                  <span className="text-sm font-medium">
                    {incident.due_date ? format(new Date(incident.due_date), 'PPP') : 'No due date'}
                  </span>
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
                  <span className="text-sm text-gray-600">Assigned to:</span>
                  <span className="text-sm font-medium">
                    {(incident as any).assigned_admin_profile 
                      ? `${(incident as any).assigned_admin_profile.last_name}, ${(incident as any).assigned_admin_profile.first_name}` 
                      : 'Unassigned'}
                  </span>
                </div>
                {(incident as any).created_by_profile && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Created by:</span>
                    <span className="text-sm font-medium">
                      {(incident as any).created_by_profile.last_name}, {(incident as any).created_by_profile.first_name}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm font-medium">
                    {format(new Date(incident.created_at), 'PPP')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {incident.description || 'No description'}
            </p>
          </div>

          <Separator />

          {/* Comments Section */}
          <IncidentCommentsSection
            comments={comments}
            isAddingComment={addComment.isPending}
            onAddComment={(comment) => addComment.mutate({ comment_text: comment })}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewIncidentDialog;