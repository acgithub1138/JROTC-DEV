import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useJudgeEventDetails } from '@/hooks/judges-portal/useJudgeEventDetails';
import { useEventScoreSheets } from '@/hooks/judges-portal/useEventScoreSheets';
import { useAttachments } from '@/hooks/attachments/useAttachments';
import { useAudioRecording, type AudioMode } from '@/hooks/useAudioRecording';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EventConfirmationStep } from '@/components/judges-portal/mobile/EventConfirmationStep';
import { SchoolSelectionStep } from '@/components/judges-portal/mobile/SchoolSelectionStep';
import { JudgeNumberStep } from '@/components/judges-portal/mobile/JudgeNumberStep';
import { AllQuestionsStep } from '@/components/judges-portal/mobile/AllQuestionsStep';
import { ReviewSubmitStep } from '@/components/judges-portal/mobile/ReviewSubmitStep';
import { ProgressIndicator } from '@/components/judges-portal/mobile/ProgressIndicator';
import type { JsonField } from '@/components/competition-management/components/json-field-builder/types';
import { calculateTotalScore } from '@/utils/scoreCalculations';

export default function MobileJudgeEventPage() {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const competitionId = searchParams.get('competitionId');
  const navigate = useNavigate();
  const { user } = useAuth();

  const { eventDetails, registeredSchools, isLoading } = useJudgeEventDetails(eventId, competitionId);
  const { data: submittedSchoolIds = new Set(), isLoading: isLoadingSubmissions } = useEventScoreSheets(
    eventDetails?.event_id, 
    competitionId, 
    user?.id
  );

  // State management with per-user localStorage persistence
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [selectedJudgeNumber, setSelectedJudgeNumber] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [audioMode, setAudioMode] = useState<AudioMode>('none');
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  // Load user preferences from localStorage (keyed by user ID)
  useEffect(() => {
    if (!user?.id) return;

    const storageKey = `judgePortal_${user.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        if (settings.judgeNumber) setSelectedJudgeNumber(settings.judgeNumber);
        if (settings.audioMode) setAudioMode(settings.audioMode);
      } catch (e) {
        console.error('Failed to load judge portal settings:', e);
      }
    }
  }, [user?.id]);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (!user?.id) return;

    const storageKey = `judgePortal_${user.id}`;
    const settings = {
      judgeNumber: selectedJudgeNumber,
      audioMode
    };
    localStorage.setItem(storageKey, JSON.stringify(settings));
  }, [selectedJudgeNumber, audioMode, user?.id]);
  const {
    recordingState,
    audioBlob,
    duration: recordingDuration,
    error: recordingError,
    hasPermission,
    requestPermission,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    deleteRecording,
  } = useAudioRecording(audioMode);
  const hasPausedOnReviewRef = useRef(false);
  const audioBlobRef = useRef<Blob | null>(null);

  // Keep ref in sync with audioBlob state
  useEffect(() => {
    audioBlobRef.current = audioBlob;
  }, [audioBlob]);

  // Handle audio mode change with permission request
  const handleAudioModeChange = async (mode: AudioMode) => {
    setAudioMode(mode);
    if (mode === 'manual' || mode === 'auto') {
      await requestPermission();
    }
  };

  // Attachments for uploading audio - use selected school's ID
  const { uploadFile } = useAttachments('competition_event', createdEventId || '', selectedSchoolId || undefined);

  // Fetch template
  const { data: template } = useQuery({
    queryKey: ['competition-template', eventDetails?.score_sheet],
    enabled: !!eventDetails?.score_sheet,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competition_templates')
        .select('*')
        .eq('id', eventDetails!.score_sheet!)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Parse fields from template
  const fields: JsonField[] = useMemo(() => {
    const scores = template?.scores as any;
    if (!scores?.criteria) return [];
    
    return scores.criteria.map((field: any, index: number) => ({
      ...field,
      id: field.id || `field_${index}_${field.name?.replace(/\s+/g, '_').toLowerCase()}`,
      pauseField: field.type === 'bold_gray' || field.type === 'pause' || field.pauseField,
      values: field.options || field.values,
      textType: field.type === 'text' ? (field.maxLength > 75 ? 'notes' : 'short') : undefined
    }));
  }, [template]);

  // Get question fields (fields that need user input)
  const questionFields = useMemo(() => {
    return fields.filter(field => 
      !['section_header', 'calculated'].includes(field.type)
    );
  }, [fields]);

  // Initialize penalty fields to 0
  useEffect(() => {
    if (questionFields.length > 0) {
      const penaltyDefaults: Record<string, any> = {};
      questionFields.forEach(field => {
        if ((field.type === 'penalty' || field.type === 'penalty_checkbox') && answers[field.id] === undefined) {
          penaltyDefaults[field.id] = 0;
        }
      });
      if (Object.keys(penaltyDefaults).length > 0) {
        setAnswers(prev => ({ ...penaltyDefaults, ...prev }));
      }
    }
  }, [questionFields]); // Only run when questionFields change, not answers

  // Calculate total steps - now all questions are on one page
  const totalSteps = 4; // confirmation + school + judge + all questions + review

  // Calculate total points (including penalties) using shared utility
  const totalPoints = useMemo(() => {
    return calculateTotalScore(fields, answers);
  }, [answers, fields]);

  // Reset transition state when step changes
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => setIsTransitioning(false), 300);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isTransitioning]);

  // Auto-start recording on questions step if mode is auto
  useEffect(() => {
    if (currentStep === 3 && audioMode === 'auto' && recordingState === 'idle') {
      startRecording();
    }
  }, [currentStep, audioMode, recordingState, startRecording]);

  // On entering review step, pause once; allow manual resume without re-pausing
  useEffect(() => {
    const onReview = currentStep === 4; // Now review is step 4
    if (onReview && !hasPausedOnReviewRef.current) {
      console.log('[Audio] Pausing on review entry');
      pauseRecording();
      hasPausedOnReviewRef.current = true;
    }
    if (!onReview && hasPausedOnReviewRef.current) {
      hasPausedOnReviewRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // Handle navigation
  const handleNext = () => {
    if (currentStep < totalSteps && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleExit = () => {
    navigate('/app/judges-portal');
  };

  // Handle answer changes
  const handleValueChange = (fieldId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleNotesChange = (fieldId: string, notes: string) => {
    setAnswers(prev => ({ ...prev, [`${fieldId}_notes`]: notes }));
  };

  // Handle edit from review page - go back to questions page
  const handleEdit = (questionIndex: number) => {
    setCurrentStep(3); // Go back to all questions step
  };

  // Utility to wait for a value to become available
  const waitFor = <T,>(
    getValue: () => T | null | undefined,
    timeoutMs = 4000,
    intervalMs = 50
  ): Promise<T | null> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        const value = getValue();
        if (value) {
          clearInterval(checkInterval);
          resolve(value);
        } else if (Date.now() - startTime >= timeoutMs) {
          clearInterval(checkInterval);
          resolve(null);
        }
      }, intervalMs);
    });
  };

  // Handle submission
  const handleSubmit = async () => {
    if (!selectedSchoolId || !eventDetails || !selectedJudgeNumber || !user) {
      toast.error('Missing required information');
      return;
    }

    setIsSubmitting(true);

    try {
      // Stop recording if active
      if (recordingState !== 'idle') {
        console.log('Stopping recording before submit...');
        stopRecording();
      }

      // Insert competition_events record
      const { data: newEvent, error: eventError } = await supabase
        .from('competition_events')
        .insert([{
          school_id: selectedSchoolId,
          event: eventDetails.event_id,
          competition_id: null,
          source_competition_id: competitionId,
          source_type: 'portal',
          score_sheet: {
            template_id: template?.id,
            judge_number: selectedJudgeNumber,
            scores: answers,
            calculated_at: new Date().toISOString()
          },
          total_points: totalPoints,
          cadet_ids: []
        }])
        .select()
        .single();

      if (eventError) throw eventError;

      // Wait for blob to finalize after stop
      console.log('Waiting for audio blob to finalize...');
      const finalBlob = await waitFor(() => audioBlobRef.current, 4000);

      if (finalBlob) {
        console.log(`Blob ready, size: ${finalBlob.size} bytes`);
        const audioFile = new File(
          [finalBlob],
          `judge-${selectedJudgeNumber}-recording-${Date.now()}.webm`,
          { type: 'audio/webm' }
        );

        console.log('Uploading audio attachment...');
        await uploadFile({
          record_type: 'competition_event',
          record_id: newEvent.id,
          file: audioFile
        });
        console.log('Audio attachment uploaded successfully');
      } else {
        console.warn('Audio blob not available after stop; proceeding without attachment');
      }

      toast.success('Score sheet submitted successfully!');
      navigate('/app/judges-portal');
    } catch (error: any) {
      console.error('Error submitting score sheet:', error);
      toast.error(error.message || 'Failed to submit score sheet');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isLoadingSubmissions || !eventDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Points Counter - Top Right */}
      {currentStep === 3 && (
        <div className="fixed top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full text-base font-bold shadow-lg z-10">
          {totalPoints} pts
        </div>
      )}

      {/* Step 0: Event Confirmation */}
      {currentStep === 0 && (
        <EventConfirmationStep
          eventName={eventDetails.event_name}
          eventStartTime={eventDetails.event_start_time}
          eventLocation={eventDetails.event_location}
          onNext={handleNext}
          onExit={handleExit}
        />
      )}

      {/* Step 1: School Selection */}
      {currentStep === 1 && (
        <SchoolSelectionStep
          schools={registeredSchools}
          submittedSchoolIds={submittedSchoolIds}
          selectedSchoolId={selectedSchoolId}
          onSelect={setSelectedSchoolId}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isTransitioning={isTransitioning}
        />
      )}

      {/* Step 2: Judge Number Selection */}
      {currentStep === 2 && (
        <JudgeNumberStep
          judgeCount={template?.judges || 4}
          selectedJudgeNumber={selectedJudgeNumber}
          onSelect={setSelectedJudgeNumber}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isTransitioning={isTransitioning}
          audioMode={audioMode}
          onAudioModeChange={handleAudioModeChange}
        />
      )}

      {/* Step 3: All Questions */}
      {currentStep === 3 && (
        <AllQuestionsStep
          fields={questionFields}
          answers={answers}
          judgeNumber={selectedJudgeNumber || '1'}
          onValueChange={handleValueChange}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isTransitioning={isTransitioning}
          audioMode={audioMode}
          recordingState={recordingState}
          recordingDuration={recordingDuration}
          onStartRecording={startRecording}
          onPauseRecording={pauseRecording}
          onResumeRecording={resumeRecording}
        />
      )}

      {/* Step 4: Review & Submit */}
      {currentStep === 4 && (
        <ReviewSubmitStep
          fields={questionFields}
          answers={answers}
          totalPoints={totalPoints}
          isSubmitting={isSubmitting}
          onEdit={handleEdit}
          onSubmit={handleSubmit}
          onPrevious={handlePrevious}
          audioMode={audioMode}
          recordingState={recordingState}
          recordingDuration={recordingDuration}
          onStartRecording={startRecording}
          onResumeRecording={resumeRecording}
          onPauseRecording={pauseRecording}
          
        />
      )}
    </div>
  );
}
