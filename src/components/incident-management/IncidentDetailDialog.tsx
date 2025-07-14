import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useIncidentStatusOptions, useIncidentPriorityOptions, useIncidentCategoryOptions } from "@/hooks/incidents/useIncidentsQuery";
import { useIncidentPermissions } from "@/hooks/useModuleSpecificPermissions";
import { useSchoolUsers } from "@/hooks/useSchoolUsers";
import { useAuth } from "@/contexts/AuthContext";
import { useEmailTemplates } from "@/hooks/email/useEmailTemplates";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Incident } from "@/hooks/incidents/types";

interface IncidentDetailDialogProps {
  incident: Incident;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (incident: Incident) => void;
  readOnly?: boolean;
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

const IncidentDetailDialog: React.FC<IncidentDetailDialogProps> = ({
  incident,
  isOpen,
  onClose,
  onEdit,
  readOnly = false,
}) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const { updateIncident, incidents } = useIncidents();
  const { users, isLoading: usersLoading } = useSchoolUsers();
  const { comments, isLoading: commentsLoading, addComment, addSystemComment } = useIncidentComments(incident.id);
  const { data: statusOptions = [] } = useIncidentStatusOptions();
  const { data: priorityOptions = [] } = useIncidentPriorityOptions();
  const { data: categoryOptions = [] } = useIncidentCategoryOptions();
  const { canUpdate, canAssign, canUpdateAssigned } = useIncidentPermissions();
  const [currentIncident, setCurrentIncident] = useState(incident);
  const [isEditing, setIsEditing] = useState(!readOnly); // Start in edit mode unless read-only
  const [editData, setEditData] = useState({
    title: incident.title,
    description: incident.description || '',
    status: incident.status,
    priority: incident.priority,
    category: incident.category,
    assigned_to_admin: incident.assigned_to_admin || 'unassigned',
    due_date: incident.due_date ? new Date(incident.due_date) : null,
  });
  
  // Email notification state
  const [sendNotification, setSendNotification] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const { templates } = useEmailTemplates();

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Filter templates for incidents table
  const incidentTemplates = templates.filter(template => template.source_table === 'incidents' && template.is_active);

  // Determine if user can edit this incident
  const isAssignedToIncident = currentIncident.assigned_to_admin === userProfile?.id;
  const canEditIncident = !readOnly && (canUpdate || (canUpdateAssigned && isAssignedToIncident));

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
      category: incidentToUse.category,
      assigned_to_admin: incidentToUse.assigned_to_admin || 'unassigned',
      due_date: incidentToUse.due_date ? new Date(incidentToUse.due_date) : null,
    });
  }, [incident, incidents]);

  const hasChanges = () => {
    return editData.title !== currentIncident.title ||
           editData.description !== (currentIncident.description || '') ||
           editData.status !== currentIncident.status ||
           editData.priority !== currentIncident.priority ||
           editData.category !== currentIncident.category ||
           (editData.assigned_to_admin === 'unassigned' ? null : editData.assigned_to_admin) !== currentIncident.assigned_to_admin ||
           (editData.due_date?.getTime() !== (currentIncident.due_date ? new Date(currentIncident.due_date).getTime() : null));
  };

  const sendNotificationEmail = async () => {
    if (!sendNotification || !selectedTemplate || !currentIncident.created_by) {
      console.log('Notification requirements not met:', {
        sendNotification,
        selectedTemplate,
        createdBy: currentIncident.created_by
      });
      return;
    }

    try {
      // Find the user who created the incident
      let createdByUser: { id: string; first_name: string; last_name: string; email: string } | undefined = users.find(u => u.id === currentIncident.created_by);
      
      // If user not found in school users (could be from different school), fetch directly
      if (!createdByUser) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .eq('id', currentIncident.created_by)
          .single();
          
        if (userError || !userData) {
          console.error('Error fetching user data:', userError);
          toast({
            title: "Error",
            description: "Could not find the incident creator's information.",
            variant: "destructive",
          });
          return;
        }
        
        createdByUser = userData as { id: string; first_name: string; last_name: string; email: string };
      }
      
      if (!createdByUser?.email) {
        toast({
          title: "Error", 
          description: "No email address found for the incident creator.",
          variant: "destructive",
        });
        return;
      }

      // Use the queue_email RPC function instead of manual processing
      const { data: queueId, error } = await supabase.rpc('queue_email', {
        template_id_param: selectedTemplate,
        recipient_email_param: createdByUser.email,
        source_table_param: 'incidents',
        record_id_param: currentIncident.id,
        school_id_param: currentIncident.school_id
      });

      if (error) {
        console.error('Error queuing notification email:', error);
        toast({
          title: "Error",
          description: "Failed to queue notification email.",
          variant: "destructive",
        });
        throw error;
      } else {
        addSystemComment.mutate(`Email sent to ${createdByUser.email} [Preview Email](${queueId})`);
        toast({
          title: "Success",
          description: `Notification sent to ${createdByUser.email}`,
        });
      }
    } catch (emailError) {
      console.error('Error sending notification:', emailError);
      toast({
        title: "Error",
        description: "Failed to send notification email.",
        variant: "destructive",
      });
      throw emailError;
    }
  };

  const handleSave = async () => {
    try {
      // Validate notification requirements
      if (sendNotification && !selectedTemplate) {
        toast({
          title: "Error",
          description: "Please select an email template to send notification.",
          variant: "destructive",
        });
        return;
      }

      const changesExist = hasChanges();
      
      // If no changes and no notification, just close the modal
      if (!changesExist && !sendNotification) {
        onClose();
        return;
      }

      // Update incident if there are changes
      if (changesExist) {
        const updateData: any = {};
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
          
          // Auto-set completed_at when status changes to "resolved"
          if (editData.status === 'resolved' && !currentIncident.completed_at) {
            updateData.completed_at = new Date().toISOString();
          }
          
          // Clear completed_at when status changes from resolved/canceled to another status
          if ((currentIncident.status === 'resolved' || currentIncident.status === 'canceled') && 
              editData.status !== 'resolved' && editData.status !== 'canceled') {
            updateData.completed_at = null;
          }
        }
        
        if (editData.priority !== currentIncident.priority) {
          updateData.priority = editData.priority;
          changes.push({ field: 'priority', oldValue: currentIncident.priority, newValue: editData.priority });
        }
        
        if (editData.category !== currentIncident.category) {
          updateData.category = editData.category;
          changes.push({ field: 'category', oldValue: currentIncident.category, newValue: editData.category });
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
            categoryOptions,
            users
          );
          addSystemComment.mutate(commentText);
        }

        // Update currentIncident with the new data for the notification
        setCurrentIncident(prev => ({ ...prev, ...updateData }));
      }
      
      // Send notification email if requested
      if (sendNotification) {
        await sendNotificationEmail();
      }
      
      // Close the modal after successful operations
      onClose();
    } catch (error) {
      console.error('Error in handleSave:', error);
      // Don't close the modal if there was an error
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
      category: currentIncident.category,
      assigned_to_admin: currentIncident.assigned_to_admin || 'unassigned',
      due_date: currentIncident.due_date ? new Date(currentIncident.due_date) : null,
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleClose = () => {
    // Check if there are unsaved changes when in edit mode
    if (isEditing && hasChanges()) {
      setShowConfirmDialog(true);
      return;
    }
    
    setIsEditing(false);
    onClose();
  };

  const confirmClose = () => {
    setShowConfirmDialog(false);
    setIsEditing(false);
    onClose();
  };

  const handleSaveAndClose = async () => {
    setShowConfirmDialog(false);
    await handleSave();
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
  const currentCategoryOption = categoryOptions.find(option => option.value === editData.category);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl flex items-center">
              {currentIncident.incident_number && (
                <span className="text-blue-600 font-mono text-xl mr-2">
                  {currentIncident.incident_number}
                </span>
              )}
              {isEditing && canEditIncident ? (
                <Input
                  value={editData.title}
                  onChange={(e) => setEditData({...editData, title: e.target.value})}
                  className="text-2xl border-none p-0 h-auto bg-transparent focus-visible:ring-0"
                />
              ) : (
                <span className="text-2xl mb-2">{currentIncident.title}</span>
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
              {!isEditing && !readOnly && canEditIncident && (
                <Button size="sm" onClick={handleEdit}>
                  Edit
                </Button>
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
                  <AlertTriangle className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Category:</span>
                  {isEditing && canEditIncident ? (
                    <Select value={editData.category} onValueChange={(value) => setEditData({...editData, category: value})}>
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
                    <Badge className={getCategoryBadgeClass(currentIncident.category)}>
                      {currentCategoryOption?.label || currentIncident.category}
                    </Badge>
                  )}
                </div>
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
                
                {/* Send Notification - Only show in edit mode */}
                {isEditing && canEditIncident && incidentTemplates.length > 0 && (
                  <div className="space-y-3 pt-3 border-t">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="send-notification" 
                          checked={sendNotification}
                          onCheckedChange={(checked) => {
                            setSendNotification(checked as boolean);
                            if (!checked) setSelectedTemplate('');
                          }}
                        />
                        <label 
                          htmlFor="send-notification"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Send Notification
                        </label>
                      </div>
                      {sendNotification && (
                        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Select email template" />
                          </SelectTrigger>
                          <SelectContent>
                            {incidentTemplates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                )}
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

    {/* Confirmation Dialog for Unsaved Changes */}
    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. What would you like to do?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
            Stay on Form
          </AlertDialogCancel>
          <Button variant="outline" onClick={confirmClose}>
            Close without Saving
          </Button>
          <AlertDialogAction onClick={handleSaveAndClose}>
            Save Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default IncidentDetailDialog;