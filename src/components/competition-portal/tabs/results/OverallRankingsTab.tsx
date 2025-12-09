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
}

export const OverallRankingsTab: React.FC<OverallRankingsTabProps> = ({ rankings, title }) => {
  const isMobile = useIsMobile();
  const top10 = rankings.slice(0, 10);

  if (rankings.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">No results available for {title.toLowerCase()} rankings.</div>;
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
                      <div className="text-lg font-bold">{school.totalPoints.toFixed(1)}</div>
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
                  <th className="px-3 py-2 w-32 text-right">Total Points</th>
                  <th className="px-3 py-2 w-24 text-right">Events</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((school, idx) => (
                  <tr key={school.schoolId} className="border-b last:border-0">
                    <td className="px-3 py-2 font-bold text-primary">{idx + 1}</td>
                    <td className="px-3 py-2 font-medium">{school.schoolName}</td>
                    <td className="px-3 py-2 text-right font-bold">{school.totalPoints.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{school.eventCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
