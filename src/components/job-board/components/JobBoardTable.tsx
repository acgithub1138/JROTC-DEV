
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { JobBoardWithCadet } from '../types';

interface JobBoardTableProps {
  jobs: JobBoardWithCadet[];
  onEditJob: (job: JobBoardWithCadet) => void;
  onDeleteJob: (job: JobBoardWithCadet) => void;
}

export const JobBoardTable = ({ jobs, onEditJob, onDeleteJob }: JobBoardTableProps) => {
  const formatCadetName = (cadet: JobBoardWithCadet['cadet']) => {
    return `${cadet.last_name}, ${cadet.first_name}`;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cadet</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Reports To</TableHead>
          <TableHead>Assistant</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <TableRow key={job.id}>
            <TableCell className="font-medium">
              {formatCadetName(job.cadet)}
            </TableCell>
            <TableCell>{job.role}</TableCell>
            <TableCell>{job.reports_to || '-'}</TableCell>
            <TableCell>{job.assistant || '-'}</TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditJob(job)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteJob(job)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {jobs.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground">
              No jobs found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
