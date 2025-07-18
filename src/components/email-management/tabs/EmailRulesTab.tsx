import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, Settings } from 'lucide-react';
import { useEmailRules } from '@/hooks/email/useEmailRules';
import { useEmailTemplates } from '@/hooks/email/useEmailTemplates';
import { RuleCard } from '../components/RuleCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmailPreviewDialog } from '../dialogs/EmailPreviewDialog';

export const EmailRulesTab: React.FC = () => {
  const { rules, isLoading: rulesLoading, updateRule, isUpdating } = useEmailRules();
  const { templates, isLoading: templatesLoading } = useEmailTemplates();
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] = useState<string | null>(null);

  const isLoading = rulesLoading || templatesLoading;
  const taskTemplates = templates.filter(t => t.source_table === 'tasks' && t.is_active);
  const activeRulesWithoutTemplates = rules.filter(r => r.is_active && !r.template_id);

  // Sort rules in desired order: Task Created, Task Information Needed, Task Completed, Task Canceled
  const ruleOrder = ['task_created', 'task_information_needed', 'task_completed', 'task_canceled'];
  const sortedRules = [...rules].sort((a, b) => {
    const aIndex = ruleOrder.indexOf(a.rule_type);
    const bIndex = ruleOrder.indexOf(b.rule_type);
    return aIndex - bIndex;
  });

  const handleToggleRule = (ruleId: string, isActive: boolean) => {
    updateRule({ id: ruleId, is_active: isActive });
  };

  const handleTemplateSelect = (ruleId: string, templateId: string | null) => {
    updateRule({ id: ruleId, template_id: templateId });
  };

  const handlePreview = (templateId: string) => {
    setSelectedTemplateForPreview(templateId);
    setPreviewDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading email rules...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Email Rules</h2>
          <p className="text-sm text-muted-foreground">
            Configure automated email notifications for task events
          </p>
        </div>
      </div>

      {taskTemplates.length === 0 && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            No task email templates found. You need to create task email templates before you can activate rules.
            Go to the Templates tab to create templates for the "tasks" source table.
          </AlertDescription>
        </Alert>
      )}

      {activeRulesWithoutTemplates.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Some active rules don't have email templates selected. 
            Please select templates for all active rules or disable them.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Available Rules</CardTitle>
          <CardDescription>
            Enable rules to automatically send emails when specific task events occur. 
            Each enabled rule requires an associated email template.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Rule</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Template</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedRules.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8">
                      <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <div className="text-lg font-medium text-muted-foreground mb-2">
                        No rules configured
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Email rules will be automatically created for your school.
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedRules.map((rule) => (
                    <RuleCard
                      key={rule.id}
                      rule={rule}
                      templates={templates}
                      onToggle={handleToggleRule}
                      onTemplateSelect={handleTemplateSelect}
                      onPreview={handlePreview}
                      isUpdating={isUpdating}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedTemplateForPreview && (
        <EmailPreviewDialog
          open={previewDialogOpen}
          onOpenChange={setPreviewDialogOpen}
          subject={templates.find(t => t.id === selectedTemplateForPreview)?.subject || ''}
          body={templates.find(t => t.id === selectedTemplateForPreview)?.body || ''}
          sourceTable={templates.find(t => t.id === selectedTemplateForPreview)?.source_table || ''}
          templateId={selectedTemplateForPreview}
        />
      )}
    </div>
  );
};