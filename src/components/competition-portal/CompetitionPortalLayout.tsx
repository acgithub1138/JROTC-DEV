import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { CompetitionSidebar } from './CompetitionSidebar';
import CompetitionDashboard from './CompetitionDashboard';
import CompetitionsPage from './CompetitionsPage';
import MyCompetitionsPage from './my-competitions/MyCompetitionsPage';
import { ScoreSheetsPage } from './ScoreSheetsPage';
import { JudgesPage } from './JudgesPage';
import { CompetitionDetailsPage } from './CompetitionDetailsPage';
import { CompetitionSettingsPage } from './pages/CompetitionSettingsPage';
import { OpenCompetitionsPage } from './OpenCompetitionsPage';
import { ScoreSheetPage } from './my-competitions/ScoreSheetPage';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

const CompetitionPortalLayout = () => {
  const { userProfile } = useAuth();
  const [activeModule, setActiveModule] = useState('cp_dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Map routes to modules - keeping for backward compatibility with header
  const routeToModuleMap: { [key: string]: string } = {
    '/app/competition-portal': 'cp_dashboard',
    '/app/competition-portal/': 'cp_dashboard',
    '/app/competition-portal/dashboard': 'cp_dashboard',
    '/app/competition-portal/competitions': 'hosting_competitions',
    '/app/competition-portal/my-competitions': 'my_competitions',
    '/app/competition-portal/score-sheets': 'cp_score_sheets',
    '/app/competition-portal/judges': 'cp_judges',
    '/app/competition-portal/analytics': 'analytics',
    '/app/competition-portal/settings': 'competition_settings',
    '/app/competition-portal/open-competitions': 'open_competitions',
  };

  // Map modules to routes - keeping for backward compatibility with header
  const moduleToRouteMap: { [key: string]: string } = {
    'cp_dashboard': '/app/competition-portal/dashboard',
    'hosting_competitions': '/app/competition-portal/competitions',
    'my_competitions': '/app/competition-portal/my-competitions',
    'cp_score_sheets': '/app/competition-portal/score-sheets',
    'cp_judges': '/app/competition-portal/judges',
    'analytics': '/app/competition-portal/analytics',
    'competition_settings': '/app/competition-portal/settings',
    'open_competitions': '/app/competition-portal/open-competitions',
  };

  useEffect(() => {
    const hasCompetitionPortal = userProfile?.schools?.competition_portal === true;
    const hasCompetitionModule = userProfile?.schools?.competition_module === true;
    
    // Extract module name from current path for active module detection
    const pathSegments = location.pathname.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];
    
    // Set active module based on current route
    let currentModule = 'cp_dashboard'; // Default to dashboard
    if (location.pathname.includes('/dashboard')) {
      currentModule = 'cp_dashboard';
    } else if (location.pathname.includes('/competitions') && !location.pathname.includes('/my-competitions')) {
      currentModule = 'hosting_competitions';
    } else if (location.pathname.includes('/my-competitions')) {
      currentModule = 'my_competitions';
    } else if (location.pathname.includes('/score-sheets')) {
      currentModule = 'cp_score_sheets';
    } else if (location.pathname.includes('/judges')) {
      currentModule = 'cp_judges';
    } else if (location.pathname.includes('/open-competitions')) {
      currentModule = 'open_competitions';
    }
    
    // Portal access checks remain the same
    const portalOnlyPaths = ['/dashboard', '/competitions', '/score-sheets', '/judges', '/analytics', '/settings'];
    const moduleAccessiblePaths = ['/open-competitions', '/my-competitions'];
    
    const currentPath = location.pathname.replace('/app/competition-portal', '');
    
    // If user doesn't have competition portal access but tries to access portal-only paths
    if (!hasCompetitionPortal && portalOnlyPaths.some(path => currentPath.includes(path))) {
      navigate('/app/competition-portal/open-competitions');
      return;
    }
    
    // If user doesn't have any competition access
    if (!hasCompetitionPortal && !hasCompetitionModule && !moduleAccessiblePaths.some(path => currentPath.includes(path))) {
      navigate('/app/competition-portal/open-competitions');
      return;
    }
    
    setActiveModule(currentModule);
  }, [location.pathname, userProfile, navigate]);

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
    } else if (path === '/app/competition-portal/my-competitions') {
      return <MyCompetitionsPage />;
    } else if (path.startsWith('/app/competition-portal/my-competitions/score-sheets/')) {
      return <ScoreSheetPage />;
    } else if (path.startsWith('/app/competition-portal/competition-details/')) {
      return <CompetitionDetailsPage />;
    } else if (path === '/app/competition-portal/score-sheets') {
      return <ScoreSheetsPage />;
    } else if (path === '/app/competition-portal/judges') {
      return <JudgesPage />;
    } else if (path === '/app/competition-portal/analytics') {
      return <div className="p-6"><h1 className="text-2xl font-bold">Analytics & Reports</h1><p>Coming soon...</p></div>;
    } else if (path === '/app/competition-portal/settings') {
      return <CompetitionSettingsPage />;
    } else if (path === '/app/competition-portal/open-competitions') {
      return <OpenCompetitionsPage />;
    }
    
    // Default to dashboard
    return <CompetitionDashboard />;
  };

  return (
    <div className="min-h-screen bg-background">
      <CompetitionSidebar 
        activeModule={activeModule} 
        onModuleChange={handleModuleChange}
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className={isMobile ? "ml-0" : "ml-64"}>
        <Header 
          activeModule={activeModule} 
          onModuleChange={handleModuleChange}
          showSidebarToggle={isMobile}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="min-h-[calc(100vh-4rem)]">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default CompetitionPortalLayout;