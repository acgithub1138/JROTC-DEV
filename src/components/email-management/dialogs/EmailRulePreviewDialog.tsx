import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmailRule } from '@/hooks/email/useEmailRules';

interface EmailRulePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: EmailRule | null;
}

export const EmailRulePreviewDialog: React.FC<EmailRulePreviewDialogProps> = ({
  open,
  onOpenChange,
  rule,
}) => {
  if (!rule) return null;

  const getTriggerEventLabel = (event: string) => {
    switch (event) {
      case 'INSERT':
        return 'New Record';
      case 'UPDATE':
        return 'Update Record';
      case 'DELETE':
        return 'Delete Record';
      default:
        return event;
    }
  };

  const getRecipientDisplay = (recipientConfig: any) => {
    if (recipientConfig?.recipient_type === 'static') {
      return {
        type: 'Static Email',
        value: recipientConfig.static_email || 'Not configured'
      };
    }
    return {
      type: 'Dynamic Field',
      value: recipientConfig?.recipient_field || 'Not configured'
    };
  };

  const recipientInfo = getRecipientDisplay(rule.recipient_config);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Email Rule Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Rule Name</div>
                  <div className="text-sm">{rule.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Status</div>
                  <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Source Table</div>
                  <Badge variant="outline">{rule.source_table}</Badge>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Trigger Event</div>
                  <Badge variant="outline">{getTriggerEventLabel(rule.trigger_event)}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Email Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium text-gray-700 mb-1">Template ID</div>
              <div className="text-sm font-mono text-gray-600">{rule.template_id}</div>
            </CardContent>
          </Card>

          {/* Recipient Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recipient Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Recipient Type</div>
                <Badge variant="outline">{recipientInfo.type}</Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">
                  {recipientInfo.type === 'Static Email' ? 'Email Address' : 'Field Name'}
                </div>
                <div className="text-sm">{recipientInfo.value}</div>
              </div>
            </CardContent>
          </Card>

          {/* Trigger Conditions */}
          {rule.trigger_conditions && Object.keys(rule.trigger_conditions).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trigger Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto">
                  {JSON.stringify(rule.trigger_conditions, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Created At</div>
                  <div className="text-sm">{new Date(rule.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Updated At</div>
                  <div className="text-sm">{new Date(rule.updated_at).toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};