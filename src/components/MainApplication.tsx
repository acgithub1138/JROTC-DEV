
import React, { useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Header } from './layout/Header';
import { Sidebar } from './layout/Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePortal } from '@/contexts/PortalContext';
import CompetitionPortalLayout from './competition-portal/CompetitionPortalLayout';

import ProtectedRoute from './ProtectedRoute';
import DashboardOverview from './dashboard/DashboardOverview';
import TaskManagementPage from './tasks/TaskManagementPage';
import IncidentManagementPage from './incident-management/IncidentManagementPage';
import SchoolManagementPage from './school-management/SchoolManagementPage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserAdminPage from './user-management/UserAdminPage';
import TaskOptionsManagement from './tasks/TaskOptionsManagement';
import IncidentOptionsManagement from './incident-management/IncidentOptionsManagement';
import ThemeManagement from './themes/ThemeManagement';
import EventTypesManagement from './event-types/EventTypesManagement';
import EmailManagementPage from './email-management/EmailManagementPage';

import NotFound from '@/pages/NotFound';
import CadetManagementPage from '@/components/cadet-management/CadetManagementPage';
import JobBoardPage from '@/components/job-board/JobBoardPage';
import TeamsManagementPage from '@/components/teams/TeamsManagementPage';
import InventoryManagementPage from '@/components/inventory-management/InventoryManagementPage';
import BudgetManagementPage from '@/components/budget-management/BudgetManagementPage';
import ContactManagementPage from '@/components/contact-management/ContactManagementPage';
import CalendarManagementPage from '@/components/calendar/CalendarManagementPage';
import CompetitionManagementPage from '@/components/competition-management/CompetitionManagementPage';
import { ScoreSheetPage } from '@/components/competition-management/ScoreSheetPage';

import { RoleManagementPage } from '@/components/role-management/RoleManagementPage';

const MainApplication = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { currentPortal } = usePortal();
  const [activeModule, setActiveModule] = useState(() => {
    // Initialize active module based on current route
    const path = location.pathname;
    
    // Handle competition portal routes
    if (path.startsWith('/app/competition-portal')) {
      const portalPath = path.replace('/app/competition-portal/', '');
      if (portalPath.startsWith('dashboard')) return 'competition-dashboard';
      if (portalPath.startsWith('competitions')) return 'competitions';
      if (portalPath.startsWith('events')) return 'events';
      if (portalPath.startsWith('teams')) return 'teams';
      if (portalPath.startsWith('score-sheets')) return 'score-sheets';
      if (portalPath.startsWith('templates')) return 'templates';
      if (portalPath.startsWith('analytics')) return 'analytics';
      if (portalPath.startsWith('settings')) return 'competition-settings';
      return 'competition-dashboard';
    }
    
    if (path === '/app' || path === '/app/') return 'dashboard';
    if (path.startsWith('/app/tasks')) return 'tasks';
    if (path.startsWith('/app/incidents')) return 'incident_management';
    if (path.startsWith('/app/school')) return 'school-management';
    if (path.startsWith('/app/users')) return 'user-admin';
    if (path.startsWith('/app/email')) return 'email-management';
    
    if (path.startsWith('/app/cadets')) return 'cadets';
    if (path.startsWith('/app/job-board')) return 'job-board';
    if (path.startsWith('/app/teams')) return 'teams';
    if (path.startsWith('/app/inventory')) return 'inventory';
    if (path.startsWith('/app/budget')) return 'budget';
    if (path.startsWith('/app/contacts')) return 'contacts';
    if (path.startsWith('/app/calendar')) return 'calendar';
    if (path.startsWith('/app/competitions')) return 'competitions';
    
    if (path.startsWith('/app/roles')) return 'role-management';
    if (path.startsWith('/app/settings')) return 'settings';
    return 'dashboard';
  });

  const handleModuleChange = (module: string) => {
    setActiveModule(module);
    // Navigate to the appropriate route based on module
    const routes: { [key: string]: string } = {
      'dashboard': '/app',
      'tasks': '/app/tasks',
      'incident_management': '/app/incidents',
      'school-management': '/app/school',
      'user-admin': '/app/users',
      'email-management': '/app/email',
      
      'cadets': '/app/cadets',
      'job-board': '/app/job-board',
      'teams': '/app/teams',
      'inventory': '/app/inventory',
      'budget': '/app/budget',
      'contacts': '/app/contacts',
      'calendar': '/app/calendar',
      'competitions': '/app/competitions',
      
      'role-management': '/app/roles',
      'settings': '/app/settings'
    };
    
    const route = routes[module];
    if (route) {
      navigate(route);
    }
  };

  // Render Competition Portal if that's the active portal or if on competition portal route
  if (currentPortal === 'competition' || location.pathname.startsWith('/app/competition-portal')) {
    return <CompetitionPortalLayout />;
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
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardOverview />
              </ProtectedRoute>
            } />
            <Route path="/tasks" element={
              <ProtectedRoute module="tasks">
                <TaskManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/incidents" element={
              <ProtectedRoute module="incident_management">
                <IncidentManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/school" element={
              <ProtectedRoute requireAdminRole={true}>
                <SchoolManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute requireAdminRole={true}>
                <UserAdminPage />
              </ProtectedRoute>
            } />
            <Route path="/email" element={
              <ProtectedRoute module="email">
                <EmailManagementPage />
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute requireAdminRole={true}>
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/cadets" element={
              <ProtectedRoute module="cadets">
                <CadetManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/job-board" element={
              <ProtectedRoute module="job_board">
                <JobBoardPage />
              </ProtectedRoute>
            } />
            <Route path="/teams" element={
              <ProtectedRoute module="teams">
                <TeamsManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedRoute module="inventory">
                <InventoryManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/budget" element={
              <ProtectedRoute module="budget">
                <BudgetManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/contacts" element={
              <ProtectedRoute module="contacts">
                <ContactManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/calendar" element={
              <ProtectedRoute module="calendar">
                <CalendarManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/competitions" element={
              <ProtectedRoute module="competitions">
                <CompetitionManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/competitions/score-sheets/:competitionId" element={
              <ProtectedRoute module="competitions">
                <ScoreSheetPage />
              </ProtectedRoute>
            } />
            
            <Route path="/roles" element={
              <ProtectedRoute requireAdminRole={true}>
                <RoleManagementPage />
              </ProtectedRoute>
            } />
            
            {/* Competition Portal Routes */}
            <Route path="/competition-portal" element={
              <ProtectedRoute>
                <CompetitionPortalLayout />
              </ProtectedRoute>
            } />
            <Route path="/competition-portal/" element={
              <ProtectedRoute>
                <CompetitionPortalLayout />
              </ProtectedRoute>
            } />
            <Route path="/competition-portal/dashboard" element={
              <ProtectedRoute>
                <CompetitionPortalLayout />
              </ProtectedRoute>
            } />
            <Route path="/competition-portal/competitions" element={
              <ProtectedRoute>
                <CompetitionPortalLayout />
              </ProtectedRoute>
            } />
            <Route path="/competition-portal/events" element={
              <ProtectedRoute>
                <CompetitionPortalLayout />
              </ProtectedRoute>
            } />
            <Route path="/competition-portal/teams" element={
              <ProtectedRoute>
                <CompetitionPortalLayout />
              </ProtectedRoute>
            } />
            <Route path="/competition-portal/score-sheets" element={
              <ProtectedRoute>
                <CompetitionPortalLayout />
              </ProtectedRoute>
            } />
            <Route path="/competition-portal/judges" element={
              <ProtectedRoute>
                <CompetitionPortalLayout />
              </ProtectedRoute>
            } />
            <Route path="/competition-portal/analytics" element={
              <ProtectedRoute>
                <CompetitionPortalLayout />
              </ProtectedRoute>
            } />
            <Route path="/competition-portal/settings" element={
              <ProtectedRoute>
                <CompetitionPortalLayout />
              </ProtectedRoute>
            } />
            <Route path="/competition-portal/open-competitions" element={
              <ProtectedRoute>
                <CompetitionPortalLayout />
              </ProtectedRoute>
            } />
            
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
      
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList>
          <TabsTrigger value="tasks">Task Options</TabsTrigger>
          <TabsTrigger value="incidents">Incident Options</TabsTrigger>
          <TabsTrigger value="event-types">Event Types</TabsTrigger>
          <TabsTrigger value="themes">Themes</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks">
          <TaskOptionsManagement />
        </TabsContent>
        <TabsContent value="incidents">
          <IncidentOptionsManagement />
        </TabsContent>
        <TabsContent value="event-types">
          <EventTypesManagement />
        </TabsContent>
        <TabsContent value="themes">
          <ThemeManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MainApplication;
