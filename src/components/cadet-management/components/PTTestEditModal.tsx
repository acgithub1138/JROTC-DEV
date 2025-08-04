import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { usePTTestEdit } from '../hooks/usePTTestEdit';

interface PTTest {
  id: string;
  cadet_id: string;
  date: string;
  push_ups: number | null;
  sit_ups: number | null;
  plank_time: number | null;
  mile_time: number | null;
  profiles: {
    first_name: string;
    last_name: string;
    grade: string | null;
    rank: string | null;
  };
}

interface PTTestEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ptTest: PTTest | null;
  onSuccess?: () => void;
}

export const PTTestEditModal = ({ open, onOpenChange, ptTest, onSuccess }: PTTestEditModalProps) => {
  const [pushUps, setPushUps] = useState('');
  const [sitUps, setSitUps] = useState('');
  const [plankTime, setPlankTime] = useState('');
  const [mileTime, setMileTime] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const { 
    updatePTTest, 
    deletePTTest, 
    isUpdating, 
    isDeleting, 
    parseTimeToSeconds, 
    formatSecondsToTime 
  } = usePTTestEdit();

  // Populate form when ptTest changes
  useEffect(() => {
    if (ptTest && open) {
      setPushUps(ptTest.push_ups?.toString() || '');
      setSitUps(ptTest.sit_ups?.toString() || '');
      setPlankTime(formatSecondsToTime(ptTest.plank_time));
      setMileTime(formatSecondsToTime(ptTest.mile_time));
      setHasChanges(false);
    }
  }, [ptTest?.id, open]); // Only depend on ptTest ID and open state

  // Track changes
  useEffect(() => {
    if (!ptTest) return;
    
    const originalPushUps = ptTest.push_ups?.toString() || '';
    const originalSitUps = ptTest.sit_ups?.toString() || '';
    const originalPlankTime = formatSecondsToTime(ptTest.plank_time);
    const originalMileTime = formatSecondsToTime(ptTest.mile_time);

    const changed = pushUps !== originalPushUps || 
                   sitUps !== originalSitUps || 
                   plankTime !== originalPlankTime || 
                   mileTime !== originalMileTime;
    
    setHasChanges(changed);
  }, [pushUps, sitUps, plankTime, mileTime, ptTest?.push_ups, ptTest?.sit_ups, ptTest?.plank_time, ptTest?.mile_time]); // Don't include formatSecondsToTime

  const handleSave = async () => {
    if (!ptTest) return;

    const updateData = {
      push_ups: pushUps.trim() ? parseInt(pushUps) : null,
      sit_ups: sitUps.trim() ? parseInt(sitUps) : null,
      plank_time: parseTimeToSeconds(plankTime),
      mile_time: parseTimeToSeconds(mileTime),
    };

    updatePTTest({ id: ptTest.id, data: updateData }, {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.();
      }
    });
  };

  const handleDelete = () => {
    if (!ptTest) return;

    deletePTTest(ptTest.id, {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.();
      }
    });
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!ptTest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit PT Test</DialogTitle>
          <div className="text-sm text-muted-foreground">
            {ptTest.profiles?.first_name} {ptTest.profiles?.last_name} - {new Date(ptTest.date).toLocaleDateString()}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="push-ups">Push-Ups</Label>
            <Input
              id="push-ups"
              type="number"
              placeholder="0"
              min="0"
              value={pushUps}
              onChange={(e) => setPushUps(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sit-ups">Sit-Ups</Label>
            <Input
              id="sit-ups"
              type="number"
              placeholder="0"
              min="0"
              value={sitUps}
              onChange={(e) => setSitUps(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plank-time">Plank Time</Label>
            <Input
              id="plank-time"
              placeholder="MM:SS or seconds"
              value={plankTime}
              onChange={(e) => setPlankTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mile-time">Mile Time</Label>
            <Input
              id="mile-time"
              placeholder="MM:SS or seconds"
              value={mileTime}
              onChange={(e) => setMileTime(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={isDeleting || isUpdating}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete PT Test</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this PT test? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleClose} disabled={isUpdating || isDeleting}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || isUpdating || isDeleting}
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};