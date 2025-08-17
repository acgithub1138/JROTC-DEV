import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableActionButtons } from '@/components/ui/table-action-buttons';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import type { CompetitionEvent } from './types';
import { getFieldNames, getCleanFieldName, calculateFieldAverage, calculateTotalAverage } from './utils/fieldHelpers';
import { EditScoreSheetDialog } from './EditScoreSheetDialog';
import { DeleteScoreSheetDialog } from './DeleteScoreSheetDialog';
import { NotesViewDialog } from './NotesViewDialog';
import { useCompetitionEvents } from '../../hooks/useCompetitionEvents';
import { useCompetitionPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useCompetitionTemplates } from '../../hooks/useCompetitionTemplates';
import { toast } from 'sonner';

interface ScoreSheetTableProps {
  events: CompetitionEvent[];
  onEventsRefresh?: () => void;
}

export const ScoreSheetTable: React.FC<ScoreSheetTableProps> = ({ events, onEventsRefresh }) => {
  const [selectedEvent, setSelectedEvent] = useState<CompetitionEvent | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    event: CompetitionEvent | null;
    isDeleting: boolean;
  }>({ open: false, event: null, isDeleting: false });
  const [notesDialog, setNotesDialog] = useState<{
    open: boolean;
    fieldName: string;
    notes: string;
    judgeNumber?: string;
  }>({ open: false, fieldName: '', notes: '', judgeNumber: '' });
  const { canViewDetails, canUpdate, canDelete } = useCompetitionPermissions();
  const competitionId = (events[0] as any)?.competition_id; // Get from first event
  const { deleteEvent } = useCompetitionEvents(competitionId);
  const { templates } = useCompetitionTemplates();
  const fieldNames = getFieldNames(events, templates);

  // Function to get max value for a field
  const getFieldMaxValue = (fieldName: string): string => {
    // Get template from the first event (assuming all events use the same template)
    const firstEvent = events[0];
    if (!firstEvent?.score_sheet?.template_id) return '-';
    
    const template = templates.find(t => t.id === firstEvent.score_sheet.template_id);
    if (!template?.scores) return '-';
    
    // Parse the scores JSON data safely
    let scoresData: any;
    try {
      scoresData = typeof template.scores === 'string' ? JSON.parse(template.scores) : template.scores;
    } catch {
      return '-';
    }
    
    if (!scoresData?.criteria || !Array.isArray(scoresData.criteria)) return '-';
    
    // Find the matching field in template criteria
    const templateField = scoresData.criteria.find((field: any) => {
      const templateFieldId = field.id || `field_${field.name}`;
      return fieldName.includes(templateFieldId) || fieldName.includes(field.name?.replace(/\s+/g, '_').toLowerCase());
    });
    
    return templateField?.maxValue ? String(templateField.maxValue) : '-';
  };

  // Function to get judge column color classes
  const getJudgeColorClasses = (index: number) => {
    const judgeColorMap = [
      'bg-judge-1 text-judge-1-foreground',
      'bg-judge-2 text-judge-2-foreground',
      'bg-judge-3 text-judge-3-foreground',
      'bg-judge-4 text-judge-4-foreground',
      'bg-judge-5 text-judge-5-foreground',
    ];
    return judgeColorMap[index % judgeColorMap.length] || 'bg-muted text-muted-foreground';
  };

  const handleEditScoreSheet = (event: CompetitionEvent) => {
    setSelectedEvent(event);
    setIsEditDialogOpen(true);
  };

  const handleEventUpdated = () => {
    onEventsRefresh?.();
  };

  const handleDeleteEvent = (event: CompetitionEvent) => {
    setDeleteDialog({
      open: true,
      event,
      isDeleting: false
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.event) return;

    setDeleteDialog(prev => ({ ...prev, isDeleting: true }));
    
    try {
      await deleteEvent(deleteDialog.event.id);
      onEventsRefresh?.();
      setDeleteDialog({ open: false, event: null, isDeleting: false });
      toast.success('Score sheet deleted successfully');
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error('Failed to delete score sheet');
      setDeleteDialog(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // Function to check if a field value is a notes field (long text)
  const isNotesField = (value: any, fieldName: string): boolean => {
    if (typeof value !== 'string') return false;
    // Check if it's likely a notes field based on length or field name
    return value.length > 75 || fieldName.toLowerCase().includes('note');
  };

  // Function to handle viewing notes
  const handleViewNotes = (fieldName: string, notes: string, judgeNumber?: string) => {
    setNotesDialog({
      open: true,
      fieldName: getCleanFieldName(fieldName),
      notes,
      judgeNumber
    });
  };

  // Get unique cadets from events - Display as Last, First
  const uniqueCadets = events.reduce((acc, event) => {
    if (event.profiles && Array.isArray(event.profiles)) {
      event.profiles.forEach(profile => {
        const fullName = `${profile.last_name}, ${profile.first_name}`;
        if (!acc.includes(fullName)) {
          acc.push(fullName);
        }
      });
    }
    return acc;
  }, [] as string[]);

  // Sort cadets A-Z by last name
  uniqueCadets.sort();

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No score sheets found for this event
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {uniqueCadets.length > 0 && (
        <div className="rounded-md border p-4 bg-muted/30">
          <div className="text-sm font-medium text-foreground mb-2">Cadets:</div>
          <div className="text-sm text-muted-foreground">
            {uniqueCadets.join(', ')}
          </div>
        </div>
      )}
      
      <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center bg-muted/30 px-2 min-w-32">Field</TableHead>
            <TableHead className="text-center bg-muted/30 px-2 min-w-16">Max</TableHead>
             {events.map((event, index) => (
                <TableHead key={event.id} className={`text-center border-r px-2 min-w-24 ${getJudgeColorClasses(index)}`}>
                  <div className="space-y-1">
                    <TableActionButtons
                      canView={canViewDetails}
                      canEdit={canUpdate}
                      canDelete={canDelete}
                      onEdit={() => handleEditScoreSheet(event)}
                      onDelete={() => handleDeleteEvent(event)}
                    />
                    <div className="font-medium text-xs">
                      {event.score_sheet?.judge_number || `Judge ${index + 1}`}
                    </div>
                  </div>
                </TableHead>
              ))}
            <TableHead className="text-center bg-muted/30 px-2 min-w-20">
              <div className="font-medium text-sm">Average</div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fieldNames.map((fieldName) => {
            const average = calculateFieldAverage(events, fieldName);

            return (
              <TableRow key={fieldName}>
                <TableCell className="sticky left-0 bg-background font-medium border-r px-2 text-sm">
                  {getCleanFieldName(fieldName)}
                </TableCell>
                <TableCell className="text-center bg-muted/30 font-medium border-r px-2 text-sm">
                  {getFieldMaxValue(fieldName)}
                </TableCell>
                 {events.map((event, eventIndex) => {
                   const value = event.score_sheet?.scores?.[fieldName];
                   const judgeNumber = event.score_sheet?.judge_number || `Judge ${eventIndex + 1}`;
                   
                   return (
                     <TableCell key={event.id} className={`text-center border-r px-1 text-sm ${getJudgeColorClasses(eventIndex)}`}>
                       {(() => {
                         if (value === null || value === undefined) return '-';
                         if (typeof value === 'object') return JSON.stringify(value);
                         
                         const stringValue = String(value);
                         
                         // Check if this is a notes field
                         if (isNotesField(stringValue, fieldName)) {
                           return (
                             <Button
                               variant="outline"
                               size="sm"
                               className="h-6 px-2 text-xs"
                               onClick={() => handleViewNotes(fieldName, stringValue, judgeNumber)}
                             >
                               <Eye className="w-3 h-3 mr-1" />
                               VIEW
                             </Button>
                           );
                         }
                         
                         return stringValue;
                       })()}
                     </TableCell>
                   );
                 })}
                <TableCell className="text-center font-medium bg-muted/30 px-1 text-sm">
                  {average}
                </TableCell>
              </TableRow>
            );
          })}
          
          {/* Total Points Row */}
          <TableRow className="bg-muted/50">
            <TableCell className="sticky left-0 bg-muted/50 font-bold border-r px-2 text-sm">
              Total Points
            </TableCell>
            <TableCell className="text-center bg-muted/50 font-bold border-r px-2 text-sm">
              -
            </TableCell>
             {events.map((event, eventIndex) => (
                <TableCell key={event.id} className={`text-center font-bold border-r px-1 text-sm ${getJudgeColorClasses(eventIndex)}`}>
                  {event.total_points || 0}
                </TableCell>
              ))}
            <TableCell className="text-center font-bold bg-muted/50 px-1 text-sm">
              {calculateTotalAverage(events)}
            </TableCell>
          </TableRow>
          
          {/* Grand Total Row */}
          <TableRow className="bg-primary/10 border-t-2">
            <TableCell className="sticky left-0 bg-primary/10 font-bold border-r text-primary px-2 text-sm">
              Grand Total
            </TableCell>
            <TableCell className="text-center font-bold text-primary px-1 text-sm" colSpan={events.length + 2}>
              {events.reduce((sum, event) => sum + (event.total_points || 0), 0)} points
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      </div>

      {canUpdate && (
        <EditScoreSheetDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          event={selectedEvent}
          onEventUpdated={handleEventUpdated}
        />
      )}

      <DeleteScoreSheetDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
        event={deleteDialog.event}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteDialog.isDeleting}
      />

      <NotesViewDialog
        open={notesDialog.open}
        onOpenChange={(open) => setNotesDialog(prev => ({ ...prev, open }))}
        fieldName={notesDialog.fieldName}
        notes={notesDialog.notes}
        judgeNumber={notesDialog.judgeNumber}
      />
    </div>
  );
};