import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { formatInTimeZone } from 'date-fns-tz';

interface TaskInfoFieldsProps {
  mode: 'create' | 'edit';
  taskNumber?: string;
  createdAt?: string;
  createdBy?: string;
}

export const TaskInfoFields: React.FC<TaskInfoFieldsProps> = ({
  mode,
  taskNumber,
  createdAt,
  createdBy
}) => {
  const { userProfile } = useAuth();
  
  // For create mode, show current user and current time
  const displayCreatedBy = mode === 'create' 
    ? `${userProfile?.last_name}, ${userProfile?.first_name}` 
    : createdBy || 'Unknown';
    
  const displayCreatedAt = mode === 'create' 
    ? formatInTimeZone(new Date(), 'America/New_York', 'MM/dd/yyyy HH:mm')
    : createdAt 
      ? formatInTimeZone(new Date(createdAt), 'America/New_York', 'MM/dd/yyyy HH:mm')
      : '';

  const displayTaskNumber = mode === 'create' ? 'Next #' : taskNumber || '';

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-4">
        <Label className="sm:w-24 sm:text-right text-left">Number</Label>
        <Input value={displayTaskNumber} disabled className="bg-muted flex-1" />
      </div>
      
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-4">
        <Label className="sm:w-24 sm:text-right text-left">Created by</Label>
        <Input value={displayCreatedBy} disabled className="bg-muted flex-1" />
      </div>
      
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-4">
        <Label className="sm:w-24 sm:text-right text-left">Created</Label>
        <Input value={displayCreatedAt} disabled className="bg-muted flex-1" />
      </div>
    </div>
  );
};