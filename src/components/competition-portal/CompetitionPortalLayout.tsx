import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { CompetitionSidebar } from './CompetitionSidebar';
import CompetitionDashboard from './CompetitionDashboard';
import CompetitionsPage from './CompetitionsPage';
import MyCompetitionsPage from './my-competitions/MyCompetitionsPage';
import MyCompetitionsAnalyticsPage from './my-competitions/MyCompetitionsAnalyticsPage';
import { ScoreSheetsPage } from './ScoreSheetsPage';
import { JudgesPage } from './JudgesPage';
import { CompetitionDetailsPage } from './CompetitionDetailsPage';
import { CompetitionSettingsPage } from './pages/CompetitionSettingsPage';
import { CompetitionEventRecord } from './pages/CompetitionEventRecord';
import { CompetitionJudgesRecord } from './CompetitionJudgesRecord';
import { CompetitionResourceRecord } from './pages/CompetitionResourceRecord';
import { CompetitionSchoolRecord } from './pages/CompetitionSchoolRecord';
import { ScoreSheetRecord } from './pages/ScoreSheetRecord';
import { ScheduleEditRecord } from './pages/ScheduleEditRecord';
import { ViewScoreSheet } from './pages/ViewScoreSheet';
import { EditScoreSheet } from './pages/EditScoreSheet';
import { OpenCompetitionsPage } from './OpenCompetitionsPage';
import { OpenCompetitionRecord } from './pages/OpenCompetitionRecord';
import { ScoreSheetPage } from './my-competitions/ScoreSheetPage';
import { CPCompetitionRecordPage } from './CPCompetitionRecordPage';
import { AddCompetitionPage } from './my-competitions/AddCompetitionPage';
import { AddCompetitionEventPage } from './my-competitions/AddCompetitionEventPage';
import { JudgeRecordPage } from './pages/JudgeRecordPage';
import { JudgesBulkUploadPage } from './pages/JudgesBulkUploadPage';
import { ScoreSheetRecordPage } from './pages/ScoreSheetRecordPage';
import { useAuth } from '@/contexts/AuthContext';
import { usePortal } from '@/contexts/PortalContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { getDefaultCompetitionModule, canAccessCompetitionModule } from '@/utils/competitionPermissions';

const CompetitionPortalLayout = () => {
  const { userProfile } = useAuth();
  const { hasCompetitionModule, hasCompetitionPortal } = usePortal();
  const [activeModule, setActiveModule] = useState('open_competitions');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Map routes to modules - keeping for backward compatibility with header
  const routeToModuleMap: { [key: string]: string } = {
    '/app/competition-portal': 'cp_dashboard',
    '/app/competition-portal/': 'cp_dashboard',
    '/app/competition-portal/dashboard': 'cp_dashboard',
    '/app/competition-portal/competitions': 'cp_competitions',
    '/app/competition-portal/my-competitions': 'competitions',
    '/app/competition-portal/my-competitions-analytics': 'my_competitions_analytics',
    '/app/competition-portal/score-sheets': 'cp_score_sheets',
    '/app/competition-portal/judges': 'cp_judges',
    '/app/competition-portal/analytics': 'analytics',
    '/app/competition-portal/settings': 'competition_settings',
    '/app/competition-portal/open-competitions': 'open_competitions',
  };

  // Map modules to routes - keeping for backward compatibility with header
  const moduleToRouteMap: { [key: string]: string } = {
    'cp_dashboard': '/app/competition-portal/dashboard',
    'cp_competitions': '/app/competition-portal/competitions',
    'competitions': '/app/competition-portal/my-competitions',
    'my_competitions_analytics': '/app/competition-portal/my-competitions-analytics',
    'cp_score_sheets': '/app/competition-portal/score-sheets',
    'cp_judges': '/app/competition-portal/judges',
    'analytics': '/app/competition-portal/analytics',
    'competition_settings': '/app/competition-portal/settings',
    'open_competitions': '/app/competition-portal/open-competitions',
  };

  useEffect(() => {
    // Initialize with default module when school flags are available
    const defaultModule = getDefaultCompetitionModule(hasCompetitionModule, hasCompetitionPortal);
    setActiveModule(defaultModule);
  }, [hasCompetitionModule, hasCompetitionPortal]);

  useEffect(() => {
    // Map current path to module - ORDER MATTERS: Check more specific paths first!
    const pathToModuleMap: { [key: string]: string } = {
      '/dashboard': 'cp_dashboard',
      '/competitions': 'cp_competitions',
      '/competition-details': 'cp_competitions',
      '/my-competitions-analytics': 'my_competitions_analytics', // Check this BEFORE /my-competitions
      '/my-competitions': 'competitions',
      '/score-sheets': 'cp_score_sheets',
      '/judges': 'cp_judges',
      '/open-competitions': 'open_competitions',
      '/analytics': 'analytics',
      '/settings': 'competition_settings'
    };
    
    const currentPath = location.pathname.replace('/app/competition-portal', '') || '/';
    let detectedModule = 'open_competitions'; // Safe fallback
    
    // Find the matching module for current path
    for (const [path, module] of Object.entries(pathToModuleMap)) {
      if (currentPath.includes(path)) {
        detectedModule = module;
        break;
      }
    }
    
    // Check if user can access the detected module
    const canAccessModule = canAccessCompetitionModule(detectedModule, hasCompetitionModule, hasCompetitionPortal);
    
    if (!canAccessModule) {
      // Redirect to default accessible module
      const defaultModule = getDefaultCompetitionModule(hasCompetitionModule, hasCompetitionPortal);
      const defaultRoute = moduleToRouteMap[defaultModule];
      if (defaultRoute && location.pathname !== defaultRoute) {
        navigate(defaultRoute);
        return;
      }
      setActiveModule(defaultModule);
    } else {
      setActiveModule(detectedModule);
    }
  }, [location.pathname, hasCompetitionModule, hasCompetitionPortal, navigate, moduleToRouteMap]);

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
    console.log('CompetitionPortalLayout - Current path:', path);
    
    if (path === '/app/competition-portal' || path === '/app/competition-portal/' || path === '/app/competition-portal/dashboard') {
      return <CompetitionDashboard />;
    } else if (path.startsWith('/app/competition-portal/competitions/competition_record')) {
      return <CPCompetitionRecordPage />;
    } else if (path === '/app/competition-portal/competitions') {
      return <CompetitionsPage />;
    } else if (path.startsWith('/app/competition-portal/my-competitions/add_competition_event')) {
      return <AddCompetitionEventPage />;
    } else if (path.startsWith('/app/competition-portal/my-competitions/add_competition')) {
      return <AddCompetitionPage />;
    } else if (path === '/app/competition-portal/my-competitions') {
      return <MyCompetitionsPage />;
    } else if (path === '/app/competition-portal/my-competitions-analytics') {
      return <MyCompetitionsAnalyticsPage />;
    } else if (path.startsWith('/app/competition-portal/my-competitions/score-sheets/')) {
      return <ScoreSheetPage />;
    } else if (path.startsWith('/app/competition-portal/competition-details/') && path.includes('/events_record')) {
      console.log('CompetitionPortalLayout - Rendering CompetitionEventRecord');
      return <CompetitionEventRecord />;
    } else if (path.startsWith('/app/competition-portal/competition-details/') && path.includes('/judges_record')) {
      console.log('CompetitionPortalLayout - Rendering CompetitionJudgesRecord');
      return <CompetitionJudgesRecord />;
    } else if (path.startsWith('/app/competition-portal/competition-details/') && path.includes('/resources_record')) {
      console.log('CompetitionPortalLayout - Rendering CompetitionResourceRecord');
      return <CompetitionResourceRecord />;
    } else if (path.startsWith('/app/competition-portal/competition-details/') && path.includes('/school_record')) {
      return <CompetitionSchoolRecord />;
    } else if (path.startsWith('/app/competition-portal/competition-details/') && path.includes('/score_sheet_record')) {
      return <ScoreSheetRecord />;
    } else if (path.startsWith('/app/competition-portal/competition-details/') && path.includes('/schedule_record')) {
      return <ScheduleEditRecord />;
    } else if (path.startsWith('/app/competition-portal/competition-details/') && path.includes('/results/view_score_sheet/edit_score_sheet')) {
      return <EditScoreSheet />;
    } else if (path.startsWith('/app/competition-portal/competition-details/') && path.includes('/results/view_score_sheet')) {
      return <ViewScoreSheet />;
    } else if (path.startsWith('/app/competition-portal/competition-details/')) {
      return <CompetitionDetailsPage />;
    } else if (path.startsWith('/app/competition-portal/score-sheets/score_sheet_record')) {
      return <ScoreSheetRecordPage />;
    } else if (path === '/app/competition-portal/score-sheets') {
      return <ScoreSheetsPage />;
    } else if (path.startsWith('/app/competition-portal/judges/judges_bulk_upload')) {
      return <JudgesBulkUploadPage />;
    } else if (path.startsWith('/app/competition-portal/judges/judge_record')) {
      return <JudgeRecordPage />;
    } else if (path === '/app/competition-portal/judges') {
      return <JudgesPage />;
    } else if (path === '/app/competition-portal/analytics') {
      return <div className="p-6"><h1 className="text-2xl font-bold">Analytics & Reports</h1><p>Coming soon...</p></div>;
    } else if (path === '/app/competition-portal/settings') {
      return <CompetitionSettingsPage />;
    } else if (path.startsWith('/app/competition-portal/open-competitions/') && path.includes('open_comp_record')) {
      console.log('CompetitionPortalLayout - Rendering OpenCompetitionRecord');
      return <OpenCompetitionRecord />;
    } else if (path === '/app/competition-portal/open-competitions') {
      return <OpenCompetitionsPage />;
    }
    
    console.log('CompetitionPortalLayout - Defaulting to CompetitionDashboard');
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