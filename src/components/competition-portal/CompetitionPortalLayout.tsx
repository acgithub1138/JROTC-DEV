import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { CompetitionSidebar } from './CompetitionSidebar';
import CompetitionDashboard from './CompetitionDashboard';
import CompetitionsPage from './CompetitionsPage';
import { EventsPage } from './EventsPage';
import { ScoreSheetsPage } from './ScoreSheetsPage';
import { JudgesPage } from './JudgesPage';

const CompetitionPortalLayout = () => {
  const [activeModule, setActiveModule] = useState('competition-dashboard');
  const location = useLocation();
  const navigate = useNavigate();

  // Map routes to modules
  const routeToModuleMap: { [key: string]: string } = {
    '/app/competition-portal': 'competition-dashboard',
    '/app/competition-portal/': 'competition-dashboard',
    '/app/competition-portal/dashboard': 'competition-dashboard',
    '/app/competition-portal/competitions': 'competitions',
    '/app/competition-portal/events': 'events',
    '/app/competition-portal/teams': 'teams',
    '/app/competition-portal/score-sheets': 'score-sheets',
    '/app/competition-portal/judges': 'judges',
    '/app/competition-portal/analytics': 'analytics',
    '/app/competition-portal/settings': 'competition-settings',
  };

  // Map modules to routes
  const moduleToRouteMap: { [key: string]: string } = {
    'competition-dashboard': '/app/competition-portal/dashboard',
    'competitions': '/app/competition-portal/competitions',
    'events': '/app/competition-portal/events',
    'teams': '/app/competition-portal/teams',
    'score-sheets': '/app/competition-portal/score-sheets',
    'judges': '/app/competition-portal/judges',
    'analytics': '/app/competition-portal/analytics',
    'competition-settings': '/app/competition-portal/settings',
  };

  // Sync activeModule with current route
  useEffect(() => {
    const currentModule = routeToModuleMap[location.pathname] || 'competition-dashboard';
    setActiveModule(currentModule);
  }, [location.pathname]);

  const handleModuleChange = (module: string) => {
    setActiveModule(module);
    const route = moduleToRouteMap[module];
    if (route) {
      navigate(route);
    }
  };

  // Function to render content based on current route
  const renderContent = () => {
    const path = location.pathname;
    
    if (path === '/app/competition-portal' || path === '/app/competition-portal/' || path === '/app/competition-portal/dashboard') {
      return <CompetitionDashboard />;
    } else if (path === '/app/competition-portal/competitions') {
      return <CompetitionsPage />;
    } else if (path === '/app/competition-portal/events') {
      return <EventsPage />;
    } else if (path === '/app/competition-portal/teams') {
      return <div className="p-6"><h1 className="text-2xl font-bold">Teams & Participants</h1><p>Coming soon...</p></div>;
    } else if (path === '/app/competition-portal/score-sheets') {
      return <ScoreSheetsPage />;
    } else if (path === '/app/competition-portal/judges') {
      return <JudgesPage />;
    } else if (path === '/app/competition-portal/analytics') {
      return <div className="p-6"><h1 className="text-2xl font-bold">Analytics & Reports</h1><p>Coming soon...</p></div>;
    } else if (path === '/app/competition-portal/settings') {
      return <div className="p-6"><h1 className="text-2xl font-bold">Competition Settings</h1><p>Coming soon...</p></div>;
    }
    
    // Default to dashboard
    return <CompetitionDashboard />;
  };

  return (
    <div className="min-h-screen bg-background">
      <CompetitionSidebar 
        activeModule={activeModule} 
        onModuleChange={handleModuleChange}
      />
      <div className="ml-64">
        <Header activeModule={activeModule} onModuleChange={handleModuleChange} />
        <main className="min-h-[calc(100vh-4rem)]">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default CompetitionPortalLayout;