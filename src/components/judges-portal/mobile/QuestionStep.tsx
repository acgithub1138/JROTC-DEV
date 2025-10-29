import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MobileNavButtons } from './MobileNavButtons';
import { ScoreButtonGrid } from './ScoreButtonGrid';
import { AudioRecordingControls } from './AudioRecordingControls';
import type { JsonField } from '@/components/competition-management/components/json-field-builder/types';
import type { AudioMode, RecordingState } from '@/hooks/useAudioRecording';
import { cn } from '@/lib/utils';
import { formatPenaltyDeduction } from '@/utils/scoreCalculations';
import { Plus, Minus } from 'lucide-react';

interface QuestionStepProps {
  field: JsonField;
  value: any;
  notes: string;
  judgeNumber: string;
  onValueChange: (value: any) => void;
  onNotesChange: (notes: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  isTransitioning?: boolean;
  currentStep?: number;
  totalSteps?: number;
  audioMode: AudioMode;
  recordingState: RecordingState;
  recordingDuration: number;
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
}
export const QuestionStep = ({
  field,
  value,
  notes,
  judgeNumber,
  onValueChange,
  onNotesChange,
  onNext,
  onPrevious,
  isTransitioning = false,
  currentStep,
  totalSteps,
  audioMode,
  recordingState,
  recordingDuration,
  onStartRecording,
  onPauseRecording,
  onResumeRecording
}: QuestionStepProps) => {
  const [localValue, setLocalValue] = useState(value);
  const [localNotes, setLocalNotes] = useState(notes);
  useEffect(() => {
    setLocalValue(value);
    setLocalNotes(notes);
  }, [value, notes, field.id]);
  const handleValueChange = (newValue: any) => {
    setLocalValue(newValue);
    onValueChange(newValue);
  };
  const handleNotesChange = (newNotes: string) => {
    setLocalNotes(newNotes);
    onNotesChange(newNotes);
  };
  const renderScoreInput = () => {
    switch (field.type) {
      case 'number':
        return <ScoreButtonGrid maxValue={field.maxValue || 10} selectedValue={localValue} onSelect={handleValueChange} />;
      case 'dropdown':
        return <div className="space-y-2">
            {field.values?.map(option => <Card key={option} onClick={() => handleValueChange(option)} className={cn("p-4 cursor-pointer transition-all touch-manipulation", "hover:border-primary", localValue === option && "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2")}>
                <div className="flex items-center gap-3">
                  <div className={cn("w-5 h-5 rounded-full border-2 shrink-0", localValue === option ? "border-primary bg-primary" : "border-muted-foreground")}>
                    {localValue === option && <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      </div>}
                  </div>
                  <p className="text-lg font-medium">{option}</p>
                </div>
              </Card>)}
          </div>;
      case 'text':
        if (field.textType === 'notes') {
          return <Textarea value={localValue || ''} onChange={e => handleValueChange(e.target.value)} placeholder="Enter your response..." className="min-h-32 text-base" />;
        }
        return <Input type="text" value={localValue || ''} onChange={e => handleValueChange(e.target.value)} placeholder="Enter your response..." className="h-12 text-base" />;
      case 'penalty':
      case 'penalty_checkbox':
        if (judgeNumber !== '1') {
          return <div className="text-center py-8 text-muted-foreground">
              <p>This field is only for Judge 1</p>
            </div>;
        }
        
        // Use shared penalty calculation utility
        const penaltyDeduction = formatPenaltyDeduction(field, localValue);
        
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
        
        return <div className="space-y-4">
            {/* Penalty Explanation */}
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
            {field.penaltyType === 'minor_major' && (
              <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                <p className="text-sm font-medium text-destructive">Minor: -20 points | Major: -50 points</p>
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
                value={localValue || ''} 
                onChange={e => handleValueChange(e.target.value)} 
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
                  Decrease
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleIncrement}
                  className="h-16 text-lg font-semibold"
                >
                  <Plus className="h-6 w-6 mr-2" />
                  Increase
                </Button>
              </div>
            </div>
            
            {penaltyDeduction !== null && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Penalty Assessed:</p>
                <p className="text-3xl font-bold text-destructive">{penaltyDeduction} points</p>
              </div>
            )}
          </div>;
      case 'scoring_scale':
        const ranges = field.scaleRanges || {
          poor: {
            min: 0,
            max: 3
          },
          average: {
            min: 4,
            max: 7
          },
          exceptional: {
            min: 8,
            max: 10
          }
        };
        const maxScale = Math.max(ranges.exceptional.max, ranges.average.max, ranges.poor.max);
        return <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center text-sm mb-2">
              <div>
                <div className="font-medium">Poor</div>
                <div className="text-muted-foreground">{ranges.poor.min}-{ranges.poor.max}</div>
              </div>
              <div>
                <div className="font-medium">Average</div>
                <div className="text-muted-foreground">{ranges.average.min}-{ranges.average.max}</div>
              </div>
              <div>
                <div className="font-medium">Exceptional</div>
                <div className="text-muted-foreground">{ranges.exceptional.min}-{ranges.exceptional.max}</div>
              </div>
            </div>
            <ScoreButtonGrid maxValue={maxScale} selectedValue={localValue} onSelect={handleValueChange} />
          </div>;
      default:
        return null;
    }
  };
  const isInputRequired = ['number', 'dropdown', 'text'].includes(field.type) || field.type === 'penalty' && judgeNumber === '1' || field.type === 'penalty_checkbox' && judgeNumber === '1' || field.type === 'scoring_scale';
  const isAnswered = localValue !== null && localValue !== undefined && localValue !== '';
  const nextDisabled = isInputRequired && !isAnswered;
  return <div className="h-[calc(100dvh-4rem)] bg-background flex flex-col overflow-hidden">
      {/* Header with Question */}
      <div className="px-4 py-4 shrink-0">
        <h1 className="text-2xl font-bold mb-2">{field.name}</h1>
        {field.fieldInfo && <p className="text-muted-foreground">{field.fieldInfo}</p>}
      </div>

      {/* Content Area - flex to fill remaining space */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden pb-28">
        {/* Score Selection Area - 2/3 of content space */}
        <div style={{
        flex: '2'
      }} className="px-4 overflow-y-auto overflow-x-hidden py-[12px]">
          {renderScoreInput()}
        </div>

        {/* Notes Area - split into 2/3 notes + 1/3 audio controls */}
        <div className="px-4 py-4 border-t bg-muted/30 flex flex-col" style={{
        flex: '0.67'
      }}>
          <label className="block text-sm font-medium mb-2 shrink-0">Notes (Optional)</label>
          <div className="flex gap-3 flex-1 min-h-0">
            <Textarea 
              value={localNotes} 
              onChange={e => handleNotesChange(e.target.value)} 
              placeholder="Add notes..." 
              className="flex-1 min-h-0 text-base resize-none" 
              style={{ flex: '2' }}
            />
            <div style={{ flex: '1' }} className="flex items-center justify-center">
              <AudioRecordingControls
                mode={audioMode}
                recordingState={recordingState}
                duration={recordingDuration}
                onStart={onStartRecording}
                onPause={onPauseRecording}
                onResume={onResumeRecording}
              />
            </div>
          </div>
        </div>
      </div>
      
      <MobileNavButtons 
        onNext={onNext} 
        onPrevious={onPrevious} 
        showPrevious 
        nextDisabled={nextDisabled || isTransitioning}
        currentStep={currentStep}
        totalSteps={totalSteps}
      />
    </div>;
};