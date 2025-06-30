
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from './layout/Header';
import { Sidebar } from './layout/Sidebar';
import { DashboardOverview } from './dashboard/DashboardOverview';
import TaskManagementPage from './tasks/TaskManagementPage';
import BusinessRulesMainPage from './business-rules/BusinessRulesMainPage';
import SchoolManagementPage from './school-management/SchoolManagementPage';
import UserAdminPage from './user-management/UserAdminPage';
import NotFound from '@/pages/NotFound';

const MainApplication = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
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
