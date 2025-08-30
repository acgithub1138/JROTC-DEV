import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';

interface ProfileInspectionServiceTabProps {
  profileId: string;
}

interface UniformInspection {
  id: string;
  date: string;
  grade: number | null;
  notes: string | null;
}

interface CommunityServiceRecord {
  id: string;
  event: string;
  date: string;
  hours: number | null;
  notes: string | null;
  created_at: string;
}

export const ProfileInspectionServiceTab = ({ profileId }: ProfileInspectionServiceTabProps) => {
  const { timezone } = useSchoolTimezone();

  const { data: uniformInspections = [], isLoading: isLoadingInspections } = useQuery({
    queryKey: ['profile-uniform-inspections', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('uniform_inspections')
        .select('id, date, grade, notes')
        .eq('cadet_id', profileId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching uniform inspections:', error);
        throw error;
      }

      return data as UniformInspection[];
    },
  });

  const { data: communityService = [], isLoading: isLoadingService } = useQuery({
    queryKey: ['profile-community-service', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_service')
        .select('id, event, date, hours, notes, created_at')
        .eq('cadet_id', profileId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching community service:', error);
        throw error;
      }

      return data as CommunityServiceRecord[];
    },
  });

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'bg-gray-100 text-gray-800';
    if (grade >= 90) return 'bg-green-100 text-green-800';
    if (grade >= 80) return 'bg-blue-100 text-blue-800';
    if (grade >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const renderLoadingState = () => (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded"></div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoadingInspections || isLoadingService) {
    return renderLoadingState();
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Inspection & Service Records</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <Tabs defaultValue="inspections" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-6 mt-6">
            <TabsTrigger value="inspections">Uniform Inspections</TabsTrigger>
            <TabsTrigger value="service">Community Service</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden px-6 pb-6">
            <TabsContent value="inspections" className="h-full overflow-auto mt-4 p-0">
              {uniformInspections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No uniform inspection records found</p>
                </div>
              ) : (
                <div className="h-full overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uniformInspections.map((inspection) => (
                        <TableRow key={inspection.id}>
                          <TableCell>
                            {formatTimeForDisplay(
                              inspection.date,
                              TIME_FORMATS.DATE_ONLY,
                              timezone
                            )}
                          </TableCell>
                          <TableCell>
                            {inspection.grade !== null ? (
                              <Badge className={getGradeColor(inspection.grade)}>
                                {inspection.grade}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {inspection.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="service" className="h-full overflow-auto mt-4 p-0">
              {communityService.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No community service records found</p>
                </div>
              ) : (
                <div className="h-full overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {communityService.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.event}</TableCell>
                          <TableCell>
                            {formatTimeForDisplay(
                              record.date,
                              TIME_FORMATS.DATE_ONLY,
                              timezone
                            )}
                          </TableCell>
                          <TableCell>
                            {record.hours !== null ? (
                              <Badge variant="outline">
                                {record.hours}h
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {record.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};