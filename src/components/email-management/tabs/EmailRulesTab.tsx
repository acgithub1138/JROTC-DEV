import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2, Settings } from 'lucide-react';
import { useEmailRules } from '@/hooks/email/useEmailRules';
import { useEmailTemplates } from '@/hooks/email/useEmailTemplates';
import { useUserManagement } from '@/components/user-management/hooks/useUserManagement';
import { RuleCard } from '../components/RuleCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
export const EmailRulesTab: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    userProfile
  } = useAuth();
  const {
    schools
  } = useUserManagement();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');

  // Determine the school ID to use for fetching rules
  const schoolIdForRules = userProfile?.role === 'admin' ? selectedSchoolId : userProfile?.school_id || '';

  // Only fetch rules when a school is selected (for admin) or automatically for non-admin users
  const {
    rules,
    isLoading: rulesLoading,
    updateRule,
    isUpdating
  } = useEmailRules(schoolIdForRules);
  const {
    templates,
    isLoading: templatesLoading
  } = useEmailTemplates();
  const isLoading = rulesLoading || templatesLoading;
  const taskTemplates = templates.filter(t => t.source_table === 'tasks' && t.is_active);
  const subtaskTemplates = templates.filter(t => t.source_table === 'subtasks' && t.is_active);
  const competitionTemplates = templates.filter(t => t.source_table === 'cp_comp_schools' && t.is_active);
  const activeRulesWithoutTemplates = rules.filter(r => r.is_active && !r.template_id);

  // Sort rules alphabetically by rule type (name)
  const sortedRules = [...rules].sort((a, b) => {
    return a.rule_type.localeCompare(b.rule_type);
  });
  const handleToggleRule = (ruleId: string, isActive: boolean) => {
    updateRule({
      id: ruleId,
      is_active: isActive
    });
  };
  const handleTemplateSelect = (ruleId: string, templateId: string | null) => {
    updateRule({
      id: ruleId,
      template_id: templateId
    });
  };
  const handlePreview = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      navigate('/app/email/email_preview_record', {
        state: {
          subject: template.subject,
          body: template.body,
          sourceTable: template.source_table,
          templateId: template.id,
          from: location.pathname
        }
      });
    }
  };
  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading email rules...</span>
        </div>
      </div>;
  }
  return <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Email Rules</h2>
          <p className="text-sm text-muted-foreground">
            Configure automated email notifications for task, subtask, and competition events
          </p>
        </div>
      </div>

      {userProfile?.role === 'admin' && <Card>
          
          <CardContent className="py-[8px]">
            <div className="w-64">
              <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select a school" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border z-50">
                  {schools.filter(school => school.name !== 'Carey Unlimited').map(school => <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>}

      {!selectedSchoolId && userProfile?.role === 'admin' && <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Select a School
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              Please select a school from the dropdown above to view and manage email rules.
            </p>
          </CardContent>
        </Card>}

      {schoolIdForRules && (taskTemplates.length === 0 || subtaskTemplates.length === 0 || competitionTemplates.length === 0) && <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            {taskTemplates.length === 0 && subtaskTemplates.length === 0 && competitionTemplates.length === 0 ? "No email templates found. You need to create email templates before you can activate rules." : [taskTemplates.length === 0 && "task templates", subtaskTemplates.length === 0 && "subtask templates", competitionTemplates.length === 0 && "competition templates"].filter(Boolean).join(", ") + " are missing."}
            Go to the Templates tab to create templates for the relevant source tables.
          </AlertDescription>
        </Alert>}

      {schoolIdForRules && activeRulesWithoutTemplates.length > 0 && <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Some active rules don't have email templates selected. 
            Please select templates for all active rules or disable them.
          </AlertDescription>
        </Alert>}

      {schoolIdForRules && <Card>
          <CardHeader>
            <CardTitle>Available Rules</CardTitle>
            <CardDescription>
              Enable rules to automatically send emails when specific events occur (tasks, subtasks, competitions). 
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
                {sortedRules.length === 0 ? <tr>
                    <td colSpan={4} className="text-center py-8">
                      <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <div className="text-lg font-medium text-muted-foreground mb-2">
                        No rules configured
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Email rules will be automatically created for your school.
                      </div>
                    </td>
                  </tr> : sortedRules.map(rule => <RuleCard key={rule.id} rule={rule} templates={templates} onToggle={handleToggleRule} onTemplateSelect={handleTemplateSelect} onPreview={handlePreview} isUpdating={isUpdating} />)}
              </tbody>
            </table>
          </div>
          </CardContent>
        </Card>}
    </div>;
};