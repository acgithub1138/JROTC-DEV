
import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import UserAdminPage from '@/components/user-management/UserAdminPage';
import SchoolManagementPage from '@/components/school-management/SchoolManagementPage';

const MainApplication = () => {
  const [activeModule, setActiveModule] = useState('dashboard');

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'user-admin':
        return <UserAdminPage />;
      case 'school-management':
        return <SchoolManagementPage />;
      case 'cadets':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Cadet Management</h2>
            <p className="text-gray-600">Cadet management module coming soon...</p>
          </div>
        );
      case 'teams':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Team Management</h2>
            <p className="text-gray-600">Team management module coming soon...</p>
          </div>
        );
      case 'tasks':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Task Management</h2>
            <p className="text-gray-600">Task management module coming soon...</p>
          </div>
        );
      case 'budget':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Budget & Finance</h2>
            <p className="text-gray-600">Budget management module coming soon...</p>
          </div>
        );
      case 'inventory':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Inventory Management</h2>
            <p className="text-gray-600">Inventory management module coming soon...</p>
          </div>
        );
      case 'contacts':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Contact Management</h2>
            <p className="text-gray-600">Contact management module coming soon...</p>
          </div>
        );
      case 'competitions':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Competition Results</h2>
            <p className="text-gray-600">Competition management module coming soon...</p>
          </div>
        );
      default:
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">{activeModule}</h2>
            <p className="text-gray-600">Module coming soon...</p>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar
        className="w-64 flex-shrink-0"
        activeModule={activeModule}
        onModuleChange={setActiveModule}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activeModule={activeModule} />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {renderModule()}
        </main>
      </div>
    </div>
  );
};

export default MainApplication;
