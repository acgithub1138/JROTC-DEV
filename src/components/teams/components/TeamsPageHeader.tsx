import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface TeamsPageHeaderProps {
  onAddTeam: () => void;
}

export const TeamsPageHeader = ({ onAddTeam }: TeamsPageHeaderProps) => {
  return (
    <div className="flex justify-end items-center">
      
      <Button onClick={onAddTeam} className="flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Add Team
      </Button>
    </div>
  );
};