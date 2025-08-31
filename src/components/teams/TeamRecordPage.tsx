import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, X, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTeams } from './hooks/useTeams';
import { useTeamMutations } from './hooks/useTeamMutations';
import { TeamWithMembers, NewTeam } from './types';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { useCadets } from '@/hooks/useCadets';

interface TeamFormData {
  name: string;
  description: string;
  team_lead_id: string;
  member_ids: string[];
}

const TeamRecordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const teamId = searchParams.get('id');
  const isEdit = !!teamId;

  const { teams, loading: teamsLoading } = useTeams();
  const { cadets, loading: cadetsLoading } = useCadets();
  const { createTeam, updateTeam } = useTeamMutations();
  const { canCreate, canEdit: canUpdate } = useTablePermissions('teams');

  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    description: '',
    team_lead_id: '',
    member_ids: []
  });

  const [initialData, setInitialData] = useState<TeamFormData>({
    name: '',
    description: '',
    team_lead_id: '',
    member_ids: []
  });

  const [loading, setLoading] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData,
    currentData: formData,
    enabled: true
  });

  // Load existing team data for edit mode
  useEffect(() => {
    if (isEdit && teams.length > 0 && !teamsLoading) {
      const team = teams.find(t => t.id === teamId);
      if (team) {
        const teamData: TeamFormData = {
          name: team.name || '',
          description: team.description || '',
          team_lead_id: team.team_lead_id || '',
          member_ids: team.team_members?.map(member => member.cadet_id) || []
        };
        setFormData(teamData);
        setInitialData(teamData);
      } else if (!teamsLoading) {
        toast({
          title: "Error",
          description: "Team not found",
          variant: "destructive"
        });
        navigate('/app/teams');
      }
    }
  }, [isEdit, teamId, teams, teamsLoading, navigate, toast]);

  // Permission checks
  useEffect(() => {
    if (!isEdit && !canCreate) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create teams",
        variant: "destructive"
      });
      navigate('/app/teams');
    } else if (isEdit && !canUpdate) {
      toast({
        title: "Access Denied", 
        description: "You don't have permission to edit teams",
        variant: "destructive"
      });
      navigate('/app/teams');
    }
  }, [isEdit, canCreate, canUpdate, navigate, toast]);

  const handleInputChange = (field: keyof TeamFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMemberToggle = (cadetId: string) => {
    setFormData(prev => ({
      ...prev,
      member_ids: prev.member_ids.includes(cadetId)
        ? prev.member_ids.filter(id => id !== cadetId)
        : [...prev.member_ids, cadetId]
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Team name is required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let success = false;

      if (isEdit) {
        const updateData: Partial<TeamWithMembers> = {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          team_lead_id: formData.team_lead_id || null,
          member_ids: formData.member_ids
        };
        success = await updateTeam(teamId!, updateData);
      } else {
        const newTeamData: NewTeam = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          team_lead_id: formData.team_lead_id,
          member_ids: formData.member_ids
        };
        success = await createTeam(newTeamData);
      }

      if (success) {
        resetChanges();
        navigate('/app/teams');
        toast({
          title: "Success",
          description: `Team ${isEdit ? 'updated' : 'created'} successfully`
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setPendingNavigation('/app/teams');
      setShowUnsavedDialog(true);
    } else {
      navigate('/app/teams');
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    resetChanges();
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  };

  if (teamsLoading || cadetsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Teams
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              {isEdit ? 'Edit Team' : 'Add New Team'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit ? 'Update team information and members' : 'Create a new team with members'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !formData.name.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : (isEdit ? 'Update Team' : 'Create Team')}
          </Button>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter team name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team_lead">Team Lead</Label>
              <Select
                value={formData.team_lead_id}
                onValueChange={(value) => handleInputChange('team_lead_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team lead" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Team Lead</SelectItem>
                  {cadets
                    .filter(cadet => cadet.active)
                    .sort((a, b) => `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`))
                    .map(cadet => (
                      <SelectItem key={cadet.id} value={cadet.id}>
                        {cadet.last_name}, {cadet.first_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter team description (optional)"
              rows={3}
            />
          </div>

          {/* Team Members */}
          <div className="space-y-4">
            <div>
              <Label>Team Members</Label>
              <p className="text-sm text-muted-foreground">
                Select cadets to add to this team
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cadets
                .filter(cadet => cadet.active)
                .sort((a, b) => `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`))
                .map(cadet => {
                  const isSelected = formData.member_ids.includes(cadet.id);
                  const isTeamLead = formData.team_lead_id === cadet.id;
                  
                  return (
                    <div
                      key={cadet.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleMemberToggle(cadet.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {cadet.last_name}, {cadet.first_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {cadet.grade}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {isSelected && (
                            <Badge variant="secondary" className="text-xs">
                              Member
                            </Badge>
                          )}
                          {isTeamLead && (
                            <Badge className="text-xs">
                              Team Lead
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {formData.member_ids.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {formData.member_ids.length} member{formData.member_ids.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onCancel={handleContinueEditing}
      />
    </div>
  );
};

export default TeamRecordPage;