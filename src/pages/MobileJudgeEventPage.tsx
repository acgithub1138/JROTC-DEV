import { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useJudgeEventDetails } from '@/hooks/judges-portal/useJudgeEventDetails';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EventConfirmationStep } from '@/components/judges-portal/mobile/EventConfirmationStep';
import { SchoolSelectionStep } from '@/components/judges-portal/mobile/SchoolSelectionStep';
import { JudgeNumberStep } from '@/components/judges-portal/mobile/JudgeNumberStep';
import { QuestionStep } from '@/components/judges-portal/mobile/QuestionStep';
import { ReviewSubmitStep } from '@/components/judges-portal/mobile/ReviewSubmitStep';
import { ProgressIndicator } from '@/components/judges-portal/mobile/ProgressIndicator';
import type { JsonField } from '@/components/competition-management/components/json-field-builder/types';
import { calculateTotalScore } from '@/utils/scoreCalculations';

export default function MobileJudgeEventPage() {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const competitionId = searchParams.get('competitionId');
  const navigate = useNavigate();

  const { eventDetails, registeredSchools, isLoading } = useJudgeEventDetails(eventId, competitionId);

  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [selectedJudgeNumber, setSelectedJudgeNumber] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

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
      !['section_header', 'label', 'pause', 'bold_gray', 'calculated'].includes(field.type)
    );
  }, [fields]);

  // Calculate total steps
  const totalSteps = 3 + questionFields.length; // confirmation + school + judge + questions

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

  // Handle edit from review page
  const handleEdit = (questionIndex: number) => {
    setCurrentStep(3 + questionIndex); // 3 = confirmation + school + judge
  };

  // Handle submission
  const handleSubmit = async () => {
    if (!selectedSchoolId || !eventDetails || !selectedJudgeNumber) {
      toast.error('Missing required information');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
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
        }]);

      if (error) throw error;

      toast.success('Score sheet submitted successfully!');
      navigate('/app/judges-portal');
    } catch (error: any) {
      console.error('Error submitting score sheet:', error);
      toast.error(error.message || 'Failed to submit score sheet');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !eventDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Calculate current question number for display
  const currentQuestionNumber = currentStep > 2 ? currentStep - 2 : 0;
  const totalQuestions = questionFields.length;

  return (
    <div className="relative">
      {/* Progress Indicator */}
      {currentStep > 0 && currentStep <= 2 + questionFields.length && (
        <ProgressIndicator
          current={currentStep > 2 ? currentQuestionNumber : currentStep}
          total={currentStep > 2 ? totalQuestions : 3}
          label={currentStep > 2 ? "Question" : "Step"}
        />
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
        />
      )}

      {/* Steps 3+: Question Steps */}
      {currentStep > 2 && currentStep < 3 + questionFields.length && (
        <QuestionStep
          field={questionFields[currentStep - 3]}
          value={answers[questionFields[currentStep - 3].id]}
          notes={answers[`${questionFields[currentStep - 3].id}_notes`] || ''}
          judgeNumber={selectedJudgeNumber || '1'}
          onValueChange={(value) => handleValueChange(questionFields[currentStep - 3].id, value)}
          onNotesChange={(notes) => handleNotesChange(questionFields[currentStep - 3].id, notes)}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isTransitioning={isTransitioning}
        />
      )}

      {/* Final Step: Review & Submit */}
      {currentStep === 3 + questionFields.length && (
        <ReviewSubmitStep
          fields={questionFields}
          answers={answers}
          totalPoints={totalPoints}
          isSubmitting={isSubmitting}
          onEdit={handleEdit}
          onSubmit={handleSubmit}
          onPrevious={handlePrevious}
        />
      )}
    </div>
  );
}
