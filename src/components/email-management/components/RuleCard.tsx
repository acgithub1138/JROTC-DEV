import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
  const sourceTableTemplates = templates.filter(t => t.source_table === 'tasks' && t.is_active);
  const selectedTemplate = templates.find(t => t.id === rule.template_id);
  const hasTemplateError = rule.is_active && !rule.template_id;
  return <Card className={`transition-all duration-200 ${rule.is_active ? 'ring-2 ring-primary/20' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">
            {RULE_LABELS[rule.rule_type]}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasTemplateError && <AlertCircle className="w-4 h-4 text-destructive" />}
            <Badge variant={rule.is_active ? 'default' : 'secondary'}>
              {rule.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {RULE_DESCRIPTIONS[rule.rule_type]}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch id={`rule-${rule.id}`} checked={rule.is_active} onCheckedChange={checked => onToggle(rule.id, checked)} disabled={isUpdating} />
          <Label htmlFor={`rule-${rule.id}`} className="font-medium">
            Enable this rule
          </Label>
        </div>

        {rule.is_active && <div className="space-y-2">
            <Label htmlFor={`template-${rule.id}`} className="text-sm font-medium">
              Email Template
            </Label>
            <Select value={rule.template_id || ''} onValueChange={value => onTemplateSelect(rule.id, value || null)} disabled={isUpdating}>
              <SelectTrigger id={`template-${rule.id}`} className={hasTemplateError ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select an email template..." />
              </SelectTrigger>
              <SelectContent>
                {sourceTableTemplates.length === 0 ? <div className="p-2 text-sm text-muted-foreground">
                    No task templates available
                  </div> : sourceTableTemplates.map(template => <SelectItem key={template.id} value={template.id}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{template.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {template.subject}
                        </span>
                      </div>
                    </SelectItem>)}
              </SelectContent>
            </Select>
            
            {hasTemplateError && <p className="text-xs text-destructive">
                Please select an email template to activate this rule.
              </p>}
            
            {selectedTemplate && !hasTemplateError && <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{selectedTemplate.name}</p>
                  
                </div>
                <Button variant="outline" size="sm" onClick={() => onPreview(selectedTemplate.id)} className="ml-2">
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
              </div>}
          </div>}
      </CardContent>
    </Card>;
};