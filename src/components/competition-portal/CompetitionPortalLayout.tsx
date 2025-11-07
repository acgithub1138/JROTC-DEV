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
import { usePermissionContext } from '@/contexts/PermissionContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { getDefaultCompetitionModule, canAccessCompetitionModule } from '@/utils/competitionPermissions';
import { fetchCompetitionModuleMappings, findModuleForPath, type ModuleMappings } from '@/utils/competitionModuleMappings';

const CompetitionPortalLayout = () => {
  const { userProfile } = useAuth();
  const { hasCompetitionModule, hasCompetitionPortal } = usePortal();
  const { hasPermission, isLoading: permissionsLoading } = usePermissionContext();
  const [activeModule, setActiveModule] = useState('open_competitions');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moduleMappings, setModuleMappings] = useState<ModuleMappings>({
    pathToModuleMap: new Map(),
    moduleToPathMap: new Map(),
    modules: []
  });
  const [mappingsLoaded, setMappingsLoaded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Load module mappings from database
  useEffect(() => {
    const loadMappings = async () => {
      if (!userProfile?.role || permissionsLoading) {
        return;
      }

      try {
        const mappings = await fetchCompetitionModuleMappings(
          hasPermission,
          hasCompetitionModule,
          hasCompetitionPortal
        );
        setModuleMappings(mappings);
        setMappingsLoaded(true);
      } catch (error) {
        console.error('Error loading competition module mappings:', error);
        setMappingsLoaded(true);
      }
    };

    loadMappings();
  }, [userProfile?.role, hasPermission, permissionsLoading, hasCompetitionModule, hasCompetitionPortal]);

  // Sync active module with current path
  useEffect(() => {
    if (!mappingsLoaded) return;

    const currentPath = location.pathname;
    console.log('🔍 Path detection:', { 
      fullPath: location.pathname, 
      availablePaths: Array.from(moduleMappings.pathToModuleMap.keys())
    });
    
    const detectedModule = findModuleForPath(currentPath, moduleMappings.pathToModuleMap);
    
    console.log('🎯 Module detection result:', {
      detectedModule,
      currentActiveModule: activeModule
    });
    
    if (detectedModule) {
      setActiveModule(detectedModule);
    } else {
      // Fallback to default if path not found
      const defaultModule = getDefaultCompetitionModule(hasCompetitionModule, hasCompetitionPortal);
      console.log('⚠️ No module found for path, using default:', defaultModule);
      setActiveModule(defaultModule);
    }
  }, [location.pathname, mappingsLoaded]);

  const handleModuleChange = (module: string) => {
    setActiveModule(module);
    const route = moduleMappings.moduleToPathMap.get(module);
    if (route) {
      navigate(route);
    } else {
      // Fallback
      navigate('/app/competition-portal');
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