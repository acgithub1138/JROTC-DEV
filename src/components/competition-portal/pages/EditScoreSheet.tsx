import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCompetitionResultsPermissions } from '@/hooks/useModuleSpecificPermissions';
import { getCleanFieldName } from '@/components/competition-portal/my-competitions/components/score-sheet-viewer/utils/fieldHelpers';

type CompetitionEvent = {
  id: string;
  event: string;
  score_sheet: any;
  total_points: number | null;
  cadet_ids: string[];
  team_name: string | null;
  school_id: string;
  created_at: string;
};

export const EditScoreSheet: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();

  // Extract competition ID correctly from URL path
  const getCompetitionIdFromPath = () => {
    const pathSegments = location.pathname.split('/');
    const competitionDetailsIndex = pathSegments.findIndex(segment => segment === 'competition-details');
    if (competitionDetailsIndex !== -1 && pathSegments[competitionDetailsIndex + 1]) {
      return pathSegments[competitionDetailsIndex + 1];
    }
    return params.competitionId;
  };

  const competitionId = getCompetitionIdFromPath();
  const eventId = searchParams.get('eventId');
  const schoolId = searchParams.get('schoolId');

  const { canUpdate } = useCompetitionResultsPermissions();
  const [event, setEvent] = useState<CompetitionEvent | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [judgeNumber, setJudgeNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  const fetchEvent = async () => {
    if (!eventId || !competitionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('competition_events')
        .select('id, event, score_sheet, total_points, cadet_ids, team_name, school_id, created_at')
        .eq('id', eventId)
        .eq('source_type', 'portal')
        .eq('source_competition_id', competitionId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Score sheet not found');

      setEvent(data);
      if (data.score_sheet && typeof data.score_sheet === 'object' && !Array.isArray(data.score_sheet) && 'scores' in data.score_sheet) {
        setScores(data.score_sheet.scores as Record<string, string>);
      }
      if (data.score_sheet && typeof data.score_sheet === 'object' && !Array.isArray(data.score_sheet) && 'judge_number' in data.score_sheet) {
        setJudgeNumber(String(data.score_sheet.judge_number));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load score sheet');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [eventId, competitionId]);

  const handleScoreChange = (fieldName: string, value: string) => {
    setScores(prev => ({
      ...prev,
      [fieldName]: value
    }));
    setHasUnsavedChanges(true);
  };

  const handleJudgeNumberChange = (value: string) => {
    setJudgeNumber(value);
    setHasUnsavedChanges(true);
  };

  const calculateTotal = () => {
    let total = 0;
    Object.values(scores).forEach(value => {
      const numValue = parseFloat(value) || 0;
      total += numValue;
    });
    return total;
  };

  const handleSave = async () => {
    if (!event) return;

    setIsSaving(true);
    try {
      const updatedScoreSheet = {
        ...event.score_sheet,
        scores,
        judge_number: judgeNumber,
        calculated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('competition_events')
        .update({
          score_sheet: updatedScoreSheet,
          total_points: calculateTotal(),
          updated_at: new Date().toISOString()
        })
        .eq('id', event.id);

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST301' || error.message?.includes('permission')) {
          throw new Error('You do not have permission to edit this score sheet. You can only edit score sheets from your own school.');
        }
        throw error;
      }

      toast.success('Score sheet updated successfully');
      setHasUnsavedChanges(false);

      // Navigate back to the view page
      navigate(`/app/competition-portal/competition-details/${competitionId}/results/view_score_sheet?eventId=${event.event}&schoolId=${schoolId}&eventName=${encodeURIComponent('Event')}`);

    } catch (error: any) {
      console.error('Error updating score sheet:', error);
      toast.error(error.message || 'Failed to update score sheet');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    const navigationAction = () => 
      navigate(`/app/competition-portal/competition-details/${competitionId}/results/view_score_sheet?eventId=${event?.event}&schoolId=${schoolId}&eventName=${encodeURIComponent('Event')}`);
    
    if (hasUnsavedChanges) {
      setPendingNavigation(() => navigationAction);
      setShowUnsavedDialog(true);
    } else {
      navigationAction();
    }
  };

  const handleSaveAndNavigate = async () => {
    await handleSave();
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
    setShowUnsavedDialog(false);
  };

  const handleDiscardAndNavigate = () => {
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
    setShowUnsavedDialog(false);
  };

  if (!canUpdate) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to edit score sheets.</p>
        </div>
      </div>
    );
  }

  if (!eventId || !competitionId) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Invalid Request</h1>
          <p className="text-muted-foreground">Missing required parameters for editing score sheet.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Loading score sheet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Error</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button 
            variant="outline" 
            onClick={fetchEvent} 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Score Sheet Not Found</h1>
          <p className="text-muted-foreground">The requested score sheet could not be found.</p>
        </div>
      </div>
    );
  }

  const sortedFieldNames = Object.keys(scores).sort((a, b) => {
    const getNumber = (str: string) => {
      const match = str.match(/^field_(\d+)/);
      return match ? parseInt(match[1]) : 999;
    };
    return getNumber(a) - getNumber(b);
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header with action buttons */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Edit Score Sheet</h1>
          <p className="text-muted-foreground">
            Modify score sheet details and scoring data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="py-4">
          <CardTitle>Score Sheet Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Judge Number Field */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="judge-number" className="text-right">
              Judge Number
            </Label>
            <div className="col-span-3">
              <Input 
                id="judge-number" 
                value={judgeNumber} 
                onChange={(e) => handleJudgeNumberChange(e.target.value)}
                placeholder="Enter judge number" 
              />
            </div>
          </div>

          <Separator />

          {/* Score Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Scoring Fields</h3>
            <div className="space-y-4">
              {sortedFieldNames.map(fieldName => (
                <div key={fieldName} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={fieldName} className="text-right font-medium">
                    {getCleanFieldName(fieldName)}
                  </Label>
                  <div className="col-span-3">
                    <Input 
                      id={fieldName} 
                      type="number" 
                      value={scores[fieldName] || ''} 
                      onChange={(e) => handleScoreChange(fieldName, e.target.value)}
                      placeholder="Enter score" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Total Points */}
          <div className="bg-muted/30 p-4 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Total Points:</span>
              <span className="text-2xl font-bold">{calculateTotal()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unsaved Changes Dialog */}
      {showUnsavedDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Unsaved Changes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You have unsaved changes. What would you like to do?
              </p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowUnsavedDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDiscardAndNavigate}>
                  Discard Changes
                </Button>
                <Button onClick={handleSaveAndNavigate}>
                  Save & Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};