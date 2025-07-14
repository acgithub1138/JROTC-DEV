import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, GraduationCap, Award, Plane, Shield, UserX, Users } from 'lucide-react';
import { useCadetPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const [isUpdating, setIsUpdating] = useState(false);

  if (selectedCadets.length === 0 || !canEdit) {
    return null;
  }

  // Grade options
  const gradeOptions = [
    { value: '9', label: '9th Grade' },
    { value: '10', label: '10th Grade' },
    { value: '11', label: '11th Grade' },
    { value: '12', label: '12th Grade' },
    { value: '', label: 'Clear Grade' }
  ];

  // Rank options (common JROTC ranks)
  const rankOptions = [
    { value: 'Cadet', label: 'Cadet' },
    { value: 'Cadet Private', label: 'Cadet Private' },
    { value: 'Cadet Private First Class', label: 'Cadet Private First Class' },
    { value: 'Cadet Corporal', label: 'Cadet Corporal' },
    { value: 'Cadet Sergeant', label: 'Cadet Sergeant' },
    { value: 'Cadet Staff Sergeant', label: 'Cadet Staff Sergeant' },
    { value: 'Cadet Master Sergeant', label: 'Cadet Master Sergeant' },
    { value: 'Cadet First Sergeant', label: 'Cadet First Sergeant' },
    { value: 'Cadet Second Lieutenant', label: 'Cadet Second Lieutenant' },
    { value: 'Cadet First Lieutenant', label: 'Cadet First Lieutenant' },
    { value: 'Cadet Captain', label: 'Cadet Captain' },
    { value: 'Cadet Major', label: 'Cadet Major' },
    { value: 'Cadet Lieutenant Colonel', label: 'Cadet Lieutenant Colonel' },
    { value: 'Cadet Colonel', label: 'Cadet Colonel' },
    { value: '', label: 'Clear Rank' }
  ];

  // Flight options (common flight names)
  const flightOptions = [
    { value: 'Alpha', label: 'Alpha Flight' },
    { value: 'Bravo', label: 'Bravo Flight' },
    { value: 'Charlie', label: 'Charlie Flight' },
    { value: 'Delta', label: 'Delta Flight' },
    { value: 'Echo', label: 'Echo Flight' },
    { value: 'Foxtrot', label: 'Foxtrot Flight' },
    { value: 'Golf', label: 'Golf Flight' },
    { value: 'Hotel', label: 'Hotel Flight' },
    { value: '', label: 'Clear Flight' }
  ];

  // Role options
  const roleOptions = [
    { value: 'cadet', label: 'Cadet' },
    { value: 'command_staff', label: 'Command Staff' },
    { value: 'instructor', label: 'Instructor' }
  ];

  const handleBulkUpdate = async (field: string, value: any) => {
    if (selectedCadets.length === 0) return;
    
    setIsUpdating(true);
    try {
      const updateData = { 
        [field]: value || null,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .in('id', selectedCadets);

      if (error) throw error;
      
      toast({
        title: "Cadets Updated",
        description: `Successfully updated ${field.replace('_', ' ')} for ${selectedCadets.length} cadet${selectedCadets.length > 1 ? 's' : ''}`,
      });
      
      onSelectionClear();
      onRefresh();
    } catch (error) {
      console.error('Failed to update cadets:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update selected cadets. Please try again.",
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
      onRefresh();
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