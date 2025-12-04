import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Phone, Calendar, MapPin, Clock } from 'lucide-react';
import { useCompetitionJudges } from '@/hooks/competition-portal/useCompetitionJudges';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { formatPhoneNumber } from '@/utils/formatUtils';
import { convertToUI } from '@/utils/timezoneUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';

interface JudgesAssignedViewProps {
  competitionId: string;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export const JudgesAssignedView = ({ competitionId, canCreate, canUpdate, canDelete }: JudgesAssignedViewProps) => {
  const navigate = useNavigate();
  const { judges, isLoading, deleteJudge, refetch } = useCompetitionJudges(competitionId);
  const { timezone } = useSchoolTimezone();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [judgeToDelete, setJudgeToDelete] = useState<string | null>(null);

  // Refetch data when component mounts to ensure fresh data after navigation
  useEffect(() => {
    refetch();
  }, []);

  const handleCreateJudge = () => {
    navigate(`/app/competition-portal/competition-details/${competitionId}/judges_record`);
  };

  const handleEdit = (judgeId: string) => {
    navigate(`/app/competition-portal/competition-details/${competitionId}/judges_record`, {
      state: { judgeId }
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">
          Manage judge assignments for this competition
        </p>
        {canCreate && (
          <Button onClick={handleCreateJudge} size="icon" className="md:w-auto md:px-4">
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Assign Judge</span>
          </Button>
        )}
      </div>

      {judges.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No judges assigned yet. Click "Assign Judge" to get started.
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block border rounded-lg py-[4px]">
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
                {judges.map(judge => (
                  <TableRow key={judge.id}>
                    <TableCell className="font-medium py-[4px]">
                      {judge.judge_profile?.name || 'Unknown'}
                    </TableCell>
                    <TableCell className="py-[4px]">
                      {judge.judge_profile?.phone ? formatPhoneNumber(judge.judge_profile.phone) : '-'}
                    </TableCell>
                    <TableCell className="py-[4px]">
                      {judge.start_time ? convertToUI(judge.start_time, timezone, 'datetime') : '-'}
                    </TableCell>
                    <TableCell className="py-[4px]">
                      {judge.end_time ? convertToUI(judge.end_time, timezone, 'datetime') : '-'}
                    </TableCell>
                    <TableCell className="py-[4px]">{judge.event_name || '-'}</TableCell>
                    <TableCell className="py-[4px]">{judge.location || '-'}</TableCell>
                    {(canUpdate || canDelete) && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-center gap-2 py-[4px]">
                          {canUpdate && (
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleEdit(judge.id)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button variant="outline" size="icon" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300" onClick={() => handleDeleteClick(judge.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {judges.map(judge => (
              <Card key={judge.id} className="border-primary/20 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {judge.judge_profile?.name || 'Unknown'}
                    </h3>
                  </div>

                  <div className="space-y-2 text-sm">
                    {judge.event_name && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span>{judge.event_name}</span>
                      </div>
                    )}

                    {judge.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span>{judge.location}</span>
                      </div>
                    )}

                    {judge.start_time && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>Start: {convertToUI(judge.start_time, timezone, 'datetime')}</span>
                      </div>
                    )}

                    {judge.end_time && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>End: {convertToUI(judge.end_time, timezone, 'datetime')}</span>
                      </div>
                    )}

                    {judge.judge_profile?.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4 flex-shrink-0" />
                        <span>{formatPhoneNumber(judge.judge_profile.phone)}</span>
                      </div>
                    )}
                  </div>

                  {(canUpdate || canDelete) && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      {canUpdate && (
                        <Button variant="outline" className="w-full" onClick={() => handleEdit(judge.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}
                      {canDelete && (
                        <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:border-red-300" onClick={() => handleDeleteClick(judge.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

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
    </div>
  );
};
