import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CompetitionDashboard from '@/components/competition-portal/CompetitionDashboard';
import CompetitionsPage from '@/components/competition-portal/CompetitionsPage';
import NotFound from '@/pages/NotFound';

const CompetitionPortalRoutes = () => {
  return (
    <Routes>
      <Route path="/app/competition-portal" element={<CompetitionDashboard />} />
      <Route path="/app/competition-portal/" element={<CompetitionDashboard />} />
      <Route path="/app/competition-portal/dashboard" element={<CompetitionDashboard />} />
      <Route path="/app/competition-portal/competitions" element={<CompetitionsPage />} />
      <Route path="/app/competition-portal/events" element={<div className="p-6"><h1 className="text-2xl font-bold">Events & Scheduling</h1><p>Coming soon...</p></div>} />
      <Route path="/app/competition-portal/teams" element={<div className="p-6"><h1 className="text-2xl font-bold">Teams & Participants</h1><p>Coming soon...</p></div>} />
      <Route path="/app/competition-portal/score-sheets" element={<div className="p-6"><h1 className="text-2xl font-bold">Score Sheets</h1><p>Coming soon...</p></div>} />
      <Route path="/app/competition-portal/templates" element={<div className="p-6"><h1 className="text-2xl font-bold">Templates</h1><p>Coming soon...</p></div>} />
      <Route path="/app/competition-portal/analytics" element={<div className="p-6"><h1 className="text-2xl font-bold">Analytics & Reports</h1><p>Coming soon...</p></div>} />
      <Route path="/app/competition-portal/settings" element={<div className="p-6"><h1 className="text-2xl font-bold">Competition Settings</h1><p>Coming soon...</p></div>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default CompetitionPortalRoutes;