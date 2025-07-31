import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, RotateCcw, GripVertical } from 'lucide-react';
import { isPermissionRelevantForModule } from '@/utils/modulePermissionMappings';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AddRoleDialog } from './AddRoleDialog';
import { UserRole } from '@/hooks/useRoleManagement';

interface SortableColumnHeaderProps {
  action: any;
  children: React.ReactNode;
}

const SortableColumnHeader: React.FC<SortableColumnHeaderProps> = ({
  action,
  children
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: action.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const getTooltipContent = (actionName: string) => {
    switch (actionName) {
      case 'sidebar':
        return 'Access to module/page via navigation and sidebar';
      case 'view':
        return 'Access to view individual record details in modals/popups';
      case 'read':
        return 'Access to see data in tables, lists, and related content';
      case 'create':
        return 'Ability to create new records';
      case 'update':
        return 'Ability to edit existing records';
      case 'delete':
        return 'Ability to delete records';
      default:
        return action.description || '';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <th 
            ref={setNodeRef} 
            style={style} 
            className="text-center p-3 font-medium min-w-24 relative group cursor-move" 
            {...attributes} 
            {...listeners}
          >
            <div className="flex items-center justify-center gap-1">
              <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              <span>{children}</span>
            </div>
          </th>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{getTooltipContent(action.name)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface PortalPermissionsTableProps {
  portal: 'ccc' | 'competition';
  selectedRole: UserRole;
  availableRoles: Array<{ value: UserRole; label: string }>;
  isLoadingAllRoles: boolean;
  setSelectedRole: (role: UserRole) => void;
  modules: any[];
  actions: any[];
  orderedActions: any[];
  rolePermissions: any;
  isUpdating: boolean;
  isResetting: boolean;
  sensors: any;
  handleDragEnd: (event: any) => void;
  handlePermissionChange: (moduleId: string, actionId: string, enabled: boolean) => void;
  handleResetToDefaults: () => void;
  refreshData: () => void;
  getPermissionCount: (role: UserRole) => { enabled: number; total: number };
}

export const PortalPermissionsTable: React.FC<PortalPermissionsTableProps> = ({
  portal,
  selectedRole,
  availableRoles,
  isLoadingAllRoles,
  setSelectedRole,
  modules,
  actions,
  orderedActions,
  rolePermissions,
  isUpdating,
  isResetting,
  sensors,
  handleDragEnd,
  handlePermissionChange,
  handleResetToDefaults,
  refreshData,
  getPermissionCount
}) => {
  // Filter modules based on portal
  const filteredModules = modules.filter(module => {
    if (portal === 'ccc') {
      // CCC Portal modules - exclude competition portal modules
      return !module.name.startsWith('cp_');
    } else {
      // Competition Portal modules - only include cp_ modules
      return module.name.startsWith('cp_');
    }
  });

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{portal === 'ccc' ? 'CCC Portal' : 'Competition Portal'} Permissions</span>
          <div className="flex items-center gap-4">
            <AddRoleDialog />
            <Button variant="outline" size="sm" onClick={refreshData} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResetToDefaults} 
              disabled={isResetting} 
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Role
          </label>
          <div className="flex items-center gap-4">
            <Select value={selectedRole} onValueChange={value => setSelectedRole(value as UserRole)}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingAllRoles ? (
                  <SelectItem value="loading" disabled>
                    Loading roles...
                  </SelectItem>
                ) : availableRoles.map(role => {
                  const { enabled, total } = getPermissionCount(role.value);
                  return (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{role.label}</span>
                        <Badge variant="secondary" className="ml-2">
                          {enabled}/{total}
                        </Badge>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Module</th>
                  <SortableContext items={orderedActions.map(action => action.id)} strategy={horizontalListSortingStrategy}>
                    {orderedActions.map(action => (
                      <SortableColumnHeader key={action.id} action={action}>
                        {action.name === 'sidebar' ? 'Module Access' : action.label}
                      </SortableColumnHeader>
                    ))}
                  </SortableContext>
                </tr>
              </thead>
              <tbody>
                {filteredModules.map(module => (
                  <tr key={module.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">
                      <div className="font-medium">{module.label}</div>
                    </td>
                    {orderedActions.map(action => {
                      const isRelevant = isPermissionRelevantForModule(module.name, action.name);
                      const isEnabled = rolePermissions[module.name]?.[action.name] || false;
                      return (
                        <td key={action.id} className="p-3 text-center">
                          {isRelevant ? (
                            <Checkbox 
                              checked={isEnabled} 
                              disabled={isUpdating} 
                              onCheckedChange={checked => handlePermissionChange(module.id, action.id, !!checked)} 
                            />
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </DndContext>
        </div>

        {isUpdating && (
          <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Updating permissions...
          </div>
        )}
      </CardContent>
    </Card>
  );
};