import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CalendarIcon, Plus, Search, ArrowUpDown, Edit, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { useSortableTable } from '@/hooks/useSortableTable';
import { useDebounce } from 'use-debounce';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { convertToUI } from '@/utils/timezoneUtils';
import { usePTTestEdit } from '../hooks/usePTTestEdit';
import { useIsMobile } from '@/hooks/use-mobile';
interface PTTestsTabProps {
  onOpenBulkDialog: () => void;
  searchTerm?: string;
  selectedDate?: Date;
}
interface PTTest {
  id: string;
  cadet_id: string;
  date: string;
  push_ups: number | null;
  sit_ups: number | null;
  plank_time: number | null;
  mile_time: number | null;
  profiles: {
    first_name: string;
    last_name: string;
    grade: string | null;
    rank: string | null;
  };
}
export const PTTestsTab = ({
  onOpenBulkDialog,
  searchTerm: externalSearchTerm = '',
  selectedDate
}: PTTestsTabProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const {
    userProfile
  } = useAuth();
  const {
    canView,
    canViewDetails,
    canEdit: canUpdate,
    canDelete,
    canCreate
  } = useTablePermissions('pt_tests');
  const {
    timezone
  } = useSchoolTimezone();
  const searchTerm = externalSearchTerm;
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const {
    deletePTTest,
    isDeleting
  } = usePTTestEdit();
  const {
    data: ptTests = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['pt-tests', userProfile?.school_id, selectedDate, debouncedSearchTerm],
    queryFn: async () => {
      if (!userProfile?.school_id) return [];
      let query = supabase.from('pt_tests').select(`
          id,
          cadet_id,
          date,
          push_ups,
          sit_ups,
          plank_time,
          mile_time,
          profiles!inner (
            first_name,
            last_name,
            grade,
            rank
          )
        `).eq('school_id', userProfile.school_id).order('date', {
        ascending: false
      });
      if (selectedDate) {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        query = query.eq('date', dateStr);
      }
      const {
        data,
        error
      } = await query;
      if (error) throw error;

      // Filter by search term if provided
      if (debouncedSearchTerm) {
        return data.filter((test: PTTest) => `${test.profiles.first_name} ${test.profiles.last_name}`.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
      }
      return data;
    },
    enabled: !!userProfile?.school_id
  });

  // Apply immediate client-side filtering for smooth UX
  const filteredPTTests = React.useMemo(() => {
    if (!searchTerm) return ptTests;
    return ptTests.filter((test: PTTest) => `${test.profiles.first_name} ${test.profiles.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [ptTests, searchTerm]);
  const formatTime = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const handleDelete = (ptTest: PTTest) => {
    deletePTTest(ptTest.id, {
      onSuccess: () => {
        refetch();
      }
    });
  };

  // Use sortable table hook with filtered data
  const {
    sortedData,
    sortConfig,
    handleSort
  } = useSortableTable({
    data: filteredPTTests,
    defaultSort: {
      key: 'date',
      direction: 'desc'
    },
    customSortFn: (a, b, sortConfig) => {
      const aValue = sortConfig.key === 'cadet_name' ? `${a.profiles.last_name}, ${a.profiles.first_name}` : sortConfig.key === 'profiles.grade' ? a.profiles.grade || '' : sortConfig.key === 'profiles.rank' ? a.profiles.rank || '' : a[sortConfig.key as keyof PTTest];
      const bValue = sortConfig.key === 'cadet_name' ? `${b.profiles.last_name}, ${b.profiles.first_name}` : sortConfig.key === 'profiles.grade' ? b.profiles.grade || '' : sortConfig.key === 'profiles.rank' ? b.profiles.rank || '' : b[sortConfig.key as keyof PTTest];
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    }
  });
  const getSortIcon = (columnKey: string) => {
    if (sortConfig?.key !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    }
    return <ArrowUpDown className={cn("w-4 h-4", sortConfig.direction === 'asc' ? 'rotate-180' : '')} />;
  };
  if (isLoading) {
    return <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded"></div>)}
          </div>
        </div>
      </div>;
  }
  return <div className="space-y-6">
      {/* PT Tests Display */}
      {sortedData.length === 0 ? <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No PT tests found</p>
          </CardContent>
        </Card> : 
        isMobile ? (
          <div className="space-y-4">
            {sortedData.map(test => (
              <Card key={test.id}>
                <CardContent className="p-4">
                  <div className="mb-3">
                    <div>
                      <h4 className="font-medium">{test.profiles.last_name}, {test.profiles.first_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {test.profiles.grade && (
                          <Badge variant="outline" className="text-xs">
                            {test.profiles.grade}
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {convertToUI(test.date, timezone, 'date')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Push-Ups:</span>
                      <span className="ml-2 font-medium">{test.push_ups || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sit-Ups:</span>
                      <span className="ml-2 font-medium">{test.sit_ups || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Plank:</span>
                      <span className="ml-2 font-medium">{formatTime(test.plank_time)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mile:</span>
                      <span className="ml-2 font-medium">{formatTime(test.mile_time)}</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons - Mobile Grid */}
                  {(canUpdate || canDelete) && (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {canUpdate && (
                        <Button variant="outline" onClick={() => navigate(`/app/cadets/pt_test_edit?id=${test.id}`)} className="w-full">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      )}
                      {canDelete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" className="w-full text-red-600 hover:text-red-700" disabled={isDeleting}>
                              {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete PT Test</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this PT test for {test.profiles.first_name} {test.profiles.last_name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(test)} disabled={isDeleting}>
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('cadet_name')} className="h-auto p-0 font-medium hover:bg-transparent">
                      Cadet
                      {getSortIcon('cadet_name')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('profiles.grade')} className="h-auto p-0 font-medium hover:bg-transparent">
                      Grade
                      {getSortIcon('profiles.grade')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('date')} className="h-auto p-0 font-medium hover:bg-transparent">
                      Date
                      {getSortIcon('date')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button variant="ghost" onClick={() => handleSort('push_ups')} className="h-auto p-0 font-medium hover:bg-transparent">
                      Push-Ups
                      {getSortIcon('push_ups')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button variant="ghost" onClick={() => handleSort('sit_ups')} className="h-auto p-0 font-medium hover:bg-transparent">
                      Sit-Ups
                      {getSortIcon('sit_ups')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button variant="ghost" onClick={() => handleSort('plank_time')} className="h-auto p-0 font-medium hover:bg-transparent">
                      Plank Time
                      {getSortIcon('plank_time')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button variant="ghost" onClick={() => handleSort('mile_time')} className="h-auto p-0 font-medium hover:bg-transparent">
                      Mile Time
                      {getSortIcon('mile_time')}
                    </Button>
                  </TableHead>
                  {(canUpdate || canDelete) && <TableHead className="text-center">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map(test => <TableRow key={test.id}>
                    <TableCell className="font-medium py-[6px]">
                      {test.profiles.last_name}, {test.profiles.first_name}
                    </TableCell>
                    <TableCell>
                      {test.profiles.grade ? <Badge variant="outline" className="text-xs">
                          {test.profiles.grade}
                        </Badge> : '-'}
                    </TableCell>
                    <TableCell>
                      {convertToUI(test.date, timezone, 'date')}
                    </TableCell>
                    <TableCell className="text-center">
                      {test.push_ups || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {test.sit_ups || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatTime(test.plank_time)}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatTime(test.mile_time)}
                    </TableCell>
                    {(canUpdate || canDelete) && <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {canUpdate && <Button variant="outline" size="icon" onClick={() => navigate(`/app/cadets/pt_test_edit?id=${test.id}`)} className="h-6 w-6">
                              <Edit className="w-3 h-3" />
                            </Button>}
                           {canDelete && <AlertDialog>
                               <AlertDialogTrigger asChild>
                                 <Button variant="outline" size="icon" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300" disabled={isDeleting}>
                                   {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                 </Button>
                               </AlertDialogTrigger>
                               <AlertDialogContent>
                                 <AlertDialogHeader>
                                   <AlertDialogTitle>Delete PT Test</AlertDialogTitle>
                                   <AlertDialogDescription>
                                     Are you sure you want to delete this PT test for {test.profiles.first_name} {test.profiles.last_name}? This action cannot be undone.
                                   </AlertDialogDescription>
                                 </AlertDialogHeader>
                                 <AlertDialogFooter>
                                   <AlertDialogCancel>Cancel</AlertDialogCancel>
                                   <AlertDialogAction onClick={() => handleDelete(test)} disabled={isDeleting}>
                                     {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                     Delete
                                   </AlertDialogAction>
                                 </AlertDialogFooter>
                               </AlertDialogContent>
                             </AlertDialog>}
                        </div>
                      </TableCell>}
                  </TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        )}
    </div>;
};