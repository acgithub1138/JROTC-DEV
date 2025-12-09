import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, History } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface JudgeScore {
  judgeNumber?: number;
  score: number;
}

interface SchoolAgg {
  schoolId: string;
  schoolName: string;
  judges: JudgeScore[];
  total: number;
  eventRecords: any[];
}

interface EventGroup {
  event: string;
  eventId: string;
  schools: SchoolAgg[];
  judgeNumbers: number[];
}

interface EventResultsTabProps {
  grouped: Map<string, EventGroup>;
  competitionId: string;
  canViewDetails: boolean;
  onOpenHistory: (schoolAgg: SchoolAgg, eventName: string, eventId: string) => void;
}

export const EventResultsTab: React.FC<EventResultsTabProps> = ({
  grouped,
  competitionId,
  canViewDetails,
  onOpenHistory,
}) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const hasAnyHistory = (schoolAgg: SchoolAgg) => {
    return schoolAgg.eventRecords.some((record: any) => record.has_history);
  };

  if (grouped.size === 0) {
    return <div className="p-4 text-sm text-muted-foreground">No event results available.</div>;
  }

  return (
    <div className="space-y-6">
      {Array.from(grouped.values()).map((group) => (
        <Card key={group.event}>
          <CardHeader className="py-[6px]">
            <CardTitle>{group.event} - Results</CardTitle>
          </CardHeader>
          <CardContent>
            {isMobile ? (
              <div className="space-y-4">
                {group.schools.map((s, idx) => (
                  <Card key={s.schoolId}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex justify-between items-center">
                        <span>
                          #{idx + 1} {s.schoolName}
                        </span>
                        <span className="text-lg font-bold">{s.total.toFixed(1)}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {group.judgeNumbers.map((n) => {
                          const js = s.judges.find((j) => j.judgeNumber === n);
                          return (
                            <div key={n} className="flex justify-between items-center">
                              <span className="text-sm font-medium text-muted-foreground">Judge {n}:</span>
                              <span className="text-sm">{js ? js.score : "-"}</span>
                            </div>
                          );
                        })}
                        <div className="flex justify-end gap-2 pt-2">
                          {hasAnyHistory(s) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onOpenHistory(s, group.event, group.eventId)}
                            >
                              <History className="h-4 w-4 mr-1" />
                              History
                            </Button>
                          )}
                          {canViewDetails && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigate(
                                  `/app/competition-portal/competition-details/${competitionId}/results/view_score_sheet?eventId=${group.eventId}&schoolId=${s.schoolId}&eventName=${encodeURIComponent(group.event)}`,
                                );
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          )}
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
                    <tr className="text-left">
                      <th className="px-3 py-2 w-20">Rank</th>
                      <th className="px-3 py-2 min-w-[200px]">School</th>
                      {group.judgeNumbers.map((n) => (
                        <th key={n} className="px-3 py-2 w-24">
                          Judge {n}
                        </th>
                      ))}
                      <th className="px-3 py-2 w-24">Total</th>
                      <th className="px-3 py-2 w-28 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.schools.map((s, idx) => (
                      <tr key={s.schoolId} className="border-t">
                        <td className="px-3 py-2 w-20">{idx + 1}</td>
                        <td className="px-3 py-2 min-w-[200px]">{s.schoolName}</td>
                        {group.judgeNumbers.map((n) => {
                          const js = s.judges.find((j) => j.judgeNumber === n);
                          return (
                            <td key={n} className="px-3 py-2 w-24">
                              {js ? js.score : "-"}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 w-24 font-medium">{s.total.toFixed(1)}</td>
                        <td className="px-3 py-2 w-28">
                          <div className="flex items-center justify-center gap-2">
                            {canViewDetails && (
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                title="View Scores"
                                aria-label={`View score sheets for ${s.schoolName}`}
                                onClick={() => {
                                  navigate(
                                    `/app/competition-portal/competition-details/${competitionId}/results/view_score_sheet?eventId=${group.eventId}&schoolId=${s.schoolId}&eventName=${encodeURIComponent(group.event)}`,
                                  );
                                }}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                            {hasAnyHistory(s) && (
                              <Button
                                variant="outline"
                                size="icon"
                                title="Score Change History"
                                className="h-8 w-8"
                                aria-label={`View history for ${s.schoolName}`}
                                onClick={() => onOpenHistory(s, group.event, group.eventId)}
                              >
                                <History className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
