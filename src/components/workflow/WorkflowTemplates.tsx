
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Database, Mail, Calendar, Webhook } from 'lucide-react';
import { WorkflowNode, WorkflowEdge } from '@/types/workflow';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

interface WorkflowTemplatesProps {
  onTemplateSelect: (template: WorkflowTemplate) => void;
}

export const WorkflowTemplates: React.FC<WorkflowTemplatesProps> = ({
  onTemplateSelect
}) => {
  const templates: WorkflowTemplate[] = [
    {
      id: 'task-automation',
      name: 'Task Automation',
      description: 'Auto-assign tasks based on priority and team member availability',
      category: 'Task Management',
      icon: <FileText className="w-5 h-5" />,
      nodes: [
        {
          id: 'trigger1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: {
            label: 'New Task Created',
            nodeType: 'trigger',
            nodeSubtype: 'database_change',
            configuration: {
              table: 'tasks',
              event: 'insert'
            }
          }
        },
        {
          id: 'condition1',
          type: 'condition',
          position: { x: 300, y: 100 },
          data: {
            label: 'Check Priority',
            nodeType: 'condition',
            nodeSubtype: 'field_comparison',
            configuration: {
              field: 'priority',
              operator: 'equals',
              value: 'high'
            }
          }
        },
        {
          id: 'action1',
          type: 'action',
          position: { x: 500, y: 50 },
          data: {
            label: 'Assign to Team Lead',
            nodeType: 'action',
            nodeSubtype: 'update_record',
            configuration: {
              table: 'tasks',
              field: 'assigned_to',
              value: '{{team_lead_id}}'
            }
          }
        },
        {
          id: 'action2',
          type: 'action',
          position: { x: 500, y: 150 },
          data: {
            label: 'Auto-assign Available Member',
            nodeType: 'action',
            nodeSubtype: 'update_record',
            configuration: {
              table: 'tasks',
              field: 'assigned_to',
              value: '{{available_member_id}}'
            }
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'trigger1', target: 'condition1' },
        { id: 'e2', source: 'condition1', target: 'action1', sourceHandle: 'true' },
        { id: 'e3', source: 'condition1', target: 'action2', sourceHandle: 'false' }
      ]
    },
    {
      id: 'email-notification',
      name: 'Email Notifications',
      description: 'Send email notifications when tasks are overdue',
      category: 'Communications',
      icon: <Mail className="w-5 h-5" />,
      nodes: [
        {
          id: 'trigger1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: {
            label: 'Daily Schedule',
            nodeType: 'trigger',
            nodeSubtype: 'schedule',
            configuration: {
              schedule: '0 9 * * *', // 9 AM daily
              timezone: 'UTC'
            }
          }
        },
        {
          id: 'data1',
          type: 'data',
          position: { x: 300, y: 100 },
          data: {
            label: 'Find Overdue Tasks',
            nodeType: 'data',
            nodeSubtype: 'data_lookup',
            configuration: {
              table: 'tasks',
              filter: 'due_date < NOW() AND status != "completed"'
            }
          }
        },
        {
          id: 'action1',
          type: 'action',
          position: { x: 500, y: 100 },
          data: {
            label: 'Send Email Alert',
            nodeType: 'action',
            nodeSubtype: 'send_email',
            configuration: {
              to: '{{assigned_to.email}}',
              subject: 'Overdue Task: {{title}}',
              template: 'overdue_task_notification'
            }
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'trigger1', target: 'data1' },
        { id: 'e2', source: 'data1', target: 'action1' }
      ]
    },
    {
      id: 'data-sync',
      name: 'Data Synchronization',
      description: 'Sync cadet information with external systems',
      category: 'Data Management',
      icon: <Database className="w-5 h-5" />,
      nodes: [
        {
          id: 'trigger1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: {
            label: 'Cadet Updated',
            nodeType: 'trigger',
            nodeSubtype: 'database_change',
            configuration: {
              table: 'cadets',
              event: 'update'
            }
          }
        },
        {
          id: 'data1',
          type: 'data',
          position: { x: 300, y: 100 },
          data: {
            label: 'Transform Data',
            nodeType: 'data',
            nodeSubtype: 'field_mapping',
            configuration: {
              mappings: {
                'first_name': 'firstName',
                'last_name': 'lastName',
                'cadet_id': 'studentId'
              }
            }
          }
        },
        {
          id: 'action1',
          type: 'action',
          position: { x: 500, y: 100 },
          data: {
            label: 'Update External System',
            nodeType: 'action',
            nodeSubtype: 'external_api',
            configuration: {
              url: 'https://api.external-system.com/students',
              method: 'PUT',
              headers: {
                'Authorization': 'Bearer {{api_token}}'
              }
            }
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'trigger1', target: 'data1' },
        { id: 'e2', source: 'data1', target: 'action1' }
      ]
    }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Task Management': return <FileText className="w-4 h-4" />;
      case 'Communications': return <Mail className="w-4 h-4" />;
      case 'Data Management': return <Database className="w-4 h-4" />;
      case 'Scheduling': return <Calendar className="w-4 h-4" />;
      case 'Integrations': return <Webhook className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Workflow Templates</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                {template.icon}
                <CardTitle className="text-base">{template.name}</CardTitle>
              </div>
              <Badge variant="secondary" className="w-fit">
                {getCategoryIcon(template.category)}
                <span className="ml-1">{template.category}</span>
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                <span>{template.nodes.length} nodes</span>
                <span>{template.edges.length} connections</span>
              </div>
              <Button 
                onClick={() => onTemplateSelect(template)}
                className="w-full"
                size="sm"
              >
                Use Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
