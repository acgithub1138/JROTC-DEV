
import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './layout/Header';
import { Sidebar } from './layout/Sidebar';
import DashboardOverview from './dashboard/DashboardOverview';
import TaskManagementPage from './tasks/TaskManagementPage';
import BusinessRulesMainPage from './business-rules/BusinessRulesMainPage';
import SchoolManagementPage from './school-management/SchoolManagementPage';
import UserAdminPage from './user-management/UserAdminPage';
import NotFound from '@/pages/NotFound';

const MainApplication = () => {
  const location = useLocation();
  const [activeModule, setActiveModule] = useState(() => {
    // Initialize active module based on current route
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    if (path.startsWith('/tasks')) return 'tasks';
    if (path.startsWith('/business-rules')) return 'rules';
    if (path.startsWith('/school')) return 'school-management';
    if (path.startsWith('/users')) return 'user-admin';
    return 'dashboard';
  });

  const handleModuleChange = (module: string) => {
    setActiveModule(module);
    // Navigate to the appropriate route based on module
    const routes: { [key: string]: string } = {
      'dashboard': '/',
      'tasks': '/tasks',
      'rules': '/business-rules',
      'school-management': '/school',
      'user-admin': '/users'
    };
    
    const route = routes[module];
    if (route) {
      window.history.pushState({}, '', route);
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
            <Route path="/business-rules" element={<BusinessRulesMainPage />} />
            <Route path="/school" element={<SchoolManagementPage />} />
            <Route path="/users" element={<UserAdminPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default MainApplication;
