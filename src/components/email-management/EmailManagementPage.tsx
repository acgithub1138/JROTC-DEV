
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Settings, Clock, BarChart3, Server } from 'lucide-react';
import { EmailTemplatesTab } from './tabs/EmailTemplatesTab';
import { EmailRulesTab } from './tabs/EmailRulesTab';
import { EmailQueueTab } from './tabs/EmailQueueTab';
import { EmailLogsTab } from './tabs/EmailLogsTab';
import { SmtpSettingsTab } from './tabs/SmtpSettingsTab';

const EmailManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('templates');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Mail className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Email Management</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Queue
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="smtp" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            SMTP Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <EmailTemplatesTab />
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <EmailRulesTab />
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <EmailQueueTab />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <EmailLogsTab />
        </TabsContent>

        <TabsContent value="smtp" className="space-y-4">
          <SmtpSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailManagementPage;
