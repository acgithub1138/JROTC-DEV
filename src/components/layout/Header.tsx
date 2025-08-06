
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { User, LogOut, Settings, Menu, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebarPreferences } from '@/hooks/useSidebarPreferences';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    menuItems
  } = useSidebarPreferences();

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
              <SheetContent side="left" className="w-64">
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
                </div>
              </SheetContent>
            </Sheet>}
        </div>
        
        {/* Center - School Name */}
        <div className="flex-1 flex justify-center">
          {userProfile?.schools && (
            <h1 className="text-xl font-semibold text-gray-900">
              {userProfile.schools.name}
            </h1>
          )}
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
              
              
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>;
};
