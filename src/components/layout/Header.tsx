
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePortal } from '@/contexts/PortalContext';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { User, LogOut, Settings, Menu, Shield, Trophy, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebarPreferences } from '@/hooks/useSidebarPreferences';
import { SchoolProfileModal } from '@/components/school/SchoolProfileModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCapacitor } from '@/hooks/useCapacitor';

interface HeaderProps {
  activeModule: string;
  onModuleChange?: (module: string) => void;
  isMobile?: boolean;
  showSidebarToggle?: boolean;
  onSidebarToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeModule,
  onModuleChange,
  isMobile,
  showSidebarToggle = false,
  onSidebarToggle
}) => {
  const {
    signOut,
    userProfile
  } = useAuth();
  const { canAccessCompetitionPortal, setPortal } = usePortal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [schoolProfileOpen, setSchoolProfileOpen] = useState(false);
  const {
    menuItems
  } = useSidebarPreferences();
  
  const isMobileDetected = useIsMobile();
  const { isNative, platform } = useCapacitor();
  const [screenSize, setScreenSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Update screen size on resize
  React.useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  const getModuleTitle = (module: string) => {
    const titles: {
      [key: string]: string;
    } = {
      dashboard: 'Dashboard Overview',
      cadets: 'Cadet Management',
      teams: 'Team Management',
      tasks: 'Task Management',
      budget: 'Budget & Finance',
      inventory: 'Inventory Management',
      contacts: 'Contact Management',
      competitions: 'Competition Results',
      reports: 'Reports & Analytics',
      calendar: 'Calendar & Events',
      documents: 'Document Management',
      email: 'Email Management',
      settings: 'System Settings'
    };
    return titles[module] || module.charAt(0).toUpperCase() + module.slice(1);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'instructor':
        return 'bg-blue-100 text-blue-800';
      case 'command_staff':
        return 'bg-green-100 text-green-800';
      case 'cadet':
        return 'bg-gray-100 text-gray-800';
      case 'parent':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center">
        {/* Left side - Mobile Menu Button */}
        <div className="flex items-center space-x-4 flex-shrink-0">
          {showSidebarToggle && onSidebarToggle && (
            <Button variant="ghost" size="icon" onClick={onSidebarToggle}>
              <Menu className="w-5 h-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          )}
          {isMobile && onModuleChange && <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="w-2/3 ml-0">
                <SheetHeader>
                  <SheetTitle className="flex items-center space-x-2">
                    <Shield className="w-6 h-6 text-blue-400" />
                    <span>JROTC CCC</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  {menuItems.map(item => <Button key={item.id} variant={activeModule === item.id ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => {
                onModuleChange(item.id);
                setMobileMenuOpen(false);
              }}>
                      {item.label}
                    </Button>)}
                  
                  {canAccessCompetitionPortal && (
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50" 
                      onClick={() => {
                        setPortal('competition');
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      Competition Portal
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>}
        </div>
        
        {/* Center - School Name with Logo */}
        <div className="flex-1 flex justify-center items-center space-x-6">
          {userProfile?.schools && (
            <div className="flex items-center space-x-3">
              {userProfile.schools.logo_url && (
                <img 
                  src={userProfile.schools.logo_url} 
                  alt={`${userProfile.schools.name} logo`}
                  className="w-12 h-12 object-contain"
                />
              )}
              <h1 className="text-xl font-semibold text-gray-900">
                {userProfile.schools.name}
              </h1>
            </div>
          )}
          
          {/* Debug Info */}
          <div className="flex flex-col items-center text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
            <div className="font-mono">
              {(() => {
                const userAgent = navigator.userAgent.toLowerCase();
                const isIpad = /ipad/i.test(userAgent);
                const isMobileUA = /android|webos|iphone|ipod|blackberry|iemobile|opera mini|mobile/i.test(userAgent);
                
                if (isIpad) {
                  return screenSize.width < 768 ? 'iPad (Mobile)' : 'iPad (Desktop)';
                } else if (isNative) {
                  return `${platform} (Native)`;
                } else if (isMobileDetected) {
                  return 'Mobile (Web)';
                } else {
                  return 'Desktop (Web)';
                }
              })()}
            </div>
            <div className="font-mono text-xs">
              {screenSize.width} × {screenSize.height}
            </div>
          </div>
        </div>
        
        {/* Right side - User Menu */}
        <div className="flex items-center flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-sm font-medium">
                    {userProfile?.first_name} {userProfile?.last_name}
                  </div>
                  <Badge variant="secondary" className={`text-xs ${getRoleColor(userProfile?.role)}`}>
                    {userProfile?.role?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {userProfile?.role === 'instructor' && (
                <>
                  <DropdownMenuItem onClick={() => setSchoolProfileOpen(true)}>
                    <Building2 className="w-4 h-4 mr-2" />
                    School Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <SchoolProfileModal
        open={schoolProfileOpen}
        onOpenChange={setSchoolProfileOpen}
      />
    </div>;
};
