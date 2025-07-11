import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Flag, User, MessageSquare } from "lucide-react";
import { IncidentCommentsSection } from "./components/IncidentCommentsSection";
import { useIncidentComments } from "@/hooks/incidents/useIncidentComments";
import { useIncidents } from "@/hooks/incidents/useIncidents";
import { useIncidentStatusOptions, useIncidentPriorityOptions } from "@/hooks/incidents/useIncidentsQuery";
import type { Incident } from "@/hooks/incidents/types";

interface IncidentDetailDialogReadonlyProps {
  incident: Incident;
  isOpen: boolean;
  onClose: () => void;
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

const IncidentDetailDialog_Readonly: React.FC<IncidentDetailDialogReadonlyProps> = ({
  incident,
  isOpen,
  onClose,
}) => {
  const { incidents } = useIncidents();
  const { comments, addComment } = useIncidentComments(incident.id);
  const { data: statusOptions = [] } = useIncidentStatusOptions();
  const { data: priorityOptions = [] } = useIncidentPriorityOptions();
  const [currentIncident, setCurrentIncident] = useState(incident);

  // Update currentIncident when the incident prop changes
  useEffect(() => {
    const updatedIncident = incidents.find(i => i.id === incident.id);
    const incidentToUse = updatedIncident || incident;
    setCurrentIncident(incidentToUse);
  }, [incident, incidents]);

  const currentStatusOption = statusOptions.find(option => option.value === currentIncident.status);
  const currentPriorityOption = priorityOptions.find(option => option.value === currentIncident.priority);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              {currentIncident.incident_number && (
                <span className="text-blue-600 font-mono mr-2">
                  {currentIncident.incident_number} -
                </span>
              )}
              <span className="text-lg font-semibold">{currentIncident.title}</span>
            </DialogTitle>
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
                  <span className="text-sm text-gray-600">Priority:</span>
                  <Badge className={getPriorityBadgeClass(currentIncident.priority)}>
                    {currentPriorityOption?.label || currentIncident.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge className={getStatusBadgeClass(currentIncident.status)}>
                    {currentStatusOption?.label || currentIncident.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Due Date:</span>
                  <span className="text-sm font-medium">
                    {currentIncident.due_date ? format(new Date(currentIncident.due_date), 'PPP') : 'No due date'}
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
                    {(currentIncident as any).assigned_admin_profile 
                      ? `${(currentIncident as any).assigned_admin_profile.last_name}, ${(currentIncident as any).assigned_admin_profile.first_name}` 
                      : 'Unassigned'}
                  </span>
                </div>
                {(currentIncident as any).created_by_profile && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Created by:</span>
                    <span className="text-sm font-medium">
                      {(currentIncident as any).created_by_profile.last_name}, {(currentIncident as any).created_by_profile.first_name}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm font-medium">
                    {format(new Date(currentIncident.created_at), 'PPP')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {currentIncident.description || 'No description'}
            </p>
          </div>

          <Separator />

          {/* Comments Section - Read-only */}
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

export default IncidentDetailDialog_Readonly;