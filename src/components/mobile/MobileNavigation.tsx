import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  CheckSquare, 
  Users, 
  Calendar, 
  Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermissionContext } from '@/contexts/PermissionContext';

const navigationItems = [
  {
    name: 'Dashboard',
    path: '/mobile/dashboard',
    icon: Home,
    module: 'dashboard',
  },
  {
    name: 'Tasks',
    path: '/mobile/tasks',
    icon: CheckSquare,
    module: 'tasks',
  },
  {
    name: 'Cadets',
    path: '/mobile/cadets',
    icon: Users,
    module: 'cadets',
  },
  {
    name: 'Calendar',
    path: '/mobile/calendar',
    icon: Calendar,
    module: 'calendar',
  },
  {
    name: 'More',
    path: '/mobile/more',
    icon: Settings,
    module: null, // Always show More tab
  },
];

export const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const { hasPermission } = usePermissionContext();

  // Filter navigation items based on permissions
  const visibleItems = navigationItems.filter(item => {
    if (!item.module) return true; // Always show items without module (like More)
    return hasPermission(item.module, 'sidebar');
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="flex justify-around">
        {visibleItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1",
                "transition-colors duration-200",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs font-medium truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};