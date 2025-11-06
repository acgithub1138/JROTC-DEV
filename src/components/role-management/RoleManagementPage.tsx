import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useRoleManagement, UserRole } from '@/hooks/useRoleManagement';
import { useRolePermissionMap } from '@/hooks/useRolePermissionMap';
import { useDynamicRoles } from '@/hooks/useDynamicRoles';
import { usePermissionTest } from '@/hooks/usePermissionTest';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { AddRoleDialog } from './AddRoleDialog';
import { PortalPermissionsTable } from './PortalPermissionsTable';
import { DashboardWidgetsTable } from './DashboardWidgetsTable';
import { UserRolesTable } from './UserRolesTable';
import { ActionsManagement } from './ActionsManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Helper function to get role colors
const getRoleColor = (roleName: string): string => {
  const colorMap: Record<string, string> = {
    instructor: 'bg-purple-100 text-purple-800',
    command_staff: 'bg-blue-100 text-blue-800',
    cadet: 'bg-green-100 text-green-800'
  };
  return colorMap[roleName] || 'bg-gray-100 text-gray-800';
};
export const RoleManagementPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('instructor');
  const [localPermissions, setLocalPermissions] = useState<Record<string, Record<string, boolean>>>({});
  // Track pending updates per cell to avoid global redraw/flicker
  const [pendingCells, setPendingCells] = useState<Set<string>>(new Set());
  const cellKey = (moduleId: string, actionId: string) => `${moduleId}:${actionId}`;
  const isCellPending = (moduleId: string, actionId: string) => pendingCells.has(cellKey(moduleId, actionId));
  
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
  const {
    allRoles,
    isLoadingAllRoles,
    error: rolesError
  } = useDynamicRoles();
  const {
    data: permissionTest
  } = usePermissionTest();
  const {
    toast
  } = useToast();

  // Debug logging
  React.useEffect(() => {
    console.log('Role Management Page - Permission Test:', permissionTest);
    console.log('Role Management Page - All Roles:', allRoles);
    console.log('Role Management Page - Roles Error:', rolesError);
  }, [permissionTest, allRoles, rolesError]);

  // Convert dynamic roles to the expected format, excluding admin and parent for role management UI
  const availableRoles = useMemo(() => {
    if (!allRoles?.length) {
      console.log('No roles available, using fallback');
      return [{
        value: 'instructor' as UserRole,
        label: 'Instructor'
      }, {
        value: 'command_staff' as UserRole,
        label: 'Command Staff'
      }, {
        value: 'cadet' as UserRole,
        label: 'Cadet'
      }];
    }
    const roles = allRoles.map(role => ({
      value: role.role_name as UserRole,
      label: role.role_label
    }));
    console.log('Available roles for management:', roles);
    return roles;
  }, [allRoles]);

  // Use role-scoped permissions map as the source of truth
  const { rolePermissionsMap, refetch: refetchRolePerms } = useRolePermissionMap(selectedRole);
  
  // Sync local permissions with fetched permissions whenever they change
  useEffect(() => {
    setLocalPermissions(rolePermissionsMap);
  }, [rolePermissionsMap]);
  
  const handlePermissionChange = (moduleId: string, actionId: string, enabled: boolean) => {
    const key = cellKey(moduleId, actionId);
    // Snapshot previous state to allow instant revert on error
    const previous = localPermissions;

    // Mark this cell as pending and update local state for instant feedback
    setPendingCells(prev => new Set(prev).add(key));
    setLocalPermissions(prev => ({
      ...prev,
      [moduleId]: {
        ...(prev[moduleId] || {}),
        [actionId]: enabled,
      },
    }));

    // Persist in background
    updatePermission(
      { role: selectedRole, moduleId, actionId, enabled },
      {
        onSuccess: () => {
          // Clear pending state for this cell
          setPendingCells(prev => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        },
        onError: error => {
          console.error('Permission update error:', error);
          // Revert to previous local state and clear pending
          setLocalPermissions(previous);
          setPendingCells(prev => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
          toast({ title: 'Error', description: 'Failed to update permission. Please try again.', variant: 'destructive' });
        }
      }
    );
  };
  const handleResetToDefaults = () => {
    console.log('Resetting permissions to defaults for role:', selectedRole);
    resetToDefaults(selectedRole, {
      onError: error => {
        console.error('Reset permissions error:', error);
        toast({
          title: 'Error',
          description: 'Failed to reset permissions. Please try again.',
          variant: 'destructive'
        });
      }
    });
  };

  // Show error state if there's an issue with roles
  if (rolesError) {
    return <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Role Management</h1>
          <p className="text-gray-600">Configure permissions for each user role and manage role definitions.</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error loading roles: {rolesError.message}</p>
              <Button onClick={refreshData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>;
  }

  // Check permission test results with proper type checking
  const hasPermissionTestError = permissionTest && 'error' in permissionTest;
  if (hasPermissionTestError) {
    console.warn('Permission system may have issues:', permissionTest.error);
  }
  return <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Role Management</h1>
        <p className="text-gray-600">
          Configure permissions for each user role and manage role definitions.
        </p>
        {permissionTest && <div className="mt-2 text-sm text-gray-500">
            System Status: {'success' in permissionTest && permissionTest.success ? '✅ Working' : '❌ Error'} | 
            Current Role: {'userRole' in permissionTest ? permissionTest.userRole : 'Unknown'} | 
            Can Read Users: {'canReadUsers' in permissionTest ? permissionTest.canReadUsers ? '✅' : '❌' : '❌'} | 
            Can Create Users: {'canCreateUsers' in permissionTest ? permissionTest.canCreateUsers ? '✅' : '❌' : '❌'}
          </div>}
      </div>

      <Tabs defaultValue="permissions" className="w-full py-[2px]">
        <TabsList className="mb-6">
          <TabsTrigger value="permissions">Role Permissions</TabsTrigger>
          <TabsTrigger value="roles">Manage Roles</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="permissions">
          <Card className="mb-6">
            <CardHeader className="py-0">
              <CardTitle className="flex items-center justify-between py-0">
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
                        {isLoadingAllRoles ? <SelectItem value="loading" disabled>
                            Loading roles...
                          </SelectItem> : availableRoles.map(role => <SelectItem key={role.value} value={role.value}>
                              <div className="flex items-center justify-between w-full">
                                <span>{role.label}</span>
                              </div>
                            </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <AddRoleDialog />
                  <Button variant="outline" size="sm" onClick={refreshData} className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="ccc" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="ccc">CCC Portal Permissions</TabsTrigger>
                  <TabsTrigger value="competition">Comp Portal Permissions</TabsTrigger>
                  <TabsTrigger value="dashboard">Dashboard Widgets</TabsTrigger>
                </TabsList>

                <TabsContent value="ccc">
                  <PortalPermissionsTable 
                    portal="ccc" 
                    modules={modules} 
                    actions={actions} 
                    rolePermissions={localPermissions} 
                    isCellPending={isCellPending}
                    handlePermissionChange={handlePermissionChange} 
                  />
                </TabsContent>

                <TabsContent value="competition">
                  <PortalPermissionsTable 
                    portal="competition" 
                    modules={modules} 
                    actions={actions} 
                    rolePermissions={localPermissions} 
                    isCellPending={isCellPending}
                    handlePermissionChange={handlePermissionChange} 
                  />
                </TabsContent>

                <TabsContent value="dashboard">
                  <DashboardWidgetsTable
                    modules={modules} 
                    actions={actions} 
                    rolePermissions={localPermissions} 
                    isCellPending={isCellPending}
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

        <TabsContent value="actions">
          <ActionsManagement />
        </TabsContent>
      </Tabs>
    </div>;
};