import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { usePortal } from '@/contexts/PortalContext';
import { useThemes } from '@/hooks/useThemes';
import { useNavigate } from 'react-router-dom';
import { Trophy, Calendar, Users, FileText, BarChart3, Settings, ArrowLeft, Shield, Award, Target, Clipboard } from 'lucide-react';
interface CompetitionSidebarProps {
  className?: string;
  activeModule: string;
  onModuleChange: (module: string) => void;
}

// Default theme configuration
const DEFAULT_THEME = {
  primary_color: '#111827',
  // Sidebar background (gray-900)
  secondary_color: '#2563eb',
  // Selected link background (blue-600)
  link_text: '#d1d5db',
  // Link text (gray-300)
  link_selected_text: '#ffffff',
  // Selected link text (white)
  link_hover: '#1f2937' // Hover background (gray-800)
};

// Competition portal specific menu items
const competitionMenuItems = [{
  id: 'competition-dashboard',
  label: 'Dashboard',
  icon: Trophy,
  path: '/app/competition-portal/dashboard'
}, {
  id: 'competitions',
  label: 'Competitions',
  icon: Award,
  path: '/app/competition-portal/competitions'
}, {
  id: 'score-sheets',
  label: 'Score Sheets',
  icon: Clipboard,
  path: '/app/competition-portal/score-sheets'
},{
  id: 'events',
  label: 'Events',
  icon: Calendar,
  path: '/app/competition-portal/events'
}, {
  id: 'judges',
  label: 'Judges',
  icon: Shield,
  path: '/app/competition-portal/judges'
}, {
  id: 'analytics',
  label: 'Analytics & Reports',
  icon: BarChart3,
  path: '/app/competition-portal/analytics'
}, {
  id: 'competition-settings',
  label: 'Settings',
  icon: Settings,
  path: '/app/competition-portal/settings'
}];
export const CompetitionSidebar: React.FC<CompetitionSidebarProps> = ({
  className,
  activeModule,
  onModuleChange
}) => {
  const {
    userProfile
  } = useAuth();
  const {
    setPortal
  } = usePortal();
  const {
    themes
  } = useThemes();
  const navigate = useNavigate();

  // Get the active theme that matches the user's JROTC program or use default
  const activeTheme = themes.find(theme => theme.is_active && theme.jrotc_program === userProfile?.schools?.jrotc_program);

  // Use active theme or fallback to default theme
  const currentTheme = {
    primary_color: activeTheme?.primary_color || DEFAULT_THEME.primary_color,
    secondary_color: activeTheme?.secondary_color || DEFAULT_THEME.secondary_color,
    link_text: (activeTheme as any)?.link_text || DEFAULT_THEME.link_text,
    link_selected_text: (activeTheme as any)?.link_selected_text || DEFAULT_THEME.link_selected_text,
    link_hover: (activeTheme as any)?.link_hover || DEFAULT_THEME.link_hover
  };
  const handleReturnToCCC = () => {
    setPortal('ccc');
    navigate('/app/dashboard');
  };
  const handleMenuItemClick = (item: typeof competitionMenuItems[0]) => {
    onModuleChange(item.id);
  };
  return <div className={cn('fixed left-0 top-0 h-full w-64 text-white flex flex-col z-40', className)} style={{
    backgroundColor: currentTheme.primary_color
  }}>
      <div className="p-6">
        <div className="flex items-center space-x-2">
          {activeTheme?.theme_image_url ? <img src={activeTheme.theme_image_url} alt="JROTC Program Logo" className="w-8 h-8 object-contain" /> : <Trophy className="w-8 h-8 text-blue-400" />}
          <div>
            <h1 className="text-xl font-bold">Competition Portal</h1>
            
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1">
          {competitionMenuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return <Button key={item.id} variant="ghost" className="w-full justify-start text-left font-normal" style={{
            backgroundColor: isActive ? currentTheme.secondary_color : 'transparent',
            color: isActive ? currentTheme.link_selected_text : currentTheme.link_text
          }} onMouseEnter={e => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor = currentTheme.link_hover;
              e.currentTarget.style.color = '#ffffff';
            }
          }} onMouseLeave={e => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = currentTheme.link_text;
            }
          }} onClick={() => handleMenuItemClick(item)}>
                <Icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>;
        })}
        </div>
      </ScrollArea>

      {/* Return to CCC Button */}
      <div className="p-3 border-t border-gray-700">
        <Button variant="outline" className="w-full justify-start text-left font-normal" style={{
        borderColor: currentTheme.link_text,
        color: currentTheme.link_text,
        backgroundColor: 'transparent'
      }} onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = currentTheme.link_hover;
        e.currentTarget.style.color = '#ffffff';
      }} onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = currentTheme.link_text;
      }} onClick={handleReturnToCCC}>
          <ArrowLeft className="w-4 h-4 mr-3" />
          Return to CCC
        </Button>
      </div>
    </div>;
};