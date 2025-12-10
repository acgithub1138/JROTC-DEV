import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

interface SchoolRanking {
  schoolId: string;
  schoolName: string;
  totalPoints: number;
  eventCount: number;
}

interface OverallRankingsTabProps {
  rankings: SchoolRanking[];
  title: string;
  isNormalized?: boolean;
}

export const OverallRankingsTab: React.FC<OverallRankingsTabProps> = ({ rankings, title, isNormalized = false }) => {
  const isMobile = useIsMobile();
  const formatScore = (score: number) => (isNormalized ? `${score.toFixed(1)}%` : score.toFixed(1));
  const top10 = rankings.slice(0, 10);

  if (rankings.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">No results available for {title.toLowerCase()} rankings.</div>
    );
  }

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle>{title} Rankings - Top 10</CardTitle>
      </CardHeader>
      <CardContent>
        {isMobile ? (
          <div className="space-y-3">
            {top10.map((school, idx) => (
              <Card key={school.schoolId}>
                <CardContent className="py-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-lg font-bold text-primary">#{idx + 1}</span>
                      <span className="ml-2 font-medium">{school.schoolName}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{formatScore(school.totalPoints)}</div>
                      <div className="text-xs text-muted-foreground">{school.eventCount} events</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="px-3 py-2 w-20">Place</th>
                  <th className="px-3 py-2">School</th>
                  <th className="px-3 py-2 w-32 text-right">{isNormalized ? "Score" : "Total Points"}</th>
                  <th className="px-3 py-2 w-24 text-center">Events</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((school, idx) => (
                  <tr key={school.schoolId} className="border-b last:border-0">
                    <td className="px-3 py-2 font-bold text-primary">{idx + 1}</td>
                    <td className="px-3 py-2 font-medium">{school.schoolName}</td>
                    <td className="px-3 py-2 text-right font-bold">{formatScore(school.totalPoints)}</td>
                    <td className="px-3 py-2 text-center text-muted-foreground">{school.eventCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {isNormalized && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-2">
            <p className="font-medium">Event weights use a relative normalization model.</p>
            <p>Each event has a weight between 1.0 and 2.0 representing its relative impact on overall scoring.</p>
            <p>
              For each team, the weights of the events they participate in are normalized so the total influence equals
              100%. This ensures fair comparison between teams, regardless of how many events they enter.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
