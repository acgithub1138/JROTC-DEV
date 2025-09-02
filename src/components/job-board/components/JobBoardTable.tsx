import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableActionButtons } from '@/components/ui/table-action-buttons';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const isMobile = useIsMobile();
  
  const formatCadetName = (cadet: JobBoardWithCadet['cadet']) => {
    if (!cadet) return 'Unassigned';
    return `${cadet.last_name}, ${cadet.first_name}`;
  };

  // Mobile card view
  if (isMobile) {
    return (
      <div className="space-y-4">
        {jobs.map(job => (
          <Card key={job.id} className="w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {formatCadetName(job.cadet)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground font-medium">Role:</span>
                  <p>{job.role}</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Reports To:</span>
                  <p>{job.reports_to || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Assistant To:</span>
                  <p>{job.assistant || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Email:</span>
                  <p>{job.email_address || '-'}</p>
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                <TableActionButtons
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={onEditJob ? () => onEditJob(job) : undefined}
                  onDelete={onDeleteJob ? () => onDeleteJob(job) : undefined}
                  readOnly={readOnly}
                />
              </div>
            </CardContent>
          </Card>
        ))}
        {jobs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No jobs found
          </div>
        )}
      </div>
    );
  }

  // Desktop table view
  return <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cadet</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Reports To</TableHead>
          <TableHead>Assistant To</TableHead>
          <TableHead>Email</TableHead>
          <TableHead className="text-center">Actions</TableHead>
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
            <TableCell className="py-2">{job.email_address || '-'}</TableCell>
            <TableCell className="text-center py-2">
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
            <TableCell colSpan={6} className="text-center text-muted-foreground py-2">
              No jobs found
            </TableCell>
          </TableRow>}
      </TableBody>
    </Table>;
};