
import React from 'react';
import { Mail, Clock } from 'lucide-react';
import { EmailQueueTab } from './tabs/EmailQueueTab';

const EmailManagementPage: React.FC = () => {

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Mail className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Email Management</h1>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Email Queue</h2>
          <p className="text-sm text-muted-foreground">
            Monitor and manage email queue status
          </p>
        </div>
      </div>

      <EmailQueueTab />
    </div>
  );
};

export default EmailManagementPage;
