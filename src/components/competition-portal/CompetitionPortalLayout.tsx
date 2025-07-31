import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { CompetitionSidebar } from './CompetitionSidebar';
import CompetitionPortalRoutes from '@/routes/CompetitionPortalRoutes';

const CompetitionPortalLayout = () => {
  const [activeModule, setActiveModule] = useState('competition-dashboard');

  const handleModuleChange = (module: string) => {
    setActiveModule(module);
  };

  return (
    <div className="min-h-screen bg-background">
      <CompetitionSidebar 
        activeModule={activeModule} 
        onModuleChange={handleModuleChange}
      />
      <div className="ml-64">
        <Header activeModule={activeModule} onModuleChange={handleModuleChange} />
        <main className="min-h-[calc(100vh-4rem)]">
          <CompetitionPortalRoutes />
        </main>
      </div>
    </div>
  );
};

export default CompetitionPortalLayout;