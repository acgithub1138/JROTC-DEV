
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Mail, Save, Globe, CheckCircle } from 'lucide-react';
import { useSmtpSettings } from '@/hooks/email/useSmtpSettings';

export const SmtpSettingsTab: React.FC = () => {
  const { settings, isLoading, createOrUpdateSettings, isSaving, sendTestEmail, isTesting } = useSmtpSettings();
  
  const [formData, setFormData] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    from_email: '',
    from_name: 'School System',
    use_tls: true,
    is_active: false,
  });

  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    if (settings) {
      setFormData({
        smtp_host: settings.smtp_host || '',
        smtp_port: settings.smtp_port || 587,
        smtp_username: settings.smtp_username || '',
        smtp_password: settings.smtp_password || '',
        from_email: settings.from_email || '',
        from_name: settings.from_name || 'School System',
        use_tls: settings.use_tls ?? true,
        is_active: settings.is_active ?? false,
      });
    }
  }, [settings]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    createOrUpdateSettings(formData);
  };

  const handleSendTestEmail = () => {
    if (!testEmail) return;
    sendTestEmail(testEmail);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-muted-foreground">Loading global SMTP settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Globe className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-2xl font-semibold">Global SMTP Settings</h2>
          <p className="text-muted-foreground">
            Configure the global SMTP server settings used by all schools in the system.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Global SMTP Configuration
          </CardTitle>
          <CardDescription>
            These settings will be used by all schools to send emails through the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp_host">SMTP Host</Label>
              <Input
                id="smtp_host"
                value={formData.smtp_host}
                onChange={(e) => handleInputChange('smtp_host', e.target.value)}
                placeholder="mail.yourdomain.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp_port">SMTP Port</Label>
              <Select
                value={formData.smtp_port.toString()}
                onValueChange={(value) => handleInputChange('smtp_port', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="587">587 (TLS)</SelectItem>
                  <SelectItem value="465">465 (SSL)</SelectItem>
                  <SelectItem value="25">25 (Unsecured)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp_username">Username</Label>
              <Input
                id="smtp_username"
                value={formData.smtp_username}
                onChange={(e) => handleInputChange('smtp_username', e.target.value)}
                placeholder="your-email@yourdomain.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp_password">Password</Label>
              <Input
                id="smtp_password"
                type="password"
                value={formData.smtp_password}
                onChange={(e) => handleInputChange('smtp_password', e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from_email">From Email</Label>
              <Input
                id="from_email"
                type="email"
                value={formData.from_email}
                onChange={(e) => handleInputChange('from_email', e.target.value)}
                placeholder="noreply@yourdomain.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from_name">From Name</Label>
              <Input
                id="from_name"
                value={formData.from_name}
                onChange={(e) => handleInputChange('from_name', e.target.value)}
                placeholder="School System"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="use_tls"
                  checked={formData.use_tls}
                  onCheckedChange={(checked) => handleInputChange('use_tls', checked)}
                />
                <Label htmlFor="use_tls">Use TLS Encryption</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Recommended for secure email transmission
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="is_active">Enable Global Email Sending</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Activate to start sending emails globally
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving || !formData.smtp_host || !formData.from_email}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Global Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {settings && settings.is_active && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Test Email Configuration
            </CardTitle>
            <CardDescription>
              Send a test email to verify your SMTP settings are working correctly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span>SMTP settings are configured and active</span>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="test_email">Test Email Address</Label>
              <Input
                id="test_email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your-email@example.com"
              />
              <p className="text-sm text-muted-foreground">
                Enter your email address to receive a test email
              </p>
            </div>

            <Button
              onClick={handleSendTestEmail}
              disabled={isTesting || !testEmail || !testEmail.includes('@')}
              className="flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              {isTesting ? 'Sending...' : 'Send Test Email'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
