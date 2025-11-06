import React from 'react';
import { Settings } from 'lucide-react';
import { EmailRulesTab } from '@/components/email-management/tabs/EmailRulesTab';
import ProtectedRoute from '@/components/ProtectedRoute';

const EmailRulesPage: React.FC = () => {
  return (
    <ProtectedRoute module="email_rules" requirePermission="read">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Email Rules</h1>
        </div>
        
        <EmailRulesTab />
      </div>
    </ProtectedRoute>
  );
};

export default EmailRulesPage;
