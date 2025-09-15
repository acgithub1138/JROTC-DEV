import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface HistoryRecord {
  id: string;
  competition_event_id: string;
  changed_by: string;
  change_reason: string;
  old_values: any;
  new_values: any;
  created_at: string;
  changed_by_profile?: {
    first_name: string;
    last_name: string;
  };
}

interface ScoreSheetHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionEventId: string;
  schoolName: string;
  eventName: string;
}

export const ScoreSheetHistoryModal: React.FC<ScoreSheetHistoryModalProps> = ({
  isOpen,
  onClose,
  competitionEventId,
  schoolName,
  eventName
}) => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && competitionEventId) {
      fetchHistory();
    }
  }, [isOpen, competitionEventId]);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('competition_events_history')
        .select(`
          id,
          competition_event_id,
          changed_by,
          change_reason,
          old_values,
          new_values,
          created_at
        `)
        .eq('competition_event_id', competitionEventId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user profiles separately to avoid relation issues
      const userIds = [...new Set(data.map(record => record.changed_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      // Map profiles to records
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const enrichedHistory = data.map(record => ({
        ...record,
        changed_by_profile: profileMap.get(record.changed_by)
      }));

      setHistory(enrichedHistory as HistoryRecord[]);
    } catch (err: any) {
      console.error('Error fetching score sheet history:', err);
      setError(err.message || 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const renderValueChange = (oldVal: any, newVal: any, field: string) => {
    const oldValue = oldVal?.[field];
    const newValue = newVal?.[field];

    if (oldValue === newValue) return null;

    return (
      <div key={field} className="grid grid-cols-3 gap-2 py-2 border-b border-border last:border-b-0">
        <div className="text-sm font-medium text-muted-foreground capitalize">
          {field.replace(/_/g, ' ')}
        </div>
        <div className="text-sm">
          <Badge variant="outline" className="text-destructive border-destructive">
            {String(oldValue || 'N/A')}
          </Badge>
        </div>
        <div className="text-sm">
          <Badge variant="outline" className="text-green-600 border-green-600">
            {String(newValue || 'N/A')}
          </Badge>
        </div>
      </div>
    );
  };

  const renderScoreChanges = (oldScores: any, newScores: any) => {
    if (!oldScores || !newScores) return null;

    const changes: React.ReactNode[] = [];
    const allFields = new Set([...Object.keys(oldScores), ...Object.keys(newScores)]);

    allFields.forEach(field => {
      const change = renderValueChange(oldScores, newScores, field);
      if (change) changes.push(change);
    });

    return changes.length > 0 ? (
      <div className="space-y-1">
        <div className="grid grid-cols-3 gap-2 pb-2 border-b-2 border-border font-semibold text-sm">
          <div>Field</div>
          <div>From</div>
          <div>To</div>
        </div>
        {changes}
      </div>
    ) : null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            Score Sheet History - {schoolName} ({eventName})
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
          {isLoading && (
            <div className="p-4 text-center text-muted-foreground">
              Loading history...
            </div>
          )}

          {error && (
            <div className="p-4 text-center text-destructive">
              Error: {error}
            </div>
          )}

          {!isLoading && !error && history.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              No history records found.
            </div>
          )}

          {!isLoading && !error && history.length > 0 && (
            <div className="space-y-6">
              {history.map((record, index) => (
                <div key={record.id} className="border border-border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium">
                        Change #{history.length - index}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(record.created_at), 'MMM dd, yyyy \'at\' h:mm a')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {record.changed_by_profile
                          ? `${record.changed_by_profile.first_name} ${record.changed_by_profile.last_name}`
                          : 'Unknown User'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-md p-3">
                    <div className="text-sm font-medium mb-2">Reason for Change:</div>
                    <div className="text-sm">{record.change_reason}</div>
                  </div>

                  <div className="space-y-4">
                    {/* Total Points Change */}
                    {record.old_values?.total_points !== record.new_values?.total_points && (
                      <div>
                        <div className="text-sm font-medium mb-2">Total Points:</div>
                        <div className="flex gap-2 items-center">
                          <Badge variant="outline" className="text-destructive border-destructive">
                            {record.old_values?.total_points || 'N/A'}
                          </Badge>
                          <span>→</span>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {record.new_values?.total_points || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Team Name Change */}
                    {record.old_values?.team_name !== record.new_values?.team_name && (
                      <div>
                        <div className="text-sm font-medium mb-2">Team Name:</div>
                        <div className="flex gap-2 items-center">
                          <Badge variant="outline" className="text-destructive border-destructive">
                            {record.old_values?.team_name || 'N/A'}
                          </Badge>
                          <span>→</span>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {record.new_values?.team_name || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Score Sheet Changes */}
                    {record.old_values?.score_sheet?.scores && record.new_values?.score_sheet?.scores && (
                      <div>
                        <div className="text-sm font-medium mb-2">Score Changes:</div>
                        {renderScoreChanges(
                          record.old_values.score_sheet.scores,
                          record.new_values.score_sheet.scores
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};