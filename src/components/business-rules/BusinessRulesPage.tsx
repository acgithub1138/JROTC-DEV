import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, Pause, Trash2, Edit } from 'lucide-react';
import { RuleBuilder } from './RuleBuilder';
import { RuleList } from './RuleList';

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: string;
    table?: string;
    conditions: any[];
  };
  actions: {
    type: string;
    parameters: any;
  }[];
  isActive: boolean;
  createdAt: string;
  lastExecuted?: string;
}

const BusinessRulesPage = () => {
  const [rules, setRules] = useState<BusinessRule[]>([
    {
      id: '1',
      name: 'Task Overdue Notification',
      description: 'Send notification when a task becomes overdue',
      trigger: {
        type: 'time_based',
        table: 'tasks',
        conditions: [{ field: 'due_date', operator: 'less_than', value: 'now()' }]
      },
      actions: [
        { type: 'send_notification', parameters: { message: 'Task is overdue', recipient: 'task.assignee' } }
      ],
      isActive: true,
      createdAt: '2024-01-15T10:30:00Z',
      lastExecuted: '2024-01-16T08:15:00Z'
    }
  ]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState<BusinessRule | null>(null);

  const handleCreateRule = () => {
    setEditingRule(null);
    setShowBuilder(true);
  };

  const handleEditRule = (rule: BusinessRule) => {
    setEditingRule(rule);
    setShowBuilder(true);
  };

  const handleSaveRule = (rule: BusinessRule) => {
    if (editingRule) {
      setRules(rules.map(r => r.id === rule.id ? rule : r));
    } else {
      setRules([...rules, { ...rule, id: Date.now().toString() }]);
    }
    setShowBuilder(false);
    setEditingRule(null);
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const handleToggleRule = (id: string) => {
    setRules(rules.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  if (showBuilder) {
    return (
      <RuleBuilder
        rule={editingRule}
        onSave={handleSaveRule}
        onCancel={() => {
          setShowBuilder(false);
          setEditingRule(null);
        }}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Business Rules Engine</h1>
          <p className="text-gray-600 mt-2">Create and manage automated business rules with IFTTT-style logic</p>
        </div>
        <Button onClick={handleCreateRule} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {rules.filter(r => r.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Inactive Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">
              {rules.filter(r => !r.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <RuleList
        rules={rules}
        onEdit={handleEditRule}
        onDelete={handleDeleteRule}
        onToggle={handleToggleRule}
      />
    </div>
  );
};

export default BusinessRulesPage;
