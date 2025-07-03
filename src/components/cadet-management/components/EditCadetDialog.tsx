
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { getRanksForProgram, JROTCProgram } from '@/utils/jrotcRanks';
import { Profile } from '../types';
import { gradeOptions, flightOptions, roleOptions } from '../constants';

interface EditCadetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProfile: Profile | null;
  setEditingProfile: (profile: Profile | null) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const EditCadetDialog = ({ open, onOpenChange, editingProfile, setEditingProfile, onSubmit }: EditCadetDialogProps) => {
  const { userProfile } = useAuth();
  const ranks = getRanksForProgram(userProfile?.schools?.jrotc_program as JROTCProgram);

  if (!editingProfile) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Cadet Information</DialogTitle>
          <DialogDescription>
            Update the cadet's grade, rank, and flight information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={`${editingProfile.first_name} ${editingProfile.last_name}`}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={editingProfile.email}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Select
                value={editingProfile.grade || ""}
                onValueChange={(value) => setEditingProfile({ ...editingProfile, grade: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {gradeOptions.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="flight">Flight</Label>
              <Select
                value={editingProfile.flight || ""}
                onValueChange={(value) => setEditingProfile({ ...editingProfile, flight: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select flight" />
                </SelectTrigger>
                <SelectContent>
                  {flightOptions.map((flight) => (
                    <SelectItem key={flight} value={flight}>
                      {flight}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={editingProfile.role || ""}
              onValueChange={(value) => setEditingProfile({ ...editingProfile, role: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((roleOption) => (
                  <SelectItem key={roleOption.value} value={roleOption.value}>
                    {roleOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rank">Rank</Label>
            <Select
              value={editingProfile.rank || ""}
              onValueChange={(value) => setEditingProfile({ ...editingProfile, rank: value === "none" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select rank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No rank</SelectItem>
                {ranks.map((rank) => (
                  <SelectItem key={rank.id} value={rank.rank || "none"}>
                    {rank.rank} {rank.abbreviation && `(${rank.abbreviation})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Update Cadet
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
