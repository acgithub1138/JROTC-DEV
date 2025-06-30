
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useEmailRules } from '@/hooks/email/useEmailRules';
import { EmailRuleDialog } from '../dialogs/EmailRuleDialog';
import { EmailRulesTable } from '../tables/EmailRulesTable';

export const EmailRulesTab: React.FC = () => {
  const { rules, isLoading, deleteRule, updateRule } = useEmailRules();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  const handleEdit = (rule: any) => {
    setEditingRule(rule);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this email rule?')) {
      deleteRule(id);
    }
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    updateRule({ id, is_active: isActive });
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setEditingRule(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Email Rules</h2>
          <p className="text-muted-foreground">
            Configure when emails are automatically sent based on database events.
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Rule
        </Button>
      </div>

      <EmailRulesTable
        rules={rules}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />

      <EmailRuleDialog
        open={showCreateDialog || !!editingRule}
        onOpenChange={handleCloseDialog}
        rule={editingRule}
        mode={editingRule ? 'edit' : 'create'}
      />
    </div>
  );
};
