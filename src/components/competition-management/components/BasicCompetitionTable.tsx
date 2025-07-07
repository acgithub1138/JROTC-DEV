import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Edit, Trash2, Plus, Eye } from 'lucide-react';

interface BasicCompetitionTableProps {
  competitions: any[];
  isLoading: boolean;
  onEdit: (competition: any) => void;
  onDelete: (id: string) => void;
  onAddEvent?: (competition: any) => void;
  onViewScoreSheets?: (competition: any) => void;
}

export const BasicCompetitionTable: React.FC<BasicCompetitionTableProps> = ({
  competitions,
  isLoading,
  onEdit,
  onDelete,
  onAddEvent,
  onViewScoreSheets
}) => {
  if (isLoading) {
    return <div className="p-4">Loading competitions...</div>;
  }

  if (competitions.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No competitions found</div>;
  }

  return (
    <TooltipProvider>
      <Card>
        <CardContent className="p-0">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Overall Placement</TableHead>
              <TableHead>Overall Armed</TableHead>
              <TableHead>Overall Unarmed</TableHead>
              <TableHead>Armed Regulation</TableHead>
              <TableHead>Armed Exhibition</TableHead>
              <TableHead>Armed Color Guard</TableHead>
              <TableHead>Armed Inspection</TableHead>
              <TableHead>Unarmed Regulation</TableHead>
              <TableHead>Unarmed Exhibition</TableHead>
              <TableHead>Unarmed Color Guard</TableHead>
              <TableHead>Unarmed Inspection</TableHead>
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
                <TableCell>{competition.overall_placement || '-'}</TableCell>
                <TableCell>{competition.overall_armed_placement || '-'}</TableCell>
                <TableCell>{competition.overall_unarmed_placement || '-'}</TableCell>
                <TableCell>{competition.armed_regulation || '-'}</TableCell>
                <TableCell>{competition.armed_exhibition || '-'}</TableCell>
                <TableCell>{competition.armed_color_guard || '-'}</TableCell>
                <TableCell>{competition.armed_inspection || '-'}</TableCell>
                <TableCell>{competition.unarmed_regulation || '-'}</TableCell>
                <TableCell>{competition.unarmed_exhibition || '-'}</TableCell>
                <TableCell>{competition.unarmed_color_guard || '-'}</TableCell>
                <TableCell>{competition.unarmed_inspection || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    {onAddEvent && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="default" size="sm" onClick={() => onAddEvent(competition)}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add Event Score Sheet</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {onViewScoreSheets && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => onViewScoreSheets(competition)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View Score Sheets</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => onEdit(competition)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit Competition</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => onDelete(competition.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete Competition</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};