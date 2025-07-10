import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { usePermissions, UserRole } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, RotateCcw } from 'lucide-react';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'command_staff', label: 'Command Staff' },
  { value: 'cadet', label: 'Cadet' },
];

export const RoleManagementPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const { 
    modules, 
    actions, 
    getRolePermissions, 
    updatePermission, 
    resetToDefaults,
    isUpdating,
    isResetting 
  } = usePermissions();
  const { toast } = useToast();

  const rolePermissions = getRolePermissions(selectedRole);

  const handlePermissionChange = (moduleId: string, actionId: string, enabled: boolean) => {
    updatePermission(
      { role: selectedRole, moduleId, actionId, enabled },
      {
        onSuccess: () => {
          toast({
            title: 'Permission Updated',
            description: `Permission ${enabled ? 'enabled' : 'disabled'} successfully.`,
          });
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: 'Failed to update permission. Please try again.',
            variant: 'destructive',
          });
          console.error('Permission update error:', error);
        },
      }
    );
  };

  const handleResetToDefaults = () => {
    resetToDefaults(selectedRole, {
      onSuccess: () => {
        toast({
          title: 'Permissions Reset',
          description: `${selectedRole} permissions have been reset to defaults.`,
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: 'Failed to reset permissions. Please try again.',
          variant: 'destructive',
        });
        console.error('Reset permissions error:', error);
      },
    });
  };

  const getPermissionCount = (role: UserRole) => {
    const perms = getRolePermissions(role);
    const total = modules.length * actions.length;
    const enabled = modules.reduce((count, module) => {
      return count + actions.filter(action => perms[module.name]?.[action.name]).length;
    }, 0);
    return { enabled, total };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
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
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => {
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
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Module</th>
                  {actions.map((action) => (
                    <th key={action.id} className="text-center p-3 font-medium min-w-24">
                      {action.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.map((module) => (
                  <tr key={module.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">
                      <div>
                        <div className="font-medium">{module.label}</div>
                        {module.description && (
                          <div className="text-sm text-gray-500">{module.description}</div>
                        )}
                      </div>
                    </td>
                    {actions.map((action) => {
                      const isEnabled = rolePermissions[module.name]?.[action.name] || false;
                      return (
                        <td key={action.id} className="p-3 text-center">
                          <Checkbox
                            checked={isEnabled}
                            disabled={isUpdating}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(module.id, action.id, !!checked)
                            }
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isUpdating && (
            <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Updating permissions...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};