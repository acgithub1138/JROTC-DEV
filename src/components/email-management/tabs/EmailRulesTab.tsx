import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, Settings, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEmailRules } from '@/hooks/email/useEmailRules';
import { useEmailTemplates } from '@/hooks/email/useEmailTemplates';
import { RuleCard } from '../components/RuleCard';
import { BulkRuleActions } from '../components/BulkRuleActions';
import { RuleAnalytics } from '../components/RuleAnalytics';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const EmailRulesTab: React.FC = () => {
  const { rules, isLoading: rulesLoading, updateRule, isUpdating } = useEmailRules();
  const { templates, isLoading: templatesLoading } = useEmailTemplates();

  const isLoading = rulesLoading || templatesLoading;
  const taskTemplates = templates.filter(t => t.source_table === 'tasks' && t.is_active);
  const activeRulesWithoutTemplates = rules.filter(r => r.is_active && !r.template_id);

  const handleToggleRule = (ruleId: string, isActive: boolean) => {
    updateRule({ id: ruleId, is_active: isActive });
  };

  const handleTemplateSelect = (ruleId: string, templateId: string | null) => {
    updateRule({ id: ruleId, template_id: templateId });
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

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Rules Management
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-6">
          {/* Bulk Actions */}
          {rules.length > 0 && <BulkRuleActions rules={rules} />}

          <Card>
            <CardHeader>
              <CardTitle>Available Rules</CardTitle>
              <CardDescription>
                Enable rules to automatically send emails when specific task events occur. 
                Each enabled rule requires an associated email template.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {rules.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    templates={templates}
                    onToggle={handleToggleRule}
                    onTemplateSelect={handleTemplateSelect}
                    isUpdating={isUpdating}
                  />
                ))}
              </div>
              
              {rules.length === 0 && (
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No rules configured
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Email rules will be automatically created for your school.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <RuleAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};