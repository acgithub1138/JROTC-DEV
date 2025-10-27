import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useRoleManagement, UserRole } from '@/hooks/useRoleManagement';
import { useRolePermissionMap } from '@/hooks/useRolePermissionMap';
import { useDynamicRoles } from '@/hooks/useDynamicRoles';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Plus } from 'lucide-react';
import { AddRoleDialog } from './AddRoleDialog';
import { UserRolesTable } from './UserRolesTable';
import ModulesManagement from './ModulesManagement';
import { ActionsManagement } from './ActionsManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePermissionContext } from '@/contexts/PermissionContext';

export const RoleManagementPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('instructor');
  const { hasPermission } = usePermissionContext();
  
  const {
    modules,
    actions,
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
  
  const { toast } = useToast();

  // Permission checks
  const canUpdatePermission = hasPermission('permissions', 'update');

  // Convert dynamic roles to the expected format
  const availableRoles = useMemo(() => {
    if (!allRoles?.length) {
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
    return allRoles
      .filter(role => role.role_name !== 'admin')
      .map(role => ({
        value: role.role_name as UserRole,
        label: role.role_label
      }));
  }, [allRoles]);

  // Use role-scoped permissions map as the source of truth
  const { rolePermissionsMap, refetch: refetchRolePerms, setOptimisticPermission } = useRolePermissionMap(selectedRole);
  const [permissionsLoadingState, setPermissionsLoading] = useState(false);
  
  const handleRoleSelect = async (roleId: string) => {
    setSelectedRole(roleId as UserRole);
    setPermissionsLoading(true);
    await refetchRolePerms();
    setPermissionsLoading(false);
  };

  const getPermissionValue = (moduleId: string, actionId: string): boolean => {
    return rolePermissionsMap?.[moduleId]?.[actionId] ?? false;
  };

  const togglePermission = (moduleId: string, actionId: string, checked: boolean) => {
    // Apply optimistic update immediately
    setOptimisticPermission(moduleId, actionId, checked);
    
    // Update database in background
    updatePermission({ role: selectedRole, moduleId, actionId, enabled: checked }, {
      onError: error => {
        console.error('Permission update error:', error);
        // Revert optimistic update on error
        refetchRolePerms();
        toast({ 
          title: 'Error', 
          description: 'Failed to update permission. Please try again.', 
          variant: 'destructive' 
        });
      },
      onSuccess: () => {
        // Refresh to ensure UI is in sync
        refetchRolePerms();
      }
    });
  };

  if (rolesError) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive mb-4">Error loading roles: {rolesError.message}</p>
              <Button onClick={refreshData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Tabs defaultValue="permissions" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Permissions</CardTitle>
                  <CardDescription>Manage Role Permissions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="role-select">Select Role</Label>
                <Select value={selectedRole} onValueChange={handleRoleSelect}>
                  <SelectTrigger id="role-select" className="w-full md:w-[300px]">
                    <SelectValue placeholder="Choose a role to configure" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {availableRoles.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRole && (
                permissionsLoadingState ? (
                  <p className="text-muted-foreground">Loading permissions...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Module</TableHead>
                          {actions.map(action => (
                            <TableHead key={action.id} className="text-center">
                              {action.label}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {modules.map(module => (
                          <TableRow key={module.id}>
                            <TableCell className="font-medium py-2">{module.label}</TableCell>
                            {actions.map(action => {
                              const value = getPermissionValue(module.id, action.id);
                              return (
                                <TableCell key={action.id} className="text-center py-2">
                                  <Switch 
                                    checked={value}
                                    onCheckedChange={(checked) => togglePermission(module.id, action.id, checked)}
                                    disabled={!canUpdatePermission}
                                  />
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <UserRolesTable />
        </TabsContent>

        <TabsContent value="modules">
          <ModulesManagement />
        </TabsContent>

        <TabsContent value="actions">
          <ActionsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};