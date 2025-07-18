
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Eye } from 'lucide-react';
import { EmailRule, RULE_LABELS, RULE_DESCRIPTIONS } from '@/hooks/email/useEmailRules';
import { EmailTemplate } from '@/hooks/email/useEmailTemplates';

interface RuleCardProps {
  rule: EmailRule;
  templates: EmailTemplate[];
  onToggle: (ruleId: string, isActive: boolean) => void;
  onTemplateSelect: (ruleId: string, templateId: string | null) => void;
  onPreview: (templateId: string) => void;
  isUpdating: boolean;
}

export const RuleCard: React.FC<RuleCardProps> = ({
  rule,
  templates,
  onToggle,
  onTemplateSelect,
  onPreview,
  isUpdating
}) => {
  // Determine source table based on rule type
  const sourceTable = rule.rule_type.startsWith('subtask_') ? 'subtasks' : 'tasks';
  
  // Filter templates based on the rule's source table
  const relevantTemplates = templates.filter(t => t.source_table === sourceTable && t.is_active);
  
  const selectedTemplate = templates.find(t => t.id === rule.template_id);
  const hasTemplateError = rule.is_active && !rule.template_id;

  return (
    <tr className={`border-b transition-all duration-200 ${rule.is_active ? 'bg-primary/5' : ''}`}>
      {/* Rule Info Column */}
      <td className="py-4 px-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{RULE_LABELS[rule.rule_type] || rule.rule_type}</span>
            {hasTemplateError && <AlertCircle className="w-4 h-4 text-destructive" />}
          </div>
          <p className="text-sm text-muted-foreground">
            {RULE_DESCRIPTIONS[rule.rule_type] || `Triggered for ${rule.rule_type}`}
            {(rule.rule_type === 'task_overdue_reminder' || rule.rule_type === 'subtask_overdue_reminder') && (
              <span className="block text-xs mt-1 text-amber-600">
                Automated daily at 10:00 AM UTC
              </span>
            )}
          </p>
        </div>
      </td>

      {/* Status Column */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <Switch 
            checked={rule.is_active} 
            onCheckedChange={(checked) => onToggle(rule.id, checked)} 
            disabled={isUpdating} 
          />
          <Badge variant={rule.is_active ? 'default' : 'secondary'}>
            {rule.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </td>

      {/* Template Column */}
      <td className="py-4 px-4">
        {rule.is_active ? (
          <div className="space-y-2 min-w-[200px]">
            <Select 
              value={rule.template_id || ''} 
              onValueChange={(value) => onTemplateSelect(rule.id, value || null)} 
              disabled={isUpdating}
            >
              <SelectTrigger className={hasTemplateError ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select template..." />
              </SelectTrigger>
              <SelectContent>
                {relevantTemplates.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No {sourceTable} templates available
                  </div>
                ) : (
                  relevantTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {hasTemplateError && (
              <p className="text-xs text-destructive">
                Please select an email template to activate this rule.
              </p>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </td>

      {/* Actions Column */}
      <td className="py-4 px-4">
        {selectedTemplate && !hasTemplateError ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onPreview(selectedTemplate.id)}
          >
            <Eye className="w-4 h-4 mr-1" />
            Preview
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </td>
    </tr>
  );
};
