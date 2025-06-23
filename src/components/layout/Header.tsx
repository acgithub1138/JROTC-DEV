
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Bell, Search, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';

interface HeaderProps {
  activeModule: string;
}

export const Header: React.FC<HeaderProps> = ({ activeModule }) => {
  const { user, signOut } = useAuth();

  const getModuleTitle = (module: string) => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      cadets: 'Cadet Management',
      teams: 'Team Management',
      tasks: 'Task Management',
      budget: 'Budget & Finance',
      inventory: 'Inventory Management',
      contacts: 'Contact Management',
      competitions: 'Competition Results',
      reports: 'Reports & Analytics',
      calendar: 'Calendar',
      documents: 'Documents',
      settings: 'Settings',
    };
    return titles[module] || 'JROTC Corps Hub';
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-900">{getModuleTitle(activeModule)}</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search..."
              className="pl-10 w-64 bg-gray-50 border-gray-200"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900">
            <Bell className="w-5 h-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-50">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-600 text-white text-sm">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700">{user?.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
