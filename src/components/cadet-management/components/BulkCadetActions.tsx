import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, GraduationCap, Award, Plane, Shield, UserX, Users } from 'lucide-react';
import { useCadetPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { gradeOptions as gradeConstants, flightOptions as flightConstants, roleOptions as roleConstants } from '../constants';
import { useAuth } from '@/contexts/AuthContext';
import { getRanksForProgram, JROTCProgram } from '@/utils/jrotcRanks';

interface BulkCadetActionsProps {
  selectedCadets: string[];
  onSelectionClear: () => void;
  canEdit: boolean;
  canDelete: boolean;
  onRefresh: () => void;
}

export const BulkCadetActions: React.FC<BulkCadetActionsProps> = ({
  selectedCadets,
  onSelectionClear,
  canEdit,
  canDelete,
  onRefresh
}) => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  if (selectedCadets.length === 0 || !canEdit) {
    return null;
  }

  // Grade options
  const gradeOptions = [
    ...gradeConstants.map(grade => ({ value: grade, label: grade })),
    { value: '', label: 'Clear Grade' }
  ];

  // Rank options based on school's JROTC program
  const ranks = getRanksForProgram(userProfile?.schools?.jrotc_program as JROTCProgram);
  const rankOptions = [
    ...ranks.map(rank => ({ 
      value: rank.rank || "none", 
      label: `${rank.rank} ${rank.abbreviation ? `(${rank.abbreviation})` : ''}` 
    })),
    { value: '', label: 'Clear Rank' }
  ];

  // Flight options - only Alpha, Bravo, Charlie, Delta
  const flightOptions = [
    ...flightConstants.map(flight => ({ value: flight, label: `${flight} Flight` })),
    { value: '', label: 'Clear Flight' }
  ];

  // Role options - only Cadet and Command Staff
  const roleOptions = [
    { value: 'cadet', label: 'Cadet' },
    { value: 'command_staff', label: 'Command Staff' }
  ];

  const handleBulkUpdate = async (field: string, value: any) => {
    if (selectedCadets.length === 0) return;
    
    console.log('Bulk update starting:', { field, value, selectedCadets });
    setIsUpdating(true);
    
    try {
      const updateData = { 
        [field]: value || null,
        updated_at: new Date().toISOString()
      };
      
      console.log('Update data:', updateData);
      console.log('Selected cadet IDs:', selectedCadets);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .in('id', selectedCadets)
        .select('id, first_name, last_name, ' + field);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Update successful, affected rows:', data);
      
      toast({
        title: "Cadets Updated",
        description: `Successfully updated ${field.replace('_', ' ')} for ${selectedCadets.length} cadet${selectedCadets.length > 1 ? 's' : ''}`,
      });
      
      onSelectionClear();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to update cadets:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Update Failed",
        description: `Failed to update selected cadets: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedCadets.length === 0) return;
    
    const confirmMessage = `Are you sure you want to deactivate ${selectedCadets.length} cadet${selectedCadets.length > 1 ? 's' : ''}?`;
    if (!confirm(confirmMessage)) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase.functions.invoke('toggle-user-status', {
        body: {
          userIds: selectedCadets,
          active: false
        }
      });

      if (error) throw error;
      
      toast({
        title: "Cadets Deactivated",
        description: `Successfully deactivated ${selectedCadets.length} cadet${selectedCadets.length > 1 ? 's' : ''}`,
      });
      
      onSelectionClear();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to deactivate cadets:', error);
      toast({
        title: "Deactivate Failed",
        description: "Failed to deactivate selected cadets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="w-4 h-4" />
        <span>{selectedCadets.length} cadet{selectedCadets.length !== 1 ? 's' : ''} selected</span>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isUpdating}>
            {isUpdating ? 'Updating...' : 'Actions'} <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white w-56">
          {/* Grade Updates */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <GraduationCap className="w-4 h-4 mr-2" />
              Update Grade
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-white">
              {gradeOptions.map((grade) => (
                <DropdownMenuItem 
                  key={grade.value}
                  onClick={() => handleBulkUpdate('grade', grade.value)}
                >
                  {grade.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Rank Updates */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Award className="w-4 h-4 mr-2" />
              Update Rank
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-white max-h-60 overflow-y-auto">
              {rankOptions.map((rank) => (
                <DropdownMenuItem 
                  key={rank.value}
                  onClick={() => handleBulkUpdate('rank', rank.value)}
                >
                  {rank.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Flight Updates */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Plane className="w-4 h-4 mr-2" />
              Update Flight
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-white">
              {flightOptions.map((flight) => (
                <DropdownMenuItem 
                  key={flight.value}
                  onClick={() => handleBulkUpdate('flight', flight.value)}
                >
                  {flight.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Role Updates */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Shield className="w-4 h-4 mr-2" />
              Update Role
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-white">
              {roleOptions.map((role) => (
                <DropdownMenuItem 
                  key={role.value}
                  onClick={() => handleBulkUpdate('role', role.value)}
                >
                  {role.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Deactivate Action - Only show if user has delete permission */}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleBulkDeactivate} className="text-red-600">
                <UserX className="w-4 h-4 mr-2" />
                Deactivate Selected
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};