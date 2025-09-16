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
  competitionId: string;
  schoolId: string;
  eventId: string;
  schoolName: string;
  eventName: string;
}

export const ScoreSheetHistoryModal: React.FC<ScoreSheetHistoryModalProps> = ({
  isOpen,
  onClose,
  competitionId,
  schoolId,
  eventId,
  schoolName,
  eventName
}) => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && competitionId && schoolId && eventId) {
      fetchHistory();
    }
  }, [isOpen, competitionId, schoolId, eventId]);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First get all competition event IDs for this school and event
      // Note: Some competition_events may have null competition_id, so we'll filter by school_id and event only
      const { data: competitionEvents, error: eventsError } = await supabase
        .from('competition_events')
        .select('id')
        .eq('school_id', schoolId)
        .eq('event', eventId);

      if (eventsError) throw eventsError;

      const eventIds = competitionEvents?.map(e => e.id) || [];
      if (eventIds.length === 0) {
        setHistory([]);
        return;
      }

      // Now get history for all these events
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
        .in('competition_event_id', eventIds)
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
              {history.map((record, index) => {
                // Find the judge number from the competition event
                const judgeNumber = record.old_values?.score_sheet?.judge_number || 
                                  record.new_values?.score_sheet?.judge_number || 
                                  'Unknown';
                
                return (
                  <div key={record.id} className="border border-border rounded-lg p-4 space-y-3">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        Change #{history.length - index} - {format(new Date(record.created_at), 'MMM dd, yyyy \'at\' h:mm a')} - Judge {judgeNumber}
                      </div>
                    </div>

                    {/* Score Sheet Changes */}
                    {record.old_values?.score_sheet?.scores && record.new_values?.score_sheet?.scores && (
                      <div className="space-y-2">
                        {Object.keys({...record.old_values.score_sheet.scores, ...record.new_values.score_sheet.scores}).map(field => {
                          const oldValue = record.old_values.score_sheet.scores[field];
                          const newValue = record.new_values.score_sheet.scores[field];
                          
                          if (oldValue === newValue) return null;
                          
                          return (
                            <div key={field}>
                              <div className="text-sm">
                                <span className="font-medium">
                                  {record.changed_by_profile
                                    ? `${record.changed_by_profile.last_name}, ${record.changed_by_profile.first_name}`
                                    : 'Unknown User'}
                                </span>
                                {' '}changed{' '}
                                <span className="font-medium">{field.replace(/_/g, ' ')}</span>
                                {' '}from{' '}
                                <Badge variant="outline" className="text-destructive border-destructive mx-1">
                                  {String(oldValue || 'N/A')}
                                </Badge>
                                {' '}to{' '}
                                <Badge variant="outline" className="text-green-600 border-green-600 mx-1">
                                  {String(newValue || 'N/A')}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Team Name Change */}
                    {record.old_values?.team_name !== record.new_values?.team_name && (
                      <div className="text-sm">
                        <span className="font-medium">
                          {record.changed_by_profile
                            ? `${record.changed_by_profile.last_name}, ${record.changed_by_profile.first_name}`
                            : 'Unknown User'}
                        </span>
                        {' '}changed{' '}
                        <span className="font-medium">Team Name</span>
                        {' '}from{' '}
                        <Badge variant="outline" className="text-destructive border-destructive mx-1">
                          {record.old_values?.team_name || 'N/A'}
                        </Badge>
                        {' '}to{' '}
                        <Badge variant="outline" className="text-green-600 border-green-600 mx-1">
                          {record.new_values?.team_name || 'N/A'}
                        </Badge>
                      </div>
                    )}

                    <div className="bg-muted/50 rounded-md p-3 mt-3">
                      <div className="text-sm">
                        <span className="font-medium">Reason for Change:</span> {record.change_reason}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};