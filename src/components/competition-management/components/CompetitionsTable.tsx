import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TableActionButtons } from '@/components/ui/table-action-buttons';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { Plus } from 'lucide-react';
import { Competition } from '../types';
import { formatCompetitionDateFull } from '@/utils/dateUtils';

interface CompetitionsTableProps {
  competitions: Competition[];
  isLoading: boolean;
  onEdit: (competition: Competition) => void;
  onDelete: (id: string) => void;
  onCancel: (id: string) => void;
}

export const CompetitionsTable: React.FC<CompetitionsTableProps> = ({
  competitions,
  isLoading,
  onEdit,
  onDelete,
  onCancel
}) => {
  const { canEdit, canDelete: canDeletePermission, canCreate } = useTablePermissions('competitions');
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (competitions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No competitions found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {competitions.map((competition) => (
            <TableRow key={competition.id}>
              <TableCell className="font-medium">{competition.name}</TableCell>
              <TableCell>
                {formatCompetitionDateFull(competition.competition_date)}
              </TableCell>
              <TableCell>{competition.location || '-'}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {competition.type?.replace('_', ' ') || '-'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={competition.status === 'cancelled' ? 'destructive' : competition.status === 'completed' ? 'secondary' : 'default'}>
                  {competition.status?.replace('_', ' ').toUpperCase() || 'ACTIVE'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <TableActionButtons
                  canEdit={canEdit}
                  canDelete={canDeletePermission}
                  canCreate={canCreate}
                  canCancel={competition.status !== 'cancelled'}
                  onEdit={() => onEdit(competition)}
                  onDelete={() => onDelete(competition.id)}
                  onCancel={() => onCancel(competition.id)}
                  customActions={[
                    {
                      icon: <Plus className="w-4 h-4" />,
                      label: "Add event",
                      onClick: () => {}, // TODO: Add event handler
                      show: canCreate
                    }
                  ]}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};