import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmailQueueMonitor } from '@/components/email/EmailQueueMonitor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmailQueueTab } from '@/components/email-management/tabs/EmailQueueTab';
import { EmailRulesTab } from '@/components/email-management/tabs/EmailRulesTab';
import { EmailTemplatesTab } from '@/components/email-management/tabs/EmailTemplatesTab';

export default function EmailQueueManagement() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Email Queue Management</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and manage the email notification system
        </p>
      </div>

      <Tabs defaultValue="monitor" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monitor">Queue Monitor</TabsTrigger>
          <TabsTrigger value="queue">Email Queue</TabsTrigger>
          <TabsTrigger value="rules">Email Rules</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="monitor" className="space-y-6">
          <EmailQueueMonitor />
        </TabsContent>

        <TabsContent value="queue" className="space-y-6">
          <EmailQueueTab />
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <EmailRulesTab />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <EmailTemplatesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}