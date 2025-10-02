import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useCompetitionJudgesPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useCompetitionJudges } from '@/hooks/competition-portal/useCompetitionJudges';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { formatPhoneNumber } from '@/utils/formatUtils';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
interface CompetitionJudgesTabProps {
  competitionId: string;
}
export const CompetitionJudgesTab = ({
  competitionId
}: CompetitionJudgesTabProps) => {
  const navigate = useNavigate();
  const {
    canCreate,
    canUpdate,
    canDelete
  } = useCompetitionJudgesPermissions();
  const {
    judges,
    isLoading,
    deleteJudge
  } = useCompetitionJudges(competitionId);
  const {
    timezone
  } = useSchoolTimezone();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [judgeToDelete, setJudgeToDelete] = useState<string | null>(null);
  const handleCreateJudge = () => {
    navigate(`/app/competition-portal/competition-details/${competitionId}/judges_record`);
  };
  const handleEdit = (judgeId: string) => {
    navigate(`/app/competition-portal/competition-details/${competitionId}/judges_record`, {
      state: {
        judgeId
      }
    });
  };
  const handleDeleteClick = (judgeId: string) => {
    setJudgeToDelete(judgeId);
    setDeleteConfirmOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (judgeToDelete) {
      await deleteJudge(judgeToDelete);
      setDeleteConfirmOpen(false);
      setJudgeToDelete(null);
    }
  };
  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading judges...</div>;
  }
  return <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">
          Manage judge assignments for this competition
        </p>
        {canCreate && <Button onClick={handleCreateJudge}>
            <Plus className="h-4 w-4 mr-2" />
            Assign Judge
          </Button>}
      </div>

      {judges.length === 0 ? <div className="text-center py-8 text-muted-foreground">
          No judges assigned yet. Click "Assign Judge" to get started.
        </div> : <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judge Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Location</TableHead>
                {(canUpdate || canDelete) && <TableHead className="text-center">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {judges.map(judge => <TableRow key={judge.id}>
                  <TableCell className="font-medium">
                    {judge.judge_profile?.name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {judge.judge_profile?.phone ? formatPhoneNumber(judge.judge_profile.phone) : '-'}
                  </TableCell>
                  <TableCell>
                    {judge.start_time ? formatTimeForDisplay(judge.start_time, TIME_FORMATS.SHORT_DATETIME_24H, timezone) : '-'}
                  </TableCell>
                  <TableCell>
                    {judge.end_time ? formatTimeForDisplay(judge.end_time, TIME_FORMATS.SHORT_DATETIME_24H, timezone) : '-'}
                  </TableCell>
                  <TableCell>{judge.event_name || '-'}</TableCell>
                  <TableCell>{judge.location || '-'}</TableCell>
                  {(canUpdate || canDelete) && <TableCell className="text-right">
                      <div className="flex items-center justify-center gap-2">
                        {canUpdate && <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleEdit(judge.id)}>
                            <Edit className="h-3 w-3" />
                          </Button>}
                        {canDelete && <Button variant="outline" size="icon" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300" onClick={() => handleDeleteClick(judge.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>}
                      </div>
                    </TableCell>}
                </TableRow>)}
            </TableBody>
          </Table>
        </div>}

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this judge assignment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};