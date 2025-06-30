
import React from 'react';
import { SmtpSettingsTab } from '../email-management/tabs/SmtpSettingsTab';

const SmtpSettingsPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <SmtpSettingsTab />
    </div>
  );
};

export default SmtpSettingsPage;
