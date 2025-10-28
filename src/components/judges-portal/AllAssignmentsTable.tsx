import { useAllJudgeAssignments } from '@/hooks/judges-portal/useAllJudgeAssignments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export const AllAssignmentsTable = () => {
  const { assignments, isLoading, error } = useAllJudgeAssignments();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Judge Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Judge Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Error loading assignments</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Judge Assignments ({assignments.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judge ID</TableHead>
                <TableHead>Competition</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No assignments found
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((assignment) => (
                  <TableRow key={assignment.assignment_id}>
                    <TableCell className="font-mono text-xs">{assignment.judge_id}</TableCell>
                    <TableCell>{assignment.competition_name}</TableCell>
                    <TableCell>{assignment.event_name || '-'}</TableCell>
                    <TableCell>{assignment.competition_start_date}</TableCell>
                    <TableCell>{assignment.competition_location}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {assignment.assignment_details || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
