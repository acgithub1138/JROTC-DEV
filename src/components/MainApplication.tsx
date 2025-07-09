
import React, { useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Header } from './layout/Header';
import { Sidebar } from './layout/Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import DashboardOverview from './dashboard/DashboardOverview';
import TaskManagementPage from './tasks/TaskManagementPage';
import SchoolManagementPage from './school-management/SchoolManagementPage';
import UserAdminPage from './user-management/UserAdminPage';
import TaskOptionsManagement from './tasks/TaskOptionsManagement';
import EmailManagementPage from './email-management/EmailManagementPage';
import SmtpSettingsPage from './smtp-settings/SmtpSettingsPage';
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
import IncidentManagementPage from '@/components/incident-management/IncidentManagementPage';

const MainApplication = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeModule, setActiveModule] = useState(() => {
    // Initialize active module based on current route
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    if (path.startsWith('/tasks')) return 'tasks';
    if (path.startsWith('/school')) return 'school-management';
    if (path.startsWith('/users')) return 'user-admin';
    if (path.startsWith('/email')) return 'email-management';
    if (path.startsWith('/smtp')) return 'smtp-settings';
    if (path.startsWith('/cadets')) return 'cadets';
    if (path.startsWith('/job-board')) return 'job-board';
    if (path.startsWith('/teams')) return 'teams';
    if (path.startsWith('/inventory')) return 'inventory';
    if (path.startsWith('/budget')) return 'budget';
    if (path.startsWith('/contacts')) return 'contacts';
    if (path.startsWith('/calendar')) return 'calendar';
    if (path.startsWith('/competitions')) return 'competitions';
    if (path.startsWith('/incidents')) return 'incidents';
    if (path.startsWith('/settings')) return 'settings';
    return 'dashboard';
  });

  const handleModuleChange = (module: string) => {
    setActiveModule(module);
    // Navigate to the appropriate route based on module
    const routes: { [key: string]: string } = {
      'dashboard': '/',
      'tasks': '/tasks',
      'school-management': '/school',
      'user-admin': '/users',
      'email-management': '/email',
      'smtp-settings': '/smtp',
      'cadets': '/cadets',
      'job-board': '/job-board',
      'teams': '/teams',
      'inventory': '/inventory',
      'budget': '/budget',
      'contacts': '/contacts',
      'calendar': '/calendar',
      'competitions': '/competitions',
      'incidents': '/incidents',
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
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/tasks" element={<TaskManagementPage />} />
            <Route path="/school" element={<SchoolManagementPage />} />
            <Route path="/users" element={<UserAdminPage />} />
            <Route path="/email" element={<EmailManagementPage />} />
            <Route path="/smtp" element={<SmtpSettingsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/cadets" element={<CadetManagementPage />} />
            <Route path="/job-board" element={<JobBoardPage />} />
            <Route path="/teams" element={<TeamsManagementPage />} />
            <Route path="/inventory" element={<InventoryManagementPage />} />
            <Route path="/budget" element={<BudgetManagementPage />} />
            <Route path="/contacts" element={<ContactManagementPage />} />
            <Route path="/calendar" element={<CalendarManagementPage />} />
            <Route path="/competitions" element={<CompetitionManagementPage />} />
            <Route path="/competitions/score-sheets/:competitionId" element={<ScoreSheetPage />} />
            <Route path="/incidents" element={<IncidentManagementPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// Settings Page component with Task Options Management
const SettingsPage = () => {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>
        <TaskOptionsManagement />
      </div>
    </div>
  );
};

export default MainApplication;
