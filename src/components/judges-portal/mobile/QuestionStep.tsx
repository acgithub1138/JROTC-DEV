import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MobileNavButtons } from './MobileNavButtons';
import { ScoreButtonGrid } from './ScoreButtonGrid';
import type { JsonField } from '@/components/competition-management/components/json-field-builder/types';
import { cn } from '@/lib/utils';
interface QuestionStepProps {
  field: JsonField;
  value: any;
  notes: string;
  judgeNumber: string;
  onValueChange: (value: any) => void;
  onNotesChange: (notes: string) => void;
  onNext: () => void;
  onPrevious: () => void;
}
export const QuestionStep = ({
  field,
  value,
  notes,
  judgeNumber,
  onValueChange,
  onNotesChange,
  onNext,
  onPrevious
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
        return <Input type="number" value={localValue || ''} onChange={e => handleValueChange(e.target.value)} placeholder="Enter penalty value..." className="h-12 text-base" />;
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
  return <div className="min-h-screen bg-background flex flex-col pb-24">
      <div className="flex-1 flex flex-col">
        {/* Score Selection Area - Top 2/3 */}
        <div className="flex-[2] p-6 overflow-y-auto py-[8px]">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">{field.name}</h1>
            {field.fieldInfo && <p className="text-muted-foreground">{field.fieldInfo}</p>}
          </div>
          
          {renderScoreInput()}
        </div>

        {/* Notes Area - Bottom 1/3 */}
        <div className="flex-1 p-6 border-t bg-muted/30 py-[8px]">
          <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
          <Textarea value={localNotes} onChange={e => handleNotesChange(e.target.value)} placeholder="Add notes..." className="h-24 text-base" />
        </div>
      </div>
      
      <MobileNavButtons onNext={onNext} onPrevious={onPrevious} showPrevious nextDisabled={nextDisabled} />
    </div>;
};