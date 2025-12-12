import React from 'react';
import { Settings } from 'lucide-react';
import { EmailRulesTab } from '@/components/email-management/tabs/EmailRulesTab';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PageContainer, FieldRow } from '@/components/ui/layout';

const EmailRulesPage: React.FC = () => {
  return (
    <ProtectedRoute module="email_rules" requirePermission="read">
      <PageContainer>
        <FieldRow>
          <Settings className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Email Rules</h1>
        </FieldRow>
        
        <EmailRulesTab />
      </PageContainer>
    </ProtectedRoute>
  );
};

export default EmailRulesPage;