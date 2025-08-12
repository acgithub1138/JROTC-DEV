import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  CheckSquare, 
  Users, 
  AlertTriangle, 
  Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    name: 'Dashboard',
    path: '/mobile/dashboard',
    icon: Home,
  },
  {
    name: 'Tasks',
    path: '/mobile/tasks',
    icon: CheckSquare,
  },
  {
    name: 'Cadets',
    path: '/mobile/cadets',
    icon: Users,
  },
  {
    name: 'Incidents',
    path: '/mobile/incidents',
    icon: AlertTriangle,
  },
  {
    name: 'More',
    path: '/mobile/more',
    icon: Settings,
  },
];

export const MobileNavigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="flex justify-around">
        {navigationItems.map((item) => {
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