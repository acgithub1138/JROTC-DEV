import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScoreButtonGrid } from './ScoreButtonGrid';
import { AudioRecordingControls } from './AudioRecordingControls';
import { MobileNavButtons } from './MobileNavButtons';
import type { JsonField } from '@/components/competition-management/components/json-field-builder/types';
import type { AudioMode, RecordingState } from '@/hooks/useAudioRecording';
import { cn } from '@/lib/utils';
import { formatPenaltyDeduction } from '@/utils/scoreCalculations';
import { ChevronDown, Plus, Minus } from 'lucide-react';

interface AllQuestionsStepProps {
  fields: JsonField[];
  answers: Record<string, any>;
  judgeNumber: string;
  onValueChange: (fieldId: string, value: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  isTransitioning?: boolean;
  audioMode: AudioMode;
  recordingState: RecordingState;
  recordingDuration: number;
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
}

export const AllQuestionsStep = ({
  fields,
  answers,
  judgeNumber,
  onValueChange,
  onNext,
  onPrevious,
  isTransitioning = false,
  audioMode,
  recordingState,
  recordingDuration,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
}: AllQuestionsStepProps) => {
  // Track which questions are expanded - default first question expanded
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(() => {
    if (fields.length > 0) {
      return new Set([fields[0].id]);
    }
    return new Set();
  });

  // Refs for each question card to enable scrolling
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const toggleQuestion = (fieldId: string) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(fieldId)) {
        next.delete(fieldId);
      } else {
        next.add(fieldId);
      }
      return next;
    });
  };

  const expandNextQuestion = (currentFieldId: string) => {
    const currentIndex = fields.findIndex(f => f.id === currentFieldId);
    if (currentIndex !== -1 && currentIndex < fields.length - 1) {
      const nextField = fields[currentIndex + 1];
      setExpandedQuestions(new Set([nextField.id]));
      
      // Scroll to show previous and current question
      setTimeout(() => {
        scrollToQuestion(nextField.id, currentIndex);
      }, 100);
    } else {
      // If this was the last question, collapse all and scroll to bottom
      setExpandedQuestions(new Set());
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  };

  const scrollToQuestion = (fieldId: string, currentIndex: number) => {
    const questionElement = questionRefs.current[fieldId];
    const container = scrollContainerRef.current;
    
    if (questionElement && container) {
      // If not first question, try to show previous question too
      if (currentIndex > 0) {
        const prevFieldId = fields[currentIndex - 1].id;
        const prevElement = questionRefs.current[prevFieldId];
        
        if (prevElement) {
          // Scroll to previous element position
          const containerTop = container.getBoundingClientRect().top;
          const prevTop = prevElement.getBoundingClientRect().top;
          const scrollOffset = prevTop - containerTop + container.scrollTop - 16; // 16px padding
          
          container.scrollTo({
            top: scrollOffset,
            behavior: 'smooth'
          });
          return;
        }
      }
      
      // Fallback: scroll to current question
      questionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToBottom = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const renderScoreInput = (field: JsonField) => {
    const localValue = answers[field.id];
    const handleValueChange = (newValue: any) => {
      onValueChange(field.id, newValue);
      
      // Auto-advance for fields that have single-tap selection
      // Don't auto-advance for text fields or numeric penalty fields that need manual input
      const shouldAutoAdvance = 
        field.type === 'number' || 
        field.type === 'dropdown' || 
        field.type === 'scoring_scale' ||
        (field.type === 'penalty' && field.penaltyType === 'minor_major') ||
        (field.type === 'penalty_checkbox' && field.penaltyType === 'minor_major') ||
        (field.type === 'penalty' && field.values && field.values.length > 0) ||
        (field.type === 'penalty_checkbox' && field.values && field.values.length > 0);
      
      if (shouldAutoAdvance) {
        // Small delay to show selection before collapsing
        setTimeout(() => {
          expandNextQuestion(field.id);
        }, 300);
      }
    };

    switch (field.type) {
      case 'label':
        return (
          <div className="space-y-4 text-center py-8">
            {field.fieldInfo && (
              <p className="text-lg text-muted-foreground whitespace-pre-wrap">{field.fieldInfo}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <ScoreButtonGrid 
            maxValue={field.maxValue || 10} 
            selectedValue={localValue} 
            onSelect={handleValueChange} 
          />
        );

      case 'dropdown':
        return (
          <div className="space-y-2">
            {field.values?.map((option) => (
              <Card
                key={option}
                onClick={() => handleValueChange(option)}
                onTouchEnd={() => handleValueChange(option)}
                className={cn(
                  'p-4 cursor-pointer transition-all touch-manipulation',
                  'hover:border-primary active:scale-[0.98]',
                  localValue === option && 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 shrink-0',
                      localValue === option ? 'border-primary bg-primary' : 'border-muted-foreground'
                    )}
                  >
                    {localValue === option && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-lg font-medium">{option}</p>
                </div>
              </Card>
            ))}
          </div>
        );

      case 'text':
        if (field.textType === 'notes') {
          return (
            <Textarea
              value={localValue || ''}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder="Enter your response..."
              className="min-h-32 text-base"
            />
          );
        }
        return (
          <Input
            type="text"
            value={localValue || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="Enter your response..."
            className="h-12 text-base"
          />
        );

      case 'penalty':
      case 'penalty_checkbox':
        if (judgeNumber !== '1') {
          return (
            <div className="text-center py-8 text-muted-foreground">
              <p>This field is only for Judge 1</p>
            </div>
          );
        }

        const penaltyDeduction = formatPenaltyDeduction(field, localValue);

        if (field.penaltyType === 'minor_major') {
          return (
            <div className="space-y-4">
              <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                <p className="text-sm font-medium text-destructive">Minor: -20 points | Major: -50 points</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Card
                  onClick={() => handleValueChange('none')}
                  onTouchEnd={() => handleValueChange('none')}
                  className={cn(
                    'p-4 cursor-pointer transition-all touch-manipulation hover:border-primary active:scale-[0.98]',
                    (!localValue || localValue === 'none') && 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 shrink-0',
                      (!localValue || localValue === 'none') ? 'border-primary bg-primary' : 'border-muted-foreground'
                    )}>
                      {(!localValue || localValue === 'none') && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-lg font-medium">None</p>
                  </div>
                </Card>
                <Card
                  onClick={() => handleValueChange('minor')}
                  onTouchEnd={() => handleValueChange('minor')}
                  className={cn(
                    'p-4 cursor-pointer transition-all touch-manipulation hover:border-primary active:scale-[0.98]',
                    localValue === 'minor' && 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 shrink-0',
                      localValue === 'minor' ? 'border-primary bg-primary' : 'border-muted-foreground'
                    )}>
                      {localValue === 'minor' && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-lg font-medium">Minor: -20</p>
                  </div>
                </Card>
                <Card
                  onClick={() => handleValueChange('major')}
                  onTouchEnd={() => handleValueChange('major')}
                  className={cn(
                    'p-4 cursor-pointer transition-all touch-manipulation hover:border-primary active:scale-[0.98]',
                    localValue === 'major' && 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 shrink-0',
                      localValue === 'major' ? 'border-primary bg-primary' : 'border-muted-foreground'
                    )}>
                      {localValue === 'major' && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-lg font-medium">Major: -50</p>
                  </div>
                </Card>
              </div>
              {penaltyDeduction !== null && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Penalty Assessed:</p>
                  <p className="text-3xl font-bold text-destructive">{penaltyDeduction} points</p>
                </div>
              )}
            </div>
          );
        }

        if (field.values && field.values.length > 0) {
          return (
            <div className="grid grid-cols-1 gap-2">
              {field.values.map((option) => (
                <Card
                  key={option}
                  onClick={() => handleValueChange(option)}
                  onTouchEnd={() => handleValueChange(option)}
                  className={cn(
                    'p-4 cursor-pointer transition-all touch-manipulation',
                    'hover:border-primary active:scale-[0.98]',
                    localValue === option && 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 shrink-0',
                        localValue === option ? 'border-primary bg-primary' : 'border-muted-foreground'
                      )}
                    >
                      {localValue === option && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-lg font-medium">{option}</p>
                  </div>
                </Card>
              ))}
            </div>
          );
        }

        const handleIncrement = () => {
          const currentValue = Number(localValue) || 0;
          handleValueChange(String(currentValue + 1));
        };

        const handleDecrement = () => {
          const currentValue = Number(localValue) || 0;
          if (currentValue > 0) {
            handleValueChange(String(currentValue - 1));
          }
        };

        return (
          <div className="space-y-4">
            {field.penaltyType === 'points' && field.pointValue && (
              <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                <p className="text-sm font-medium text-destructive">Each violation: {field.pointValue} points</p>
              </div>
            )}
            {(field.penaltyType === 'split' || (field.splitFirstValue && field.splitSubsequentValue)) && (
              <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                <p className="text-sm font-medium text-destructive">
                  1st occurrence: {field.splitFirstValue || -5} points | 2+ occurrences: {field.splitSubsequentValue || -25} points each
                </p>
              </div>
            )}
            {field.type === 'penalty_checkbox' && field.penaltyValue && (
              <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                <p className="text-sm font-medium text-destructive">Each penalty: {field.penaltyValue} points</p>
              </div>
            )}
            {!field.penaltyType && field.penaltyValue && field.type === 'penalty' && (
              <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                <p className="text-sm font-medium text-destructive">Penalty: {field.penaltyValue} points</p>
              </div>
            )}

            <div className="space-y-3">
              <Input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={localValue ?? ''}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder="Enter penalty value..."
                className="h-12 text-base w-full"
              />
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleDecrement}
                  className="h-16 text-lg font-semibold"
                >
                  <Minus className="h-6 w-6 mr-2" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleIncrement}
                  className="h-16 text-lg font-semibold"
                >
                  <Plus className="h-6 w-6 mr-2" />
                </Button>
              </div>
            </div>

            {penaltyDeduction !== null && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Penalty Assessed:</p>
                <p className="text-3xl font-bold text-destructive">{penaltyDeduction} points</p>
              </div>
            )}
          </div>
        );

      case 'scoring_scale':
        const ranges = field.scaleRanges || {
          poor: { min: 0, max: 3 },
          average: { min: 4, max: 7 },
          exceptional: { min: 8, max: 10 },
        };
        const maxScale = Math.max(ranges.exceptional.max, ranges.average.max, ranges.poor.max);
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center text-sm mb-2">
              <div>
                <div className="font-medium">Poor</div>
                <div className="text-muted-foreground">
                  {ranges.poor.min}-{ranges.poor.max}
                </div>
              </div>
              <div>
                <div className="font-medium">Average</div>
                <div className="text-muted-foreground">
                  {ranges.average.min}-{ranges.average.max}
                </div>
              </div>
              <div>
                <div className="font-medium">Exceptional</div>
                <div className="text-muted-foreground">
                  {ranges.exceptional.min}-{ranges.exceptional.max}
                </div>
              </div>
            </div>
            <ScoreButtonGrid maxValue={maxScale} selectedValue={localValue} onSelect={handleValueChange} />
          </div>
        );

      default:
        return null;
    }
  };

  const isFieldAnswered = (field: JsonField) => {
    const value = answers[field.id];
    return value !== null && value !== undefined && value !== '';
  };

  // Check if all required fields are answered
  const allRequiredAnswered = fields.every(field => {
    if (field.type === 'label') return true;
    if ((field.type === 'penalty' || field.type === 'penalty_checkbox') && judgeNumber !== '1') return true;
    return isFieldAnswered(field);
  });

  return (
    <div className="h-[calc(100dvh-4rem)] bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 shrink-0 border-b">
        <h1 className="text-2xl font-bold">Score Questions</h1>
        <p className="text-muted-foreground text-sm mt-1">Tap each question to expand and score</p>
      </div>

      {/* Questions List */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-28">
        {fields.map((field, index) => {
          const isAnswered = isFieldAnswered(field);
          const isExpanded = expandedQuestions.has(field.id);

          return (
            <Collapsible
              key={field.id}
              open={isExpanded}
              onOpenChange={() => toggleQuestion(field.id)}
            >
              <Card 
                ref={(el) => questionRefs.current[field.id] = el}
                className={cn(
                  'overflow-hidden transition-all',
                  isAnswered && 'border-primary/50 bg-primary/5'
                )}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Q{index + 1}</span>
                        <h3 className="font-semibold">{field.name}</h3>
                      </div>
                      {isAnswered && (
                        <p className="text-sm text-primary font-medium mt-1">
                          Answered: {answers[field.id]}
                        </p>
                      )}
                    </div>
                    <ChevronDown className={cn(
                      'h-5 w-5 text-muted-foreground transition-transform',
                      isExpanded && 'transform rotate-180'
                    )} />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-2 border-t space-y-4">
                    {field.fieldInfo && (
                      <p className="text-sm text-muted-foreground">{field.fieldInfo}</p>
                    )}
                    
                    {/* Scoring Input */}
                    <div className="space-y-4">
                      {renderScoreInput(field)}
                      
                      {/* Next button for penalty fields */}
                      {(field.type === 'penalty' || field.type === 'penalty_checkbox') && judgeNumber === '1' && (
                        <div className="flex justify-end pt-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              expandNextQuestion(field.id);
                            }}
                            size="lg"
                            className="min-w-[120px]"
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}

        {/* General Notes Section */}
        <Card className="p-4">
          <div className="space-y-3">
            <label className="block text-sm font-medium">Notes (Optional)</label>
            <Textarea
              value={answers['general_notes'] || ''}
              onChange={(e) => onValueChange('general_notes', e.target.value)}
              placeholder="Add general notes..."
              className="min-h-32 text-base resize-none"
            />
          </div>
        </Card>

        {/* Audio Recording Controls at bottom of list */}
        <Card className="p-4">
          <div className="flex flex-col items-center gap-4">
            <label className="text-sm font-medium">Audio Recording</label>
            <AudioRecordingControls
              mode={audioMode}
              recordingState={recordingState}
              duration={recordingDuration}
              onStart={onStartRecording}
              onPause={onPauseRecording}
              onResume={onResumeRecording}
            />
          </div>
        </Card>
      </div>

      <MobileNavButtons
        onNext={onNext}
        onPrevious={onPrevious}
        nextDisabled={!allRequiredAnswered}
        showPrevious={true}
      />
    </div>
  );
};
