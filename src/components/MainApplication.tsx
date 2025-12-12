import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from './layout/Header';
import { Sidebar } from './layout/Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePortal } from '@/contexts/PortalContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

// Essential layout components - keep as eager imports
import ProtectedRoute from './ProtectedRoute';

// Lazy load CompetitionPortalLayout since it's a complete sub-app
const CompetitionPortalLayout = lazy(() => import('./competition-portal/CompetitionPortalLayout'));

// Page loader component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// ============ LAZY LOADED COMPONENTS ============

// Dashboard
const DashboardOverview = lazy(() => import('./dashboard/DashboardOverview'));

// Tasks
const TaskManagementPage = lazy(() => import('./tasks/TaskManagementPage'));
const TaskRecordPage = lazy(() => import('./tasks/TaskRecordPage').then(m => ({ default: m.TaskRecordPage })));

// Incidents
const IncidentManagementPage = lazy(() => import('./incident-management/IncidentManagementPage'));
const IncidentRecordPage = lazy(() => import('./incident-management/IncidentRecordPage').then(m => ({ default: m.IncidentRecordPage })));
const IncidentOptionsManagement = lazy(() => import('./incident-management/IncidentOptionsManagement'));

// School Management
const SchoolManagementPage = lazy(() => import('./school-management/SchoolManagementPage'));
const SchoolRecordPage = lazy(() => import('./school-management/SchoolRecordPage'));

// User Management
const UserAdminPage = lazy(() => import('./user-management/UserAdminPage'));
const UserRecordPage = lazy(() => import('./user-management/UserRecordPage'));

// Email Management
const EmailManagementPage = lazy(() => import('./email-management/EmailManagementPage'));
const EmailTemplatesPage = lazy(() => import('@/pages/EmailTemplatesPage'));
const EmailRulesPage = lazy(() => import('@/pages/EmailRulesPage'));
const EmailQueuePage = lazy(() => import('@/pages/EmailQueuePage'));
const EmailTemplateRecordPage = lazy(() => import('./email-management/EmailTemplateRecordPage').then(m => ({ default: m.EmailTemplateRecordPage })));
const EmailPreviewRecordPage = lazy(() => import('./email-management/EmailPreviewRecordPage').then(m => ({ default: m.EmailPreviewRecordPage })));

// Settings Pages
const ThemesPage = lazy(() => import('@/pages/ThemesPage'));
const CalendarEventTypesPage = lazy(() => import('@/pages/CalendarEventTypesPage'));
const CompetitionEventTypesPage = lazy(() => import('@/pages/CompetitionEventTypesPage'));
const TaskStatusOptionsPage = lazy(() => import('@/pages/TaskStatusOptionsPage'));
const TaskPriorityOptionsPage = lazy(() => import('@/pages/TaskPriorityOptionsPage'));
const IncidentStatusOptionsPage = lazy(() => import('@/pages/IncidentStatusOptionsPage'));
const IncidentPriorityOptionsPage = lazy(() => import('@/pages/IncidentPriorityOptionsPage'));
const IncidentCategoryOptionsPage = lazy(() => import('@/pages/IncidentCategoryOptionsPage'));

// Cadet Management
const CadetManagementPage = lazy(() => import('@/components/cadet-management/CadetManagementPage'));
const CadetRecordPage = lazy(() => import('@/components/cadet-management/CadetRecordPage').then(m => ({ default: m.CadetRecordPage })));
const CadetBulkUploadPage = lazy(() => import('@/components/cadet-management/CadetBulkUploadPage').then(m => ({ default: m.CadetBulkUploadPage })));
const MyServiceRecordPage = lazy(() => import('@/components/cadet-management/MyServiceRecordPage').then(m => ({ default: m.MyServiceRecordPage })));
const PTTestCreatePage = lazy(() => import('./cadet-management/PTTestCreatePage').then(m => ({ default: m.PTTestCreatePage })));
const PTTestEditPage = lazy(() => import('./cadet-management/PTTestEditPage').then(m => ({ default: m.PTTestEditPage })));
const InspectionCreatePage = lazy(() => import('./cadet-management/InspectionCreatePage').then(m => ({ default: m.InspectionCreatePage })));
const InspectionEditPage = lazy(() => import('./cadet-management/InspectionEditPage').then(m => ({ default: m.InspectionEditPage })));
const CommunityServiceCreatePage = lazy(() => import('./cadet-management/CommunityServiceCreatePage').then(m => ({ default: m.CommunityServiceCreatePage })));
const CommunityServiceEditPage = lazy(() => import('./cadet-management/CommunityServiceEditPage').then(m => ({ default: m.CommunityServiceEditPage })));
const PTTestsPage = lazy(() => import('@/pages/PTTestsPage'));
const UniformInspectionPage = lazy(() => import('@/pages/UniformInspectionPage'));
const CommunityServicePage = lazy(() => import('@/pages/CommunityServicePage'));

// Job Board & Teams
const JobBoardPage = lazy(() => import('@/components/job-board/JobBoardPage'));
const TeamsManagementPage = lazy(() => import('@/components/teams/TeamsManagementPage'));
const TeamRecordPage = lazy(() => import('@/components/teams/TeamRecordPage'));
const ChainOfCommandRecordPage = lazy(() => import('@/components/cadets/ChainOfCommandRecordPage').then(m => ({ default: m.ChainOfCommandRecordPage })));

// Inventory
const InventoryManagementPage = lazy(() => import('@/components/inventory-management/InventoryManagementPage'));
const InventoryRecordPage = lazy(() => import('@/components/inventory-management/InventoryRecordPage').then(m => ({ default: m.InventoryRecordPage })));
const InventoryBulkUploadPage = lazy(() => import('@/components/inventory-management/InventoryBulkUploadPage').then(m => ({ default: m.InventoryBulkUploadPage })));

// Budget
const BudgetManagementPage = lazy(() => import('@/components/budget-management/BudgetManagementPage'));
const BudgetIncomeRecordPage = lazy(() => import('@/components/budget-management/BudgetIncomeRecordPage').then(m => ({ default: m.BudgetIncomeRecordPage })));
const BudgetExpenseRecordPage = lazy(() => import('@/components/budget-management/BudgetExpenseRecordPage').then(m => ({ default: m.BudgetExpenseRecordPage })));
const BudgetReportPage = lazy(() => import('@/components/budget-management/BudgetReportPage'));

// Contacts
const ContactManagementPage = lazy(() => import('@/components/contact-management/ContactManagementPage'));
const ContactRecordPage = lazy(() => import('@/components/contact-management/ContactRecordPage').then(m => ({ default: m.ContactRecordPage })));
const ContactBulkImportPage = lazy(() => import('@/components/contact-management/ContactBulkImportPage').then(m => ({ default: m.ContactBulkImportPage })));

// Calendar
const CalendarManagementPage = lazy(() => import('@/components/calendar/CalendarManagementPage'));
const CalendarRecordPage = lazy(() => import('@/components/calendar/CalendarRecordPage').then(m => ({ default: m.CalendarRecordPage })));

// Competition Management
const CompetitionManagementPage = lazy(() => import('@/components/competition-management/CompetitionManagementPage'));
const ScoreSheetPage = lazy(() => import('@/components/competition-management/ScoreSheetPage').then(m => ({ default: m.ScoreSheetPage })));

// Announcements
const AnnouncementManagementPage = lazy(() => import('@/components/announcements/AnnouncementManagementPage'));
const AnnouncementRecordPage = lazy(() => import('@/components/announcements/AnnouncementRecordPage').then(m => ({ default: m.AnnouncementRecordPage })));

// Role & Permission Management
const RoleManagementPage = lazy(() => import('@/components/role-management/RoleManagementPage').then(m => ({ default: m.RoleManagementPage })));
const ModulesManagementPage = lazy(() => import('@/pages/ModulesManagementPage'));
const ActionsManagementPage = lazy(() => import('@/pages/ActionsManagementPage'));
const CCCPermissionsPage = lazy(() => import('@/pages/CCCPermissionsPage'));
const CPPermissionsPage = lazy(() => import('@/pages/CPPermissionsPage'));
const WidgetPermissionsPage = lazy(() => import('@/pages/WidgetPermissionsPage'));

// Other Pages
const ParentProfilePage = lazy(() => import('@/pages/ParentProfilePage'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// UI Components needed for SettingsPage
const Tabs = lazy(() => import('@/components/ui/tabs').then(m => ({ default: m.Tabs })));
const TabsContent = lazy(() => import('@/components/ui/tabs').then(m => ({ default: m.TabsContent })));
const TabsList = lazy(() => import('@/components/ui/tabs').then(m => ({ default: m.TabsList })));
const TabsTrigger = lazy(() => import('@/components/ui/tabs').then(m => ({ default: m.TabsTrigger })));

const MainApplication = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { currentPortal, canAccessCCC, canAccessCompetitionPortal } = usePortal();
  const { userProfile } = useAuth();
  const [moduleRoutes, setModuleRoutes] = useState<{ [key: string]: string }>({});
  
  const getModuleFromPath = (path: string, routes: { [key: string]: string }): string => {
    if (path === '/app' || path === '/app/') return 'dashboard';
    
    const matchingModules = Object.entries(routes)
      .filter(([_, route]) => path.startsWith(route) && route !== '/app')
      .sort((a, b) => b[1].length - a[1].length);
    
    return matchingModules.length > 0 ? matchingModules[0][0] : 'dashboard';
  };

  const [activeModule, setActiveModule] = useState(() => {
    const path = location.pathname;
    
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
        }
      } catch (error) {
        console.error('Failed to load module routes:', error);
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
    return (
      <Suspense fallback={<PageLoader />}>
        <CompetitionPortalLayout />
      </Suspense>
    );
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
          <Suspense fallback={<PageLoader />}>
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
              <Route path="competition-portal/*" element={<CompetitionPortalLayout />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

// Settings Page Component - kept inline since it's small and uses lazy-loaded tabs
const SettingsPage = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage system settings and configuration options
            </p>
          </div>
        </div>
        
        <Suspense fallback={<PageLoader />}>
          <Tabs defaultValue="incidents" className="w-full">
            <TabsList>
              <TabsTrigger value="incidents">Incident Options</TabsTrigger>
            </TabsList>
            <TabsContent value="incidents">
              <Suspense fallback={<PageLoader />}>
                <IncidentOptionsManagement />
              </Suspense>
            </TabsContent>
          </Tabs>
        </Suspense>
      </div>
    </Suspense>
  );
};

export default MainApplication;
