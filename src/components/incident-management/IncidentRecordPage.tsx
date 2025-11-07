import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Flag, User, Calendar, AlertTriangle, Save, X, Edit, Check, MessageSquare, ArrowUpDown, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { IncidentCommentsSection } from './components/IncidentCommentsSection';
import { IncidentFormContent } from './forms/IncidentFormContent';
import { EditableIncidentField } from './components/EditableIncidentField';
import { IncidentAttachmentSection } from './components/IncidentAttachmentSection';
import { EmailViewDialog } from '@/components/email-management/dialogs/EmailViewDialog';
import { useIncidents } from '@/hooks/incidents/useIncidents';
import { useIncidentMutations } from '@/hooks/incidents/useIncidentMutations';
import { useIncidentComments } from '@/hooks/incidents/useIncidentComments';
import { useIncidentPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEmailQueue } from '@/hooks/email/useEmailQueue';
import { useIncidentPriorityOptions, useIncidentCategoryOptions, useIncidentStatusOptions } from '@/hooks/incidents/useIncidentsQuery';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import type { Incident } from '@/hooks/incidents/types';
import { useIsMobile } from '@/hooks/use-mobile';
type IncidentRecordMode = 'create' | 'edit' | 'view';
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
export const IncidentRecordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const {
    toast
  } = useToast();
  const {
    userProfile
  } = useAuth();

  // Extract parameters from URL
  const mode = searchParams.get('mode') as IncidentRecordMode || 'view';
  const incidentId = searchParams.get('id');

  // Permissions
  const {
    canCreate,
    canUpdate,
    canUpdateAssigned,
    canView
  } = useIncidentPermissions();

  // Data
  const {
    incidents,
    isLoading: incidentsLoading
  } = useIncidents();
  const { updateIncident } = useIncidentMutations();
  const incident = incidents.find(i => i.id === incidentId);
  const {
    data: statusOptions = []
  } = useIncidentStatusOptions();
  const {
    data: priorityOptions = []
  } = useIncidentPriorityOptions();
  const {
    data: categoryOptions = []
  } = useIncidentCategoryOptions();
  const {
    users: allUsers
  } = useSchoolUsers();
  
  // Get active users for incident assignment (don't filter by grade)
  const activeUsers = allUsers.filter(user => user.active);

  // Local state - all hooks must be at top level
  const [currentMode, setCurrentMode] = useState<IncidentRecordMode>(mode);
  const [editedIncident, setEditedIncident] = useState<any>(incident || {});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sortCommentsNewestFirst, setSortCommentsNewestFirst] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  // Email queue for email history
  const {
    queueItems
  } = useEmailQueue();

  // Comments (only if incident exists)
  const {
    comments,
    isLoading: commentsLoading,
    addComment,
    addSystemComment
  } = useIncidentComments(incident?.id || '');

  // Update currentMode when URL mode changes
  React.useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  // Update edited incident when incident changes
  useEffect(() => {
    if (incident) {
      setEditedIncident(incident);
    }
  }, [incident]);

  // Handle incident field changes
  const handleIncidentFieldChange = (field: string, value: any) => {
    setEditedIncident(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!incident || !hasUnsavedChanges) return;
    
    try {
      setIsLoading(true);
      
      // Prepare update data with only the fields that can be updated
      const updateData = {
        title: editedIncident.title,
        description: editedIncident.description,
        status: editedIncident.status,
        priority: editedIncident.priority,
        category: editedIncident.category,
        assigned_to_admin: editedIncident.assigned_to_admin,
        due_date: editedIncident.due_date
      };
      
      // Filter out undefined values
      const filteredUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );
      
      // Generate change tracking comments
      const changes: string[] = [];
      
      // Helper functions to get display names
      const getStatusLabel = (value: string) => statusOptions.find(s => s.value === value)?.label || value;
      const getPriorityLabel = (value: string) => priorityOptions.find(p => p.value === value)?.label || value;
      const getCategoryLabel = (value: string) => categoryOptions.find(c => c.value === value)?.label || value;
      const getUserName = (userId: string | null) => {
        if (!userId) return 'Unassigned';
        const user = allUsers.find(u => u.id === userId);
        return user ? `${user.last_name}, ${user.first_name}` : 'Admin';
      };
      
      // Check each field for changes
      if (filteredUpdateData.title && filteredUpdateData.title !== incident.title) {
        changes.push(`Title changed from "${incident.title}" to "${filteredUpdateData.title}"`);
      }
      
      if (filteredUpdateData.description && filteredUpdateData.description !== incident.description) {
        const oldDesc = incident.description || 'No description';
        changes.push(`Description updated`);
      }
      
      if (filteredUpdateData.status && filteredUpdateData.status !== incident.status) {
        const oldStatus = getStatusLabel(incident.status);
        const newStatus = getStatusLabel(filteredUpdateData.status);
        changes.push(`Status changed from "${oldStatus}" to "${newStatus}"`);
      }
      
      if (filteredUpdateData.priority && filteredUpdateData.priority !== incident.priority) {
        const oldPriority = getPriorityLabel(incident.priority);
        const newPriority = getPriorityLabel(filteredUpdateData.priority);
        changes.push(`Priority changed from "${oldPriority}" to "${newPriority}"`);
      }
      
      if (filteredUpdateData.category && filteredUpdateData.category !== incident.category) {
        const oldCategory = getCategoryLabel(incident.category);
        const newCategory = getCategoryLabel(filteredUpdateData.category);
        changes.push(`Category changed from "${oldCategory}" to "${newCategory}"`);
      }
      
      if (filteredUpdateData.assigned_to_admin !== incident.assigned_to_admin) {
        const oldAssignee = getUserName(incident.assigned_to_admin);
        const newAssignee = getUserName(filteredUpdateData.assigned_to_admin || null);
        changes.push(`Assignment changed from "${oldAssignee}" to "${newAssignee}"`);
      }
      
      if (filteredUpdateData.due_date && filteredUpdateData.due_date !== incident.due_date) {
        const oldDate = incident.due_date ? format(new Date(incident.due_date), 'MM/dd/yyyy') : 'No due date';
        const newDate = format(new Date(filteredUpdateData.due_date), 'MM/dd/yyyy');
        changes.push(`Due date changed from "${oldDate}" to "${newDate}"`);
      }
      
      // Update the incident
      await updateIncident.mutateAsync({
        id: incident.id,
        data: filteredUpdateData
      });
      
      // Add system comment for changes if any were made
      if (changes.length > 0) {
        const changeMessage = changes.join('\n');
        await addSystemComment.mutateAsync(changeMessage);
      }
      
      setHasUnsavedChanges(false);
      setEditingSummary(false);
      setEditingDescription(false);
    } catch (error) {
      console.error('Failed to save incident changes:', error);
      // The error toast is already handled by the mutation
    } finally {
      setIsLoading(false);
    }
  };

  // Handle add comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setIsAddingComment(true);
    try {
      await addComment.mutateAsync({
        comment_text: newComment
      });
      setNewComment('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAddingComment(false);
    }
  };
  const handleEmailPreviewClick = (emailId: string) => {
    setSelectedEmailId(emailId);
    setShowEmailPreview(true);
  };

  // Get display info
  const getStatusInfo = () => {
    if (!incident) return null;
    return statusOptions.find(s => s.value === incident.status);
  };
  const getPriorityInfo = () => {
    if (!incident) return null;
    return priorityOptions.find(p => p.value === incident.priority);
  };
  const getCategoryInfo = () => {
    if (!incident) return null;
    return categoryOptions.find(c => c.value === incident.category);
  };

  // Check permissions for the current incident
  const isAssignedToIncident = incident?.assigned_to_admin === userProfile?.id;
  const canEditIncident = canUpdate || canUpdateAssigned && isAssignedToIncident;
  const getAssignedUserName = () => {
    if (!incident?.assigned_to_admin) return 'Unassigned';
    const user = allUsers.find(u => u.id === incident.assigned_to_admin);
    return user ? `${user.last_name}, ${user.first_name}` : 'Admin';
  };

  // Handle URL parameter changes
  useEffect(() => {
    if (currentMode === 'create' && !canCreate) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create incidents.",
        variant: "destructive"
      });
      navigate('/app/incidents');
      return;
    }
    if (incidentId && currentMode !== 'create') {
      if (!incident && !incidentsLoading) {
        toast({
          title: "Incident Not Found",
          description: "The incident you're looking for doesn't exist.",
          variant: "destructive"
        });
        navigate('/app/incidents');
        return;
      }
      if (incident && !canView) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this incident.",
          variant: "destructive"
        });
        navigate('/app/incidents');
        return;
      }
      if (currentMode === 'edit' && !canEditIncident) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to edit this incident.",
          variant: "destructive"
        });
        // Switch to view mode instead
        navigate(`/app/incidents/incident_record?mode=view&id=${incidentId}`);
        return;
      }
    }
  }, [currentMode, incidentId, incident, incidentsLoading, canCreate, canView, canEditIncident, navigate, toast]);
  const handleBack = () => {
    navigate('/app/incidents');
  };
  const handleModeChange = (newMode: IncidentRecordMode) => {
    if (newMode === 'create') {
      navigate('/app/incidents/incident_record?mode=create');
    } else if (incident?.id) {
      navigate(`/app/incidents/incident_record?mode=${newMode}&id=${incident.id}`);
    }
  };
  const handleIncidentCreated = (newIncident: Incident) => {
    navigate('/app/incidents');
  };
  const handleIncidentUpdated = (updatedIncident: Incident) => {
    navigate(`/app/incidents/incident_record?mode=view&id=${updatedIncident.id}`);
  };
  const handleCancel = () => {
    if (currentMode === 'create') {
      navigate('/app/incidents');
    } else if (incident?.id) {
      navigate(`/app/incidents/incident_record?mode=view&id=${incident.id}`);
    }
  };

  // Loading state
  if (incidentsLoading) {
    return <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Incidents
          </Button>
        </div>
        <div className="text-center py-8">Loading incident...</div>
      </div>;
  }

  // Create mode
  if (currentMode === 'create') {
    return <div className="p-6 space-y-6 max-h-screen overflow-y-auto">
        {isMobile && (
          <Button variant="ghost" size="sm" onClick={handleBack} className="w-fit mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center gap-2'}`}>
                {!isMobile && (
                  <Button variant="ghost" size="sm" onClick={handleBack} className="mr-auto">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Create New Incident
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IncidentFormContent mode="create" onSuccess={handleIncidentCreated} onCancel={handleCancel} showAttachments={false} />
            </CardContent>
          </Card>
        </div>
      </div>;
  }

  // Need incident for view/edit modes
  if (!incident) {
    return <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Incidents
          </Button>
        </div>
        <div className="text-center py-8">Incident not found</div>
      </div>;
  }

  // Edit mode
  if (currentMode === 'edit') {
    return <div className="p-6 space-y-6 max-h-screen overflow-y-auto">
        {isMobile && (
          <Button variant="ghost" size="sm" onClick={handleBack} className="w-fit mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center gap-2'}`}>
                {!isMobile && (
                  <Button variant="ghost" size="sm" onClick={handleBack} className="mr-auto">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Edit Incident - {incident.incident_number}
                </div>
                {!isMobile && (
                  <div className="text-sm text-muted-foreground ml-2">
                    {incident.incident_number} / Edit
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IncidentFormContent mode="edit" incident={incident} onSuccess={handleIncidentUpdated} onCancel={handleCancel} showAttachments={true} />
            </CardContent>
          </Card>
        </div>
      </div>;
  }

  // View mode (default) - using task-like layout
  return <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <Button variant="outline" onClick={handleBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Incidents
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {incident.incident_number && <span className="text-blue-600 font-mono mr-2">
                  {incident.incident_number} -
                </span>}
              {incident.title}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {canEditIncident && hasUnsavedChanges && <Button onClick={handleSaveChanges} disabled={isLoading || updateIncident.isPending} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {isLoading || updateIncident.isPending ? 'Saving...' : 'Save Changes'}
              </Button>}
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader className="py-[8px]">
              <CardTitle className="flex items-center justify-between">
                Summary
                {canEditIncident && <Button variant="ghost" size="sm" onClick={() => {
                if (!editingSummary && incident) {
                  setEditedIncident(incident);
                }
                setEditingSummary(!editingSummary);
              }}>
                    <Edit className="w-4 h-4" />
                  </Button>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Number</span>
                  <p className="font-medium">{incident.incident_number || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Status</span>
                  <div className="mt-1">
                    {editingSummary ? <Select value={editedIncident.status || ''} onValueChange={value => handleIncidentFieldChange('status', value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(option => <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>)}
                        </SelectContent>
                      </Select> : <Badge className={getStatusInfo()?.color_class || 'bg-gray-100 text-gray-800'}>
                        {getStatusInfo()?.label || incident.status}
                      </Badge>}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Assigned to</span>
                  {editingSummary ? <Select value={editedIncident.assigned_to_admin || 'unassigned'} onValueChange={value => handleIncidentFieldChange('assigned_to_admin', value === 'unassigned' ? null : value)}>
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {activeUsers.map(user => <SelectItem key={user.id} value={user.id}>
                            {user.last_name}, {user.first_name}
                          </SelectItem>)}
                      </SelectContent>
                    </Select> : <p className="font-medium">{getAssignedUserName()}</p>}
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Priority</span>
                  <div className="mt-1">
                    {editingSummary ? <Select value={editedIncident.priority || ''} onValueChange={value => handleIncidentFieldChange('priority', value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map(option => <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>)}
                        </SelectContent>
                      </Select> : <Badge className={getPriorityInfo()?.color_class || 'bg-gray-100 text-gray-800'}>
                        {getPriorityInfo()?.label || incident.priority}
                      </Badge>}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Created</span>
                  <p className="font-medium">
                    {incident.created_at ? formatInTimeZone(new Date(incident.created_at), 'America/New_York', 'MM/dd/yyyy') : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Due Date</span>
                  {editingSummary ? <Input type="date" value={editedIncident.due_date ? new Date(editedIncident.due_date).toISOString().slice(0, 10) : ''} onChange={e => handleIncidentFieldChange('due_date', e.target.value ? new Date(e.target.value).toISOString() : null)} min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)} className="mt-1" /> : <p className="font-medium">
                      {incident.due_date ? formatInTimeZone(new Date(incident.due_date), 'America/New_York', 'MM/dd/yyyy') : 'No due date'}
                    </p>}
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Created By</span>
                  <p className="font-medium">
                    {(incident as any).created_by_profile ? `${(incident as any).created_by_profile.last_name}, ${(incident as any).created_by_profile.first_name}` : 'Unknown'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Category</span>
                  <div className="mt-1">
                    {editingSummary ? <Select value={editedIncident.category || ''} onValueChange={value => handleIncidentFieldChange('category', value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map(option => <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>)}
                        </SelectContent>
                      </Select> : <Badge className={getCategoryInfo()?.color_class || 'bg-gray-100 text-gray-800'}>
                        {getCategoryInfo()?.label || incident.category}
                      </Badge>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader className="py-[8px]">
              <CardTitle className="flex items-center justify-between">
                Incident Description
                {canEditIncident && <Button variant="ghost" size="sm" onClick={() => setEditingDescription(!editingDescription)}>
                    <Edit className="w-4 h-4" />
                  </Button>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                {editingDescription ? <Textarea value={editedIncident.description || ''} onChange={e => handleIncidentFieldChange('description', e.target.value)} className="min-h-[120px]" placeholder="Enter incident description..." /> : <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {incident.description || 'No description provided.'}
                  </p>}
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader className="py-[8px]">
              <CardTitle className="flex items-center justify-between">
                <IncidentAttachmentSection incidentId={incident.id} canEdit={canEditIncident} defaultOpen={true} showTitleWithCount={true} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IncidentAttachmentSection incidentId={incident.id} canEdit={canEditIncident} defaultOpen={true} showContentOnly={true} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Comments & History */}
        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader className="py-[12px]">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Comments & History
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[600px] overflow-y-auto">
              {/* Add Comment */}
              <div className="space-y-3 mb-4">
                <Textarea placeholder="Add a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} className="min-h-[80px]" />
                <div className="flex items-center justify-between">
                  <Button onClick={handleAddComment} disabled={!newComment.trim() || isAddingComment} size="sm" className="w-fit">
                    {isAddingComment ? 'Posting...' : 'Post Comment'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSortCommentsNewestFirst(!sortCommentsNewestFirst)} className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4" />
                    {sortCommentsNewestFirst ? 'New to Old' : 'Old to New'}
                  </Button>
                </div>
              </div>

              <Separator className="mb-4" />

              {/* History Tabs */}
              <div className="flex-1 overflow-hidden">
                <Tabs defaultValue="comments" className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="comments">Comments</TabsTrigger>
                    <TabsTrigger value="history">Email History</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="comments" className="flex-1 overflow-y-auto mt-4">
                    <div className="space-y-3">
                      {comments && comments.length > 0 ? comments.slice().sort((a, b) => {
                      const dateA = new Date(a.created_at).getTime();
                      const dateB = new Date(b.created_at).getTime();
                      return sortCommentsNewestFirst ? dateB - dateA : dateA - dateB;
                    }).map(comment => <div key={comment.id} className="p-3 bg-muted rounded-lg">
                             <div className="flex items-center justify-between mb-2">
                               <div className="flex items-center gap-2">
                                 <span className="text-sm font-medium">
                                   {comment.user ? `${comment.user.last_name}, ${comment.user.first_name}` : 'System'}
                                 </span>
                                 {comment.is_system_comment ? (
                                   <Badge variant="secondary" className="text-xs bg-black text-white border border-black">Update</Badge>
                                 ) : (
                                   <Badge variant="outline" className="text-xs bg-white text-black border border-black">Comment</Badge>
                                 )}
                               </div>
                               <span className="text-xs text-muted-foreground">
                                 {formatInTimeZone(new Date(comment.created_at), 'America/New_York', 'MM/dd/yyyy HH:mm')}
                               </span>
                             </div>
                            <p className="text-sm whitespace-pre-wrap">{comment.comment_text}</p>
                          </div>) : <p className="text-muted-foreground text-sm text-center py-8">No comments yet.</p>}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="history" className="flex-1 overflow-y-auto mt-4">
                    <div className="space-y-3">
                      {comments && comments.filter(comment => comment.comment_text.includes('[Preview Email]')).length > 0 ? comments.filter(comment => comment.comment_text.includes('[Preview Email]')).slice().sort((a, b) => {
                      const dateA = new Date(a.created_at).getTime();
                      const dateB = new Date(b.created_at).getTime();
                      return sortCommentsNewestFirst ? dateB - dateA : dateA - dateB;
                    }).map(comment => {
                      const emailLinkMatch = comment.comment_text.match(/\[Preview Email\]\(([^)]+)\)/);
                      const emailId = emailLinkMatch ? emailLinkMatch[1] : null;
                      const emailItem = emailId ? queueItems?.find(item => item.id === emailId) : null;
                      return <div key={comment.id} className="p-3 bg-muted rounded-lg border">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-4 h-4 text-blue-600" />
                                      <span className="text-sm font-medium">Email Sent</span>
                                      {emailItem && <Badge variant={emailItem.status === 'sent' ? 'default' : 'secondary'} className="text-xs">
                                          {emailItem.status}
                                        </Badge>}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {formatInTimeZone(new Date(comment.created_at), 'America/New_York', 'MM/dd/yyyy HH:mm')}
                                    </span>
                                  </div>
                                  {emailItem && <div className="space-y-1">
                                      <p className="text-sm font-medium">{emailItem.subject}</p>
                                      <p className="text-xs text-muted-foreground">To: {emailItem.recipient_email}</p>
                                      <div className="flex items-center gap-2 mt-2">
                                        <Button size="sm" variant="outline" onClick={() => handleEmailPreviewClick(emailId!)} className="text-xs h-7">
                                          View Email
                                        </Button>
                                      </div>
                                    </div>}
                                </div>;
                    }) : <p className="text-muted-foreground text-sm text-center py-8">No emails sent for this incident yet.</p>}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Email View Dialog */}
      {selectedEmailId && queueItems && <EmailViewDialog email={queueItems.find(item => item.id === selectedEmailId)!} open={showEmailPreview} onOpenChange={setShowEmailPreview} />}
    </div>;
};