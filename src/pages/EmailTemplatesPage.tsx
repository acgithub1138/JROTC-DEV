import React from 'react';
import { Mail } from 'lucide-react';
import { EmailTemplatesTab } from '@/components/email-management/tabs/EmailTemplatesTab';
import ProtectedRoute from '@/components/ProtectedRoute';

const EmailTemplatesPage: React.FC = () => {
  return (
    <ProtectedRoute module="email_templates" requirePermission="read">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Mail className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Email Templates</h1>
        </div>
        
        <EmailTemplatesTab />
      </div>
    </ProtectedRoute>
  );
};

export default EmailTemplatesPage;
