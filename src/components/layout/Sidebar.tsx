
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebarPreferences } from '@/hooks/useSidebarPreferences';
import { useThemes } from '@/hooks/useThemes';
import { SidebarCustomization } from './SidebarCustomization';
import {
  User,
  Users,
  CheckSquare,
  DollarSign,
  Package,
  Contact,
  Trophy,
  Shield,
  Settings,
  BarChart3,
  Calendar,
  FileText,
  Home,
  UserCog,
  Building2,
  Menu,
  Mails,
  Workflow,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  activeModule: string;
  onModuleChange: (module: string) => void;
}

// Icon mapping for dynamic icon resolution
const iconMap = {
  Home,
  User,
  Users,
  Shield,
  CheckSquare,
  DollarSign,
  Package,
  Contact,
  Settings,
  BarChart3,
  Calendar,
  FileText,
  UserCog,
  Building2,
  Mails,
  Workflow,
  Briefcase,
  Trophy,
  AlertTriangle,
};

export const Sidebar: React.FC<SidebarProps> = ({ className, activeModule, onModuleChange }) => {
  const { userProfile } = useAuth();
  const { menuItems, isLoading, refreshPreferences } = useSidebarPreferences();
  const { themes } = useThemes();
  const [showCustomization, setShowCustomization] = useState(false);

  // Get the active theme for the user's school
  const activeTheme = themes.find(theme => theme.is_active);

  const handlePreferencesUpdated = async () => {
    // Refresh the preferences data from the database
    await refreshPreferences();
  };

  if (isLoading) {
    return (
      <div className={cn('fixed left-0 top-0 h-full w-64 bg-gray-900 text-white flex flex-col z-40', className)}>
        <div className="p-6">
          <div className="flex items-center space-x-2">
            {activeTheme?.theme_image_url ? (
              <img 
                src={activeTheme.theme_image_url} 
                alt="JROTC Program Logo" 
                className="w-8 h-8 object-contain"
              />
            ) : (
              <Shield className="w-8 h-8 text-blue-400" />
            )}
            <h1 className="text-xl font-bold">JROTC CCC</h1>
          </div>
        </div>
        <div className="flex-1 p-3">
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn('fixed left-0 top-0 h-full w-64 bg-gray-900 text-white flex flex-col z-40', className)}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {activeTheme?.theme_image_url ? (
                <img 
                  src={activeTheme.theme_image_url} 
                  alt="JROTC Program Logo" 
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <Shield className="w-8 h-8 text-blue-400" />
              )}
              <h1 className="text-xl font-bold">JROTC CCC</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
              onClick={() => setShowCustomization(true)}
              title="Customize sidebar"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap] || Home;
              return (
                <Button
                  key={item.id}
                  variant={activeModule === item.id ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    activeModule === item.id
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  )}
                  onClick={() => onModuleChange(item.id)}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <SidebarCustomization
        open={showCustomization}
        onOpenChange={setShowCustomization}
        onPreferencesUpdated={handlePreferencesUpdated}
      />
    </>
  );
};
