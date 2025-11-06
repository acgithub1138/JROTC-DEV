import React from 'react';
import { Clock } from 'lucide-react';
import { EmailQueueTab } from '@/components/email-management/tabs/EmailQueueTab';
import ProtectedRoute from '@/components/ProtectedRoute';

const EmailQueuePage: React.FC = () => {
  return (
    <ProtectedRoute module="email" requirePermission="read">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Clock className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Email Queue</h1>
        </div>
        
        <EmailQueueTab />
      </div>
    </ProtectedRoute>
  );
};

export default EmailQueuePage;
