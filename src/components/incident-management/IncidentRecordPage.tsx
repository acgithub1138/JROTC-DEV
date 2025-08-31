import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Flag, User, Calendar, AlertTriangle, Save, X, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { IncidentCommentsSection } from './components/IncidentCommentsSection';
import { IncidentFormContent } from './forms/IncidentFormContent';
import { EditableIncidentField } from './components/EditableIncidentField';
import { AttachmentSection } from '@/components/attachments/AttachmentSection';
import { useIncidents } from '@/hooks/incidents/useIncidents';
import { useIncidentComments } from '@/hooks/incidents/useIncidentComments';
import { useIncidentPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Incident } from '@/hooks/incidents/types';

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
  const { toast } = useToast();
  const { userProfile } = useAuth();
  
  // Extract parameters from URL
  const mode = (searchParams.get('mode') as IncidentRecordMode) || 'view';
  const incidentId = searchParams.get('id');
  
  // Permissions
  const { canCreate, canUpdate, canUpdateAssigned, canView } = useIncidentPermissions();
  
  // Data
  const { incidents, isLoading: incidentsLoading } = useIncidents();
  const incident = incidents.find(i => i.id === incidentId);
  
  // Local state - all hooks must be at top level
  const [currentMode, setCurrentMode] = useState<IncidentRecordMode>(mode);
  
  // Update currentMode when URL mode changes
  React.useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortCommentsNewestFirst, setSortCommentsNewestFirst] = useState(true);
  const [editingSummary, setEditingSummary] = useState(false);

  // Comments (only if incident exists)
  const { 
    comments, 
    isLoading: commentsLoading,
    addComment 
  } = useIncidentComments(incident?.id || '');

  // Check permissions for the current incident
  const isAssignedToIncident = incident?.assigned_to_admin === userProfile?.id;
  const canEditIncident = canUpdate || (canUpdateAssigned && isAssignedToIncident);

  // Handle URL parameter changes
  useEffect(() => {
    if (currentMode === 'create' && !canCreate) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create incidents.",
        variant: "destructive",
      });
      navigate('/app/incidents');
      return;
    }

    if (incidentId && currentMode !== 'create') {
      if (!incident && !incidentsLoading) {
        toast({
          title: "Incident Not Found",
          description: "The incident you're looking for doesn't exist.",
          variant: "destructive",
        });
        navigate('/app/incidents');
        return;
      }

      if (incident && !canView) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this incident.",
          variant: "destructive",
        });
        navigate('/app/incidents');
        return;
      }

      if (currentMode === 'edit' && !canEditIncident) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to edit this incident.",
          variant: "destructive",
        });
        // Switch to view mode instead
        navigate(`/app/incidents/incident_record?mode=view&id=${incidentId}`);
        return;
      }
    }
  }, [
    currentMode, 
    incidentId, 
    incident, 
    incidentsLoading, 
    canCreate, 
    canView, 
    canEditIncident, 
    navigate, 
    toast
  ]);

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
    navigate(`/app/incidents/incident_record?mode=view&id=${newIncident.id}`);
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
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Incidents
          </Button>
        </div>
        <div className="text-center py-8">Loading incident...</div>
      </div>
    );
  }

  // Create mode
  if (currentMode === 'create') {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Incidents
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Create New Incident
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IncidentFormContent
                mode="create"
                onSuccess={handleIncidentCreated}
                onCancel={handleCancel}
                showAttachments={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Need incident for view/edit modes
  if (!incident) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Incidents
          </Button>
        </div>
        <div className="text-center py-8">Incident not found</div>
      </div>
    );
  }

  // Edit mode
  if (currentMode === 'edit') {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Incidents
          </Button>
          <div className="text-sm text-muted-foreground">
            {incident.incident_number} / Edit
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit Incident - {incident.incident_number}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IncidentFormContent
                mode="edit"
                incident={incident}
                onSuccess={handleIncidentUpdated}
                onCancel={handleCancel}
                showAttachments={true}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // View mode (default)
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Incidents
          </Button>
          <div className="text-sm text-muted-foreground">
            {incident.incident_number}
          </div>
        </div>
        
        {canEditIncident && (
          <Button onClick={() => handleModeChange('edit')} size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Incident
          </Button>
        )}
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Overview Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Status</span>
              </div>
              <Badge className={`mt-2 ${getStatusBadgeClass(incident.status)}`}>
                {incident.status.replace('_', ' ')}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Priority</span>
              </div>
              <Badge className={`mt-2 ${getPriorityBadgeClass(incident.priority)}`}>
                {incident.priority}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Assigned To</span>
              </div>
              <div className="mt-2 text-sm">
                {incident.assigned_to_admin 
                  ? ((incident as any).assigned_to_admin_profile 
                      ? `${(incident as any).assigned_to_admin_profile.last_name}, ${(incident as any).assigned_to_admin_profile.first_name}` 
                      : 'Admin')
                  : 'Unassigned'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Created</span>
              </div>
              <div className="mt-2 text-sm">
                {format(new Date(incident.created_at), "MMM d, yyyy")}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Incident Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Incident Details</span>
                  <Badge className={getCategoryBadgeClass(incident.category)}>
                    {incident.category}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Title</label>
                  <div className="mt-1 text-lg font-medium">{incident.title}</div>
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <div className="mt-1 whitespace-pre-wrap text-sm">
                    {incident.description || 'No description provided'}
                  </div>
                </div>

                {incident.due_date && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                      <div className="mt-1 text-sm">
                        {format(new Date(incident.due_date), "PPP")}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <AttachmentSection
                  recordType="incident"
                  recordId={incident.id}
                  canEdit={canEditIncident}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Comments */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <IncidentCommentsSection
                  comments={comments}
                  isAddingComment={false}
                  onAddComment={(commentText) => addComment.mutate({ comment_text: commentText })}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};