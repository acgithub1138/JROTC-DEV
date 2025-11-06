import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useRoleManagement, UserRole } from '@/hooks/useRoleManagement';
import { useRolePermissionMap } from '@/hooks/useRolePermissionMap';
import { useDynamicRoles } from '@/hooks/useDynamicRoles';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';
import { PortalPermissionsTable } from '@/components/role-management/PortalPermissionsTable';
import ProtectedRoute from '@/components/ProtectedRoute';
const CPPermissionsPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('instructor');
  const [localPermissions, setLocalPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [pendingCells, setPendingCells] = useState<Set<string>>(new Set());
  const cellKey = (moduleId: string, actionId: string) => `${moduleId}:${actionId}`;
  const isCellPending = (moduleId: string, actionId: string) => pendingCells.has(cellKey(moduleId, actionId));
  const {
    modules,
    actions,
    updatePermission,
    refreshData
  } = useRoleManagement();
  const {
    allRoles,
    isLoadingAllRoles,
    error: rolesError
  } = useDynamicRoles();
  const {
    toast
  } = useToast();

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
    return allRoles.map(role => ({
      value: role.role_name as UserRole,
      label: role.role_label
    }));
  }, [allRoles]);

  // Use role-scoped permissions map
  const {
    rolePermissionsMap
  } = useRolePermissionMap(selectedRole);

  // Sync local permissions with fetched permissions
  useEffect(() => {
    setLocalPermissions(rolePermissionsMap);
  }, [rolePermissionsMap]);
  const handlePermissionChange = (moduleId: string, actionId: string, enabled: boolean) => {
    const key = cellKey(moduleId, actionId);
    const previous = localPermissions;
    setPendingCells(prev => new Set(prev).add(key));
    setLocalPermissions(prev => ({
      ...prev,
      [moduleId]: {
        ...(prev[moduleId] || {}),
        [actionId]: enabled
      }
    }));
    updatePermission({
      role: selectedRole,
      moduleId,
      actionId,
      enabled
    }, {
      onSuccess: () => {
        setPendingCells(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        toast({
          title: 'Permission updated',
          description: `${enabled ? 'Enabled' : 'Disabled'} permission successfully.`
        });
      },
      onError: (error: any) => {
        setPendingCells(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        setLocalPermissions(previous);
        toast({
          title: 'Error updating permission',
          description: error.message,
          variant: 'destructive'
        });
      }
    });
  };
  if (rolesError) {
    return <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Roles</CardTitle>
          </CardHeader>
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
  return <ProtectedRoute module="cp_permissions" requirePermission="read">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Competition Portal Permissions</h1>
        </div>

        <Card className="mb-6">
          <CardHeader className="py-0">
            <CardTitle className="flex items-center justify-between py-[8px]">
              <div className="flex items-center gap-4 mb-6">
                <label className="text-sm font-medium whitespace-nowrap">
                  Select Role
                </label>
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
              
              <Button variant="outline" size="sm" onClick={refreshData} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PortalPermissionsTable portal="competition" modules={modules} actions={actions} rolePermissions={localPermissions} isCellPending={isCellPending} handlePermissionChange={handlePermissionChange} />
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>;
};
export default CPPermissionsPage;