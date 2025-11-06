import React from 'react';
import { ActionsManagement } from '@/components/role-management/ActionsManagement';
import ProtectedRoute from '@/components/ProtectedRoute';

const ActionsManagementPage: React.FC = () => {
  return (
    <ProtectedRoute module="actions" requirePermission="read">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Actions Management</h1>
          <p className="text-muted-foreground">
            Manage permission actions that can be assigned to roles.
          </p>
        </div>
        <ActionsManagement />
      </div>
    </ProtectedRoute>
  );
};

export default ActionsManagementPage;
