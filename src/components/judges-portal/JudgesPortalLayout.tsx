import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JudgesPortalSidebar } from './JudgesPortalSidebar';
import { JudgesPortalDashboard } from '@/pages/JudgesPortalDashboard';
import { JudgesOpenCompetitionsPage } from '@/pages/JudgesOpenCompetitionsPage';
import { CompetitionDetailsPage } from './CompetitionDetailsPage';
import { ApplyToCompetitionPage } from './ApplyToCompetitionPage';
import { MyApplicationsPage } from './MyApplicationsPage';
import { JudgeProfilePage } from './JudgeProfilePage';
import { JudgeEventPage } from '@/pages/JudgeEventPage';
import MobileJudgeEventPage from '@/pages/MobileJudgeEventPage';
import { useIsMobile } from '@/hooks/use-mobile';
import type { User } from '@supabase/supabase-js';

export const JudgesPortalLayout = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="min-h-screen bg-background">
      <JudgesPortalSidebar 
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      
      <div className={isMobile ? "ml-0" : "ml-64"}>
        {isMobile && (
          <header className="h-16 border-b bg-background flex items-center px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="ml-4 text-lg font-semibold">Judges Portal</h1>
          </header>
        )}
        
        <main className={isMobile ? "min-h-[calc(100vh-4rem)]" : "min-h-screen"}>
          <Routes>
            <Route index element={<JudgesPortalDashboard />} />
            <Route path="open-competitions" element={<JudgesOpenCompetitionsPage />} />
            <Route path="competitions/:competitionId" element={<CompetitionDetailsPage />} />
            <Route path="competitions/:competitionId/apply" element={<ApplyToCompetitionPage />} />
            <Route path="applications" element={<MyApplicationsPage />} />
            <Route path="profile" element={<JudgeProfilePage />} />
            <Route path="judge_event/:eventId" element={<JudgeEventPage />} />
            <Route path="m_judge_event/:eventId" element={<MobileJudgeEventPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};
