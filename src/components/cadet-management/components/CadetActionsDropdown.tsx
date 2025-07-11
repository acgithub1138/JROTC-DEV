import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, GraduationCap, Award, Plane, Shield, UserX, Users } from 'lucide-react';

interface CadetActionsDropdownProps {
  selectedCount: number;
  onUpdateGrade: () => void;
  onUpdateRank: () => void;
  onUpdateFlight: () => void;
  onUpdateRole: () => void;
  onDeactivate: () => void;
  loading: boolean;
  canUpdate: boolean;
}

export const CadetActionsDropdown = ({
  selectedCount,
  onUpdateGrade,
  onUpdateRank,
  onUpdateFlight,
  onUpdateRole,
  onDeactivate,
  loading,
  canUpdate
}: CadetActionsDropdownProps) => {
  // Don't render if no cadets selected or user doesn't have update permission
  if (selectedCount === 0 || !canUpdate) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="w-4 h-4" />
        <span>{selectedCount} cadet{selectedCount !== 1 ? 's' : ''} selected</span>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={loading}>
            Actions <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-card border border-border">
          <DropdownMenuItem onClick={onUpdateGrade} disabled={loading}>
            <GraduationCap className="w-4 h-4 mr-2" />
            Update Grade
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onUpdateRank} disabled={loading}>
            <Award className="w-4 h-4 mr-2" />
            Update Rank
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onUpdateFlight} disabled={loading}>
            <Plane className="w-4 h-4 mr-2" />
            Update Flight
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onUpdateRole} disabled={loading}>
            <Shield className="w-4 h-4 mr-2" />
            Update Role
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDeactivate} disabled={loading} className="text-destructive">
            <UserX className="w-4 h-4 mr-2" />
            Deactivate
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};