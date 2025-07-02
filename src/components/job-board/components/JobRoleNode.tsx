
import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';

interface JobRoleNodeData {
  job: any;
  role: string;
  cadetName: string;
  rank: string;
  grade: string;
  onHandleClick?: (handleId: string, job: any) => void;
}

interface JobRoleNodeProps {
  data: JobRoleNodeData;
}

const getGradeColor = (grade: string): string => {
  const gradeNumber = parseInt(grade);
  switch (gradeNumber) {
    case 9:
      return 'bg-red-500 text-white'; // Freshman - Red
    case 10:
      return 'bg-green-500 text-white'; // Sophomore - Green
    case 11:
      return 'bg-blue-500 text-white'; // Junior - Blue
    case 12:
      return 'bg-black text-white'; // Senior - Black
    default:
      // Handle text-based grades
      const gradeLower = grade.toLowerCase();
      if (gradeLower.includes('freshman') || gradeLower === '9th') {
        return 'bg-red-500 text-white';
      } else if (gradeLower.includes('sophomore') || gradeLower === '10th') {
        return 'bg-green-500 text-white';
      } else if (gradeLower.includes('junior') || gradeLower === '11th') {
        return 'bg-blue-500 text-white';
      } else if (gradeLower.includes('senior') || gradeLower === '12th') {
        return 'bg-black text-white';
      }
      return 'bg-gray-500 text-white';
  }
};

const InteractiveHandle = ({ 
  id, 
  type, 
  position, 
  isActive, 
  onClick 
}: {
  id: string;
  type: 'source' | 'target';
  position: Position;
  isActive: boolean;
  onClick: () => void;
}) => (
  <Handle
    id={id}
    type={type}
    position={position}
    className={`transition-all duration-200 cursor-pointer ${
      isActive 
        ? 'w-4 h-4 bg-blue-500 border-2 border-white shadow-lg' 
        : 'w-3 h-3 hover:w-4 hover:h-4 hover:bg-blue-400'
    }`}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
  />
);

export const JobRoleNode = ({ data }: JobRoleNodeProps) => {
  const { job, role, cadetName, rank, grade, onHandleClick } = data;
  const [activeHandle, setActiveHandle] = useState<string | null>(null);

  const handleClick = (handleId: string) => {
    setActiveHandle(handleId);
    onHandleClick?.(handleId, job);
  };

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-md min-w-[280px] hover:shadow-lg transition-shadow relative group">
      <InteractiveHandle
        id="top-target"
        type="target"
        position={Position.Top}
        isActive={activeHandle === 'top-target'}
        onClick={() => handleClick('top-target')}
      />
      <InteractiveHandle
        id="top-source"
        type="source"
        position={Position.Top}
        isActive={activeHandle === 'top-source'}
        onClick={() => handleClick('top-source')}
      />
      <InteractiveHandle
        id="left-target"
        type="target"
        position={Position.Left}
        isActive={activeHandle === 'left-target'}
        onClick={() => handleClick('left-target')}
      />
      <InteractiveHandle
        id="left-source"
        type="source"
        position={Position.Left}
        isActive={activeHandle === 'left-source'}
        onClick={() => handleClick('left-source')}
      />
      <InteractiveHandle
        id="right-target"
        type="target"
        position={Position.Right}
        isActive={activeHandle === 'right-target'}
        onClick={() => handleClick('right-target')}
      />
      <InteractiveHandle
        id="right-source"
        type="source"
        position={Position.Right}
        isActive={activeHandle === 'right-source'}
        onClick={() => handleClick('right-source')}
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
        onClick={() => handleClick('bottom-target')}
      />
      <InteractiveHandle
        id="bottom-source"
        type="source"
        position={Position.Bottom}
        isActive={activeHandle === 'bottom-source'}
        onClick={() => handleClick('bottom-source')}
      />
    </div>
  );
};
