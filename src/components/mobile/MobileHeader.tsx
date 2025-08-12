import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const getPageTitle = (pathname: string): string => {
  if (pathname.includes('/dashboard')) return 'Dashboard';
  if (pathname.includes('/tasks')) return 'Tasks';
  if (pathname.includes('/cadets')) return 'Cadets';
  if (pathname.includes('/incidents')) return 'Incidents';
  if (pathname.includes('/more')) return 'Settings';
  return 'JROTC Command';
};

const getCanGoBack = (pathname: string): boolean => {
  const segments = pathname.split('/').filter(Boolean);
  return segments.length > 2; // More than /mobile/dashboard
};

export const MobileHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const title = getPageTitle(location.pathname);
  const canGoBack = getCanGoBack(location.pathname);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {canGoBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2 h-8 w-8"
            >
              <ArrowLeft size={18} />
            </Button>
          )}
          <h1 className="text-lg font-semibold text-foreground truncate">
            {title}
          </h1>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 h-8 w-8"
            onClick={() => navigate('/mobile/search')}
          >
            <Search size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 h-8 w-8 relative"
            onClick={() => navigate('/mobile/notifications')}
          >
            <Bell size={18} />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
};