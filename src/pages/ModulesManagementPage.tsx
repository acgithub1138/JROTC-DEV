import React from 'react';
import ModulesManagement from '@/components/role-management/ModulesManagement';
import ProtectedRoute from '@/components/ProtectedRoute';

const ModulesManagementPage: React.FC = () => {
  return (
    <ProtectedRoute module="modules" requirePermission="read">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Modules Management</h1>
          <p className="text-muted-foreground">
            Manage permission modules that appear in sidebars and role permissions.
          </p>
        </div>
        <ModulesManagement />
      </div>
    </ProtectedRoute>
  );
};

export default ModulesManagementPage;
