
import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { getGradeColor } from '@/utils/gradeColors';

interface JobRoleNodeData {
  job: any;
  role: string;
  cadetName: string;
  rank: string;
  grade: string;
  occupiedHandles: Set<string>;
  onHandleDragStart?: (handleId: string, job: any, event: React.MouseEvent) => void;
  onHandleDrop?: (targetJobId: string, targetHandle: string) => void;
  isValidDropTarget?: (jobId: string, handleId: string) => boolean;
  editState?: any;
}

interface JobRoleNodeProps {
  data: JobRoleNodeData;
}


const InteractiveHandle = ({ 
  id, 
  type, 
  position, 
  isActive,
  isValidDropTarget,
  isDragMode,
  hasConnection,
  onMouseDown,
  onMouseUp
}: {
  id: string;
  type: 'source' | 'target';
  position: Position;
  isActive: boolean;
  isValidDropTarget: boolean;
  isDragMode: boolean;
  hasConnection: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
}) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow interaction if this handle has an existing connection
    if (!hasConnection) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
    onMouseDown(e);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMouseUp(e);
  };

  return (
    <Handle
      id={id}
      type={type}
      position={position}
      className={`transition-all duration-200 ${
        hasConnection 
          ? 'cursor-pointer' 
          : 'cursor-default pointer-events-none opacity-30'
      } ${
        isActive 
          ? 'w-4 h-4 bg-primary border-2 border-white shadow-lg' 
          : isDragMode && isValidDropTarget
          ? 'w-4 h-4 bg-green-500 border-2 border-white shadow-lg'
          : isDragMode
          ? 'w-3 h-3 bg-red-500 opacity-50'
          : hasConnection
          ? 'w-4 h-4 bg-primary/80 border-2 border-white shadow hover:bg-primary'
          : 'w-2 h-2 bg-gray-300 border border-gray-400'
      }`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    />
  );
};

export const JobRoleNode = ({ data }: JobRoleNodeProps) => {
  const { job, role, cadetName, rank, grade, occupiedHandles, onHandleDragStart, onHandleDrop, isValidDropTarget, editState } = data;
  const [activeHandle, setActiveHandle] = useState<string | null>(null);

  const handleMouseDown = (handleId: string, event: React.MouseEvent) => {
    setActiveHandle(handleId);
    onHandleDragStart?.(handleId, job, event);
  };

  const handleMouseUp = (handleId: string, event: React.MouseEvent) => {
    if (editState?.isDragging && isValidDropTarget?.(job.id, handleId)) {
      onHandleDrop?.(job.id, handleId);
    }
    setActiveHandle(null);
  };

  return (
    <div className={`bg-white border-2 rounded-lg p-4 shadow-md min-w-[280px] hover:shadow-lg transition-all relative group ${
      editState?.isDragging ? 'border-primary/50' : 'border-gray-300'
    }`}>
      <InteractiveHandle
        id="top-target"
        type="target"
        position={Position.Top}
        isActive={activeHandle === 'top-target'}
        isValidDropTarget={isValidDropTarget?.(job.id, 'top-target') || false}
        isDragMode={editState?.isDragging || false}
        hasConnection={occupiedHandles.has('top-target')}
        onMouseDown={(e) => handleMouseDown('top-target', e)}
        onMouseUp={(e) => handleMouseUp('top-target', e)}
      />
      <InteractiveHandle
        id="top-source"
        type="source"
        position={Position.Top}
        isActive={activeHandle === 'top-source'}
        isValidDropTarget={isValidDropTarget?.(job.id, 'top-source') || false}
        isDragMode={editState?.isDragging || false}
        hasConnection={occupiedHandles.has('top-source')}
        onMouseDown={(e) => handleMouseDown('top-source', e)}
        onMouseUp={(e) => handleMouseUp('top-source', e)}
      />
      <InteractiveHandle
        id="left-target"
        type="target"
        position={Position.Left}
        isActive={activeHandle === 'left-target'}
        isValidDropTarget={isValidDropTarget?.(job.id, 'left-target') || false}
        isDragMode={editState?.isDragging || false}
        hasConnection={occupiedHandles.has('left-target')}
        onMouseDown={(e) => handleMouseDown('left-target', e)}
        onMouseUp={(e) => handleMouseUp('left-target', e)}
      />
      <InteractiveHandle
        id="left-source"
        type="source"
        position={Position.Left}
        isActive={activeHandle === 'left-source'}
        isValidDropTarget={isValidDropTarget?.(job.id, 'left-source') || false}
        isDragMode={editState?.isDragging || false}
        hasConnection={occupiedHandles.has('left-source')}
        onMouseDown={(e) => handleMouseDown('left-source', e)}
        onMouseUp={(e) => handleMouseUp('left-source', e)}
      />
      <InteractiveHandle
        id="right-target"
        type="target"
        position={Position.Right}
        isActive={activeHandle === 'right-target'}
        isValidDropTarget={isValidDropTarget?.(job.id, 'right-target') || false}
        isDragMode={editState?.isDragging || false}
        hasConnection={occupiedHandles.has('right-target')}
        onMouseDown={(e) => handleMouseDown('right-target', e)}
        onMouseUp={(e) => handleMouseUp('right-target', e)}
      />
      <InteractiveHandle
        id="right-source"
        type="source"
        position={Position.Right}
        isActive={activeHandle === 'right-source'}
        isValidDropTarget={isValidDropTarget?.(job.id, 'right-source') || false}
        isDragMode={editState?.isDragging || false}
        hasConnection={occupiedHandles.has('right-source')}
        onMouseDown={(e) => handleMouseDown('right-source', e)}
        onMouseUp={(e) => handleMouseUp('right-source', e)}
      />
      
      <div className="space-y-2">
        {/* Role Name */}
        <div className="font-bold text-lg text-gray-900 text-center border-b pb-2">
          {role}
        </div>
        
        {/* Cadet Name */}
        <div className="text-center">
          <div className="font-semibold text-gray-800">{cadetName}</div>
        </div>
        
        {/* Rank and Grade */}
        <div className="flex justify-between items-center pt-2">
          {rank && (
            <Badge variant="outline" className="text-xs">
              {rank}
            </Badge>
          )}
          {grade && (
            <Badge className={`text-xs ${getGradeColor(grade)}`}>
              {grade}
            </Badge>
          )}
        </div>
      </div>
      
      <InteractiveHandle
        id="bottom-target"
        type="target"
        position={Position.Bottom}
        isActive={activeHandle === 'bottom-target'}
        isValidDropTarget={isValidDropTarget?.(job.id, 'bottom-target') || false}
        isDragMode={editState?.isDragging || false}
        hasConnection={occupiedHandles.has('bottom-target')}
        onMouseDown={(e) => handleMouseDown('bottom-target', e)}
        onMouseUp={(e) => handleMouseUp('bottom-target', e)}
      />
      <InteractiveHandle
        id="bottom-source"
        type="source"
        position={Position.Bottom}
        isActive={activeHandle === 'bottom-source'}
        isValidDropTarget={isValidDropTarget?.(job.id, 'bottom-source') || false}
        isDragMode={editState?.isDragging || false}
        hasConnection={occupiedHandles.has('bottom-source')}
        onMouseDown={(e) => handleMouseDown('bottom-source', e)}
        onMouseUp={(e) => handleMouseUp('bottom-source', e)}
      />
    </div>
  );
};
