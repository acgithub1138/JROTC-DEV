import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { getRanksForProgram, JROTCProgram } from '@/utils/jrotcRanks';
import { NewCadet } from '../types';
import { gradeOptions, flightOptions, cadetYearOptions } from '../constants';
import { useCadetRoles } from '@/hooks/useCadetRoles';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { getYearOptions } from '@/utils/yearOptions';
import { useEmailValidation } from '@/hooks/useEmailValidation';
import { calculateGrade, shouldAutoCalculateGrade } from '@/utils/gradeCalculation';
interface AddCadetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newCadet: NewCadet;
  setNewCadet: (cadet: NewCadet) => void;
  onSubmit: (e: React.FormEvent) => void;
}
export const AddCadetDialog = ({
  open,
  onOpenChange,
  newCadet,
  setNewCadet,
  onSubmit
}: AddCadetDialogProps) => {
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const {
    userProfile
  } = useAuth();
  const ranks = getRanksForProgram(userProfile?.schools?.jrotc_program as JROTCProgram);
  const {
    roleOptions
  } = useCadetRoles();
  const initialData = {
    first_name: '',
    last_name: '',
    email: '',
    role_id: '',
    grade: '',
    flight: '',
    cadet_year: '',
    rank: '',
    start_year: undefined
  };
  const {
    hasUnsavedChanges,
    resetChanges
  } = useUnsavedChanges({
    initialData,
    currentData: newCadet as any,
    enabled: open
  });

  // Email validation hook
  const { isChecking: isCheckingEmail, exists: emailExists, error: emailError } = useEmailValidation(
    newCadet.email,
    open && newCadet.email.length > 0
  );
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
  const handleSubmit = (e: React.FormEvent) => {
    onSubmit(e);
    resetChanges();
  };
  const handleDiscardChanges = () => {
    setNewCadet({
      first_name: '',
      last_name: '',
      email: '',
      role_id: '',
      grade: '',
      flight: '',
      cadet_year: '',
      rank: '',
      start_year: undefined
    });
    resetChanges();
    setShowUnsavedDialog(false);
    onOpenChange(false);
  };
  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };
  return <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Cadet</DialogTitle>
          <DialogDescription>
            Create a new cadet for your school.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input id="first_name" value={newCadet.first_name} onChange={e => setNewCadet({
                ...newCadet,
                first_name: e.target.value
              })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input id="last_name" value={newCadet.last_name} onChange={e => setNewCadet({
                ...newCadet,
                last_name: e.target.value
              })} required />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={newCadet.email} onChange={e => setNewCadet({
                ...newCadet,
                email: e.target.value
              })} required />
              {isCheckingEmail && (
                <p className="text-sm text-muted-foreground">Checking email...</p>
              )}
              {!isCheckingEmail && emailExists === false && newCadet.email && (
                <p className="text-sm text-emerald-600">Email is good</p>
              )}
              {!isCheckingEmail && emailExists === true && (
                <p className="text-sm text-destructive">User email already exists, please enter a new email</p>
              )}
              {emailError && (
                <p className="text-sm text-destructive">{emailError}</p>
              )}
            </div>
  
            <div className="space-y-2">
              <Label htmlFor="role_id">Role *</Label>
              <Select value={newCadet.role_id} onValueChange={(value: string) => setNewCadet({
                ...newCadet,
                role_id: value
              })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map(role => <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_year">Freshman Year</Label>
              <Select value={newCadet.start_year?.toString() || ""} onValueChange={value => {
                const freshmanYear = value ? parseInt(value) : undefined;
                const updatedCadet = {
                  ...newCadet,
                  start_year: freshmanYear
                };
                
                // Auto-calculate grade if freshman year is selected
                if (shouldAutoCalculateGrade(freshmanYear)) {
                  updatedCadet.grade = calculateGrade(freshmanYear);
                }
                
                setNewCadet(updatedCadet);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select start year" />
                </SelectTrigger>
                <SelectContent>
                  {getYearOptions().map(year => <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Grade {shouldAutoCalculateGrade(newCadet.start_year) && "(Auto-calculated)"}</Label>
              <Select 
                value={newCadet.grade || ""} 
                onValueChange={value => setNewCadet({
                  ...newCadet,
                  grade: value
                })}
                disabled={shouldAutoCalculateGrade(newCadet.start_year)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {gradeOptions.map(grade => <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flight">Flight</Label>
              <Select value={newCadet.flight || ""} onValueChange={value => setNewCadet({
                ...newCadet,
                flight: value
              })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select flight" />
                </SelectTrigger>
                <SelectContent>
                  {flightOptions.map(flight => <SelectItem key={flight} value={flight}>
                      {flight}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cadet_year">Cadet Year</Label>
              <Select value={newCadet.cadet_year || ""} onValueChange={value => setNewCadet({
                ...newCadet,
                cadet_year: value
              })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {cadetYearOptions.map(year => <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rank">Rank</Label>
              <Select value={newCadet.rank || ""} onValueChange={value => setNewCadet({
                ...newCadet,
                rank: value === "none" ? "" : value
              })} disabled={ranks.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={ranks.length === 0 ? userProfile?.schools?.jrotc_program ? "No ranks available" : "Set JROTC program first" : "Select rank"} />
                </SelectTrigger>
                <SelectContent>
                  {ranks.length === 0 ? <SelectItem value="none" disabled>
                      {userProfile?.schools?.jrotc_program ? "No ranks available for this program" : "JROTC program not set for school"}
                    </SelectItem> : ranks.map(rank => <SelectItem key={rank.id} value={rank.abbreviation ? `${rank.rank} (${rank.abbreviation})` : rank.rank || "none"}>
                        {rank.rank} {rank.abbreviation && `(${rank.abbreviation})`}
                      </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Create Cadet
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <UnsavedChangesDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog} onDiscard={handleDiscardChanges} onCancel={handleContinueEditing} />
  </>;
};