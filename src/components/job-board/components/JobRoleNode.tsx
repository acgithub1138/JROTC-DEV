
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
}

interface JobRoleNodeProps {
  data: JobRoleNodeData;
}


const SimpleHandle = ({ 
  id, 
  type, 
  position, 
  hasConnection
}: {
  id: string;
  type: 'source' | 'target';
  position: Position;
  hasConnection: boolean;
}) => {
  return (
    <Handle
      id={id}
      type={type}
      position={position}
      className={`pointer-events-none ${
        hasConnection
          ? 'w-3 h-3 bg-primary border-2 border-white shadow'
          : 'w-2 h-2 bg-gray-300 border border-gray-400 opacity-50'
      }`}
    />
  );
};

export const JobRoleNode = ({ data }: JobRoleNodeProps) => {
  const { job, role, cadetName, rank, grade, occupiedHandles } = data;

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-md min-w-[280px] hover:shadow-lg transition-all relative group">
      <SimpleHandle
        id="top-target"
        type="target"
        position={Position.Top}
        hasConnection={occupiedHandles.has('top-target')}
      />
      <SimpleHandle
        id="top-source"
        type="source"
        position={Position.Top}
        hasConnection={occupiedHandles.has('top-source')}
      />
      <SimpleHandle
        id="left-target"
        type="target"
        position={Position.Left}
        hasConnection={occupiedHandles.has('left-target')}
      />
      <SimpleHandle
        id="left-source"
        type="source"
        position={Position.Left}
        hasConnection={occupiedHandles.has('left-source')}
      />
      <SimpleHandle
        id="right-target"
        type="target"
        position={Position.Right}
        hasConnection={occupiedHandles.has('right-target')}
      />
      <SimpleHandle
        id="right-source"
        type="source"
        position={Position.Right}
        hasConnection={occupiedHandles.has('right-source')}
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
      
      <SimpleHandle
        id="bottom-target"
        type="target"
        position={Position.Bottom}
        hasConnection={occupiedHandles.has('bottom-target')}
      />
      <SimpleHandle
        id="bottom-source"
        type="source"
        position={Position.Bottom}
        hasConnection={occupiedHandles.has('bottom-source')}
      />
    </div>
  );
};
