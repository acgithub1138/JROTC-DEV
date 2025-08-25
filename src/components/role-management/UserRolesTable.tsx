import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit2, Save, X, GripVertical } from 'lucide-react';
import { useUserRolesManagement, type UserRole } from '@/hooks/useUserRolesManagement';
import { toast } from 'sonner';
export const UserRolesTable = () => {
  const {
    userRoles,
    isLoading,
    updateRole,
    isUpdating
  } = useUserRolesManagement();
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserRole>>({});
  const handleEdit = (role: UserRole) => {
    setEditingRole(role.id);
    setEditForm({
      role_label: role.role_label,
      admin_only: role.admin_only,
      is_active: role.is_active
    });
  };
  const handleSave = () => {
    if (!editingRole) return;
    updateRole({
      id: editingRole,
      updates: {
        role_label: editForm.role_label,
        admin_only: editForm.admin_only,
        is_active: editForm.is_active
      }
    });
    setEditingRole(null);
    setEditForm({});
  };
  const handleCancel = () => {
    setEditingRole(null);
    setEditForm({});
  };
  const getRoleBadgeVariant = (role: UserRole) => {
    if (!role.is_active) return 'secondary';
    if (role.admin_only) return 'destructive';
    return 'default';
  };
  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle>User Roles</CardTitle>
          <CardDescription>Loading roles...</CardDescription>
        </CardHeader>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <CardTitle>User Roles Management</CardTitle>
        <CardDescription>
          Manage existing user roles, their permissions, and assignment restrictions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Order</TableHead>
              <TableHead>Role Name</TableHead>
              <TableHead>Display Label</TableHead>
              <TableHead>Admin Only</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center ">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userRoles.map(role => <TableRow key={role.id}>
                <TableCell>
                  <div className="flex items-center">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <span className="ml-2 text-sm">{role.sort_order}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {role.role_name}
                  </code>
                </TableCell>
                <TableCell>
                  {editingRole === role.id ? <Input value={editForm.role_label || ''} onChange={e => setEditForm(prev => ({
                ...prev,
                role_label: e.target.value
              }))} className="w-full" /> : <span>{role.role_label}</span>}
                </TableCell>
                <TableCell>
                  {editingRole === role.id ? <div className="flex items-center space-x-2">
                      <Switch checked={editForm.admin_only || false} onCheckedChange={checked => setEditForm(prev => ({
                  ...prev,
                  admin_only: checked
                }))} disabled={role.role_name === 'admin' || role.role_name === 'instructor'} />
                      <Label className="text-sm">Admin Only</Label>
                    </div> : <Badge variant={role.admin_only ? 'destructive' : 'secondary'}>
                      {role.admin_only ? 'Admin Only' : 'Assignable'}
                    </Badge>}
                </TableCell>
                <TableCell>
                  {editingRole === role.id ? <div className="flex items-center space-x-2">
                      <Switch checked={editForm.is_active !== false} onCheckedChange={checked => setEditForm(prev => ({
                  ...prev,
                  is_active: checked
                }))} disabled={role.role_name === 'admin'} />
                      <Label className="text-sm">Active</Label>
                    </div> : <Badge variant={getRoleBadgeVariant(role)}>
                      {role.is_active ? 'Active' : 'Inactive'}
                    </Badge>}
                </TableCell>
                <TableCell className="flex items-center justify-center gap-2">
                  {editingRole === role.id ? <div className="flex justify-end space-x-2">
                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={handleSave} disabled={isUpdating || !editForm.role_label?.trim()}>
                        <Save className="w-3 h-3" />
                      </Button>
                    </div> : <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => handleEdit(role)} disabled={isUpdating}>
                      <Edit2 className="w-3 h-3" />
                      <Button size="icon" variant="outline" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300" onClick={handleCancel} disabled={isUpdating}>
                        <X className="w-3 h-3" />
                      </Button>
                    </Button>}
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </CardContent>
    </Card>;
};