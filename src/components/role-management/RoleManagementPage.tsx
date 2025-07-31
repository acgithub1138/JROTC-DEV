import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useRoleManagement, UserRole } from '@/hooks/useRoleManagement';
import { useRoleManagementColumnOrder } from '@/hooks/useRoleManagementColumnOrder';
import { useDynamicRoles } from '@/hooks/useDynamicRoles';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, RotateCcw, GripVertical } from 'lucide-react';
import { isPermissionRelevantForModule } from '@/utils/modulePermissionMappings';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AddRoleDialog } from './AddRoleDialog';
import { UserRolesTable } from './UserRolesTable';
import { PortalPermissionsTable } from './PortalPermissionsTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Helper function to get role colors
const getRoleColor = (roleName: string): string => {
  const colorMap: Record<string, string> = {
    instructor: 'bg-purple-100 text-purple-800',
    command_staff: 'bg-blue-100 text-blue-800',
    cadet: 'bg-green-100 text-green-800',
  };
  return colorMap[roleName] || 'bg-gray-100 text-gray-800';
};
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
  const [selectedRole, setSelectedRole] = useState<UserRole>('instructor');
  const {
    modules,
    actions,
    getRolePermissions,
    updatePermission,
    resetToDefaults,
    isUpdating,
    isResetting,
    refreshData
  } = useRoleManagement();
  const { allRoles, isLoadingAllRoles } = useDynamicRoles();
  const { toast } = useToast();

  // Convert dynamic roles to the expected format, excluding admin and parent for role management UI
  const availableRoles = useMemo(() => {
    if (!allRoles?.length) return [];
    
    return allRoles
      .filter(role => !['admin'].includes(role.role_name))
      .map(role => ({
        value: role.role_name as UserRole,
        label: role.role_label
      }));
  }, [allRoles]);

  // Use database-backed column ordering
  const defaultActionIds = React.useMemo(() => actions.map(action => action.id), [actions]);
  const { actionOrder, setActionOrder, isLoading: isLoadingOrder } = useRoleManagementColumnOrder(defaultActionIds);
  
  // Create ordered actions based on saved order
  const orderedActions = React.useMemo(() => {
    if (actions.length === 0 || actionOrder.length === 0) return actions;
    
    // Map action IDs to actual action objects
    const orderedActionObjects = actionOrder.map(id => actions.find(action => action.id === id)).filter(Boolean);
    
    // Add any new actions that might not be in the saved order
    const missingActions = actions.filter(action => !actionOrder.includes(action.id));
    
    return [...orderedActionObjects, ...missingActions];
  }, [actions, actionOrder]);

  // Drag and drop sensors
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = actionOrder.findIndex(id => id === active.id);
      const newIndex = actionOrder.findIndex(id => id === over.id);
      const newOrder = arrayMove(actionOrder, oldIndex, newIndex);
      
      // Save the new order to database
      setActionOrder(newOrder);
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
          Configure permissions for each user role and manage role definitions.
        </p>
      </div>

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
    
    
    
      <Tabs defaultValue="permissions" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="permissions">Role Permissions</TabsTrigger>
          <TabsTrigger value="roles">Manage Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Role Permissions</span>
                <div className="flex items-center gap-4">
                  <AddRoleDialog />
                  <Button variant="outline" size="sm" onClick={refreshData} className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleResetToDefaults} disabled={isResetting} className="flex items-center gap-2">
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

              <Tabs defaultValue="ccc" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="ccc">CCC Portal Permissions</TabsTrigger>
                  <TabsTrigger value="competition">Comp Portal Permissions</TabsTrigger>
                </TabsList>

                <TabsContent value="ccc">
                  <PortalPermissionsTable 
                    portal="ccc"
                    modules={modules}
                    actions={actions}
                    orderedActions={orderedActions}
                    rolePermissions={rolePermissions}
                    isUpdating={isUpdating}
                    sensors={sensors}
                    handleDragEnd={handleDragEnd}
                    handlePermissionChange={handlePermissionChange}
                  />
                </TabsContent>

                <TabsContent value="competition">
                  <PortalPermissionsTable 
                    portal="competition"
                    modules={modules}
                    actions={actions}
                    orderedActions={orderedActions}
                    rolePermissions={rolePermissions}
                    isUpdating={isUpdating}
                    sensors={sensors}
                    handleDragEnd={handleDragEnd}
                    handlePermissionChange={handlePermissionChange}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <UserRolesTable />
        </TabsContent>
      </Tabs>
    </div>;
};