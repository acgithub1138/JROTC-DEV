import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const [searchTerm, setSearchTerm] = useState('');

  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData,
    currentData: formData,
    enabled: true
  });

  // Filter cadets based on search term and exclude team lead from members list
  const filteredCadets = cadets
    .filter(cadet => cadet.active)
    .filter(cadet => cadet.id !== formData.team_lead_id) // Exclude team lead from members
    .filter(cadet => 
      searchTerm === '' || 
      `${cadet.first_name} ${cadet.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${cadet.last_name}, ${cadet.first_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`));

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
      [field]: field === 'team_lead_id' && value === 'none' ? '' : value
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

    if (!formData.team_lead_id) {
      toast({
        title: "Validation Error",
        description: "Team lead is required",
        variant: "destructive"
      });
      return;
    }

    if (formData.member_ids.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one team member is required",
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
      {/* Back Button - Above header on mobile */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className="sm:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Teams
      </Button>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="hidden sm:flex"
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

          {/* Action Buttons - Desktop only */}
          <div className="hidden sm:flex items-center gap-2">
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

        {/* Action Buttons - Mobile: Below header in 2-column grid */}
        <div className="grid grid-cols-2 gap-2 sm:hidden">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={loading}
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !formData.name.trim()}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto">
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-6">
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-4">
              <Label htmlFor="name" className="sm:w-32 sm:text-right text-left shrink-0">Team Name *</Label>
              <div className="flex-1">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter team name"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-4">
              <Label htmlFor="team_lead" className="sm:w-32 sm:text-right text-left shrink-0">Team Lead *</Label>
              <div className="flex-1">
                <Select
                  value={formData.team_lead_id}
                  onValueChange={(value) => handleInputChange('team_lead_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team lead" />
                  </SelectTrigger>
                  <SelectContent>
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
          </div>

          {/* Team Members - Only show when Team Lead is selected */}
          {formData.team_lead_id && (
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-start sm:gap-4">
              <Label className="sm:w-32 sm:text-right text-left shrink-0 sm:pt-2">Team Members *</Label>
              <div className="flex-1 space-y-3">
                <Input
                  placeholder="Search cadets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
                <ScrollArea className="h-48 border rounded-md p-2">
                  {cadetsLoading ? (
                    <div className="text-center py-4 text-muted-foreground">Loading cadets...</div>
                  ) : filteredCadets.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">No cadets found</div>
                  ) : (
                    <div className="space-y-2">
                      {filteredCadets.map(cadet => {
                        const isSelected = formData.member_ids.includes(cadet.id);
                        const isTeamLead = formData.team_lead_id === cadet.id;
                        
                        return (
                          <div key={cadet.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`cadet-${cadet.id}`}
                              checked={isSelected}
                              onCheckedChange={() => handleMemberToggle(cadet.id)}
                            />
                            <Label 
                              htmlFor={`cadet-${cadet.id}`}
                              className="flex-1 cursor-pointer flex items-center justify-between"
                            >
                              <span>
                                {cadet.last_name}, {cadet.first_name}
                                {cadet.grade && ` (${cadet.grade})`}
                              </span>
                              {isTeamLead && (
                                <Badge className="text-xs ml-2">Team Lead</Badge>
                              )}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
                {formData.member_ids.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {formData.member_ids.length} member{formData.member_ids.length !== 1 ? 's' : ''} selected
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-2 sm:flex-row sm:items-start sm:gap-4">
            <Label htmlFor="description" className="sm:w-32 sm:text-right text-left shrink-0 sm:pt-2">Description</Label>
            <div className="flex-1">
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter team description (optional)"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      </div>

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