import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { JudgesPortalSidebar } from './JudgesPortalSidebar';
import { JudgesPortalDashboard } from '@/pages/JudgesPortalDashboard';
import { JudgesOpenCompetitionsPage } from '@/pages/JudgesOpenCompetitionsPage';
import { CompetitionDetailsPage } from './CompetitionDetailsPage';
import { ApplyToCompetitionPage } from './ApplyToCompetitionPage';
import { MyApplicationsPage } from './MyApplicationsPage';
import { JudgeProfilePage } from './JudgeProfilePage';
import type { User } from '@supabase/supabase-js';

export const JudgesPortalLayout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/app/judges/auth');
      } else {
        setUser(session.user);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          navigate('/app/judges/auth');
        } else {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-judge" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 shrink-0">
        <JudgesPortalSidebar />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-background">
        <Routes>
          <Route index element={<JudgesPortalDashboard />} />
          <Route path="open-competitions" element={<JudgesOpenCompetitionsPage />} />
          <Route path="competitions/:competitionId" element={<CompetitionDetailsPage />} />
          <Route path="competitions/:competitionId/apply" element={<ApplyToCompetitionPage />} />
          <Route path="applications" element={<MyApplicationsPage />} />
          <Route path="profile" element={<JudgeProfilePage />} />
        </Routes>
      </main>
    </div>
  );
};
