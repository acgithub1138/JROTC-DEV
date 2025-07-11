
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, Trash2, Play, Pause, Eye } from 'lucide-react';
import { EmailRule } from '@/hooks/email/useEmailRules';
import { useEmailPermissions } from '@/hooks/useModuleSpecificPermissions';

interface EmailRulesTableProps {
  rules: (EmailRule & { email_templates: { name: string; subject: string } })[];
  isLoading: boolean;
  onEdit: (rule: EmailRule) => void;
  onView?: (rule: EmailRule) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

export const EmailRulesTable: React.FC<EmailRulesTableProps> = ({
  rules,
  isLoading,
  onEdit,
  onView,
  onDelete,
  onToggleActive,
}) => {
  const { canUpdate, canDelete, canViewDetails } = useEmailPermissions();
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading email rules...</div>
        </CardContent>
      </Card>
    );
  }

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
    if (recipientConfig.recipient_type === 'static') {
      return recipientConfig.static_email;
    }
    return `Field: ${recipientConfig.recipient_field}`;
  };

  return (
    <TooltipProvider>
      <Card>
      <CardHeader>
        <CardTitle>Email Rules</CardTitle>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No email rules found. Create your first rule to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium py-2">{rule.name}</TableCell>
                  <TableCell className="py-2">
                    <Badge variant="outline">{rule.source_table}</Badge>
                  </TableCell>
                  <TableCell className="py-2">{getTriggerEventLabel(rule.trigger_event)}</TableCell>
                  <TableCell className="py-2">{rule.email_templates?.name || 'Unknown'}</TableCell>
                  <TableCell className="max-w-48 truncate py-2">
                    {getRecipientDisplay(rule.recipient_config)}
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center justify-center gap-2">
                      {canViewDetails && onView && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon" className="h-6 w-6"
                              onClick={() => onView(rule)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View rule</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {canUpdate && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon" className="h-6 w-6"
                                onClick={() => onToggleActive(rule.id, !rule.is_active)}
                              >
                                {rule.is_active ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{rule.is_active ? 'Deactivate rule' : 'Activate rule'}</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon" className="h-6 w-6"
                                onClick={() => onEdit(rule)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit rule</p>
                            </TooltipContent>
                          </Tooltip>
                        </>
                      )}
                      {canDelete && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300"
                              onClick={() => onDelete(rule.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete rule</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
    </TooltipProvider>
  );
};
