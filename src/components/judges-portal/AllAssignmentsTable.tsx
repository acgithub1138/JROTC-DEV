import { useAllJudgeAssignments } from '@/hooks/judges-portal/useAllJudgeAssignments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
export const AllAssignmentsTable = () => {
  const {
    assignments,
    isLoading,
    error
  } = useAllJudgeAssignments();
  if (isLoading) {
    return <Card>
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
      </Card>;
  }
  if (error) {
    return <Card>
        <CardHeader>
          <CardTitle>All Judge Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Error loading assignments</p>
        </CardContent>
      </Card>;
  }
  return;
};