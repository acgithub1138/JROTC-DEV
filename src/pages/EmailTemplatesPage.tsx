import React from 'react';
import { Mail } from 'lucide-react';
import { EmailTemplatesTab } from '@/components/email-management/tabs/EmailTemplatesTab';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PageContainer, FieldRow } from '@/components/ui/layout';

const EmailTemplatesPage: React.FC = () => {
  return (
    <ProtectedRoute module="email_templates" requirePermission="read">
      <PageContainer>
        <FieldRow>
          <Mail className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Email Templates</h1>
        </FieldRow>
        
        <EmailTemplatesTab />
      </PageContainer>
    </ProtectedRoute>
  );
};

export default EmailTemplatesPage;