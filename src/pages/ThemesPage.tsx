import React, { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import ThemeManagement from '@/components/themes/ThemeManagement';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePermissionContext } from '@/contexts/PermissionContext';

const ThemesPageContent: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { hasPermission } = usePermissionContext();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Themes</h1>
          <p className="text-muted-foreground mt-1">
            Manage visual themes for different JROTC programs
          </p>
        </div>
        {hasPermission('themes', 'create') && (
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Theme
          </Button>
        )}
      </div>
      <ThemeManagement 
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
      />
    </div>
  );
};

const ThemesPage: React.FC = () => {
  return (
    <ProtectedRoute module="themes" requirePermission="read">
      <ThemesPageContent />
    </ProtectedRoute>
  );
};

export default ThemesPage;
