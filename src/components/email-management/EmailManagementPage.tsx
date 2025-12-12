import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Clock, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageContainer, FieldRow } from '@/components/ui/layout';

const EmailManagementPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <FieldRow>
        <Mail className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Email Management</h1>
      </FieldRow>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/app/email_templates')}>
          <CardHeader>
            <Mail className="w-12 h-12 text-primary mb-4" />
            <CardTitle>Email Templates</CardTitle>
            <CardDescription>
              Create and manage email templates for automated notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Manage Templates
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/app/email_rules')}>
          <CardHeader>
            <Settings className="w-12 h-12 text-primary mb-4" />
            <CardTitle>Email Rules</CardTitle>
            <CardDescription>
              Configure automated email rules for tasks, subtasks, and competitions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Manage Rules
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/app/email_queue')}>
          <CardHeader>
            <Clock className="w-12 h-12 text-primary mb-4" />
            <CardTitle>Email Queue</CardTitle>
            <CardDescription>
              Monitor and manage the email queue status and logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              View Queue
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default EmailManagementPage;