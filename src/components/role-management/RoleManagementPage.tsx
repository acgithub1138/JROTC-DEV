import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRolesTable } from './UserRolesTable';
import { AddRoleDialog } from './AddRoleDialog';

export const RoleManagementPage: React.FC = () => {
  return <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Role Management</h1>
          <p className="text-muted-foreground">
            Manage user role definitions and settings.
          </p>
        </div>
        <AddRoleDialog />
      </div>

      <Card>
        <UserRolesTable />
      </Card>
    </div>;
};