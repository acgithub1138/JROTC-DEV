import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface PTTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface PTTestData {
  cadetId: string;
  date: Date | undefined;
  pushUps: string;
  sitUps: string;
  plankTime: string;
  mileTime: string;
}

export const PTTestDialog = ({ open, onOpenChange, onSuccess }: PTTestDialogProps) => {
  const { userProfile } = useAuth();
  const { users: schoolUsers } = useSchoolUsers(true); // Only active users
  const [loading, setLoading] = useState(false);
  const [ptTestData, setPTTestData] = useState<PTTestData>({
    cadetId: '',
    date: undefined,
    pushUps: '',
    sitUps: '',
    plankTime: '',
    mileTime: ''
  });

  // Filter to only show cadets and command staff, sorted by last name
  const cadets = schoolUsers
    .filter(user => user.role === 'cadet' || user.role === 'command_staff')
    .sort((a, b) => a.last_name.localeCompare(b.last_name));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ptTestData.cadetId || !ptTestData.date) {
      toast({
        title: "Validation Error",
        description: "Please select a cadet and date.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('pt_tests')
        .insert({
          school_id: userProfile?.school_id,
          cadet_id: ptTestData.cadetId,
          date: format(ptTestData.date, 'yyyy-MM-dd'),
          push_ups: ptTestData.pushUps ? parseInt(ptTestData.pushUps) : null,
          sit_ups: ptTestData.sitUps ? parseInt(ptTestData.sitUps) : null,
          plank_time: ptTestData.plankTime ? parseInt(ptTestData.plankTime) : null,
          mile_time: ptTestData.mileTime ? parseInt(ptTestData.mileTime) : null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "PT test record created successfully."
      });

      // Reset form
      setPTTestData({
        cadetId: '',
        date: undefined,
        pushUps: '',
        sitUps: '',
        plankTime: '',
        mileTime: ''
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating PT test:', error);
      toast({
        title: "Error",
        description: "Failed to create PT test record. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimeInput = (seconds: string) => {
    if (!seconds) return '';
    const totalSeconds = parseInt(seconds);
    if (isNaN(totalSeconds)) return seconds;
    
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const parseTimeInput = (timeString: string) => {
    if (!timeString) return '';
    
    // If it's already in seconds, return as is
    if (!timeString.includes(':')) return timeString;
    
    const [minutes, seconds] = timeString.split(':').map(s => parseInt(s) || 0);
    return (minutes * 60 + seconds).toString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add PT Test Record</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cadet Selection */}
          <div className="space-y-2">
            <Label htmlFor="cadet">Cadet *</Label>
            <Select
              value={ptTestData.cadetId}
              onValueChange={(value) => setPTTestData(prev => ({ ...prev, cadetId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a cadet" />
              </SelectTrigger>
              <SelectContent>
                {cadets.map((cadet) => (
                  <SelectItem key={cadet.id} value={cadet.id}>
                    {cadet.last_name}, {cadet.first_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !ptTestData.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {ptTestData.date ? format(ptTestData.date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={ptTestData.date}
                  onSelect={(date) => setPTTestData(prev => ({ ...prev, date }))}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Push-ups */}
          <div className="space-y-2">
            <Label htmlFor="pushUps">Push-ups</Label>
            <Input
              id="pushUps"
              type="number"
              min="0"
              placeholder="Enter number of push-ups"
              value={ptTestData.pushUps}
              onChange={(e) => setPTTestData(prev => ({ ...prev, pushUps: e.target.value }))}
            />
          </div>

          {/* Sit-ups */}
          <div className="space-y-2">
            <Label htmlFor="sitUps">Sit-ups</Label>
            <Input
              id="sitUps"
              type="number"
              min="0"
              placeholder="Enter number of sit-ups"
              value={ptTestData.sitUps}
              onChange={(e) => setPTTestData(prev => ({ ...prev, sitUps: e.target.value }))}
            />
          </div>

          {/* Plank Time */}
          <div className="space-y-2">
            <Label htmlFor="plankTime">Plank Time (seconds)</Label>
            <Input
              id="plankTime"
              type="number"
              min="0"
              placeholder="Enter time in seconds"
              value={ptTestData.plankTime}
              onChange={(e) => setPTTestData(prev => ({ ...prev, plankTime: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">Enter time in seconds (e.g., 120 for 2 minutes)</p>
          </div>

          {/* Mile Time */}
          <div className="space-y-2">
            <Label htmlFor="mileTime">Mile Run Time (seconds)</Label>
            <Input
              id="mileTime"
              type="number"
              min="0"
              placeholder="Enter time in seconds"
              value={ptTestData.mileTime}
              onChange={(e) => setPTTestData(prev => ({ ...prev, mileTime: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">Enter time in seconds (e.g., 480 for 8:00)</p>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save PT Test'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};