
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
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
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  activeModule: string;
  onModuleChange: (module: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'cadets', label: 'Cadets', icon: Users },
  { id: 'teams', label: 'Teams', icon: Shield },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'budget', label: 'Budget', icon: DollarSign },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'contacts', label: 'Contacts', icon: Contact },
  { id: 'competitions', label: 'Competitions', icon: Trophy },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ className, activeModule, onModuleChange }) => {
  return (
    <div className={cn('bg-gray-900 text-white flex flex-col', className)}>
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <Shield className="w-8 h-8 text-blue-400" />
          <h1 className="text-xl font-bold">JROTC Hub</h1>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
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
  );
};
