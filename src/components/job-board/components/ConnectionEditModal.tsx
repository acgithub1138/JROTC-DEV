import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight } from 'lucide-react';
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
const handleOptions = [{
  value: 'top',
  label: 'Top'
}, {
  value: 'bottom',
  label: 'Bottom'
}, {
  value: 'left',
  label: 'Left'
}, {
  value: 'right',
  label: 'Right'
}];
export const ConnectionEditModal = ({
  isOpen,
  onClose,
  sourceJob,
  targetJob,
  connectionType,
  connectionId,
  currentSourceHandle,
  currentTargetHandle,
  onSave
}: ConnectionEditModalProps) => {
  const navigate = useNavigate();
  const [sourceHandle, setSourceHandle] = useState(currentSourceHandle ? currentSourceHandle.split('-')[0] : 'bottom');
  const [targetHandle, setTargetHandle] = useState(currentTargetHandle ? currentTargetHandle.split('-')[0] : 'top');

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
    navigate('/app/job-board?tab=chart');
  };
  const connectionTypeLabel = connectionType === 'reports_to' ? 'Reports To' : 'Assistant';
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {connectionTypeLabel} Connection</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-6">
          {/* Controls - 1/3 width */}
          <div className="w-1/3 space-y-4">
            {connectionType === 'assistant' ? (
              <>
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    From: {targetJob.role} {targetJob.cadet ? `(${targetJob.cadet.last_name}, ${targetJob.cadet.first_name})` : '(Unassigned)'}
                  </h4>
                  <Select value={targetHandle} onValueChange={setTargetHandle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select connection point" />
                    </SelectTrigger>
                    <SelectContent>
                      {handleOptions.map(option => <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    To: {sourceJob.role} {sourceJob.cadet ? `(${sourceJob.cadet.last_name}, ${sourceJob.cadet.first_name})` : '(Unassigned)'}
                  </h4>
                  <Select value={sourceHandle} onValueChange={setSourceHandle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select connection point" />
                    </SelectTrigger>
                    <SelectContent>
                      {handleOptions.map(option => <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    From: {sourceJob.role} {sourceJob.cadet ? `(${sourceJob.cadet.last_name}, ${sourceJob.cadet.first_name})` : '(Unassigned)'}
                  </h4>
                  <Select value={sourceHandle} onValueChange={setSourceHandle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select connection point" />
                    </SelectTrigger>
                    <SelectContent>
                      {handleOptions.map(option => <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    To: {targetJob.role} {targetJob.cadet ? `(${targetJob.cadet.last_name}, ${targetJob.cadet.first_name})` : '(Unassigned)'}
                  </h4>
                  <Select value={targetHandle} onValueChange={setTargetHandle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select connection point" />
                    </SelectTrigger>
                    <SelectContent>
                      {handleOptions.map(option => <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          {/* Visual Preview - 2/3 width */}
          <div className="w-2/3 relative bg-muted/20 rounded-lg p-4 min-h-[200px]">
            <div className="relative h-full w-full" style={{ minHeight: '160px' }}>
              {/* Position cards based on handle positions */}
              {connectionType === 'assistant' ? (
                <>
                  {/* Target Job Card (Assistant) - Positioned based on target handle */}
                  <div className={`absolute w-24 h-16 transition-all duration-300 ${
                    sourceHandle === 'top' && targetHandle === 'bottom' ? 'top-4 left-1/2 -translate-x-1/2' :
                    sourceHandle === 'bottom' && targetHandle === 'top' ? 'bottom-4 left-1/2 -translate-x-1/2' :
                    sourceHandle === 'left' && targetHandle === 'right' ? 'top-1/2 -translate-y-1/2 right-4' :
                    sourceHandle === 'right' && targetHandle === 'left' ? 'top-1/2 -translate-y-1/2 left-4' :
                    sourceHandle === 'top' && targetHandle === 'top' ? 'top-4 left-8' :
                    sourceHandle === 'bottom' && targetHandle === 'bottom' ? 'bottom-4 left-8' :
                    sourceHandle === 'left' && targetHandle === 'left' ? 'top-1/2 -translate-y-1/2 left-4' :
                    sourceHandle === 'right' && targetHandle === 'right' ? 'top-1/2 -translate-y-1/2 right-4' :
                    sourceHandle === 'top' && targetHandle === 'left' ? 'top-4 right-8' :
                    sourceHandle === 'top' && targetHandle === 'right' ? 'top-4 left-8' :
                    sourceHandle === 'bottom' && targetHandle === 'left' ? 'bottom-4 right-8' :
                    sourceHandle === 'bottom' && targetHandle === 'right' ? 'bottom-4 left-8' :
                    sourceHandle === 'left' && targetHandle === 'top' ? 'bottom-8 left-4' :
                    sourceHandle === 'left' && targetHandle === 'bottom' ? 'top-8 left-4' :
                    sourceHandle === 'right' && targetHandle === 'top' ? 'bottom-8 right-4' :
                    'top-8 right-4'
                  }`}>
                    <div className="w-24 h-16 bg-card border rounded-lg p-2 shadow-sm">
                      <div className="text-xs font-medium truncate">{targetJob.role}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {targetJob.cadet ? `${targetJob.cadet.last_name}` : 'Unassigned'}
                      </div>
                    </div>
                    {/* Target Handle Indicator */}
                    <div className={`absolute w-2 h-2 bg-primary rounded-full ${targetHandle === 'top' ? '-top-1 left-1/2 -translate-x-1/2' : targetHandle === 'bottom' ? '-bottom-1 left-1/2 -translate-x-1/2' : targetHandle === 'left' ? '-left-1 top-1/2 -translate-y-1/2' : '-right-1 top-1/2 -translate-y-1/2'}`} />
                  </div>

                  {/* Source Job Card (Supervisor) - Positioned based on source handle */}
                  <div className={`absolute w-24 h-16 transition-all duration-300 ${
                    sourceHandle === 'top' && targetHandle === 'bottom' ? 'bottom-4 left-1/2 -translate-x-1/2' :
                    sourceHandle === 'bottom' && targetHandle === 'top' ? 'top-4 left-1/2 -translate-x-1/2' :
                    sourceHandle === 'left' && targetHandle === 'right' ? 'top-1/2 -translate-y-1/2 left-4' :
                    sourceHandle === 'right' && targetHandle === 'left' ? 'top-1/2 -translate-y-1/2 right-4' :
                    sourceHandle === 'top' && targetHandle === 'top' ? 'top-4 right-8' :
                    sourceHandle === 'bottom' && targetHandle === 'bottom' ? 'bottom-4 right-8' :
                    sourceHandle === 'left' && targetHandle === 'left' ? 'top-1/2 -translate-y-1/2 right-8' :
                    sourceHandle === 'right' && targetHandle === 'right' ? 'top-1/2 -translate-y-1/2 left-8' :
                    sourceHandle === 'top' && targetHandle === 'left' ? 'top-4 left-8' :
                    sourceHandle === 'top' && targetHandle === 'right' ? 'top-4 right-8' :
                    sourceHandle === 'bottom' && targetHandle === 'left' ? 'bottom-4 left-8' :
                    sourceHandle === 'bottom' && targetHandle === 'right' ? 'bottom-4 right-8' :
                    sourceHandle === 'left' && targetHandle === 'top' ? 'top-8 left-4' :
                    sourceHandle === 'left' && targetHandle === 'bottom' ? 'bottom-8 left-4' :
                    sourceHandle === 'right' && targetHandle === 'top' ? 'top-8 right-4' :
                    'bottom-8 right-4'
                  }`}>
                    <div className="w-24 h-16 bg-card border rounded-lg p-2 shadow-sm">
                      <div className="text-xs font-medium truncate">{sourceJob.role}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {sourceJob.cadet ? `${sourceJob.cadet.last_name}` : 'Unassigned'}
                      </div>
                    </div>
                    {/* Source Handle Indicator */}
                    <div className={`absolute w-2 h-2 bg-primary rounded-full ${sourceHandle === 'top' ? '-top-1 left-1/2 -translate-x-1/2' : sourceHandle === 'bottom' ? '-bottom-1 left-1/2 -translate-x-1/2' : sourceHandle === 'left' ? '-left-1 top-1/2 -translate-y-1/2' : '-right-1 top-1/2 -translate-y-1/2'}`} />
                  </div>

                  {/* Connection Line */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary))" />
                      </marker>
                    </defs>
                    <line 
                      x1="50%" y1="50%" 
                      x2="50%" y2="50%" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth="2" 
                      markerEnd="url(#arrowhead)"
                      className="opacity-60"
                    />
                  </svg>
                </>
              ) : (
                <>
                  {/* Target Job Card (Subordinate) - Positioned based on target handle */}
                  <div className={`absolute w-24 h-16 transition-all duration-300 ${
                    sourceHandle === 'top' && targetHandle === 'bottom' ? 'top-4 left-1/2 -translate-x-1/2' :
                    sourceHandle === 'bottom' && targetHandle === 'top' ? 'bottom-4 left-1/2 -translate-x-1/2' :
                    sourceHandle === 'left' && targetHandle === 'right' ? 'top-1/2 -translate-y-1/2 right-4' :
                    sourceHandle === 'right' && targetHandle === 'left' ? 'top-1/2 -translate-y-1/2 left-4' :
                    sourceHandle === 'top' && targetHandle === 'top' ? 'top-4 left-8' :
                    sourceHandle === 'bottom' && targetHandle === 'bottom' ? 'bottom-4 left-8' :
                    sourceHandle === 'left' && targetHandle === 'left' ? 'top-1/2 -translate-y-1/2 left-4' :
                    sourceHandle === 'right' && targetHandle === 'right' ? 'top-1/2 -translate-y-1/2 right-4' :
                    sourceHandle === 'top' && targetHandle === 'left' ? 'top-4 right-8' :
                    sourceHandle === 'top' && targetHandle === 'right' ? 'top-4 left-8' :
                    sourceHandle === 'bottom' && targetHandle === 'left' ? 'bottom-4 right-8' :
                    sourceHandle === 'bottom' && targetHandle === 'right' ? 'bottom-4 left-8' :
                    sourceHandle === 'left' && targetHandle === 'top' ? 'bottom-8 left-4' :
                    sourceHandle === 'left' && targetHandle === 'bottom' ? 'top-8 left-4' :
                    sourceHandle === 'right' && targetHandle === 'top' ? 'bottom-8 right-4' :
                    'top-8 right-4'
                  }`}>
                    <div className="w-24 h-16 bg-card border rounded-lg p-2 shadow-sm">
                      <div className="text-xs font-medium truncate">{targetJob.role}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {targetJob.cadet ? `${targetJob.cadet.last_name}` : 'Unassigned'}
                      </div>
                    </div>
                    {/* Target Handle Indicator */}
                    <div className={`absolute w-2 h-2 bg-primary rounded-full ${targetHandle === 'top' ? '-top-1 left-1/2 -translate-x-1/2' : targetHandle === 'bottom' ? '-bottom-1 left-1/2 -translate-x-1/2' : targetHandle === 'left' ? '-left-1 top-1/2 -translate-y-1/2' : '-right-1 top-1/2 -translate-y-1/2'}`} />
                  </div>

                  {/* Source Job Card (Supervisor) - Positioned based on source handle */}
                  <div className={`absolute w-24 h-16 transition-all duration-300 ${
                    sourceHandle === 'top' && targetHandle === 'bottom' ? 'bottom-4 left-1/2 -translate-x-1/2' :
                    sourceHandle === 'bottom' && targetHandle === 'top' ? 'top-4 left-1/2 -translate-x-1/2' :
                    sourceHandle === 'left' && targetHandle === 'right' ? 'top-1/2 -translate-y-1/2 left-4' :
                    sourceHandle === 'right' && targetHandle === 'left' ? 'top-1/2 -translate-y-1/2 right-4' :
                    sourceHandle === 'top' && targetHandle === 'top' ? 'top-4 right-8' :
                    sourceHandle === 'bottom' && targetHandle === 'bottom' ? 'bottom-4 right-8' :
                    sourceHandle === 'left' && targetHandle === 'left' ? 'top-1/2 -translate-y-1/2 right-8' :
                    sourceHandle === 'right' && targetHandle === 'right' ? 'top-1/2 -translate-y-1/2 left-8' :
                    sourceHandle === 'top' && targetHandle === 'left' ? 'top-4 left-8' :
                    sourceHandle === 'top' && targetHandle === 'right' ? 'top-4 right-8' :
                    sourceHandle === 'bottom' && targetHandle === 'left' ? 'bottom-4 left-8' :
                    sourceHandle === 'bottom' && targetHandle === 'right' ? 'bottom-4 right-8' :
                    sourceHandle === 'left' && targetHandle === 'top' ? 'top-8 left-4' :
                    sourceHandle === 'left' && targetHandle === 'bottom' ? 'bottom-8 left-4' :
                    sourceHandle === 'right' && targetHandle === 'top' ? 'top-8 right-4' :
                    'bottom-8 right-4'
                  }`}>
                    <div className="w-24 h-16 bg-card border rounded-lg p-2 shadow-sm">
                      <div className="text-xs font-medium truncate">{sourceJob.role}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {sourceJob.cadet ? `${sourceJob.cadet.last_name}` : 'Unassigned'}
                      </div>
                    </div>
                    {/* Source Handle Indicator */}
                    <div className={`absolute w-2 h-2 bg-primary rounded-full ${sourceHandle === 'top' ? '-top-1 left-1/2 -translate-x-1/2' : sourceHandle === 'bottom' ? '-bottom-1 left-1/2 -translate-x-1/2' : sourceHandle === 'left' ? '-left-1 top-1/2 -translate-y-1/2' : '-right-1 top-1/2 -translate-y-1/2'}`} />
                  </div>

                  {/* Connection Line with Arrow */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                      <marker id="arrowhead-reports" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary))" />
                      </marker>
                    </defs>
                    <line 
                      x1="50%" y1="50%" 
                      x2="50%" y2="50%" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth="2" 
                      markerEnd="url(#arrowhead-reports)"
                      className="opacity-60"
                    />
                  </svg>
                </>
              )}
             </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};