import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, Trash2, Eye, Plus, X, CheckCircle } from 'lucide-react';

interface TableActionButtonsProps {
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canCreate?: boolean;
  canCancel?: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCreate?: () => void;
  onCancel?: () => void;
  // Custom actions for specific use cases
  customActions?: Array<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    className?: string;
    show?: boolean;
  }>;
  // Legacy readOnly support
  readOnly?: boolean;
}

export const TableActionButtons: React.FC<TableActionButtonsProps> = ({
  canView = true,
  canEdit = true,
  canDelete = true,
  canCreate = true,
  canCancel = true,
  onView,
  onEdit,
  onDelete,
  onCreate,
  onCancel,
  customActions = [],
  readOnly = false
}) => {
  // If readOnly is true, don't show any actions
  if (readOnly) {
    return null;
  }

  const hasAnyAction = onView || onEdit || onDelete || onCreate || onCancel || customActions.some(action => action.show !== false);
  
  if (!hasAnyAction) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Create Action */}
      {onCreate && canCreate && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-6 w-6" onClick={onCreate}>
                <Plus className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Subtask</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {/* View Action */}
      {onView && canView && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-6 w-6" onClick={onView}>
                <Eye className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Edit Action */}
      {onEdit && canEdit && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-6 w-6" onClick={onEdit}>
                <Edit className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit {action.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Delete Action */}
      {onDelete && canDelete && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300" onClick={onDelete}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Cancel Action */}
      {onCancel && canCancel && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300" onClick={onCancel}>
                <X className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cancel {action.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Custom Actions */}
      {customActions.map((action, index) => 
        action.show !== false ? (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={action.variant || "ghost"} 
                  size="icon" 
                  onClick={action.onClick}
                  className={`h-6 w-6 ${action.className || ''}`}
                >
                  {action.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{action.label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null
      )}
    </div>
  );
};