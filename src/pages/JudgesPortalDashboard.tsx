import { useNavigate } from 'react-router-dom';
import { MyAssignmentsWidget } from '@/components/judges-portal/MyAssignmentsWidget';
import { AllAssignmentsTable } from '@/components/judges-portal/AllAssignmentsTable';
import { ArrowRight } from 'lucide-react';

export const JudgesPortalDashboard = () => {
  const navigate = useNavigate();

  return <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-br from-judge to-judge/70 bg-clip-text text-transparent">
            Welcome to Judges Portal
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your judging assignments and scoring
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <MyAssignmentsWidget />
          </div>

          <div className="space-y-6">
            <div 
              onClick={() => navigate('/app/judges-portal/score-sheets')}
              className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Score Sheets</h3>
                  <p className="text-sm text-muted-foreground">
                    View your submitted score sheets
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-judge transition-colors" />
              </div>
            </div>

            
          </div>
        </div>

        <AllAssignmentsTable />
      </div>
    </div>;
};