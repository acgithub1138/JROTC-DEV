import { MyAssignmentsWidget } from '@/components/judges-portal/MyAssignmentsWidget';
import { MyScoreSheetsWidget } from '@/components/judges-portal/MyScoreSheetsWidget';
import { AllAssignmentsTable } from '@/components/judges-portal/AllAssignmentsTable';
export const JudgesPortalDashboard = () => {
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-judge/5 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-judge to-judge/50 rounded-lg blur opacity-20" />
          <div className="relative bg-background/80 backdrop-blur-sm border border-judge/20 rounded-lg p-6 shadow-lg">
            <h1 className="font-bold text-foreground text-4xl">
              Welcome to Judges Portal
            </h1>
            
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="transition-all duration-300 hover:scale-[1.02]">
            <MyAssignmentsWidget />
          </div>

          <div className="transition-all duration-300 hover:scale-[1.02]">
            <MyScoreSheetsWidget />
          </div>
        </div>

        <AllAssignmentsTable />
      </div>
    </div>;
};