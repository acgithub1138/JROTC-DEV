
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebarPreferences } from '@/hooks/useSidebarPreferences';
import { useThemes } from '@/hooks/useThemes';
import { usePortal } from '@/contexts/PortalContext';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { Shield, Home, Trophy, Youtube } from 'lucide-react';

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

// Dynamic icon renderer component
const DynamicIcon: React.FC<{ iconName: string; className?: string }> = ({ iconName, className = "" }) => {
  const iconKey = iconName as keyof typeof LucideIcons;
  const IconComponent = LucideIcons[iconKey];
  
  // Type guard to check if it's a valid React component
  const isValidComponent = (component: any): component is React.ComponentType<any> => {
    return typeof component === 'function' || (typeof component === 'object' && component.$$typeof);
  };
  
  if (!IconComponent || !isValidComponent(IconComponent)) {
    console.warn(`Icon "${iconName}" not found in Lucide icons, using fallback`);
    return <Home className={className} />;
  }
  
  return <IconComponent className={className} />;
};

export const Sidebar: React.FC<SidebarProps> = ({ className, activeModule, onModuleChange }) => {
  const { userProfile } = useAuth();
  const { menuItems, isLoading } = useSidebarPreferences();
  const { themes } = useThemes();
  const { setPortal, canAccessCompetitionPortal } = usePortal();
  const navigate = useNavigate();

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

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1">
            {menuItems.map((item) => {
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
                  <DynamicIcon iconName={item.icon} className="w-4 h-4 mr-3" />
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
                    console.log('Competition Portal button clicked - navigating to portal');
                    setPortal('competition');
                    navigate('/app/competition-portal/dashboard');
                  }}
                >
                  <Trophy className="w-4 h-4 mr-3" />
                  Competition Portal
                </Button>
              </div>
            )}

            {/* Training Videos Button */}
            <div className={`${canAccessCompetitionPortal ? 'pt-2' : 'pt-4 border-t border-gray-700'}`}>
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
                  window.open('https://www.youtube.com/@JORTC-CCC/playlists', '_blank');
                }}
              >
                <Youtube className="w-4 h-4 mr-3" />
                Training Videos
              </Button>
            </div>
            
          </div>
        </ScrollArea>
      </div>
    </>
  );
};
