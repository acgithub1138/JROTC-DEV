import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, Trash2 } from 'lucide-react';
import { JobBoardWithCadet } from '../types';
interface JobBoardTableProps {
  jobs: JobBoardWithCadet[];
  onEditJob?: (job: JobBoardWithCadet) => void;
  onDeleteJob?: (job: JobBoardWithCadet) => void;
  readOnly?: boolean;
}
export const JobBoardTable = ({
  jobs,
  onEditJob,
  onDeleteJob,
  readOnly = false
}: JobBoardTableProps) => {
  const formatCadetName = (cadet: JobBoardWithCadet['cadet']) => {
    return `${cadet.last_name}, ${cadet.first_name}`;
  };
  return <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cadet</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Reports To</TableHead>
          <TableHead>Assistant To
        </TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map(job => <TableRow key={job.id}>
            <TableCell className="font-medium py-2">
              {formatCadetName(job.cadet)}
            </TableCell>
            <TableCell className="py-2">{job.role}</TableCell>
            <TableCell className="py-2">{job.reports_to || '-'}</TableCell>
            <TableCell className="py-2">{job.assistant || '-'}</TableCell>
            <TableCell className="text-right py-2">
              {!readOnly && (
                <div className="flex items-center justify-end gap-2">
                  {onEditJob && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => onEditJob(job)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit job</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {onDeleteJob && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => onDeleteJob(job)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete job</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              )}
            </TableCell>
          </TableRow>)}
        {jobs.length === 0 && <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-2">
              No jobs found
            </TableCell>
          </TableRow>}
      </TableBody>
    </Table>;
};