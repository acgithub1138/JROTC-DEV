import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { usePermissions, UserRole } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, RotateCcw, GripVertical } from 'lucide-react';
import { isPermissionRelevantForModule } from '@/utils/modulePermissionMappings';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
const ROLES: {
  value: UserRole;
  label: string;
}[] = [{
  value: 'admin',
  label: 'Admin'
}, {
  value: 'instructor',
  label: 'Instructor'
}, {
  value: 'command_staff',
  label: 'Command Staff'
}, {
  value: 'cadet',
  label: 'Cadet'
}];
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
  return <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <th ref={setNodeRef} style={style} className="text-center p-3 font-medium min-w-24 relative group cursor-move" {...attributes} {...listeners}>
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
    </TooltipProvider>;
};
export const RoleManagementPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const {
    modules,
    actions,
    getRolePermissions,
    updatePermission,
    resetToDefaults,
    isUpdating,
    isResetting,
    refreshData
  } = usePermissions();
  const {
    toast
  } = useToast();

  // State for column ordering with localStorage persistence
  const [orderedActions, setOrderedActions] = useState(actions);

  // Load saved column order from localStorage
  React.useEffect(() => {
    if (actions.length > 0) {
      const savedOrder = localStorage.getItem('roleManagement-columnOrder');
      if (savedOrder) {
        try {
          const savedActionIds = JSON.parse(savedOrder);
          // Reorder actions based on saved order, keeping any new actions at the end
          const reorderedActions = savedActionIds.map((id: string) => actions.find(action => action.id === id)).filter(Boolean).concat(actions.filter(action => !savedActionIds.includes(action.id)));
          setOrderedActions(reorderedActions);
        } catch (error) {
          console.error('Failed to parse saved column order:', error);
          setOrderedActions(actions);
        }
      } else {
        setOrderedActions(actions);
      }
    }
  }, [actions]);

  // Drag and drop sensors
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));
  const handleDragEnd = (event: DragEndEvent) => {
    const {
      active,
      over
    } = event;
    if (over && active.id !== over.id) {
      setOrderedActions(actions => {
        const oldIndex = actions.findIndex(action => action.id === active.id);
        const newIndex = actions.findIndex(action => action.id === over.id);
        const newOrder = arrayMove(actions, oldIndex, newIndex);

        // Save the new order to localStorage
        const actionIds = newOrder.map(action => action.id);
        localStorage.setItem('roleManagement-columnOrder', JSON.stringify(actionIds));
        return newOrder;
      });
    }
  };
  const rolePermissions = getRolePermissions(selectedRole);
  const handlePermissionChange = (moduleId: string, actionId: string, enabled: boolean) => {
    updatePermission({
      role: selectedRole,
      moduleId,
      actionId,
      enabled
    }, {
      onSuccess: () => {
        toast({
          title: 'Permission Updated',
          description: `Permission ${enabled ? 'enabled' : 'disabled'} successfully.`
        });
      },
      onError: error => {
        toast({
          title: 'Error',
          description: 'Failed to update permission. Please try again.',
          variant: 'destructive'
        });
        console.error('Permission update error:', error);
      }
    });
  };
  const handleResetToDefaults = () => {
    resetToDefaults(selectedRole, {
      onSuccess: () => {
        toast({
          title: 'Permissions Reset',
          description: `${selectedRole} permissions have been reset to defaults.`
        });
      },
      onError: error => {
        toast({
          title: 'Error',
          description: 'Failed to reset permissions. Please try again.',
          variant: 'destructive'
        });
        console.error('Reset permissions error:', error);
      }
    });
  };
  const getPermissionCount = (role: UserRole) => {
    const perms = getRolePermissions(role);
    let total = 0;
    let enabled = 0;
    modules.forEach(module => {
      actions.forEach(action => {
        if (isPermissionRelevantForModule(module.name, action.name)) {
          total++;
          if (perms[module.name]?.[action.name]) {
            enabled++;
          }
        }
      });
    });
    return {
      enabled,
      total
    };
  };
  return <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Role Management</h1>
        <p className="text-gray-600">
          Configure permissions for each user role. Changes take effect immediately.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Role Permissions</span>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={refreshData} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
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
                  {ROLES.map(role => {
                  const {
                    enabled,
                    total
                  } = getPermissionCount(role.value);
                  return <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center justify-between w-full">
                          <span>{role.label}</span>
                          <Badge variant="secondary" className="ml-2">
                            {enabled}/{total}
                          </Badge>
                        </div>
                      </SelectItem>;
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
                      {orderedActions.map(action => <SortableColumnHeader key={action.id} action={action}>
                          {action.name === 'sidebar' ? 'Module Access' : action.label}
                        </SortableColumnHeader>)}
                    </SortableContext>
                  </tr>
                </thead>
                <tbody>
                  {modules.map(module => <tr key={module.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">
                        <div className="font-medium">{module.label}</div>
                      </td>
                      {orderedActions.map(action => {
                    const isRelevant = isPermissionRelevantForModule(module.name, action.name);
                    const isEnabled = rolePermissions[module.name]?.[action.name] || false;
                    return <td key={action.id} className="p-3 text-center">
                            {isRelevant ? <Checkbox checked={isEnabled} disabled={isUpdating} onCheckedChange={checked => handlePermissionChange(module.id, action.id, !!checked)} /> : null}
                          </td>;
                  })}
                    </tr>)}
                </tbody>
              </table>
            </DndContext>
          </div>

          {isUpdating && <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Updating permissions...
            </div>}
        </CardContent>
      </Card>
    </div>;
};