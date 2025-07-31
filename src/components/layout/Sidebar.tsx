
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebarPreferences } from '@/hooks/useSidebarPreferences';
import { useThemes } from '@/hooks/useThemes';
import { SidebarCustomization } from './SidebarCustomization';
import { usePortal } from '@/contexts/PortalContext';
import { useNavigate } from 'react-router-dom';
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

// Default theme configuration
const DEFAULT_THEME = {
  primary_color: '#111827',    // Sidebar background (gray-900)
  secondary_color: '#2563eb',  // Selected link background (blue-600)
  link_text: '#d1d5db',       // Link text (gray-300)
  link_selected_text: '#ffffff', // Selected link text (white)
  link_hover: '#1f2937'       // Hover background (gray-800)
};

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
  const { setPortal, canAccessCompetitionPortal } = usePortal();
  const navigate = useNavigate();
  const [showCustomization, setShowCustomization] = useState(false);

  // Get the active theme that matches the user's JROTC program or use default
  const activeTheme = themes.find(theme => 
    theme.is_active && theme.jrotc_program === userProfile?.schools?.jrotc_program
  );
  
  // Use active theme or fallback to default theme
  const currentTheme = {
    primary_color: activeTheme?.primary_color || DEFAULT_THEME.primary_color,
    secondary_color: activeTheme?.secondary_color || DEFAULT_THEME.secondary_color,
    link_text: (activeTheme as any)?.link_text || DEFAULT_THEME.link_text,
    link_selected_text: (activeTheme as any)?.link_selected_text || DEFAULT_THEME.link_selected_text,
    link_hover: (activeTheme as any)?.link_hover || DEFAULT_THEME.link_hover,
  };

  const handlePreferencesUpdated = async () => {
    // Refresh the preferences data from the database
    await refreshPreferences();
  };

  if (isLoading) {
    return (
      <div 
        className={cn('fixed left-0 top-0 h-full w-64 text-white flex flex-col z-40', className)}
        style={{ backgroundColor: currentTheme.primary_color }}
      >
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
              <div key={i} className="h-10 rounded animate-pulse" style={{ backgroundColor: currentTheme.link_hover }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className={cn('fixed left-0 top-0 h-full w-64 text-white flex flex-col z-40', className)}
        style={{ backgroundColor: currentTheme.primary_color }}
      >
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
              const isActive = activeModule === item.id;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="w-full justify-start text-left font-normal"
                  style={{
                    backgroundColor: isActive ? currentTheme.secondary_color : 'transparent',
                    color: isActive ? currentTheme.link_selected_text : currentTheme.link_text,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = currentTheme.link_hover;
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = currentTheme.link_text;
                    }
                  }}
                  onClick={() => onModuleChange(item.id)}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.label}
                </Button>
              );
            })}

            {/* Competition Portal Access Button */}
            {canAccessCompetitionPortal && (
              <div className="pt-4 border-t border-gray-700">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left font-normal"
                  style={{
                    backgroundColor: 'transparent',
                    color: currentTheme.link_text,
                    border: `1px solid ${currentTheme.link_text}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = currentTheme.secondary_color;
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = currentTheme.link_text;
                  }}
                  onClick={() => {
                    setPortal('competition');
                    navigate('/app/competition-portal/dashboard');
                  }}
                >
                  <Trophy className="w-4 h-4 mr-3" />
                  Competition Portal
                </Button>
              </div>
            )}
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
