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
import { EventScoreForm } from '@/components/competition-management/components/EventScoreForm';
import { useCompetitionTemplates } from '@/components/competition-portal/my-competitions/hooks/useCompetitionTemplates';

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
  const { templates } = useCompetitionTemplates();
  const [event, setEvent] = useState<CompetitionEvent | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [scores, setScores] = useState<Record<string, any>>({});
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [judgeNumber, setJudgeNumber] = useState('');
  const [teamName, setTeamName] = useState('');
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
      
      // Load existing scores and metadata
      if (data.score_sheet && typeof data.score_sheet === 'object' && !Array.isArray(data.score_sheet)) {
        if ('scores' in data.score_sheet) {
          setScores(data.score_sheet.scores as Record<string, any>);
        }
        if ('judge_number' in data.score_sheet) {
          setJudgeNumber(String(data.score_sheet.judge_number));
        }
      }
      
      if (data.team_name) {
        setTeamName(data.team_name);
      }
      
      if (data.total_points) {
        setTotalPoints(Number(data.total_points));
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

  // Separate effect to handle template loading when templates change
  useEffect(() => {
    if (event && templates.length > 0 && !selectedTemplate) {
      // Find and set the template
      if (event.score_sheet && typeof event.score_sheet === 'object' && !Array.isArray(event.score_sheet) && 'template_id' in event.score_sheet) {
        const scoreSheet = event.score_sheet as { template_id?: string };
        if (scoreSheet.template_id) {
          const template = templates.find(t => t.id === scoreSheet.template_id);
          if (template) {
            setSelectedTemplate(template);
          }
        }
      } else if (event.event) {
        // Try to find template by event type
        const template = templates.find(t => t.event === event.event);
        if (template) {
          setSelectedTemplate(template);
        }
      }
    }
  }, [event, templates]);

  const handleScoreChange = React.useCallback((newScores: Record<string, any>, newTotalPoints: number) => {
    setScores(newScores);
    setTotalPoints(newTotalPoints);
    setHasUnsavedChanges(true);
  }, []);

  const handleJudgeNumberChange = React.useCallback((value: string) => {
    setJudgeNumber(value);
    setHasUnsavedChanges(true);
  }, []);

  const handleTeamNameChange = React.useCallback((value: string) => {
    setTeamName(value);
    setHasUnsavedChanges(true);
  }, []);

  const handleSave = async () => {
    if (!event) return;

    setIsSaving(true);
    try {
      const updatedScoreSheet = {
        ...event.score_sheet,
        scores,
        judge_number: judgeNumber,
        template_id: selectedTemplate?.id,
        calculated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('competition_events')
        .update({
          score_sheet: updatedScoreSheet,
          total_points: totalPoints,
          team_name: teamName || null,
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

      // Navigate back to the view page - use event.id instead of event.event to view the specific score sheet
      navigate(`/app/competition-portal/competition-details/${competitionId}/results/view_score_sheet?eventId=${event.id}&schoolId=${schoolId}&eventName=${encodeURIComponent('Event')}`);

    } catch (error: any) {
      console.error('Error updating score sheet:', error);
      toast.error(error.message || 'Failed to update score sheet');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    const navigationAction = () => 
      navigate(`/app/competition-portal/competition-details/${competitionId}/results/view_score_sheet?eventId=${event?.id}&schoolId=${schoolId}&eventName=${encodeURIComponent('Event')}`);
    
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

  if (!event || !selectedTemplate) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Loading score sheet...</p>
        </div>
      </div>
    );
  }

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
          {/* Judge Number and Team Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="judge-number" className="font-medium">
                Judge Number
              </Label>
              <Input 
                id="judge-number" 
                value={judgeNumber} 
                onChange={(e) => handleJudgeNumberChange(e.target.value)}
                placeholder="Enter judge number" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="team-name" className="font-medium">
                Team Name
              </Label>
              <Input 
                id="team-name" 
                value={teamName} 
                onChange={(e) => handleTeamNameChange(e.target.value)}
                placeholder="Enter team name" 
              />
            </div>
          </div>

          <Separator />

          {/* Score Sheet Section */}
          {selectedTemplate && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Score Sheet: {selectedTemplate.template_name}</h3>
              <EventScoreForm
                templateScores={selectedTemplate.scores as Record<string, any>}
                onScoreChange={handleScoreChange}
                initialScores={scores}
                judgeNumber={judgeNumber}
              />
            </div>
          )}

          {!selectedTemplate && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Loading score sheet template...</p>
            </div>
          )}
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