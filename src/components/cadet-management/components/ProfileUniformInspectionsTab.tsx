import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { convertToUI } from '@/utils/timezoneUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
interface ProfileUniformInspectionsTabProps {
  profileId: string;
}
interface UniformInspection {
  id: string;
  date: string;
  grade: number | null;
  notes: string | null;
}
export const ProfileUniformInspectionsTab = ({
  profileId
}: ProfileUniformInspectionsTabProps) => {
  const {
    timezone
  } = useSchoolTimezone();
  const {
    data: uniformInspections = [],
    isLoading
  } = useQuery({
    queryKey: ['profile-uniform-inspections', profileId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('uniform_inspections').select('id, date, grade, notes').eq('cadet_id', profileId).order('date', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching uniform inspections:', error);
        throw error;
      }
      return data as UniformInspection[];
    }
  });
  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'bg-gray-100 text-gray-800';
    if (grade >= 90) return 'bg-green-100 text-green-800';
    if (grade >= 80) return 'bg-blue-100 text-blue-800';
    if (grade >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  if (isLoading) {
    return <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted rounded"></div>)}
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className="h-full flex flex-col">
      
      <CardContent className="flex-1 overflow-hidden">
        {uniformInspections.length === 0 ? <div className="text-center py-8 text-muted-foreground">
            <p>No uniform inspection records found</p>
          </div> : <div className="h-full overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uniformInspections.map(inspection => <TableRow key={inspection.id}>
                    <TableCell className="py-[6px]">
                      {convertToUI(inspection.date, timezone, 'date')}
                    </TableCell>
                    <TableCell>
                      {inspection.grade !== null ? <Badge className={getGradeColor(inspection.grade)}>
                          {inspection.grade}%
                        </Badge> : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {inspection.notes || '-'}
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </div>}
      </CardContent>
    </Card>;
};