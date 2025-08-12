import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MobileNavigation } from './MobileNavigation';
import { MobileHeader } from './MobileHeader';

export const MobileLayout: React.FC = () => {
  const location = useLocation();
  
  // Hide header on certain full-screen pages
  const hideHeader = location.pathname.includes('/camera') || location.pathname.includes('/scanner');
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {!hideHeader && <MobileHeader />}
      
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      
      <MobileNavigation />
    </div>
  );
};