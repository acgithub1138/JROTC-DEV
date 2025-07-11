import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Save, X, Calendar as CalendarIcon, Flag, User, MessageSquare, AlertTriangle } from "lucide-react";
import { IncidentCommentsSection } from "./components/IncidentCommentsSection";
import { formatIncidentFieldChangeComment } from "@/utils/incidentCommentUtils";
import { useIncidentComments } from "@/hooks/incidents/useIncidentComments";
import { useIncidents } from "@/hooks/incidents/useIncidents";
import { useIncidentStatusOptions, useIncidentPriorityOptions } from "@/hooks/incidents/useIncidentsQuery";
import { useIncidentPermissions } from "@/hooks/useModuleSpecificPermissions";
import { useSchoolUsers } from "@/hooks/useSchoolUsers";
import { useAuth } from "@/contexts/AuthContext";
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
  const { userProfile } = useAuth();
  const { updateIncident, incidents } = useIncidents();
  const { users, isLoading: usersLoading } = useSchoolUsers();
  const { comments, isLoading: commentsLoading, addComment, addSystemComment } = useIncidentComments(incident.id);
  const { data: statusOptions = [] } = useIncidentStatusOptions();
  const { data: priorityOptions = [] } = useIncidentPriorityOptions();
  const { canUpdate, canAssign, canUpdateAssigned } = useIncidentPermissions();
  const [currentIncident, setCurrentIncident] = useState(incident);
  const [isEditing, setIsEditing] = useState(true); // Always start in edit mode
  const [editData, setEditData] = useState({
    title: incident.title,
    description: incident.description || '',
    status: incident.status,
    priority: incident.priority,
    assigned_to_admin: incident.assigned_to_admin || 'unassigned',
    due_date: incident.due_date ? new Date(incident.due_date) : null,
  });

  // Determine if user can edit this incident
  const isAssignedToIncident = currentIncident.assigned_to_admin === userProfile?.id;
  const canEditIncident = canUpdate || (canUpdateAssigned && isAssignedToIncident);

  // Update currentIncident and editData when the incident prop changes
  useEffect(() => {
    const updatedIncident = incidents.find(i => i.id === incident.id);
    const incidentToUse = updatedIncident || incident;
    setCurrentIncident(incidentToUse);
    setEditData({
      title: incidentToUse.title,
      description: incidentToUse.description || '',
      status: incidentToUse.status,
      priority: incidentToUse.priority,
      assigned_to_admin: incidentToUse.assigned_to_admin || 'unassigned',
      due_date: incidentToUse.due_date ? new Date(incidentToUse.due_date) : null,
    });
  }, [incident, incidents]);

  const handleSave = async () => {
    try {
      const updateData: any = {};
      const trackedFields = ['title', 'status', 'priority', 'assigned_to_admin', 'due_date', 'description'];
      
      // Track changes for system comments
      const changes: Array<{field: string, oldValue: any, newValue: any}> = [];
      
      if (editData.title !== currentIncident.title) {
        updateData.title = editData.title;
        changes.push({ field: 'title', oldValue: currentIncident.title, newValue: editData.title });
      }
      
      if (editData.description !== (currentIncident.description || '')) {
        updateData.description = editData.description || null;
        changes.push({ field: 'description', oldValue: currentIncident.description || '', newValue: editData.description || '' });
      }
      
      if (editData.status !== currentIncident.status) {
        updateData.status = editData.status;
        changes.push({ field: 'status', oldValue: currentIncident.status, newValue: editData.status });
      }
      
      if (editData.priority !== currentIncident.priority) {
        updateData.priority = editData.priority;
        changes.push({ field: 'priority', oldValue: currentIncident.priority, newValue: editData.priority });
      }
      
      const newAssignedTo = editData.assigned_to_admin === 'unassigned' ? null : editData.assigned_to_admin;
      if (newAssignedTo !== currentIncident.assigned_to_admin) {
        updateData.assigned_to_admin = newAssignedTo;
        changes.push({ field: 'assigned_to_admin', oldValue: currentIncident.assigned_to_admin, newValue: newAssignedTo });
      }
      
      const oldDueDate = currentIncident.due_date ? new Date(currentIncident.due_date) : null;
      const newDueDate = editData.due_date;
      const dueDatesAreDifferent = (oldDueDate && newDueDate && oldDueDate.getTime() !== newDueDate.getTime()) ||
                                   (!oldDueDate && newDueDate) ||
                                   (oldDueDate && !newDueDate);
      
      if (dueDatesAreDifferent) {
        updateData.due_date = newDueDate ? newDueDate.toISOString() : null;
        changes.push({ field: 'due_date', oldValue: oldDueDate, newValue: newDueDate });
      }

      // Update the incident
      await updateIncident.mutateAsync({ id: currentIncident.id, data: updateData });
      
      // Add system comments for tracked changes
      for (const change of changes) {
        const commentText = formatIncidentFieldChangeComment(
          change.field,
          change.oldValue,
          change.newValue,
          statusOptions,
          priorityOptions,
          users
        );
        addSystemComment.mutate(commentText);
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating incident:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset edit data to current incident values
    setEditData({
      title: currentIncident.title,
      description: currentIncident.description || '',
      status: currentIncident.status,
      priority: currentIncident.priority,
      assigned_to_admin: currentIncident.assigned_to_admin || 'unassigned',
      due_date: currentIncident.due_date ? new Date(currentIncident.due_date) : null,
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  const adminOptions = [
    { value: 'unassigned', label: 'Unassigned' },
    ...users.filter(user => user.role === 'admin').map(user => ({
      value: user.id,
      label: `${user.last_name}, ${user.first_name}`
    }))
  ];

  const currentStatusOption = statusOptions.find(option => option.value === editData.status);
  const currentPriorityOption = priorityOptions.find(option => option.value === editData.priority);

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
              {isEditing && canEditIncident ? (
                <Input
                  value={editData.title}
                  onChange={(e) => setEditData({...editData, title: e.target.value})}
                  className="text-lg font-semibold border-none p-0 h-auto bg-transparent focus-visible:ring-0"
                />
              ) : (
                <span className="text-lg font-semibold">{currentIncident.title}</span>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {isEditing && canEditIncident && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={updateIncident.isPending}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateIncident.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </>
              )}
            </div>
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
                  {isEditing && canEditIncident ? (
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
                    <Badge className={getPriorityBadgeClass(currentIncident.priority)}>
                      {currentPriorityOption?.label || currentIncident.priority}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Status:</span>
                  {isEditing && canEditIncident ? (
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
                    <Badge className={getStatusBadgeClass(currentIncident.status)}>
                      {currentStatusOption?.label || currentIncident.status.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Due Date:</span>
                  {isEditing && canEditIncident ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-8 text-left">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editData.due_date ? format(editData.due_date, 'PPP') : 'Set date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={editData.due_date}
                          onSelect={(date) => setEditData({...editData, due_date: date})}
                          disabled={(date) => {
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            tomorrow.setHours(0, 0, 0, 0);
                            return date < tomorrow;
                          }}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <span className="text-sm font-medium">
                      {currentIncident.due_date ? format(new Date(currentIncident.due_date), 'PPP') : 'No due date'}
                    </span>
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
                  <span className="text-sm text-gray-600">Assigned to:</span>
                  {isEditing && canUpdate && canAssign ? (
                    usersLoading ? (
                      <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                    ) : (
                      <Select value={editData.assigned_to_admin} onValueChange={(value) => setEditData({...editData, assigned_to_admin: value})}>
                        <SelectTrigger className="h-8 w-auto min-w-[120px]">
                          <SelectValue placeholder={usersLoading ? "Loading..." : "Select admin"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {users.filter(user => user.role === 'admin').map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.last_name}, {user.first_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )
                  ) : (
                    <span className="text-sm font-medium">
                      {(currentIncident as any).assigned_admin_profile 
                        ? `${(currentIncident as any).assigned_admin_profile.last_name}, ${(currentIncident as any).assigned_admin_profile.first_name}` 
                        : 'Unassigned'}
                    </span>
                  )}
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
            {isEditing && canEditIncident ? (
              <Textarea
                value={editData.description}
                onChange={(e) => setEditData({...editData, description: e.target.value})}
                rows={4}
                placeholder="Detailed description of the incident..."
              />
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {currentIncident.description || 'No description'}
              </p>
            )}
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

export default IncidentDetailDialog;