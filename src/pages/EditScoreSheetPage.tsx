import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Save, AudioLines } from 'lucide-react';
import { EventScoreForm } from '@/components/competition-management/components/EventScoreForm';
import { useCompetitionTemplates } from '@/components/competition-management/hooks/useCompetitionTemplates';
import { Skeleton } from '@/components/ui/skeleton';
import { useAttachments } from '@/hooks/attachments/useAttachments';
import { PageContainer, FieldRow } from '@/components/ui/layout';

export const EditScoreSheetPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scoreSheetId = searchParams.get('id');
  const { templates } = useCompetitionTemplates();

  const [scoreSheet, setScoreSheet] = useState<any>(null);
  const [scores, setScores] = useState<Record<string, any>>({});
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Fetch attachments for this competition_event
  const { attachments, isLoading: attachmentsLoading } = useAttachments(
    'competition_event',
    scoreSheetId || ''
  );
  
  // Find audio attachment
  const audioAttachment = attachments.find(att => att.file_type?.startsWith('audio/'));
  const hasAudioRecording = scoreSheet?.judge_transcript || audioUrl;

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, [hasAudioRecording]);

  // Load audio URL from attachment
  useEffect(() => {
    const loadAudioUrl = async () => {
      if (audioAttachment) {
        const { data, error } = await supabase.storage
          .from('task-incident-attachments')
          .createSignedUrl(audioAttachment.file_path, 3600); // 1 hour expiry
        
        if (error) {
          console.error('Error creating signed URL:', error);
          return;
        }
        
        console.log('Audio signed URL created:', data.signedUrl);
        setAudioUrl(data.signedUrl);
      }
    };
    
    loadAudioUrl();
  }, [audioAttachment]);

  useEffect(() => {
    if (!scoreSheetId) {
      toast.error('No score sheet ID provided');
      navigate('/app/judges-portal');
      return;
    }

    loadScoreSheet();
  }, [scoreSheetId]);

  const loadScoreSheet = async () => {
    try {
      const { data, error } = await supabase
        .from('competition_events')
        .select('*')
        .eq('id', scoreSheetId)
        .single();

      if (error) throw error;

      setScoreSheet(data);
      const scoreSheetData = data.score_sheet as any;
      setScores(scoreSheetData?.scores || {});
      // Use the stored total_points from database instead of recalculating
      setTotalPoints(data.total_points || 0);
    } catch (error) {
      console.error('Error loading score sheet:', error);
      toast.error('Failed to load score sheet');
      navigate('/app/judges-portal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoreChange = (newScores: Record<string, any>, newTotal: number) => {
    setScores(newScores);
    setTotalPoints(newTotal);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const scoreSheetData = scoreSheet.score_sheet as any;
      const updatedScoreSheet = {
        ...scoreSheetData,
        scores: scores,
        calculated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('competition_events')
        .update({
          score_sheet: updatedScoreSheet,
          total_points: totalPoints,
          updated_at: new Date().toISOString()
        })
        .eq('id', scoreSheetId);

      if (error) throw error;

      toast.success('Score sheet updated successfully');
      navigate('/app/judges-portal');
    } catch (error) {
      console.error('Error updating score sheet:', error);
      toast.error('Failed to update score sheet');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </PageContainer>
    );
  }

  const scoreSheetData = scoreSheet?.score_sheet as any;
  const template = templates.find(t => t.id === scoreSheetData?.template_id);
  const judgeNumber = scoreSheetData?.judge_number || 'Unknown Judge';

  return (
    <PageContainer>
      <FieldRow>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/app/judges-portal')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Score Sheet</h1>
          <p className="text-sm text-muted-foreground">
            Judge {judgeNumber}
          </p>
        </div>
      </FieldRow>

      <Card>
        <CardHeader>
          <CardTitle>Score Details</CardTitle>
        </CardHeader>
        <CardContent>
          {template ? (
            <EventScoreForm
              templateScores={template.scores as Record<string, any>}
              onScoreChange={handleScoreChange}
              initialScores={scores}
              judgeNumber={judgeNumber}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Template not found for this score sheet.</p>
              <p className="text-sm mt-2">Unable to edit scores without template data.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {hasAudioRecording && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AudioLines className="h-5 w-5" />
              Judge Audio Recording
            </CardTitle>
          </CardHeader>
          <CardContent>
            <audio
              ref={audioRef}
              src={audioUrl || scoreSheet?.judge_transcript}
              className="w-full"
              controls
            />
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => navigate('/app/judges-portal')}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!template || isSaving}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </PageContainer>
  );
};