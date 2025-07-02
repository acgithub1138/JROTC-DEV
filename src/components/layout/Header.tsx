
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  activeModule: string;
}

export const Header: React.FC<HeaderProps> = ({ activeModule }) => {
  const { signOut, userProfile } = useAuth();

  const getModuleTitle = (module: string) => {
    const titles: { [key: string]: string } = {
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
      settings: 'System Settings',
    };
    return titles[module] || module.charAt(0).toUpperCase() + module.slice(1);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'instructor': return 'bg-blue-100 text-blue-800';
      case 'command_staff': return 'bg-green-100 text-green-800';
      case 'cadet': return 'bg-gray-100 text-gray-800';
      case 'parent': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          {userProfile?.schools && (
            <p className="text-sm text-gray-600">{userProfile.schools.name}</p>
          )}
        </div>
        
        <div className="flex items-center">
          {/* User Menu */}
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
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
