
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from './layout/Header';
import { Sidebar } from './layout/Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePortal } from '@/contexts/PortalContext';
import CompetitionPortalLayout from './competition-portal/CompetitionPortalLayout';
import { supabase } from '@/integrations/supabase/client';

import ProtectedRoute from './ProtectedRoute';
import DashboardOverview from './dashboard/DashboardOverview';
import TaskManagementPage from './tasks/TaskManagementPage';
import { TaskRecordPage } from './tasks/TaskRecordPage';
import IncidentManagementPage from './incident-management/IncidentManagementPage';
import { IncidentRecordPage } from './incident-management/IncidentRecordPage';
import SchoolManagementPage from './school-management/SchoolManagementPage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserAdminPage from './user-management/UserAdminPage';
import TaskOptionsManagement from './tasks/TaskOptionsManagement';
import IncidentOptionsManagement from './incident-management/IncidentOptionsManagement';
import EmailManagementPage from './email-management/EmailManagementPage';
import EmailTemplatesPage from '@/pages/EmailTemplatesPage';
import CalendarEventTypesPage from '@/pages/CalendarEventTypesPage';
import CompetitionEventTypesPage from '@/pages/CompetitionEventTypesPage';
import ThemesPage from '@/pages/ThemesPage';
import EmailRulesPage from '@/pages/EmailRulesPage';
import EmailQueuePage from '@/pages/EmailQueuePage';
import { EmailTemplateRecordPage } from './email-management/EmailTemplateRecordPage';
import { EmailPreviewRecordPage } from './email-management/EmailPreviewRecordPage';
import { CPCompetitionRecordPage } from './competition-portal/CPCompetitionRecordPage';

import NotFound from '@/pages/NotFound';
import CadetManagementPage from '@/components/cadet-management/CadetManagementPage';
import { CadetRecordPage } from '@/components/cadet-management/CadetRecordPage';
import { CadetBulkUploadPage } from '@/components/cadet-management/CadetBulkUploadPage';
import SchoolRecordPage from './school-management/SchoolRecordPage';
import UserRecordPage from './user-management/UserRecordPage';
import { MyServiceRecordPage } from '@/components/cadet-management/MyServiceRecordPage';
import { PTTestCreatePage } from './cadet-management/PTTestCreatePage';
import { PTTestEditPage } from './cadet-management/PTTestEditPage';
import { InspectionCreatePage } from './cadet-management/InspectionCreatePage';
import { InspectionEditPage } from './cadet-management/InspectionEditPage';
import { CommunityServiceCreatePage } from './cadet-management/CommunityServiceCreatePage';
import { CommunityServiceEditPage } from './cadet-management/CommunityServiceEditPage';
import JobBoardPage from '@/components/job-board/JobBoardPage';
import TeamsManagementPage from '@/components/teams/TeamsManagementPage';
import InventoryManagementPage from '@/components/inventory-management/InventoryManagementPage';
import { InventoryRecordPage } from '@/components/inventory-management/InventoryRecordPage';
import { InventoryBulkUploadPage } from '@/components/inventory-management/InventoryBulkUploadPage';
import BudgetManagementPage from '@/components/budget-management/BudgetManagementPage';
import { BudgetIncomeRecordPage } from '@/components/budget-management/BudgetIncomeRecordPage';
import { BudgetExpenseRecordPage } from '@/components/budget-management/BudgetExpenseRecordPage';
import BudgetReportPage from '@/components/budget-management/BudgetReportPage';
import ContactManagementPage from '@/components/contact-management/ContactManagementPage';
import { ContactRecordPage } from '@/components/contact-management/ContactRecordPage';
import { ContactBulkImportPage } from '@/components/contact-management/ContactBulkImportPage';
import CalendarManagementPage from '@/components/calendar/CalendarManagementPage';
import { CalendarRecordPage } from '@/components/calendar/CalendarRecordPage';
import CompetitionManagementPage from '@/components/competition-management/CompetitionManagementPage';
import { ScoreSheetPage } from '@/components/competition-management/ScoreSheetPage';
import AnnouncementManagementPage from '@/components/announcements/AnnouncementManagementPage';
import { AnnouncementRecordPage } from '@/components/announcements/AnnouncementRecordPage';
import { ChainOfCommandRecordPage } from '@/components/cadets/ChainOfCommandRecordPage';
import TeamRecordPage from '@/components/teams/TeamRecordPage';

import { RoleManagementPage } from '@/components/role-management/RoleManagementPage';
import ModulesManagementPage from '@/pages/ModulesManagementPage';
import ActionsManagementPage from '@/pages/ActionsManagementPage';
import CCCPermissionsPage from '@/pages/CCCPermissionsPage';
import CPPermissionsPage from '@/pages/CPPermissionsPage';
import WidgetPermissionsPage from '@/pages/WidgetPermissionsPage';
import ParentProfilePage from '@/pages/ParentProfilePage';
import PTTestsPage from '@/pages/PTTestsPage';
import UniformInspectionPage from '@/pages/UniformInspectionPage';
import CommunityServicePage from '@/pages/CommunityServicePage';
import TaskStatusOptionsPage from '@/pages/TaskStatusOptionsPage';
import TaskPriorityOptionsPage from '@/pages/TaskPriorityOptionsPage';
import IncidentStatusOptionsPage from '@/pages/IncidentStatusOptionsPage';
import IncidentPriorityOptionsPage from '@/pages/IncidentPriorityOptionsPage';
import IncidentCategoryOptionsPage from '@/pages/IncidentCategoryOptionsPage';

const MainApplication = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { currentPortal, canAccessCCC, canAccessCompetitionPortal } = usePortal();
  const { userProfile } = useAuth();
  const [moduleRoutes, setModuleRoutes] = useState<{ [key: string]: string }>({});
  
  const getModuleFromPath = (path: string, routes: { [key: string]: string }): string => {
    if (path === '/app' || path === '/app/') return 'dashboard';
    
    // Find all matching routes and sort by length (longest first) to prioritize child routes
    const matchingModules = Object.entries(routes)
      .filter(([_, route]) => path.startsWith(route) && route !== '/app')
      .sort((a, b) => b[1].length - a[1].length);
    
    return matchingModules.length > 0 ? matchingModules[0][0] : 'dashboard';
  };

  const [activeModule, setActiveModule] = useState(() => {
    // Initialize active module based on current route
    const path = location.pathname;
    
    // Handle competition portal routes
    if (path.startsWith('/app/competition-portal')) {
      const portalPath = path.replace('/app/competition-portal/', '');
      if (portalPath.startsWith('dashboard')) return 'competition-dashboard';
      if (portalPath.startsWith('competitions')) return 'competitions';
      if (portalPath.startsWith('teams')) return 'teams';
      if (portalPath.startsWith('score-sheets')) return 'score-sheets';
      if (portalPath.startsWith('templates')) return 'templates';
      if (portalPath.startsWith('analytics')) return 'analytics';
      if (portalPath.startsWith('settings')) return 'competition-settings';
      return 'competition-dashboard';
    }
    
    // Use fallback mapping for initial load
    const fallbackRoutes = {
      'dashboard': '/app',
      'tasks': '/app/tasks',
      'incident_management': '/app/incidents',
      'school_admin': '/app/school',
      'user_admin': '/app/users',
      'email': '/app/email',
      'cadets': '/app/cadets',
      'pt_tests': '/app/cadets/pt_tests',
      'uniform_inspection': '/app/cadets/uniform_inspection',
      'community_service': '/app/cadets/community_service',
      'job_board': '/app/job-board',
      'teams': '/app/teams',
      'inventory': '/app/inventory',
      'budget': '/app/budget',
      'contacts': '/app/contacts',
      'calendar': '/app/calendar',
      'announcements': '/app/announcements',
      'role_management': '/app/roles',
      'modules': '/app/modules',
      'actions': '/app/actions',
      'ccc_permissions': '/app/ccc_permissions',
      'cp_permissions': '/app/cp_permissions',
      'widget_permissions': '/app/widget_permissions',
      'settings': '/app/settings'
    };
    
    return getModuleFromPath(path, fallbackRoutes);
  });

  // Load module routes from database
  useEffect(() => {
    const loadModuleRoutes = async () => {
      try {
        const { data: modules, error } = await supabase
          .from('permission_modules')
          .select('name, path')
          .eq('is_active', true);

        if (!error && modules) {
          const routes: { [key: string]: string } = {
            'dashboard': '/app'
          };
          
          modules.forEach(module => {
            if (module.path && !module.path.startsWith('/app/competition-portal')) {
              routes[module.name] = module.path;
            }
          });
          
          setModuleRoutes(routes);
          console.log('Loaded module routes:', routes);
        }
      } catch (error) {
        console.error('Failed to load module routes:', error);
        // Fallback to hardcoded routes
        setModuleRoutes({
          'dashboard': '/app',
          'tasks': '/app/tasks',
          'incident_management': '/app/incidents',
          'school_admin': '/app/school',
          'user_admin': '/app/users',
          'email': '/app/email',
          'cadets': '/app/cadets',
          'pt_tests': '/app/cadets/pt_tests',
          'uniform_inspection': '/app/cadets/uniform_inspection',
          'community_service': '/app/cadets/community_service',
          'job_board': '/app/job-board',
          'teams': '/app/teams',
          'inventory': '/app/inventory',
          'budget': '/app/budget',
          'contacts': '/app/contacts',
          'calendar': '/app/calendar',
          'announcements': '/app/announcements',
          'role_management': '/app/roles',
          'modules': '/app/modules',
          'actions': '/app/actions',
          'ccc_permissions': '/app/ccc_permissions',
          'cp_permissions': '/app/cp_permissions',
          'widget_permissions': '/app/widget_permissions',
          'settings': '/app/settings'
        });
      }
    };

    loadModuleRoutes();
  }, []);

  // Update active module when path changes
  useEffect(() => {
    if (Object.keys(moduleRoutes).length > 0) {
      const newModule = getModuleFromPath(location.pathname, moduleRoutes);
      setActiveModule(newModule);
    }
  }, [location.pathname, moduleRoutes]);

  const handleModuleChange = (module: string) => {
    setActiveModule(module);
    const route = moduleRoutes[module];
    if (route) {
      navigate(route);
    }
  };

  // Render Competition Portal if that's the active portal or if on competition portal route
  if (currentPortal === 'competition' || location.pathname.startsWith('/app/competition-portal')) {
    return <CompetitionPortalLayout />;
  }

  // Show access denied if user doesn't have CCC access
  if (!canAccessCCC) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You do not have access to the CCC Portal. Please contact your administrator if you believe this is an error.
          </p>
          {canAccessCompetitionPortal && (
            <button
              onClick={() => navigate('/app/competition-portal/dashboard')}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Go to Competition Portal
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        activeModule={activeModule} 
        onModuleChange={handleModuleChange}
        isMobile={isMobile}
      />
      <div className="flex">
        {!isMobile && (
          <Sidebar 
            activeModule={activeModule} 
            onModuleChange={handleModuleChange}
          />
        )}
        <main className={`flex-1 ${!isMobile ? 'ml-64' : ''}`}>
          <Routes>
            <Route index element={<DashboardOverview />} />
            <Route path="tasks" element={<TaskManagementPage />} />
            <Route path="tasks/task_record" element={<TaskRecordPage />} />
            <Route path="incidents" element={<IncidentManagementPage />} />
            <Route path="incidents/incident_record" element={<IncidentRecordPage />} />
            <Route path="school" element={<SchoolManagementPage />} />
            <Route path="school/school_record" element={<SchoolRecordPage />} />
            <Route path="users" element={<UserAdminPage />} />
            <Route path="users/users_record" element={<UserRecordPage />} />
            <Route path="email" element={<EmailManagementPage />} />
            <Route path="email_templates" element={<EmailTemplatesPage />} />
            <Route path="email_rules" element={<EmailRulesPage />} />
            <Route path="email_queue" element={<EmailQueuePage />} />
            <Route path="email/template_record" element={<EmailTemplateRecordPage />} />
            <Route path="email/template_record/:id" element={<EmailTemplateRecordPage />} />
            <Route path="email/email_preview_record" element={<EmailPreviewRecordPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="task_status" element={<TaskStatusOptionsPage />} />
            <Route path="task_priority" element={<TaskPriorityOptionsPage />} />
            <Route path="incident_status" element={<IncidentStatusOptionsPage />} />
            <Route path="incident_priority" element={<IncidentPriorityOptionsPage />} />
            <Route path="incident_category" element={<IncidentCategoryOptionsPage />} />
            <Route path="themes" element={<ThemesPage />} />
            <Route path="cal_event_types" element={<CalendarEventTypesPage />} />
            <Route path="comp_event_types" element={<CompetitionEventTypesPage />} />
            <Route path="cadets" element={<CadetManagementPage />} />
            <Route path="cadets/cadet_record" element={<CadetRecordPage />} />
            <Route path="cadets/cadet_bulk_upload" element={<CadetBulkUploadPage />} />
            <Route path="cadets/my_service_record" element={<MyServiceRecordPage />} />
            <Route path="cadets/pt_tests" element={<PTTestsPage />} />
            <Route path="cadets/uniform_inspection" element={<UniformInspectionPage />} />
            <Route path="cadets/community_service" element={<CommunityServicePage />} />
          <Route path="cadets/pt_test_create" element={<PTTestCreatePage />} />
          <Route path="cadets/pt_test_edit" element={<PTTestEditPage />} />
          <Route path="cadets/inspection_create" element={<InspectionCreatePage />} />
          <Route path="cadets/inspection_edit" element={<InspectionEditPage />} />
          <Route path="cadets/service_record" element={<CommunityServiceCreatePage />} />
          <Route path="cadets/service_record_edit/:id" element={<CommunityServiceEditPage />} />
            <Route path="job-board/coc_record" element={<ChainOfCommandRecordPage />} />
            <Route path="teams/team_record" element={<TeamRecordPage />} />
            <Route path="job-board" element={<JobBoardPage />} />
            <Route path="teams" element={<TeamsManagementPage />} />
            <Route path="inventory" element={<InventoryManagementPage />} />
            <Route path="inventory/inventory_record" element={<InventoryRecordPage />} />
            <Route path="inventory/inventory_bulk_upload" element={<InventoryBulkUploadPage />} />
            <Route path="budget" element={<BudgetManagementPage />} />
            <Route path="budget/income_record" element={<BudgetIncomeRecordPage />} />
            <Route path="budget/expense_record" element={<BudgetExpenseRecordPage />} />
            <Route path="budget/budget_report" element={<BudgetReportPage />} />
            <Route path="contacts" element={<ContactManagementPage />} />
            <Route path="contacts/contact_record" element={<ContactRecordPage />} />
            <Route path="contacts/bulk-import" element={<ContactBulkImportPage />} />
            <Route path="calendar" element={<CalendarManagementPage />} />
            <Route path="calendar/calendar_record" element={<CalendarRecordPage />} />
            <Route path="competitions" element={<CompetitionManagementPage />} />
            <Route path="competitions/score-sheets/:competitionId" element={<ScoreSheetPage />} />
            <Route path="announcements" element={<AnnouncementManagementPage />} />
            <Route path="announcements/announcements_record" element={<AnnouncementRecordPage />} />
            <Route path="roles" element={<RoleManagementPage />} />
            <Route path="modules" element={<ModulesManagementPage />} />
            <Route path="actions" element={<ActionsManagementPage />} />
            <Route path="ccc_permissions" element={<CCCPermissionsPage />} />
            <Route path="cp_permissions" element={<CPPermissionsPage />} />
            <Route path="widget_permissions" element={<WidgetPermissionsPage />} />
            <Route path="parent-profile" element={<ParentProfilePage />} />
            
            {/* Competition Portal Routes */}
            <Route path="competition-portal/competitions/competition_record" element={<CPCompetitionRecordPage />} />
            <Route path="competition-portal" element={<CompetitionPortalLayout />} />
            <Route path="competition-portal/" element={<CompetitionPortalLayout />} />
            <Route path="competition-portal/dashboard" element={<CompetitionPortalLayout />} />
            <Route path="competition-portal/competitions" element={<CompetitionPortalLayout />} />
            <Route path="competition-portal/score-sheets" element={<CompetitionPortalLayout />} />
            <Route path="competition-portal/score-sheets/score_sheet_record" element={<CompetitionPortalLayout />} />
            <Route path="competition-portal/judges" element={<CompetitionPortalLayout />} />
            <Route path="competition-portal/judges/judge_record" element={<CompetitionPortalLayout />} />
            <Route path="competition-portal/judges/judges_bulk_upload" element={<CompetitionPortalLayout />} />
            <Route path="competition-portal/cadets" element={<CompetitionPortalLayout />} />
            <Route path="competition-portal/cadets_record" element={<CompetitionPortalLayout />} />
            <Route path="competition-portal/cadets_bulk_upload" element={<CompetitionPortalLayout />} />
            <Route path="competition-portal/analytics" element={<CompetitionPortalLayout />} />
            <Route path="competition-portal/settings" element={<CompetitionPortalLayout />} />
            <Route path="competition-portal/open-competitions" element={<CompetitionPortalLayout />} />
            <Route path="competition-portal/open-competitions/:competitionId/open_comp_record" element={<CompetitionPortalLayout />} />
            <Route path="competition-portal/my-competitions" element={<CompetitionPortalLayout />} />
            <Route path="competition-portal/my-competitions-analytics" element={<CompetitionPortalLayout />} />
            <Route path="competition-portal/my-competitions/*" element={<CompetitionPortalLayout />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// Settings Page Component
const SettingsPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage system settings and configuration options
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="incidents" className="w-full">
        <TabsList>
          <TabsTrigger value="incidents">Incident Options</TabsTrigger>
        </TabsList>
        <TabsContent value="incidents">
          <IncidentOptionsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MainApplication;
