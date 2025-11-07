import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { usePTTestEdit } from './hooks/usePTTestEdit';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

export const PTTestEditPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userProfile } = useAuth();
  const ptTestId = searchParams.get('id');
  
  const [pushUps, setPushUps] = useState('');
  const [sitUps, setSitUps] = useState('');
  const [plankTime, setPlankTime] = useState('');
  const [mileTime, setMileTime] = useState('');
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const { 
    updatePTTest, 
    deletePTTest, 
    isUpdating, 
    isDeleting, 
    parseTimeToSeconds, 
    formatSecondsToTime 
  } = usePTTestEdit();

  // Fetch PT test data
  const { data: ptTest, isLoading, error } = useQuery({
    queryKey: ['pt-test', ptTestId],
    queryFn: async () => {
      if (!ptTestId || !userProfile?.school_id) return null;

      const { data, error } = await supabase
        .from('pt_tests')
        .select(`
          id,
          cadet_id,
          date,
          push_ups,
          sit_ups,
          plank_time,
          mile_time,
          profiles:cadet_id (
            first_name,
            last_name,
            grade,
            rank
          )
        `)
        .eq('id', ptTestId)
        .eq('school_id', userProfile.school_id)
        .single();

      if (error) throw error;
      return data as PTTest;
    },
    enabled: !!ptTestId && !!userProfile?.school_id,
  });

  // Initial data for comparison
  const initialData = ptTest ? {
    pushUps: ptTest.push_ups?.toString() || '',
    sitUps: ptTest.sit_ups?.toString() || '',
    plankTime: formatSecondsToTime(ptTest.plank_time),
    mileTime: formatSecondsToTime(ptTest.mile_time),
  } : {
    pushUps: '',
    sitUps: '',
    plankTime: '',
    mileTime: '',
  };

  // Current data for comparison
  const currentData = {
    pushUps,
    sitUps,
    plankTime,
    mileTime,
  };

  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData,
    currentData,
    enabled: !!ptTest,
  });

  // Populate form when ptTest loads
  useEffect(() => {
    if (ptTest) {
      setPushUps(ptTest.push_ups?.toString() || '');
      setSitUps(ptTest.sit_ups?.toString() || '');
      setPlankTime(formatSecondsToTime(ptTest.plank_time));
      setMileTime(formatSecondsToTime(ptTest.mile_time));
      resetChanges();
    }
  }, [ptTest, resetChanges]);

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
        navigate(-1);
      }
    });
  };

  const handleDelete = () => {
    if (!ptTest) return;

    deletePTTest(ptTest.id, {
      onSuccess: () => {
        navigate(-1);
      }
    });
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigate(-1);
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    navigate(-1);
  };

  const handleCancelClose = () => {
    setShowUnsavedDialog(false);
  };

  if (!ptTestId) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">PT Test Not Found</h2>
          <p className="text-muted-foreground mt-2">No PT test ID provided.</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Back to Cadets
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading PT test...</span>
        </div>
      </div>
    );
  }

  if (error || !ptTest) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">PT Test Not Found</h2>
          <p className="text-muted-foreground mt-2">The requested PT test could not be found.</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Back to Cadets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleBack} size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit PT Test</h1>
          <p className="text-muted-foreground">
            {ptTest.profiles?.first_name} {ptTest.profiles?.last_name} - {new Date(ptTest.date).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>PT Test Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="flex items-center gap-4">
                <Label htmlFor="push-ups" className="w-24 text-right shrink-0">Push-Ups</Label>
                <Input
                  id="push-ups"
                  type="number"
                  placeholder="0"
                  min="0"
                  value={pushUps}
                  onChange={(e) => setPushUps(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-4">
                <Label htmlFor="sit-ups" className="w-24 text-right shrink-0">Sit-Ups</Label>
                <Input
                  id="sit-ups"
                  type="number"
                  placeholder="0"
                  min="0"
                  value={sitUps}
                  onChange={(e) => setSitUps(e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-center gap-4">
                  <Label htmlFor="plank-time" className="w-24 text-right shrink-0">Plank Time</Label>
                  <Input
                    id="plank-time"
                    placeholder="MM:SS or seconds"
                    value={plankTime}
                    onChange={(e) => setPlankTime(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-28">Enter as MM:SS or total seconds</p>
              </div>

              <div>
                <div className="flex items-center gap-4">
                  <Label htmlFor="mile-time" className="w-24 text-right shrink-0">Mile Time</Label>
                  <Input
                    id="mile-time"
                    placeholder="MM:SS or seconds"
                    value={mileTime}
                    onChange={(e) => setMileTime(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-28">Enter as MM:SS or total seconds</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:justify-between gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isDeleting || isUpdating} className="w-full md:w-auto">
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

            <Button variant="outline" onClick={handleBack} disabled={isUpdating || isDeleting} className="w-full md:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!hasUnsavedChanges || isUpdating || isDeleting}
              className="w-full md:w-auto"
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onCancel={handleCancelClose}
      />
    </div>
  );
};