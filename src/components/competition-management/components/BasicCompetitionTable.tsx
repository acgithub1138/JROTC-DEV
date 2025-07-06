import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Plus } from 'lucide-react';

interface BasicCompetitionTableProps {
  competitions: any[];
  isLoading: boolean;
  onEdit: (competition: any) => void;
  onDelete: (id: string) => void;
  onAddEvent?: (competition: any) => void;
}

export const BasicCompetitionTable: React.FC<BasicCompetitionTableProps> = ({
  competitions,
  isLoading,
  onEdit,
  onDelete,
  onAddEvent
}) => {
  if (isLoading) {
    return <div className="p-4">Loading competitions...</div>;
  }

  if (competitions.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No competitions found</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {competitions.map((competition) => (
            <TableRow key={competition.id}>
              <TableCell className="font-medium">{competition.name}</TableCell>
              <TableCell>
                {new Date(competition.competition_date).toLocaleDateString()}
              </TableCell>
              <TableCell>{competition.location || '-'}</TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  {onAddEvent && (
                    <Button variant="default" size="sm" onClick={() => onAddEvent(competition)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Event
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => onEdit(competition)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onDelete(competition.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};