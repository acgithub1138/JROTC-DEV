import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { RecurrenceRule, formatRecurrenceDescription } from '@/utils/recurrence';

interface RecurrenceSettingsProps {
  isRecurring: boolean;
  onRecurringChange: (recurring: boolean) => void;
  recurrenceRule: RecurrenceRule;
  onRecurrenceRuleChange: (rule: RecurrenceRule) => void;
  eventStartDate?: string; // Event start date to use as default for end date picker
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
];

export const RecurrenceSettings: React.FC<RecurrenceSettingsProps> = ({
  isRecurring,
  onRecurringChange,
  recurrenceRule,
  onRecurrenceRuleChange,
  eventStartDate,
}) => {
  const updateRule = (updates: Partial<RecurrenceRule>) => {
    onRecurrenceRuleChange({ ...recurrenceRule, ...updates });
  };

  const handleDayOfWeekChange = (day: number, checked: boolean) => {
    const daysOfWeek = recurrenceRule.daysOfWeek || [];
    if (checked) {
      updateRule({ daysOfWeek: [...daysOfWeek, day].sort() });
    } else {
      updateRule({ daysOfWeek: daysOfWeek.filter(d => d !== day) });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="recurring"
          checked={isRecurring}
          onCheckedChange={onRecurringChange}
        />
        <Label htmlFor="recurring">Repeat Event</Label>
      </div>

      {isRecurring && (
        <div className="space-y-4 pl-6 border-l-2 border-muted">
          {/* Frequency Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Repeat</Label>
              <Select 
                value={recurrenceRule.frequency} 
                onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                  updateRule({ frequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Every</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="1"
                  value={recurrenceRule.interval}
                  onChange={(e) => updateRule({ interval: parseInt(e.target.value) || 1 })}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">
                  {recurrenceRule.frequency === 'daily' && (recurrenceRule.interval === 1 ? 'day' : 'days')}
                  {recurrenceRule.frequency === 'weekly' && (recurrenceRule.interval === 1 ? 'week' : 'weeks')}
                  {recurrenceRule.frequency === 'monthly' && (recurrenceRule.interval === 1 ? 'month' : 'months')}
                </span>
              </div>
            </div>
          </div>

          {/* Weekly - Days of Week */}
          {recurrenceRule.frequency === 'weekly' && (
            <div className="space-y-2">
              <Label>Repeat on</Label>
              <div className="flex space-x-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.value} className="flex items-center space-x-1">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={recurrenceRule.daysOfWeek?.includes(day.value) || false}
                      onCheckedChange={(checked) => 
                        handleDayOfWeekChange(day.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={`day-${day.value}`} className="text-sm">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* End Condition */}
          <div className="space-y-2">
            <Label>Ends</Label>
            <Select 
              value={recurrenceRule.endType} 
              onValueChange={(value: 'date' | 'count' | 'never') => 
                updateRule({ endType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="date">On date</SelectItem>
                <SelectItem value="count">After number of occurrences</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* End Date */}
          {recurrenceRule.endType === 'date' && (
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !recurrenceRule.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {recurrenceRule.endDate 
                      ? format(new Date(recurrenceRule.endDate), "PPP")
                      : "Pick an end date"
                    }
                  </Button>
                </PopoverTrigger>
                 <PopoverContent className="w-auto p-0" align="start">
                   <Calendar
                     mode="single"
                     selected={recurrenceRule.endDate ? new Date(recurrenceRule.endDate) : undefined}
                     onSelect={(date) => updateRule({ endDate: date?.toISOString() })}
                     initialFocus
                     className="pointer-events-auto h-[350px]"
                     defaultMonth={recurrenceRule.endDate 
                       ? new Date(recurrenceRule.endDate) 
                       : eventStartDate 
                         ? new Date(eventStartDate)
                         : undefined
                     }
                   />
                 </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Occurrence Count */}
          {recurrenceRule.endType === 'count' && (
            <div className="space-y-2">
              <Label>Number of occurrences</Label>
              <Input
                type="number"
                min="1"
                value={recurrenceRule.occurrenceCount || ''}
                onChange={(e) => updateRule({ occurrenceCount: parseInt(e.target.value) || undefined })}
                placeholder="Enter number of occurrences"
              />
            </div>
          )}

          {/* Preview */}
          <div className="p-3 bg-muted rounded-md">
            <Label className="text-sm font-medium">Summary</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {formatRecurrenceDescription(recurrenceRule)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};