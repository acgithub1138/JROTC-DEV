
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Clock, Settings } from 'lucide-react';
import { EmailQueueTab } from './tabs/EmailQueueTab';
import { EmailRulesTab } from './tabs/EmailRulesTab';

const EmailManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('rules');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Mail className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Email Management</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Queue
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <EmailRulesTab />
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <EmailQueueTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailManagementPage;
