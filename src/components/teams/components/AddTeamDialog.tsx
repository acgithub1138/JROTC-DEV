import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { NewTeam } from '../types';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
interface AddTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newTeam: NewTeam;
  setNewTeam: (team: NewTeam) => void;
  onAddTeam: (team: NewTeam) => Promise<boolean>;
}
export const AddTeamDialog = ({
  open,
  onOpenChange,
  newTeam,
  setNewTeam,
  onAddTeam
}: AddTeamDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const {
    users
  } = useSchoolUsers(true); // Only get active users

  const initialData = {
    name: '',
    description: '',
    team_lead_id: '',
    member_ids: []
  };
  const {
    hasUnsavedChanges,
    resetChanges
  } = useUnsavedChanges({
    initialData,
    currentData: newTeam,
    enabled: open
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await onAddTeam(newTeam);
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
    setNewTeam(initialData);
    resetChanges();
    setShowUnsavedDialog(false);
    onOpenChange(false);
  };
  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };
  const addMember = (userId: string) => {
    if (!newTeam.member_ids.includes(userId)) {
      setNewTeam({
        ...newTeam,
        member_ids: [...newTeam.member_ids, userId]
      });
    }
  };
  const removeMember = (userId: string) => {
    setNewTeam({
      ...newTeam,
      member_ids: newTeam.member_ids.filter(id => id !== userId)
    });
  };
  const getSelectedMembers = () => {
    return users.filter(user => newTeam.member_ids.includes(user.id));
  };
  const getAvailableUsers = () => {
    return users.filter(user => !newTeam.member_ids.includes(user.id) && user.id !== newTeam.team_lead_id);
  };
  return <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto py-[4px]">Add New Team</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Team Name *</Label>
            <Input id="name" value={newTeam.name} onChange={e => setNewTeam({
              ...newTeam,
              name: e.target.value
            })} required />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={newTeam.description} onChange={e => setNewTeam({
              ...newTeam,
              description: e.target.value
            })} rows={3} />
          </div>

          <div>
            <Label htmlFor="team_lead">Team Lead</Label>
            <Select value={newTeam.team_lead_id || "none"} onValueChange={value => setNewTeam({
              ...newTeam,
              team_lead_id: value === "none" ? "" : value
            })}>
              <SelectTrigger>
                <SelectValue placeholder="Select team lead (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No team lead</SelectItem>
                {users.filter(user => !newTeam.member_ids.includes(user.id)).map(user => <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.role})
                    </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Team Members</Label>
            <div className="space-y-2">
              <Select onValueChange={addMember}>
                <SelectTrigger>
                  <SelectValue placeholder="Add team members" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableUsers().map(user => <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.role})
                    </SelectItem>)}
                </SelectContent>
              </Select>
              
              {getSelectedMembers().length > 0 && <div className="flex flex-wrap gap-2 mt-2">
                  {getSelectedMembers().map(user => <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                      {user.first_name} {user.last_name}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeMember(user.id)} />
                    </Badge>)}
                </div>}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !newTeam.name.trim()}>
              {loading ? 'Creating...' : 'Create Team'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <UnsavedChangesDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog} onDiscard={handleDiscardChanges} onCancel={handleContinueEditing} />
  </>;
};