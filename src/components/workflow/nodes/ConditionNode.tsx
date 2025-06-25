
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch, Equal, Clock, Shield } from 'lucide-react';

export const ConditionNode = memo(({ data }: { data: any }) => {
  const getIcon = () => {
    switch (data.nodeSubtype) {
      case 'field_comparison':
        return <Equal className="w-4 h-4" />;
      case 'datetime_condition':
        return <Clock className="w-4 h-4" />;
      case 'role_check':
        return <Shield className="w-4 h-4" />;
      default:
        return <GitBranch className="w-4 h-4" />;
    }
  };

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-yellow-100 border-2 border-yellow-500 min-w-32">
      <div className="flex items-center space-x-2">
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-yellow-500"
        />
        {getIcon()}
        <div className="font-medium text-yellow-800">{data.label}</div>
      </div>
      {data.configuration?.description && (
        <div className="text-xs text-yellow-600 mt-1">
          {data.configuration.description}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="w-3 h-3 bg-green-500"
        style={{ top: '25%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        className="w-3 h-3 bg-red-500"
        style={{ top: '75%' }}
      />
    </div>
  );
});

ConditionNode.displayName = "ConditionNode";
