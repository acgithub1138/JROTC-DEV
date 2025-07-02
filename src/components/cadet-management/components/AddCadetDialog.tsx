
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { getRanksForProgram, JROTCProgram } from '@/utils/jrotcRanks';
import { NewCadet } from '../types';
import { gradeOptions, flightOptions, roleOptions } from '../constants';

interface AddCadetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newCadet: NewCadet;
  setNewCadet: (cadet: NewCadet) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AddCadetDialog = ({ open, onOpenChange, newCadet, setNewCadet, onSubmit }: AddCadetDialogProps) => {
  const { userProfile } = useAuth();
  const ranks = getRanksForProgram(userProfile?.schools?.jrotc_program as JROTCProgram);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Cadet</DialogTitle>
          <DialogDescription>
            Create a new cadet or command staff member for your school. They will receive an invitation email to set up their account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={newCadet.first_name}
                onChange={(e) => setNewCadet({ ...newCadet, first_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={newCadet.last_name}
                onChange={(e) => setNewCadet({ ...newCadet, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={newCadet.email}
              onChange={(e) => setNewCadet({ ...newCadet, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={newCadet.role}
              onValueChange={(value: 'cadet' | 'command_staff') => setNewCadet({ ...newCadet, role: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Select
                value={newCadet.grade || ""}
                onValueChange={(value) => setNewCadet({ ...newCadet, grade: value })}
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
                value={newCadet.flight || ""}
                onValueChange={(value) => setNewCadet({ ...newCadet, flight: value })}
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
            <Label htmlFor="rank">Rank</Label>
            <Select
              value={newCadet.rank || ""}
              onValueChange={(value) => setNewCadet({ ...newCadet, rank: value === "none" ? "" : value })}
              disabled={ranks.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    ranks.length === 0
                      ? userProfile?.schools?.jrotc_program
                        ? "No ranks available"
                        : "Set JROTC program first"
                      : "Select rank"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {ranks.length === 0 ? (
                  <SelectItem value="none" disabled>
                    {userProfile?.schools?.jrotc_program
                      ? "No ranks available for this program"
                      : "JROTC program not set for school"}
                  </SelectItem>
                ) : (
                  ranks.map((rank) => (
                    <SelectItem key={rank.id} value={rank.rank || "none"}>
                      {rank.rank} {rank.abbreviation && `(${rank.abbreviation})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Send Invitation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
