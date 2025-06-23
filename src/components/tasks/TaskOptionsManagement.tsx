
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusOptionsTab } from './options/StatusOptionsTab';
import { PriorityOptionsTab } from './options/PriorityOptionsTab';

const TaskOptionsManagement: React.FC = () => {
  const { userProfile } = useAuth();

  // Only show for admin users
  if (userProfile?.role !== 'admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task Options Management</CardTitle>
          <CardDescription>Access restricted to administrators</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Options Management</CardTitle>
        <CardDescription>Manage status and priority options for tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="status">Status Options</TabsTrigger>
            <TabsTrigger value="priority">Priority Options</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="space-y-4">
            <StatusOptionsTab />
          </TabsContent>
          
          <TabsContent value="priority" className="space-y-4">
            <PriorityOptionsTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TaskOptionsManagement;
