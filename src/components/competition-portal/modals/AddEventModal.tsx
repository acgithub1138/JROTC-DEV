import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { formatInSchoolTimezone } from '@/utils/timezoneUtils';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useCompetitionEventTypes } from '../../competition-management/hooks/useCompetitionEventTypes';
type CompEventInsert = Database['public']['Tables']['cp_comp_events']['Insert'];
interface AddEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionId: string;
  onEventAdded: (event: Omit<CompEventInsert, 'school_id' | 'created_by'> & {
    competition_id: string;
  }) => void;
}
export const AddEventModal: React.FC<AddEventModalProps> = ({
  open,
  onOpenChange,
  competitionId,
  onEventAdded
}) => {
  const [formData, setFormData] = useState({
    event: '',
    location: '',
    start_date: '',
    start_hour: '',
    start_minute: '',
    end_date: '',
    end_hour: '',
    end_minute: '',
    lunch_start_hour: '',
    lunch_start_minute: '',
    lunch_end_hour: '',
    lunch_end_minute: '',
    max_participants: '',
    fee: '',
    interval: '',
    notes: '',
    score_sheet: '',
    judges: [] as string[],
    resources: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [judges, setJudges] = useState<Array<{
    id: string;
    name: string;
  }>>([]);
  const [scoreSheets, setScoreSheets] = useState<Array<{
    id: string;
    template_name: string;
    jrotc_program: string;
  }>>([]);
  const {
    users: schoolUsers,
    isLoading: usersLoading
  } = useSchoolUsers(true); // Only active users
  const { timezone, isLoading: timezoneLoading } = useSchoolTimezone();
  const { eventTypes, isLoading: eventTypesLoading } = useCompetitionEventTypes();
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  
  // Track initial data for unsaved changes
  const initialFormData = {
    event: '',
    location: '',
    start_date: '',
    start_hour: '',
    start_minute: '',
    end_date: '',
    end_hour: '',
    end_minute: '',
    lunch_start_hour: '',
    lunch_start_minute: '',
    lunch_end_hour: '',
    lunch_end_minute: '',
    max_participants: '',
    fee: '',
    interval: '',
    notes: '',
    score_sheet: '',
    judges: [] as string[],
    resources: [] as string[]
  };
  
  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData: initialFormData,
    currentData: formData,
    enabled: open
  });

  useEffect(() => {
    if (open) {
      fetchJudges();
      fetchCompetitionDate();
      fetchFilteredScoreSheets();
    }
  }, [open]);

  const fetchCompetitionDate = async () => {
    try {
      const { data, error } = await supabase
        .from('cp_competitions')
        .select('start_date, end_date')
        .eq('id', competitionId)
        .single();

      if (error) throw error;

      if (data?.start_date && !timezoneLoading) {
        const startDate = formatInSchoolTimezone(data.start_date, 'yyyy-MM-dd', timezone);
        const endDate = data?.end_date ? formatInSchoolTimezone(data.end_date, 'yyyy-MM-dd', timezone) : startDate;
        
        setFormData(prev => ({
          ...prev,
          start_date: startDate,
          end_date: endDate
        }));
      }
    } catch (error) {
      console.error('Error fetching competition date:', error);
    }
  };
  const fetchJudges = async () => {
    try {
      const { data, error } = await supabase
        .from('cp_judges')
        .select('id, name')
        .eq('available', true)
        .order('name', { ascending: true });
      
      if (error) throw error;
      setJudges(data || []);
    } catch (error) {
      console.error('Error fetching judges:', error);
      toast.error('Failed to load judges');
    }
  };

  const fetchFilteredScoreSheets = async () => {
    try {
      // Get the competition's program to filter score sheets
      const { data: competitionData, error: competitionError } = await supabase
        .from('cp_competitions')
        .select('program')
        .eq('id', competitionId)
        .single();

      if (competitionError) throw competitionError;

      if (competitionData?.program) {
        const { data, error } = await supabase
          .from('competition_templates')
          .select('id, template_name, jrotc_program')
          .eq('is_active', true)
          .eq('jrotc_program', competitionData.program)
          .order('template_name', { ascending: true });
        
        if (error) throw error;
        setScoreSheets(data || []);
      } else {
        setScoreSheets([]);
      }
    } catch (error) {
      console.error('Error fetching filtered score sheets:', error);
      toast.error('Failed to load score sheets');
    }
  };
  const addJudge = (judgeId: string) => {
    if (!formData.judges.includes(judgeId)) {
      setFormData(prev => ({
        ...prev,
        judges: [...prev.judges, judgeId]
      }));
    }
  };
  const removeJudge = (judgeId: string) => {
    setFormData(prev => ({
      ...prev,
      judges: prev.judges.filter(id => id !== judgeId)
    }));
  };
  const addResource = (resourceId: string) => {
    if (!formData.resources.includes(resourceId)) {
      setFormData(prev => ({
        ...prev,
        resources: [...prev.resources, resourceId]
      }));
    }
  };
  const removeResource = (resourceId: string) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.filter(id => id !== resourceId)
    }));
  };
  const getSelectedJudges = () => {
    return judges.filter(judge => formData.judges.includes(judge.id));
  };
  const getAvailableJudges = () => {
    return judges.filter(judge => !formData.judges.includes(judge.id));
  };
  const getSelectedResources = () => {
    return schoolUsers.filter(user => formData.resources.includes(user.id));
  };
  const getAvailableResources = () => {
    return schoolUsers
      .filter(user => !formData.resources.includes(user.id))
      .sort((a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name));
  };
  const combineDateTime = (date: string, hour: string, minute: string): string | null => {
    if (!date || !hour || !minute) return null;
    return `${date}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
  };

  // Calculate max participants when interval is set
  useEffect(() => {
    if (formData.interval && 
        formData.start_date && formData.start_hour && formData.start_minute &&
        formData.end_hour && formData.end_minute) {
      
      const startTime = new Date(`${formData.start_date}T${formData.start_hour.padStart(2, '0')}:${formData.start_minute.padStart(2, '0')}:00`);
      const endTime = new Date(`${formData.start_date}T${formData.end_hour.padStart(2, '0')}:${formData.end_minute.padStart(2, '0')}:00`);
      
      let totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      
      // Subtract lunch break if defined
      if (formData.lunch_start_hour && formData.lunch_start_minute && 
          formData.lunch_end_hour && formData.lunch_end_minute) {
        const lunchStart = new Date(`${formData.start_date}T${formData.lunch_start_hour.padStart(2, '0')}:${formData.lunch_start_minute.padStart(2, '0')}:00`);
        const lunchEnd = new Date(`${formData.start_date}T${formData.lunch_end_hour.padStart(2, '0')}:${formData.lunch_end_minute.padStart(2, '0')}:00`);
        const lunchMinutes = (lunchEnd.getTime() - lunchStart.getTime()) / (1000 * 60);
        totalMinutes -= lunchMinutes;
      }
      
      const interval = parseInt(formData.interval);
      if (interval > 0 && totalMinutes > 0) {
        const maxParticipants = Math.floor(totalMinutes / interval);
        setFormData(prev => ({
          ...prev,
          max_participants: maxParticipants.toString()
        }));
      }
    }
  }, [formData.interval, formData.start_date, formData.start_hour, formData.start_minute, 
      formData.end_hour, formData.end_minute, formData.lunch_start_hour, formData.lunch_start_minute,
      formData.lunch_end_hour, formData.lunch_end_minute]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.event) {
      toast.error('Please select an event');
      return;
    }
    setIsLoading(true);
    try {
      const start_time = combineDateTime(formData.start_date, formData.start_hour, formData.start_minute);
      const end_time = combineDateTime(formData.end_date, formData.end_hour, formData.end_minute);
      
      // Create lunch times using the event's start date
      const lunch_start_time = formData.lunch_start_hour && formData.lunch_start_minute && formData.start_date
        ? `${formData.start_date}T${formData.lunch_start_hour.padStart(2, '0')}:${formData.lunch_start_minute.padStart(2, '0')}:00`
        : null;
        
      const lunch_end_time = formData.lunch_end_hour && formData.lunch_end_minute && formData.start_date
        ? `${formData.start_date}T${formData.lunch_end_hour.padStart(2, '0')}:${formData.lunch_end_minute.padStart(2, '0')}:00`
        : null;

      const eventData: any = {
        competition_id: competitionId,
        event: formData.event,
        location: formData.location || null,
        start_time: start_time || null,
        end_time: end_time || null,
        lunch_start_time: lunch_start_time,
        lunch_end_time: lunch_end_time,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        fee: formData.fee ? parseFloat(formData.fee) : null,
        interval: formData.interval ? parseInt(formData.interval) : null,
        notes: formData.notes || null,
        score_sheet: formData.score_sheet || null,
        judges: formData.judges,
        resources: formData.resources
      };
      await onEventAdded(eventData);
      resetChanges();
      onOpenChange(false);
      setFormData({
        event: '',
        location: '',
        start_date: '',
        start_hour: '',
        start_minute: '',
        end_date: '',
        end_hour: '',
        end_minute: '',
        lunch_start_hour: '',
        lunch_start_minute: '',
        lunch_end_hour: '',
        lunch_end_minute: '',
        max_participants: '',
        fee: '',
        interval: '',
        notes: '',
        score_sheet: '',
        judges: [],
        resources: []
      });
    } catch (error) {
      console.error('Error adding event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges && !isLoading) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    onOpenChange(false);
  };

  const handleCancelDiscard = () => {
    setShowUnsavedDialog(false);
  };
  return <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Competition Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="event">Event *</Label>
            <Select value={formData.event} onValueChange={value => setFormData(prev => ({
            ...prev,
            event: value
          }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(eventType => (
                    <SelectItem key={eventType.id} value={eventType.id}>
                      {eventType.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={formData.location} onChange={e => setFormData(prev => ({
            ...prev,
            location: e.target.value
          }))} placeholder="Event location" />
          </div>

          <div className="space-y-4">
            <div>
              <Label>Start Date & Time *</Label>
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-2">
                  <Input 
                    id="start_date" 
                    type="date" 
                    value={formData.start_date} 
                    onChange={e => {
                      setFormData(prev => ({
                        ...prev,
                        start_date: e.target.value
                      }));
                      // Auto-set end date if not set
                      if (e.target.value && !formData.end_date) {
                        setFormData(prev => ({
                          ...prev,
                          end_date: e.target.value
                        }));
                      }
                    }} 
                    required 
                  />
                </div>
                <div>
                  <Select value={formData.start_hour} onValueChange={value => {
                    setFormData(prev => ({
                      ...prev,
                      start_hour: value
                    }));
                    // Auto-set end hour if not set
                    if (value && !formData.end_hour) {
                      const nextHour = (parseInt(value) + 1).toString().padStart(2, '0');
                      setFormData(prev => ({
                        ...prev,
                        end_hour: nextHour > '23' ? '23' : nextHour
                      }));
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                          {i.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={formData.start_minute} onValueChange={value => {
                    setFormData(prev => ({
                      ...prev,
                      start_minute: value
                    }));
                    // Auto-set end minute if not set
                    if (value && !formData.end_minute) {
                      setFormData(prev => ({
                        ...prev,
                        end_minute: value
                      }));
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      {['00', '10', '20', '30', '40', '50'].map((minute) => (
                        <SelectItem key={minute} value={minute}>
                          {minute}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label>End Date & Time</Label>
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-2">
                  <Input 
                    id="end_date" 
                    type="date" 
                    value={formData.end_date} 
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      end_date: e.target.value
                    }))} 
                  />
                </div>
                <div>
                  <Select value={formData.end_hour} onValueChange={value => setFormData(prev => ({
                    ...prev,
                    end_hour: value
                  }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                          {i.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={formData.end_minute} onValueChange={value => setFormData(prev => ({
                    ...prev,
                    end_minute: value
                  }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      {['00', '10', '20', '30', '40', '50'].map((minute) => (
                        <SelectItem key={minute} value={minute}>
                          {minute}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label>Judge Lunch Break</Label>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label className="text-xs">Start Hour</Label>
                <Select 
                  value={formData.lunch_start_hour} 
                  onValueChange={(value) => {
                    const endHour = (parseInt(value) + 1) % 24;
                    setFormData(prev => ({ 
                      ...prev, 
                      lunch_start_hour: value,
                      lunch_end_hour: endHour.toString().padStart(2, '0')
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                        {i.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Start Min</Label>
                <Select 
                  value={formData.lunch_start_minute} 
                  onValueChange={(value) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      lunch_start_minute: value,
                      lunch_end_minute: value
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Min" />
                  </SelectTrigger>
                  <SelectContent>
                    {['00', '10', '20', '30', '40', '50'].map((minute) => (
                      <SelectItem key={minute} value={minute}>
                        {minute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">End Hour</Label>
                <Select 
                  value={formData.lunch_end_hour} 
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, lunch_end_hour: value }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                        {i.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">End Min</Label>
                <Select 
                  value={formData.lunch_end_minute} 
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, lunch_end_minute: value }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Min" />
                  </SelectTrigger>
                  <SelectContent>
                    {['00', '10', '20', '30', '40', '50'].map((minute) => (
                      <SelectItem key={minute} value={minute}>
                        {minute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              This time period will be blocked from school scheduling
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="interval">Interval (minutes)</Label>
              <Input id="interval" type="number" min="0" value={formData.interval} onChange={e => setFormData(prev => ({
              ...prev,
              interval: e.target.value
            }))} placeholder="0" />
            </div>
            <div>
              <Label htmlFor="max_participants">Max Participants</Label>
              <Input id="max_participants" type="number" min="1" value={formData.max_participants} onChange={e => setFormData(prev => ({
              ...prev,
              max_participants: e.target.value
            }))} placeholder="Maximum number of participants" />
            </div>
            <div>
              <Label htmlFor="fee">Event Fee</Label>
              <Input id="fee" type="number" step="0.01" min="0" value={formData.fee} onChange={e => setFormData(prev => ({
              ...prev,
              fee: e.target.value
            }))} placeholder="0.00" />
            </div>
          </div>

          <div>
            <Label>Judges</Label>
            <div className="space-y-2">
              <Select onValueChange={addJudge}>
                <SelectTrigger>
                  <SelectValue placeholder="Add judges" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableJudges().map(judge => <SelectItem key={judge.id} value={judge.id}>
                      {judge.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
              
              {getSelectedJudges().length > 0 && <div className="flex flex-wrap gap-2 mt-2">
                  {getSelectedJudges().map(judge => <Badge key={judge.id} variant="secondary" className="flex items-center gap-1">
                      {judge.name}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeJudge(judge.id)} />
                    </Badge>)}
                </div>}
            </div>
          </div>

          <div>
            <Label>Resources</Label>
            <div className="space-y-2">
              <Select onValueChange={addResource}>
                <SelectTrigger>
                  <SelectValue placeholder="Add resources" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableResources().map(user => <SelectItem key={user.id} value={user.id}>
                      {user.last_name}, {user.first_name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
              
              {getSelectedResources().length > 0 && <div className="flex flex-wrap gap-2 mt-2">
                  {getSelectedResources().map(user => <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                      {user.last_name}, {user.first_name}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeResource(user.id)} />
                    </Badge>)}
                </div>}
            </div>
          </div>

          <div>
            <Label htmlFor="score_sheet">Score Sheet Template</Label>
            <Select value={formData.score_sheet} onValueChange={value => setFormData(prev => ({
              ...prev,
              score_sheet: value
            }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a score sheet template" />
              </SelectTrigger>
              <SelectContent>
                {scoreSheets.map(sheet => (
                  <SelectItem key={sheet.id} value={sheet.id}>
                    {sheet.template_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={formData.notes} onChange={e => setFormData(prev => ({
            ...prev,
            notes: e.target.value
          }))} placeholder="Additional notes for this event" rows={3} />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <UnsavedChangesDialog
      open={showUnsavedDialog}
      onOpenChange={setShowUnsavedDialog}
      onDiscard={handleDiscardChanges}
      onCancel={handleCancelDiscard}
    />
  </>;
};