import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Edit2 } from 'lucide-react';
import type { JsonField } from '@/components/competition-management/components/json-field-builder/types';
interface ReviewSubmitStepProps {
  fields: JsonField[];
  answers: Record<string, any>;
  totalPoints: number;
  isSubmitting: boolean;
  onEdit: (questionIndex: number) => void;
  onSubmit: () => void;
  onPrevious: () => void;
}
export const ReviewSubmitStep = ({
  fields,
  answers,
  totalPoints,
  isSubmitting,
  onEdit,
  onSubmit,
  onPrevious
}: ReviewSubmitStepProps) => {
  // Filter out non-input fields for review
  const reviewFields = fields.filter(field => !['section_header', 'label', 'pause', 'bold_gray', 'calculated'].includes(field.type));
  return <div className="min-h-screen bg-background pb-32">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Review & Submit</h1>
          <p className="text-muted-foreground">Review your answers before submitting</p>
        </div>

        {/* Total Score Card */}
        <Card className="p-6 mb-6 bg-primary/5 border-primary">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Score</p>
            <p className="text-4xl font-bold">{totalPoints}</p>
          </div>
        </Card>

        {/* Answers Review */}
        <div className="space-y-4">
          {reviewFields.map((field, index) => {
          const fieldValue = answers[field.id];
          const fieldNotes = answers[`${field.id}_notes`];
          const hasAnswer = fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
          // Calculate actual penalty deduction using field configuration
          const isPenalty = ['penalty', 'penalty_checkbox'].includes(field.type);
          const computePenaltyDeduction = () => {
            if (!isPenalty || !hasAnswer) return null;
            const num = typeof fieldValue === 'number' ? fieldValue : Number(fieldValue);

            if (field.penaltyType === 'split' && field.splitFirstValue && field.splitSubsequentValue) {
              if (isNaN(num) || num <= 0) return null;
              const total = field.splitFirstValue + Math.max(0, num - 1) * field.splitSubsequentValue;
              return -Math.abs(total);
            }

            if (field.penaltyType === 'points' && field.pointValue) {
              if (typeof fieldValue === 'boolean') return fieldValue ? -Math.abs(field.pointValue) : null;
              if (isNaN(num) || num <= 0) return null;
              return -Math.abs(field.pointValue * num);
            }

            if (field.penaltyValue) {
              if (typeof fieldValue === 'boolean') return fieldValue ? -Math.abs(field.penaltyValue) : null;
              if (!isNaN(num) && num > 0) return -Math.abs(field.penaltyValue * num);
            }
            return null;
          };
          const penaltyDeduction = computePenaltyDeduction();
          
          return <Card key={field.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium mb-1">{field.name}</p>
                    {hasAnswer ? <>
                        <div className="flex items-center justify-center gap-2">
                          <p className="text-lg font-semibold text-primary">
                            {fieldValue}
                          </p>
                          {penaltyDeduction !== null && (
                            <p className="text-lg font-semibold text-destructive">
                              ({penaltyDeduction})
                            </p>
                          )}
                        </div>
                        {fieldNotes && <p className="text-sm text-muted-foreground mt-2 italic">
                            Note: {fieldNotes}
                          </p>}
                      </> : <p className="text-muted-foreground italic">Not answered</p>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(index)} className="shrink-0">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>;
        })}
        </div>
      </div>

      {/* Fixed Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 space-y-3">
        <Button onClick={onSubmit} disabled={isSubmitting} className="w-full h-14 text-lg" size="lg">
          {isSubmitting ? "Submitting..." : "Submit Score Sheet"}
        </Button>
        <Button onClick={onPrevious} variant="outline" className="w-full h-12" disabled={isSubmitting}>
          Back to Last Question
        </Button>
      </div>
    </div>;
};