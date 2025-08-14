import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScoreSheetTable as PortalScoreSheetTable } from '@/components/competition-portal/my-competitions/components/score-sheet-viewer/ScoreSheetTable';

interface CompetitionResultsTabProps {
  competitionId: string;
}

interface CompetitionEventRow {
  id: string;
  event: string;
  total_points: number | null;
  score_sheet: any;
  school_id: string;
  created_at: string;
}

interface CPSchoolRow {
  school_id: string;
  school_name: string | null;
}

const formatEventName = (name?: string) => {
  if (!name) return 'Unknown Event';
  return name
    .toString()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export const CompetitionResultsTab: React.FC<CompetitionResultsTabProps> = ({ competitionId }) => {
  const isMobile = useIsMobile();
  const [rows, setRows] = useState<CompetitionEventRow[]>([]);
  const [schoolMap, setSchoolMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewEvent, setViewEvent] = useState<string | null>(null);
  const [eventSheets, setEventSheets] = useState<any[]>([]);
  const [isDialogLoading, setIsDialogLoading] = useState(false);
  const [viewSchoolId, setViewSchoolId] = useState<string | null>(null);
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    const [eventsRes, schoolsRes] = await Promise.all([
      supabase
        .from('competition_events')
        .select('id, event, total_points, score_sheet, school_id, created_at')
        .eq('source_type', 'portal')
        .eq('source_competition_id', competitionId),
      supabase
        .from('cp_comp_schools')
        .select('school_id, school_name')
        .eq('competition_id', competitionId),
    ]);

    if (eventsRes.error || schoolsRes.error) {
      setError(eventsRes.error?.message || schoolsRes.error?.message || 'Failed to load results');
      setIsLoading(false);
      return;
    }

    setRows((eventsRes.data || []) as CompetitionEventRow[]);

    const map: Record<string, string> = {};
    (schoolsRes.data || []).forEach((s: CPSchoolRow) => {
      if (s.school_id) map[s.school_id] = s.school_name || 'Unknown School';
    });
    setSchoolMap(map);

    setIsLoading(false);
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      await fetchData();
    };

    load();
    return () => {
      active = false;
    };
  }, [competitionId]);

  const fetchEventSheets = async () => {
    if (!viewEvent || !viewSchoolId) return;
    setIsDialogLoading(true);
    const { data, error } = await supabase
      .from('competition_events')
      .select('id, event, score_sheet, total_points, cadet_ids, team_name, school_id, created_at')
      .eq('source_type', 'portal')
      .eq('source_competition_id', competitionId)
      .eq('event', viewEvent as any)
      .eq('school_id', viewSchoolId as any);
    
    setEventSheets(error ? [] : (data || []));
    setIsDialogLoading(false);
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      await fetchEventSheets();
    };

    load();
    return () => {
      active = false;
    };
  }, [viewEvent, viewSchoolId, competitionId]);

  const handleEventsRefresh = async () => {
    // Small delay to ensure database updates are committed
    await new Promise(resolve => setTimeout(resolve, 200));
    // Refresh both main results and dialog data
    await Promise.all([
      fetchData(),
      fetchEventSheets()
    ]);
  };

  const grouped = useMemo(() => {
    type JudgeScore = { judgeNumber?: number; score: number };
    type SchoolAgg = { schoolId: string; schoolName: string; judges: JudgeScore[]; total: number };
    const result = new Map<string, { event: string; schools: SchoolAgg[]; judgeNumbers: number[] }>();

    const eventMap: Record<string, { schoolsMap: Map<string, SchoolAgg>; judgeSet: Set<number>; eventKey: string }> = {};

    function getJudgeNumber(ss: any): number | undefined {
      const candidates = [
        ss?.judge_number,
        ss?.judgeNumber,
        ss?.judgeNo,
        ss?.judge,
        ss?.judge_id,
      ];
      for (const c of candidates) {
        if (c !== null && c !== undefined) {
          const n = parseInt(String(c), 10);
          if (!isNaN(n)) return n;
        }
      }
      return undefined;
    }

    (rows || []).forEach((r) => {
      const ev = r.event || 'Unknown';
      if (!eventMap[ev]) eventMap[ev] = { schoolsMap: new Map(), judgeSet: new Set(), eventKey: ev };
      const { schoolsMap, judgeSet } = eventMap[ev];

      const schoolId = r.school_id;
      const schoolName = schoolMap[schoolId] || 'Unknown School';
      const score = typeof r.total_points === 'number' ? r.total_points : Number(r.total_points) || 0;
      const judgeNumber = getJudgeNumber(r.score_sheet);

      if (judgeNumber !== undefined) judgeSet.add(judgeNumber);

      let agg = schoolsMap.get(schoolId);
      if (!agg) {
        agg = { schoolId, schoolName, judges: [], total: 0 };
        schoolsMap.set(schoolId, agg);
      }

      agg.judges.push({ judgeNumber, score });
      agg.total += score;
    });

    Object.keys(eventMap).forEach((ev) => {
      const { schoolsMap, judgeSet, eventKey } = eventMap[ev];
      const schools = Array.from(schoolsMap.values());

      // Sort judges per school by judge number
      schools.forEach((s) => {
        s.judges.sort((a, b) => {
          const an = a.judgeNumber ?? 9999;
          const bn = b.judgeNumber ?? 9999;
          return an - bn;
        });
      });

      // Sort schools by total score descending
      schools.sort((a, b) => b.total - a.total);

      const judgeNumbers = Array.from(judgeSet.values()).sort((a, b) => a - b);
      result.set(ev, { event: eventKey, schools, judgeNumbers });
    });

    return result;
  }, [rows, schoolMap]);

  if (isLoading) return <div className="p-4 text-sm text-muted-foreground">Loading results...</div>;
  if (error) return <div className="p-4 text-sm text-destructive">Error: {error}</div>;
  if (rows.length === 0) return <div className="p-4 text-sm text-muted-foreground">No results submitted yet.</div>;

  return (
    <div className="space-y-6">
      {Array.from(grouped.values()).map((group) => (
        <Card key={group.event}>
          <CardHeader>
            <CardTitle>{formatEventName(group.event)} - Results</CardTitle>
          </CardHeader>

          <CardContent>
            {isMobile ? (
              <div className="space-y-4">
                {group.schools.map((s, idx) => (
                  <Card key={s.schoolId}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex justify-between items-center">
                        <span>#{idx + 1} {s.schoolName}</span>
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
                              <span className="text-sm">{js ? js.score : '-'}</span>
                            </div>
                          );
                        })}
                        <div className="flex justify-end pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setViewEvent(group.event); setViewSchoolId(s.schoolId); }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
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
                      <th className="px-3 py-2">Rank</th>
                      <th className="px-3 py-2">School</th>
                      {group.judgeNumbers.map((n) => (
                        <th key={n} className="px-3 py-2">Judge {n}</th>
                      ))}
                      <th className="px-3 py-2">Total</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {group.schools.map((s, idx) => (
                      <tr key={s.schoolId} className="border-t">
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2">{s.schoolName}</td>
                        {group.judgeNumbers.map((n) => {
                          const js = s.judges.find((j) => j.judgeNumber === n);
                          return (
                            <td key={n} className="px-3 py-2">{js ? js.score : '-'}</td>
                          );
                        })}
                        <td className="px-3 py-2 font-medium">{s.total.toFixed(1)}</td>
                        <td className="px-3 py-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`View score sheets for ${s.schoolName}`}
                            onClick={() => { setViewEvent(group.event); setViewSchoolId(s.schoolId); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
      <Dialog open={!!viewEvent && !!viewSchoolId} onOpenChange={(open) => {
        if (!open) { setViewEvent(null); setViewSchoolId(null); }
      }}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewEvent ? `${formatEventName(viewEvent)} - ${viewSchoolId ? (schoolMap[viewSchoolId] || 'School') : ''} Score Sheets` : 'Score Sheets'}
            </DialogTitle>
          </DialogHeader>
          {isDialogLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading score sheets...</div>
          ) : eventSheets.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No score sheets found for this school.</div>
          ) : (
            <PortalScoreSheetTable 
              events={eventSheets as any} 
              onEventsRefresh={handleEventsRefresh} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
