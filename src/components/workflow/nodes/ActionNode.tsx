
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap, Plus, Edit, Trash2, Mail, ExternalLink } from 'lucide-react';

export const ActionNode = memo(({ data }: { data: any }) => {
  const getIcon = () => {
    switch (data.nodeSubtype) {
      case 'create_record':
        return <Plus className="w-4 h-4" />;
      case 'update_record':
        return <Edit className="w-4 h-4" />;
      case 'delete_record':
        return <Trash2 className="w-4 h-4" />;
      case 'send_email':
        return <Mail className="w-4 h-4" />;
      case 'external_api':
        return <ExternalLink className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-blue-100 border-2 border-blue-500 min-w-32">
      <div className="flex items-center space-x-2">
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-blue-500"
        />
        {getIcon()}
        <div className="font-medium text-blue-800">{data.label}</div>
      </div>
      {data.configuration?.description && (
        <div className="text-xs text-blue-600 mt-1">
          {data.configuration.description}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500"
      />
    </div>
  );
});

ActionNode.displayName = "ActionNode";
