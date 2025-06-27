import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { RuleBuilder } from './RuleBuilder';
import { RuleList } from './RuleList';
import { useBusinessRules, BusinessRule } from '@/hooks/useBusinessRules';
import { Skeleton } from '@/components/ui/skeleton';

const BusinessRulesPage = () => {
  const { rules, loading, createRule, updateRule, deleteRule, toggleRule } = useBusinessRules();
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

  const handleSaveRule = async (ruleData: any) => {
    try {
      if (editingRule) {
        await updateRule(editingRule.id, ruleData);
      } else {
        await createRule(ruleData);
      }
      setShowBuilder(false);
      setEditingRule(null);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleDeleteRule = async (id: string) => {
    await deleteRule(id);
  };

  const handleToggleRule = async (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (rule) {
      await toggleRule(id, !rule.is_active);
    }
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

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-96" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
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
              {rules.filter(r => r.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Inactive Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">
              {rules.filter(r => !r.is_active).length}
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
