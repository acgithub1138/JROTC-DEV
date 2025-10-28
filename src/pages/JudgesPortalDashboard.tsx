import { MyAssignmentsWidget } from '@/components/judges-portal/MyAssignmentsWidget';
import { MyScoreSheetsWidget } from '@/components/judges-portal/MyScoreSheetsWidget';
import { AllAssignmentsTable } from '@/components/judges-portal/AllAssignmentsTable';

export const JudgesPortalDashboard = () => {
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

          <div>
            <MyScoreSheetsWidget />
          </div>
        </div>

        <AllAssignmentsTable />
      </div>
    </div>;
};