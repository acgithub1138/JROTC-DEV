
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play, Database, Clock, Webhook } from 'lucide-react';

export const TriggerNode = memo(({ data }: { data: any }) => {
  const getIcon = () => {
    switch (data.nodeSubtype) {
      case 'database_change':
        return <Database className="w-4 h-4" />;
      case 'schedule':
        return <Clock className="w-4 h-4" />;
      case 'webhook':
        return <Webhook className="w-4 h-4" />;
      default:
        return <Play className="w-4 h-4" />;
    }
  };

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-green-100 border-2 border-green-500 min-w-32">
      <div className="flex items-center space-x-2">
        {getIcon()}
        <div className="font-medium text-green-800">{data.label}</div>
      </div>
      {data.configuration?.description && (
        <div className="text-xs text-green-600 mt-1">
          {data.configuration.description}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-500"
      />
    </div>
  );
});

TriggerNode.displayName = "TriggerNode";
