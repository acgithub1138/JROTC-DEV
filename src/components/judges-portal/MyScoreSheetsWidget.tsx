import { useMyScoreSheets } from '@/hooks/judges-portal/useMyScoreSheets';
import { convertToUI } from '@/utils/timezoneUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, School, Trophy, Pencil, Trash2 } from 'lucide-react';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
export const MyScoreSheetsWidget = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sheetToDelete, setSheetToDelete] = useState<{ id: string; event_name: string } | null>(null);
  
  const {
    scoreSheets,
    isLoading,
    error
  } = useMyScoreSheets();
  const {
    timezone
  } = useSchoolTimezone();

  const deleteMutation = useMutation({
    mutationFn: async (scoreSheetId: string) => {
      const { error } = await supabase
        .from('judge_score_sheets' as any)
        .delete()
        .eq('id', scoreSheetId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['judge-score-sheets'] });
      toast({
        title: 'Score sheet deleted',
        description: 'The score sheet has been successfully deleted.',
      });
      setDeleteDialogOpen(false);
      setSheetToDelete(null);
    },
    onError: (error) => {
      toast({
        title: 'Error deleting score sheet',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDeleteClick = (sheet: { id: string; event_name: string }) => {
    setSheetToDelete(sheet);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (sheetToDelete) {
      deleteMutation.mutate(sheetToDelete.id);
    }
  };
  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle>My Score Sheets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>;
  }
  if (error) {
    return <Card>
        <CardHeader>
          <CardTitle>My Score Sheets</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Error loading score sheets: {error.message}
          </p>
        </CardContent>
      </Card>;
  }
  if (scoreSheets.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle>My Score Sheets</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No score sheets submitted yet
          </p>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <CardTitle>My Score Sheets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {scoreSheets.slice(0, 5).map(sheet => <div key={sheet.id} className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{sheet.event_name}</h3>
                  {sheet.school_name && <p className="font-semibold text-sm">{sheet.school_name}</p>}
                  <p className="text-xs text-muted-foreground">{sheet.competition_name}</p>
                </div>
                {sheet.total_points !== null && <div className="flex items-center gap-1 text-sm font-medium text-judge">
                    <Trophy className="h-3.5 w-3.5" />
                    {sheet.total_points}
                  </div>}
              </div>

              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {convertToUI(sheet.competition_start_date, timezone, 'date')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                {sheet.team_name ? <div className="text-xs">
                    <span className="font-medium">Team:</span> {sheet.team_name}
                  </div> : <div />}
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => navigate(`/app/judges-portal/edit-score-sheet?id=${sheet.id}`)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7 text-destructive hover:text-destructive" 
                    onClick={() => handleDeleteClick({ id: sheet.id, event_name: sheet.event_name })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>)}
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Score Sheet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the score sheet for <strong>{sheetToDelete?.event_name}</strong>? 
              This action cannot be undone and all scoring data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Score Sheet'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>;
};