import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableActionButtons } from '@/components/ui/table-action-buttons';
import { SortableTableHead } from '@/components/ui/sortable-table';
import { useSortableTable } from '@/hooks/useSortableTable';
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

  // Custom sorting function for job board data
  const customSortFn = (a: JobBoardWithCadet, b: JobBoardWithCadet, sortConfig: any) => {
    const getJobValue = (job: JobBoardWithCadet, key: string) => {
      if (key === 'cadet_name') {
        return formatCadetName(job.cadet);
      }
      return job[key as keyof JobBoardWithCadet];
    };

    const aValue = getJobValue(a, sortConfig.key);
    const bValue = getJobValue(b, sortConfig.key);

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  };

  const { sortedData, sortConfig, handleSort } = useSortableTable({
    data: jobs,
    customSortFn
  });

  // Mobile card view
  if (isMobile) {
    return (
      <div className="space-y-4">
        {sortedData.map(job => (
          <Card key={job.id} className="w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {formatCadetName(job.cadet)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 text-sm mb-4">
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
              
              {!readOnly && (canEdit || canDelete) && (
                <div className="grid grid-cols-2 gap-2 pt-3 border-t">
                  <TableActionButtons
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onEdit={onEditJob ? () => onEditJob(job) : undefined}
                    onDelete={onDeleteJob ? () => onDeleteJob(job) : undefined}
                    readOnly={readOnly}
                    mobileFullButtons={true}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {sortedData.length === 0 && (
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
          <SortableTableHead
            sortKey="cadet_name"
            currentSort={sortConfig}
            onSort={handleSort}
          >
            Cadet
          </SortableTableHead>
          <SortableTableHead
            sortKey="role"
            currentSort={sortConfig}
            onSort={handleSort}
          >
            Role
          </SortableTableHead>
          <SortableTableHead
            sortKey="reports_to"
            currentSort={sortConfig}
            onSort={handleSort}
          >
            Reports To
          </SortableTableHead>
          <SortableTableHead
            sortKey="assistant"
            currentSort={sortConfig}
            onSort={handleSort}
          >
            Assistant To
          </SortableTableHead>
          <SortableTableHead
            sortKey="email_address"
            currentSort={sortConfig}
            onSort={handleSort}
          >
            Email
          </SortableTableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
         {sortedData.map(job => <TableRow key={job.id}>
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
        {sortedData.length === 0 && <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-2">
              No jobs found
            </TableCell>
          </TableRow>}
      </TableBody>
    </Table>;
};