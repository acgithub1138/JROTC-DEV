import { Trophy } from 'lucide-react';

export const JudgesOpenCompetitionsPage = () => {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-judge to-judge/70 flex items-center justify-center">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Open Competitions</h1>
            <p className="text-muted-foreground mt-1">
              Browse and register for available competitions
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-12 text-center">
          <Trophy className="h-16 w-16 mx-auto text-judge/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Open Competitions</h3>
          <p className="text-muted-foreground">
            Check back later for new competition opportunities
          </p>
        </div>
      </div>
    </div>
  );
};
