
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusOptionsTab } from './options/StatusOptionsTab';
import { PriorityOptionsTab } from './options/PriorityOptionsTab';

const TaskOptionsManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);
  const [priorityDialogOpen, setPriorityDialogOpen] = React.useState(false);

  // Only show for admin users since options are now global
  if (userProfile?.role !== 'admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task Options Management</CardTitle>
          <CardDescription>Access restricted to administrators only</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Task status and priority options are managed globally by administrators. 
            Contact your administrator if you need changes to the available options.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Options Management</CardTitle>
        <CardDescription>Manage global status and priority options for all tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="status">Status Options</TabsTrigger>
            <TabsTrigger value="priority">Priority Options</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="space-y-4">
            <StatusOptionsTab isDialogOpen={statusDialogOpen} setIsDialogOpen={setStatusDialogOpen} />
          </TabsContent>
          
          <TabsContent value="priority" className="space-y-4">
            <PriorityOptionsTab isDialogOpen={priorityDialogOpen} setIsDialogOpen={setPriorityDialogOpen} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TaskOptionsManagement;
