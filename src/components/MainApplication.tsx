
import React, { useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Header } from './layout/Header';
import { Sidebar } from './layout/Sidebar';
import DashboardOverview from './dashboard/DashboardOverview';
import TaskManagementPage from './tasks/TaskManagementPage';
import SchoolManagementPage from './school-management/SchoolManagementPage';
import UserAdminPage from './user-management/UserAdminPage';
import TaskOptionsManagement from './tasks/TaskOptionsManagement';
import EmailManagementPage from './email-management/EmailManagementPage';
import SmtpSettingsPage from './smtp-settings/SmtpSettingsPage';
import NotFound from '@/pages/NotFound';

const MainApplication = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState(() => {
    // Initialize active module based on current route
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    if (path.startsWith('/tasks')) return 'tasks';
    if (path.startsWith('/school')) return 'school-management';
    if (path.startsWith('/users')) return 'user-admin';
    if (path.startsWith('/email')) return 'email-management';
    if (path.startsWith('/smtp')) return 'smtp-settings';
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
      'settings': '/settings'
    };
    
    const route = routes[module];
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeModule={activeModule} />
      <div className="flex">
        <Sidebar 
          activeModule={activeModule} 
          onModuleChange={handleModuleChange}
        />
        <main className="flex-1 ml-64">
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/tasks" element={<TaskManagementPage />} />
            <Route path="/school" element={<SchoolManagementPage />} />
            <Route path="/users" element={<UserAdminPage />} />
            <Route path="/email" element={<EmailManagementPage />} />
            <Route path="/smtp" element={<SmtpSettingsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
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
