
import React, { useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Header } from './layout/Header';
import { Sidebar } from './layout/Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import ProtectedRoute from './ProtectedRoute';
import DashboardOverview from './dashboard/DashboardOverview';
import TaskManagementPage from './tasks/TaskManagementPage';
import IncidentManagementPage from './incident-management/IncidentManagementPage';
import SchoolManagementPage from './school-management/SchoolManagementPage';
import UserAdminPage from './user-management/UserAdminPage';
import TaskOptionsManagement from './tasks/TaskOptionsManagement';
import IncidentOptionsManagement from './incident-management/IncidentOptionsManagement';
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
  const [activeModule, setActiveModule] = useState(() => {
    // Initialize active module based on current route
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    if (path.startsWith('/tasks')) return 'tasks';
    if (path.startsWith('/incidents')) return 'incident_management';
    if (path.startsWith('/school')) return 'school-management';
    if (path.startsWith('/users')) return 'user-admin';
    if (path.startsWith('/email')) return 'email-management';
    
    if (path.startsWith('/cadets')) return 'cadets';
    if (path.startsWith('/job-board')) return 'job-board';
    if (path.startsWith('/teams')) return 'teams';
    if (path.startsWith('/inventory')) return 'inventory';
    if (path.startsWith('/budget')) return 'budget';
    if (path.startsWith('/contacts')) return 'contacts';
    if (path.startsWith('/calendar')) return 'calendar';
    if (path.startsWith('/competitions')) return 'competitions';
    
    if (path.startsWith('/roles')) return 'role-management';
    if (path.startsWith('/settings')) return 'settings';
    return 'dashboard';
  });

  const handleModuleChange = (module: string) => {
    setActiveModule(module);
    // Navigate to the appropriate route based on module
    const routes: { [key: string]: string } = {
      'dashboard': '/',
      'tasks': '/tasks',
      'incident_management': '/incidents',
      'school-management': '/school',
      'user-admin': '/users',
      'email-management': '/email',
      
      'cadets': '/cadets',
      'job-board': '/job-board',
      'teams': '/teams',
      'inventory': '/inventory',
      'budget': '/budget',
      'contacts': '/contacts',
      'calendar': '/calendar',
      'competitions': '/competitions',
      
      'role-management': '/roles',
      'settings': '/settings'
    };
    
    const route = routes[module];
    if (route) {
      navigate(route);
    }
  };

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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
                <RoleManagementPage />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// Settings Page component with Task and Incident Options Management
const SettingsPage = () => {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>
        <div className="space-y-6">
          <TaskOptionsManagement />
          <IncidentOptionsManagement />
        </div>
      </div>
    </div>
  );
};

export default MainApplication;
