import React from 'react';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut,
  Smartphone,
  Globe,
  Download
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { useCapacitor } from '@/hooks/useCapacitor';

const settingsSections = [
  {
    title: 'Account',
    items: [
      { icon: User, label: 'Profile Settings', path: '/mobile/profile' },
      { icon: Bell, label: 'Notifications', path: '/mobile/notifications' },
      { icon: Shield, label: 'Privacy & Security', path: '/mobile/privacy' },
    ]
  },
  {
    title: 'App Settings',
    items: [
      { icon: Smartphone, label: 'Mobile Features', path: '/mobile/mobile-features' },
      { icon: Globe, label: 'Language & Region', path: '/mobile/language' },
      { icon: Download, label: 'Offline Data', path: '/mobile/offline' },
    ]
  },
  {
    title: 'Support',
    items: [
      { icon: HelpCircle, label: 'Help & Support', path: '/mobile/help' },
      { icon: Settings, label: 'About App', path: '/mobile/about' },
    ]
  }
];

export const MobileMore: React.FC = () => {
  const navigate = useNavigate();
  const { isNative, platform } = useCapacitor();

  const handleSignOut = () => {
    // Handle sign out logic
    navigate('/login');
  };

  return (
    <div className="p-4 space-y-6">
      {/* User Profile Card */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Instructor Davis</h3>
              <p className="text-sm text-muted-foreground">Senior Instructor</p>
              <p className="text-xs text-muted-foreground">Alpha Company</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/mobile/profile')}
            >
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Platform Info */}
      {isNative && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Smartphone className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Mobile App</p>
                  <p className="text-xs text-muted-foreground">Running on {platform}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/mobile/mobile-features')}
              >
                Manage
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Sections */}
      {settingsSections.map((section) => (
        <Card key={section.title} className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="font-medium text-foreground mb-3">{section.title}</h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.label}
                    variant="ghost"
                    className="w-full justify-start p-2 h-auto"
                    onClick={() => navigate(item.path)}
                  >
                    <Icon className="mr-3 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{item.label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Quick Toggles */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <h3 className="font-medium text-foreground mb-3">Quick Settings</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Push Notifications</span>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Download className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Offline Mode</span>
              </div>
              <Switch />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start p-2 h-auto text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="mr-3 h-4 w-4" />
            <span className="text-sm">Sign Out</span>
          </Button>
        </CardContent>
      </Card>

      {/* App Version */}
      <div className="text-center text-xs text-muted-foreground">
        JROTC Command Center v1.0.0
        {isNative && <span className="block">Mobile App ({platform})</span>}
      </div>
    </div>
  );
};