import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IncidentStatusOptionsTab } from './options/IncidentStatusOptionsTab';
import { IncidentPriorityOptionsTab } from './options/IncidentPriorityOptionsTab';
import { IncidentCategoryOptionsTab } from './options/IncidentCategoryOptionsTab';

const IncidentOptionsManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [priorityDialogOpen, setPriorityDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  // Only show for admin users since options are now global
  if (userProfile?.role !== 'admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Incident Options Management</CardTitle>
          <CardDescription>Access restricted to administrators only</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Incident status, priority, and category options are managed globally by administrators. 
            Contact your administrator if you need changes to the available options.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Incident Options Management</CardTitle>
        <CardDescription>Manage global status, priority, and category options for all incidents</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status">Status Options</TabsTrigger>
            <TabsTrigger value="priority">Priority Options</TabsTrigger>
            <TabsTrigger value="category">Category Options</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="space-y-4">
            <IncidentStatusOptionsTab isDialogOpen={statusDialogOpen} setIsDialogOpen={setStatusDialogOpen} />
          </TabsContent>
          
          <TabsContent value="priority" className="space-y-4">
            <IncidentPriorityOptionsTab isDialogOpen={priorityDialogOpen} setIsDialogOpen={setPriorityDialogOpen} />
          </TabsContent>
          
          <TabsContent value="category" className="space-y-4">
            <IncidentCategoryOptionsTab isDialogOpen={categoryDialogOpen} setIsDialogOpen={setCategoryDialogOpen} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default IncidentOptionsManagement;