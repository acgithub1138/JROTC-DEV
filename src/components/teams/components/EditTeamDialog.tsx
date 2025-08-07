import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { TeamWithMembers } from '../types';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
interface EditTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: TeamWithMembers | null;
  onUpdateTeam: (team: Partial<TeamWithMembers>) => Promise<boolean>;
}
export const EditTeamDialog = ({
  open,
  onOpenChange,
  team,
  onUpdateTeam
}: EditTeamDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    team_lead_id: '',
    member_ids: [] as string[]
  });
  const {
    users
  } = useSchoolUsers(true); // Only get active users
  const {
    canEdit: canUpdate
  } = useTablePermissions('teams');
  const isReadOnly = !canUpdate;

  const initialData = team ? {
    name: team.name || '',
    description: team.description || '',
    team_lead_id: team.team_lead_id || '',
    member_ids: team.team_members?.map(member => member.cadet_id) || []
  } : { name: '', description: '', team_lead_id: '', member_ids: [] };

  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData,
    currentData: formData,
    enabled: open && !isReadOnly
  });
  useEffect(() => {
    if (team) {
      const newFormData = {
        name: team.name,
        description: team.description || '',
        team_lead_id: team.team_lead_id || '',
        member_ids: team.team_members?.map(member => member.cadet_id) || []
      };
      setFormData(newFormData);
      resetChanges();
    }
  }, [team, resetChanges]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await onUpdateTeam(formData);
    setLoading(false);
    if (success) {
      resetChanges();
      onOpenChange(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(open);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleDiscardChanges = () => {
    if (team) {
      setFormData({
        name: team.name,
        description: team.description || '',
        team_lead_id: team.team_lead_id || '',
        member_ids: team.team_members?.map(member => member.cadet_id) || []
      });
    }
    resetChanges();
    setShowUnsavedDialog(false);
    onOpenChange(false);
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };
  const addMember = (userId: string) => {
    if (!formData.member_ids.includes(userId)) {
      setFormData({
        ...formData,
        member_ids: [...formData.member_ids, userId]
      });
    }
  };
  const removeMember = (userId: string) => {
    setFormData({
      ...formData,
      member_ids: formData.member_ids.filter(id => id !== userId)
    });
  };
  const getSelectedMembers = () => {
    return users.filter(user => formData.member_ids.includes(user.id));
  };
  const getAvailableUsers = () => {
    return users
      .filter(user => !formData.member_ids.includes(user.id) && user.id !== formData.team_lead_id)
      .sort((a, b) => a.last_name.localeCompare(b.last_name));
  };
  if (!team) return null;
  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Team Name *</Label>
            {isReadOnly ? <div className="p-2 border rounded-md bg-muted">{formData.name}</div> : <Input id="name" value={formData.name} onChange={e => setFormData({
            ...formData,
            name: e.target.value
          })} required />}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            {isReadOnly ? <div className="p-2 border rounded-md bg-muted min-h-[72px]">{formData.description || 'No description'}</div> : <Textarea id="description" value={formData.description} onChange={e => setFormData({
            ...formData,
            description: e.target.value
          })} rows={3} />}
          </div>

          <div>
            <Label htmlFor="team_lead">Team Lead</Label>
            {isReadOnly ? <div className="p-2 border rounded-md bg-muted">
                {formData.team_lead_id ? users.find(u => u.id === formData.team_lead_id)?.first_name + ' ' + users.find(u => u.id === formData.team_lead_id)?.last_name || 'Unknown' : 'No team lead'}
              </div> : <Select value={formData.team_lead_id || "none"} onValueChange={value => setFormData({
            ...formData,
            team_lead_id: value === "none" ? "" : value
          })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team lead (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No team lead</SelectItem>
                  {users
                    .filter(user => !formData.member_ids.includes(user.id))
                    .sort((a, b) => a.last_name.localeCompare(b.last_name))
                    .map(user => <SelectItem key={user.id} value={user.id}>
                        {user.last_name}, {user.first_name} ({user.role})
                      </SelectItem>)}
                </SelectContent>
              </Select>}
          </div>

          <div>
            <Label>Team Members</Label>
            <div className="space-y-2">
              {!isReadOnly && <Select onValueChange={addMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add team members" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableUsers().map(user => <SelectItem key={user.id} value={user.id}>
                        {user.last_name}, {user.first_name} ({user.role})
                      </SelectItem>)}
                  </SelectContent>
                </Select>}
              
              {getSelectedMembers().length > 0 && <div className="flex flex-wrap gap-2 mt-2">
                  {getSelectedMembers().map(user => <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                      {user.last_name}, {user.first_name}
                      {!isReadOnly && <X className="h-3 w-3 cursor-pointer" onClick={() => removeMember(user.id)} />}
                    </Badge>)}
                </div>}
              
              {getSelectedMembers().length === 0 && <div className="text-sm text-muted-foreground">No team members</div>}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && <Button type="submit" disabled={loading || !formData.name.trim()}>
                {loading ? 'Updating...' : 'Update Team'}
              </Button>}
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <UnsavedChangesDialog
      open={showUnsavedDialog}
      onOpenChange={setShowUnsavedDialog}
      onDiscard={handleDiscardChanges}
      onCancel={handleContinueEditing}
    />
  </>
  );
};