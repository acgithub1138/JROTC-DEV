
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';

interface JobRoleNodeData {
  role: string;
  cadetName: string;
  rank: string;
  grade: string;
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

export const JobRoleNode = ({ data }: JobRoleNodeProps) => {
  const { role, cadetName, rank, grade } = data;

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-md min-w-[280px] hover:shadow-lg transition-shadow">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Top} className="w-3 h-3" />
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Left} className="w-3 h-3" />
      <Handle type="target" position={Position.Right} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      
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
      
      <Handle type="target" position={Position.Bottom} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};
