import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JobBoardWithCadet } from '../types';

interface ConnectionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceJob: JobBoardWithCadet;
  targetJob: JobBoardWithCadet;
  connectionType: 'reports_to' | 'assistant';
  connectionId?: string | null;
  currentSourceHandle: string | null;
  currentTargetHandle: string | null;
  onSave: (sourceHandle: string, targetHandle: string) => void;
}

const handleOptions = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
];

export const ConnectionEditModal = ({
  isOpen,
  onClose,
  sourceJob,
  targetJob,
  connectionType,
  connectionId,
  currentSourceHandle,
  currentTargetHandle,
  onSave,
}: ConnectionEditModalProps) => {
  const [sourceHandle, setSourceHandle] = useState(
    currentSourceHandle ? currentSourceHandle.split('-')[0] : 'bottom'
  );
  const [targetHandle, setTargetHandle] = useState(
    currentTargetHandle ? currentTargetHandle.split('-')[0] : 'top'
  );

  // Update state when props change
  useEffect(() => {
    setSourceHandle(currentSourceHandle ? currentSourceHandle.split('-')[0] : 'bottom');
    setTargetHandle(currentTargetHandle ? currentTargetHandle.split('-')[0] : 'top');
  }, [currentSourceHandle, currentTargetHandle]);

  const handleSave = () => {
    const newSourceHandle = `${sourceHandle}-source`;
    const newTargetHandle = `${targetHandle}-target`;
    onSave(newSourceHandle, newTargetHandle);
    onClose();
  };

  const connectionTypeLabel = connectionType === 'reports_to' ? 'Reports To' : 'Assistant';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {connectionTypeLabel} Connection</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">
                To: {targetJob.role} {targetJob.cadet ? `(${targetJob.cadet.last_name}, ${targetJob.cadet.first_name})` : '(Unassigned)'}
              </h4>
              <Select value={targetHandle} onValueChange={setTargetHandle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select connection point" />
                </SelectTrigger>
                <SelectContent>
                  {handleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">
                From: {sourceJob.role} {sourceJob.cadet ? `(${sourceJob.cadet.last_name}, ${sourceJob.cadet.first_name})` : '(Unassigned)'}
              </h4>
              <Select value={sourceHandle} onValueChange={setSourceHandle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select connection point" />
                </SelectTrigger>
                <SelectContent>
                  {handleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};