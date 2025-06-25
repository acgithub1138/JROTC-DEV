
import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Database, 
  Clock, 
  Webhook,
  GitBranch,
  Equal,
  Shield,
  Zap,
  Plus,
  Edit,
  Trash2,
  Mail,
  ExternalLink,
  Settings,
  ArrowRightLeft,
  Calculator
} from 'lucide-react';
import { NodeTypeDefinition } from '@/types/workflow';

const nodeDefinitions: NodeTypeDefinition[] = [
  // Trigger Nodes
  {
    type: 'trigger',
    subtype: 'manual',
    label: 'Manual Trigger',
    description: 'Manually start the workflow',
    category: 'trigger',
    icon: 'Play',
    configSchema: {}
  },
  {
    type: 'trigger',
    subtype: 'database_change',
    label: 'Database Change',
    description: 'Trigger on table changes',
    category: 'trigger',
    icon: 'Database',
    configSchema: {}
  },
  {
    type: 'trigger',
    subtype: 'schedule',
    label: 'Schedule',
    description: 'Run on a schedule',
    category: 'trigger',
    icon: 'Clock',
    configSchema: {}
  },
  {
    type: 'trigger',
    subtype: 'webhook',
    label: 'Webhook',
    description: 'Trigger via HTTP request',
    category: 'trigger',
    icon: 'Webhook',
    configSchema: {}
  },
  // Condition Nodes
  {
    type: 'condition',
    subtype: 'field_comparison',
    label: 'Field Comparison',
    description: 'Compare field values',
    category: 'condition',
    icon: 'Equal',
    configSchema: {}
  },
  {
    type: 'condition',
    subtype: 'datetime_condition',
    label: 'Date/Time Check',
    description: 'Check date/time conditions',
    category: 'condition',
    icon: 'Clock',
    configSchema: {}
  },
  {
    type: 'condition',
    subtype: 'role_check',
    label: 'Role Check',
    description: 'Check user roles',
    category: 'condition',
    icon: 'Shield',
    configSchema: {}
  },
  // Action Nodes
  {
    type: 'action',
    subtype: 'create_record',
    label: 'Create Record',
    description: 'Create a new record',
    category: 'action',
    icon: 'Plus',
    configSchema: {}
  },
  {
    type: 'action',
    subtype: 'update_record',
    label: 'Update Record',
    description: 'Update existing record',
    category: 'action',
    icon: 'Edit',
    configSchema: {}
  },
  {
    type: 'action',
    subtype: 'delete_record',
    label: 'Delete Record',
    description: 'Delete a record',
    category: 'action',
    icon: 'Trash2',
    configSchema: {}
  },
  {
    type: 'action',
    subtype: 'send_email',
    label: 'Send Email',
    description: 'Send email notification',
    category: 'action',
    icon: 'Mail',
    configSchema: {}
  },
  {
    type: 'action',
    subtype: 'external_api',
    label: 'External API',
    description: 'Call external API',
    category: 'action',
    icon: 'ExternalLink',
    configSchema: {}
  },
  // Data Processing Nodes
  {
    type: 'data',
    subtype: 'field_mapping',
    label: 'Field Mapping',
    description: 'Map data between fields',
    category: 'data',
    icon: 'ArrowRightLeft',
    configSchema: {}
  },
  {
    type: 'data',
    subtype: 'calculation',
    label: 'Calculation',
    description: 'Perform calculations',
    category: 'data',
    icon: 'Calculator',
    configSchema: {}
  },
];

const iconMap = {
  Play, Database, Clock, Webhook, GitBranch, Equal, Shield,
  Zap, Plus, Edit, Trash2, Mail, ExternalLink, Settings,
  ArrowRightLeft, Calculator
};

interface NodePaletteProps {
  onNodeAdd: (nodeDefinition: NodeTypeDefinition) => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ onNodeAdd }) => {
  const categories = ['trigger', 'condition', 'action', 'data'] as const;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'trigger': return 'text-green-600 bg-green-50';
      case 'condition': return 'text-yellow-600 bg-yellow-50';
      case 'action': return 'text-blue-600 bg-blue-50';
      case 'data': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="w-64 border-r bg-white">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Node Palette</h3>
        <p className="text-sm text-gray-600">Drag nodes to canvas</p>
      </div>
      
      <ScrollArea className="h-full">
        <div className="p-2">
          {categories.map((category) => (
            <div key={category} className="mb-4">
              <h4 className="font-medium text-sm uppercase tracking-wide mb-2 px-2">
                {category}s
              </h4>
              <div className="space-y-1">
                {nodeDefinitions
                  .filter(node => node.category === category)
                  .map((node) => {
                    const Icon = iconMap[node.icon as keyof typeof iconMap];
                    return (
                      <Button
                        key={`${node.type}-${node.subtype}`}
                        variant="ghost"
                        className={`w-full justify-start h-auto p-2 ${getCategoryColor(category)}`}
                        onClick={() => onNodeAdd(node)}
                      >
                        <div className="flex items-start space-x-2">
                          <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div className="text-left">
                            <div className="font-medium text-xs">{node.label}</div>
                            <div className="text-xs opacity-75">{node.description}</div>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
              </div>
              {category !== 'data' && <Separator className="mt-4" />}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
