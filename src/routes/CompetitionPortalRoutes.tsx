import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CompetitionDashboard from '@/components/competition-portal/CompetitionDashboard';
import CompetitionsPage from '@/components/competition-portal/CompetitionsPage';
import NotFound from '@/pages/NotFound';

const CompetitionPortalRoutes = () => {
  return (
    <Routes>
      <Route index element={<CompetitionDashboard />} />
      <Route path="dashboard" element={<CompetitionDashboard />} />
      <Route path="competitions" element={<CompetitionsPage />} />
      <Route path="events" element={<div className="p-6"><h1 className="text-2xl font-bold">Events & Scheduling</h1><p>Coming soon...</p></div>} />
      <Route path="teams" element={<div className="p-6"><h1 className="text-2xl font-bold">Teams & Participants</h1><p>Coming soon...</p></div>} />
      <Route path="score-sheets" element={<div className="p-6"><h1 className="text-2xl font-bold">Score Sheets</h1><p>Coming soon...</p></div>} />
      <Route path="templates" element={<div className="p-6"><h1 className="text-2xl font-bold">Templates</h1><p>Coming soon...</p></div>} />
      <Route path="analytics" element={<div className="p-6"><h1 className="text-2xl font-bold">Analytics & Reports</h1><p>Coming soon...</p></div>} />
      <Route path="settings" element={<div className="p-6"><h1 className="text-2xl font-bold">Competition Settings</h1><p>Coming soon...</p></div>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default CompetitionPortalRoutes;