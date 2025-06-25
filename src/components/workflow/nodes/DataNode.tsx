
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Settings, ArrowRightLeft, Calculator, Database } from 'lucide-react';

export const DataNode = memo(({ data }: { data: any }) => {
  const getIcon = () => {
    switch (data.nodeSubtype) {
      case 'field_mapping':
        return <ArrowRightLeft className="w-4 h-4" />;
      case 'calculation':
        return <Calculator className="w-4 h-4" />;
      case 'data_lookup':
        return <Database className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-purple-100 border-2 border-purple-500 min-w-32">
      <div className="flex items-center space-x-2">
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-purple-500"
        />
        {getIcon()}
        <div className="font-medium text-purple-800">{data.label}</div>
      </div>
      {data.configuration?.description && (
        <div className="text-xs text-purple-600 mt-1">
          {data.configuration.description}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-purple-500"
      />
    </div>
  );
});

DataNode.displayName = "DataNode";
