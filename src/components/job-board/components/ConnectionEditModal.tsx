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
  savedPositions?: Map<string, { x: number; y: number }>;
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
  onSave,
  savedPositions
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
              {(() => {
                // Get actual positions from database if available
                const sourcePosition = savedPositions?.get(sourceJob.id);
                const targetPosition = savedPositions?.get(targetJob.id);
                
                // Calculate relative positioning based on actual coordinates
                let sourceCardClass = 'top-1/2 -translate-y-1/2 right-8'; // default
                let targetCardClass = 'top-1/2 -translate-y-1/2 left-8'; // default
                
                if (sourcePosition && targetPosition) {
                  // Determine relative positioning based on actual coordinates
                  const isTargetBelow = targetPosition.y > sourcePosition.y;
                  const isTargetLeft = targetPosition.x < sourcePosition.x;
                  const isTargetRight = targetPosition.x > sourcePosition.x;
                  
                  // Position source card (supervisor/assistant)
                  if (isTargetBelow && isTargetLeft) {
                    // Target is below and left of source
                    sourceCardClass = 'top-4 right-8';
                    targetCardClass = 'bottom-4 left-8';
                  } else if (isTargetBelow && isTargetRight) {
                    // Target is below and right of source
                    sourceCardClass = 'top-4 left-8';
                    targetCardClass = 'bottom-4 right-8';
                  } else if (!isTargetBelow && isTargetLeft) {
                    // Target is above and left of source
                    sourceCardClass = 'bottom-4 right-8';
                    targetCardClass = 'top-4 left-8';
                  } else if (!isTargetBelow && isTargetRight) {
                    // Target is above and right of source
                    sourceCardClass = 'bottom-4 left-8';
                    targetCardClass = 'top-4 right-8';
                  }
                }
                
                // Calculate connection line coordinates
                const getHandlePosition = (cardClass: string, handle: string) => {
                  const cardWidth = 96; // w-24
                  const cardHeight = 64; // h-16
                  
                  // Parse position from class
                  let baseX = 0, baseY = 0;
                  if (cardClass.includes('left-8')) baseX = 32;
                  if (cardClass.includes('right-8')) baseX = 320 - 32 - cardWidth;
                  if (cardClass.includes('top-4')) baseY = 16;
                  if (cardClass.includes('bottom-4')) baseY = 160 - 16 - cardHeight;
                  if (cardClass.includes('top-1/2')) baseY = 80 - cardHeight/2;
                  
                  // Add handle offset
                  switch (handle) {
                    case 'top': return { x: baseX + cardWidth/2, y: baseY };
                    case 'bottom': return { x: baseX + cardWidth/2, y: baseY + cardHeight };
                    case 'left': return { x: baseX, y: baseY + cardHeight/2 };
                    case 'right': return { x: baseX + cardWidth, y: baseY + cardHeight/2 };
                    default: return { x: baseX + cardWidth/2, y: baseY + cardHeight };
                  }
                };
                
                const sourcePoint = getHandlePosition(sourceCardClass, sourceHandle);
                const targetPoint = getHandlePosition(targetCardClass, targetHandle);
                
                return (
                  <>
                    {/* Connection Line */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      <line
                        x1={sourcePoint.x}
                        y1={sourcePoint.y}
                        x2={targetPoint.x}
                        y2={targetPoint.y}
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                        strokeDasharray="4,4"
                        className="transition-all duration-300"
                      />
                      {/* Arrow marker */}
                      <defs>
                        <marker
                          id="arrowhead"
                          markerWidth="10"
                          markerHeight="7"
                          refX="9"
                          refY="3.5"
                          orient="auto"
                        >
                          <polygon
                            points="0 0, 10 3.5, 0 7"
                            fill="hsl(var(--primary))"
                          />
                        </marker>
                      </defs>
                      <line
                        x1={sourcePoint.x}
                        y1={sourcePoint.y}
                        x2={targetPoint.x}
                        y2={targetPoint.y}
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                        strokeDasharray="4,4"
                        markerEnd="url(#arrowhead)"
                        className="transition-all duration-300"
                      />
                    </svg>
                    
                    {/* Target Job Card */}
                    <div className={`absolute w-24 h-16 transition-all duration-300 ${targetCardClass}`}>
                      <div className="w-24 h-16 bg-card border rounded-lg p-2 shadow-sm">
                        <div className="text-xs font-medium truncate">{targetJob.role}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {targetJob.cadet ? `${targetJob.cadet.last_name}` : 'Unassigned'}
                        </div>
                      </div>
                      {/* Target Handle Indicator */}
                      <div className={`absolute w-2 h-2 bg-primary rounded-full ${targetHandle === 'top' ? '-top-1 left-1/2 -translate-x-1/2' : targetHandle === 'bottom' ? '-bottom-1 left-1/2 -translate-x-1/2' : targetHandle === 'left' ? '-left-1 top-1/2 -translate-y-1/2' : '-right-1 top-1/2 -translate-y-1/2'}`} />
                    </div>

                    {/* Source Job Card */}
                    <div className={`absolute w-24 h-16 transition-all duration-300 ${sourceCardClass}`}>
                      <div className="w-24 h-16 bg-card border rounded-lg p-2 shadow-sm">
                        <div className="text-xs font-medium truncate">{sourceJob.role}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {sourceJob.cadet ? `${sourceJob.cadet.last_name}` : 'Unassigned'}
                        </div>
                      </div>
                      {/* Source Handle Indicator */}
                      <div className={`absolute w-2 h-2 bg-primary rounded-full ${sourceHandle === 'top' ? '-top-1 left-1/2 -translate-x-1/2' : sourceHandle === 'bottom' ? '-bottom-1 left-1/2 -translate-x-1/2' : sourceHandle === 'left' ? '-left-1 top-1/2 -translate-y-1/2' : '-right-1 top-1/2 -translate-y-1/2'}`} />
                    </div>
                  </>
                );
              })()}
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