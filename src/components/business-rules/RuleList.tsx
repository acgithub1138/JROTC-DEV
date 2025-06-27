
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Trash2, Edit, Clock, Database } from 'lucide-react';
import { BusinessRule } from '@/hooks/useBusinessRules';

interface RuleListProps {
  rules: BusinessRule[];
  onEdit: (rule: BusinessRule) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

export const RuleList: React.FC<RuleListProps> = ({
  rules,
  onEdit,
  onDelete,
  onToggle,
}) => {
  if (rules.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">No Rules Created</h3>
            <p className="text-gray-600 mb-4">
              Start by creating your first business rule to automate processes.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {rules.map((rule) => (
        <Card key={rule.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-lg">{rule.name}</CardTitle>
                  <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <CardDescription>{rule.description}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onToggle(rule.id)}
                  title={rule.is_active ? 'Pause Rule' : 'Activate Rule'}
                >
                  {rule.is_active ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(rule)}
                  title="Edit Rule"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(rule.id)}
                  title="Delete Rule"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-1">Trigger</h4>
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <span>When {rule.trigger_type.replace('_', ' ')} occurs</span>
                    {rule.trigger_table && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <Database className="w-3 h-3" />
                        <span className="font-mono text-xs">{rule.trigger_table}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Actions</h4>
                <div className="space-y-1">
                  {rule.actions.map((action, index) => (
                    <div key={index} className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                      {action.type.replace('_', ' ')}
                    </div>
                  ))}
                </div>
              </div>
              {rule.last_executed && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-3 h-3" />
                  Last executed: {new Date(rule.last_executed).toLocaleString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
