
import React from 'react';
import { AddCadetDialog } from './AddCadetDialog';
import { StatusConfirmationDialog } from './StatusConfirmationDialog';
import { MassUpdateGradeDialog } from './MassUpdateGradeDialog';
import { MassUpdateRankDialog } from './MassUpdateRankDialog';
import { MassUpdateFlightDialog } from './MassUpdateFlightDialog';
import { MassUpdateRoleDialog } from './MassUpdateRoleDialog';
import { MassDeactivateDialog } from './MassDeactivateDialog';
import { BulkImportDialog } from './BulkImportDialog';
import { Profile, NewCadet } from '../types';

interface CadetDialogsProps {
  // Add Dialog
  addDialogOpen: boolean;
  setAddDialogOpen: (open: boolean) => void;
  newCadet: any;
  setNewCadet: (cadet: any) => void;
  onAddCadet: (e: React.FormEvent) => void;
  
  // Edit Dialog
  editDialogOpen: boolean;
  setEditDialogOpen: (open: boolean) => void;
  editingProfile: Profile | null;
  setEditingProfile: (profile: Profile | null) => void;
  onSaveProfile: (e: React.FormEvent) => void;
  
  // Status Dialog
  statusDialogOpen: boolean;
  setStatusDialogOpen: (open: boolean) => void;
  profileToToggle: Profile | null;
  onToggleStatus: () => void;
  statusLoading: boolean;
  
  // Bulk Import Dialog
  bulkImportDialogOpen: boolean;
  setBulkImportDialogOpen: (open: boolean) => void;
  onBulkImport: (cadets: NewCadet[]) => Promise<{ success: number; failed: number; errors: string[] }>;
  
  // Mass Update Dialogs
  gradeDialogOpen: boolean;
  setGradeDialogOpen: (open: boolean) => void;
  rankDialogOpen: boolean;
  setRankDialogOpen: (open: boolean) => void;
  flightDialogOpen: boolean;
  setFlightDialogOpen: (open: boolean) => void;
  roleDialogOpen: boolean;
  setRoleDialogOpen: (open: boolean) => void;
  deactivateDialogOpen: boolean;
  setDeactivateDialogOpen: (open: boolean) => void;
  
  selectedCount: number;
  massOperationLoading: boolean;
  onMassUpdateGrade: (grade: string) => Promise<boolean>;
  onMassUpdateRank: (rank: string) => Promise<boolean>;
  onMassUpdateFlight: (flight: string) => Promise<boolean>;
  onMassUpdateRole: (role: string) => Promise<boolean>;
  onMassDeactivate: () => Promise<boolean>;
}

export const CadetDialogs = (props: CadetDialogsProps) => {
  return (
    <>
      <StatusConfirmationDialog
        open={props.statusDialogOpen}
        onOpenChange={props.setStatusDialogOpen}
        profileToToggle={props.profileToToggle}
        onConfirm={props.onToggleStatus}
        loading={props.statusLoading}
      />

      <AddCadetDialog
        open={props.addDialogOpen}
        onOpenChange={props.setAddDialogOpen}
        newCadet={props.newCadet}
        setNewCadet={props.setNewCadet}
        onSubmit={props.onAddCadet}
      />


      <MassUpdateGradeDialog
        open={props.gradeDialogOpen}
        onOpenChange={props.setGradeDialogOpen}
        onSubmit={props.onMassUpdateGrade}
        selectedCount={props.selectedCount}
        loading={props.massOperationLoading}
      />

      <MassUpdateRankDialog
        open={props.rankDialogOpen}
        onOpenChange={props.setRankDialogOpen}
        onSubmit={props.onMassUpdateRank}
        selectedCount={props.selectedCount}
        loading={props.massOperationLoading}
      />

      <MassUpdateFlightDialog
        open={props.flightDialogOpen}
        onOpenChange={props.setFlightDialogOpen}
        onSubmit={props.onMassUpdateFlight}
        selectedCount={props.selectedCount}
        loading={props.massOperationLoading}
      />

      <MassUpdateRoleDialog
        open={props.roleDialogOpen}
        onOpenChange={props.setRoleDialogOpen}
        onSubmit={props.onMassUpdateRole}
        selectedCount={props.selectedCount}
        loading={props.massOperationLoading}
      />

      <MassDeactivateDialog
        open={props.deactivateDialogOpen}
        onOpenChange={props.setDeactivateDialogOpen}
        onConfirm={props.onMassDeactivate}
        selectedCount={props.selectedCount}
        loading={props.massOperationLoading}
      />

      <BulkImportDialog
        open={props.bulkImportDialogOpen}
        onOpenChange={props.setBulkImportDialogOpen}
        onBulkImport={props.onBulkImport}
      />
    </>
  );
};
