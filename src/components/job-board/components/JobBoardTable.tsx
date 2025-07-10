import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableActionButtons } from '@/components/ui/table-action-buttons';
import { useTablePermissions } from '@/hooks/useTablePermissions';
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
  const { canEdit, canDelete } = useTablePermissions('job_board');
  
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
              <TableActionButtons
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={onEditJob ? () => onEditJob(job) : undefined}
                onDelete={onDeleteJob ? () => onDeleteJob(job) : undefined}
                readOnly={readOnly}
              />
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