
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePortal } from '@/contexts/PortalContext';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { User, LogOut, Settings, Menu, Shield, Trophy, Building2, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebarPreferences } from '@/hooks/useSidebarPreferences';
import { SchoolProfileModal } from '@/components/school/SchoolProfileModal';
import { supabase } from '@/integrations/supabase/client';

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
  const navigate = useNavigate();
  const {
    signOut,
    userProfile
  } = useAuth();
  const { canAccessCompetitionPortal, setPortal } = usePortal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [schoolProfileOpen, setSchoolProfileOpen] = useState(false);
  const [linkedCadetId, setLinkedCadetId] = useState<string | null>(null);
  const {
    menuItems
  } = useSidebarPreferences();

  // Fetch linked cadet ID for parent users
  useEffect(() => {
    const fetchLinkedCadet = async () => {
      if (userProfile?.role === 'parent' && userProfile?.email && userProfile?.school_id) {
        try {
          const { data, error } = await supabase
            .from('contacts')
            .select('cadet_id')
            .eq('email', userProfile.email)
            .eq('school_id', userProfile.school_id)
            .maybeSingle();

          if (data?.cadet_id) {
            setLinkedCadetId(data.cadet_id);
          }
        } catch (error) {
          console.error('Error fetching linked cadet:', error);
        }
      }
    };

    fetchLinkedCadet();
  }, [userProfile?.role, userProfile?.email, userProfile?.school_id]);

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
                  {menuItems.map(item => (
                    <div key={item.id}>
                      <Button 
                        variant={activeModule === item.id ? 'secondary' : 'ghost'} 
                        className="w-full justify-start" 
                        onClick={() => {
                          onModuleChange(item.id);
                          setMobileMenuOpen(false);
                        }}
                      >
                        {item.label}
                      </Button>
                      
                      {/* Render sub-items if they exist */}
                      {item.children && item.children.length > 0 && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.children.map(subItem => (
                            <Button
                              key={subItem.id}
                              variant={activeModule === subItem.id ? 'secondary' : 'ghost'}
                              className="w-full justify-start text-sm"
                              onClick={() => {
                                onModuleChange(subItem.id);
                                setMobileMenuOpen(false);
                              }}
                            >
                              {subItem.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
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
        <div className="flex-1 flex justify-center">
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
              
              <DropdownMenuItem onClick={() => {
                if (userProfile?.role === 'parent') {
                  navigate('/app/parent-profile');
                } else {
                  navigate(`/app/cadets/cadet_record?mode=view&id=${userProfile?.id}`);
                }
              }}>
                <User className="w-4 h-4 mr-2" />
                My Profile
              </DropdownMenuItem>
              
              {userProfile?.role === 'parent' && linkedCadetId && (
                <DropdownMenuItem onClick={() => navigate(`/app/cadets/cadet_record?mode=view&id=${linkedCadetId}`)}>
                  <UserCircle className="w-4 h-4 mr-2" />
                  My Cadet's Profile
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
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
