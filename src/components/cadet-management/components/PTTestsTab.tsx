import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Search, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCadetPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useSortableTable } from '@/hooks/useSortableTable';
interface PTTestsTabProps {
  onOpenBulkDialog: () => void;
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
  onOpenBulkDialog
}: PTTestsTabProps) => {
  const {
    userProfile
  } = useAuth();
  const {
    canCreate
  } = useCadetPermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const {
    data: ptTests = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['pt-tests', userProfile?.school_id, selectedDate, searchTerm],
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
      if (searchTerm) {
        return data.filter((test: PTTest) => `${test.profiles.first_name} ${test.profiles.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      return data;
    },
    enabled: !!userProfile?.school_id
  });
  const formatTime = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Use sortable table hook
  const { sortedData, sortConfig, handleSort } = useSortableTable({
    data: ptTests,
    defaultSort: { key: 'date', direction: 'desc' },
    customSortFn: (a, b, sortConfig) => {
      const aValue = sortConfig.key === 'cadet_name' 
        ? `${a.profiles.last_name}, ${a.profiles.first_name}`
        : sortConfig.key === 'profiles.grade'
        ? a.profiles.grade || ''
        : sortConfig.key === 'profiles.rank'
        ? a.profiles.rank || ''
        : a[sortConfig.key as keyof PTTest];
      
      const bValue = sortConfig.key === 'cadet_name' 
        ? `${b.profiles.last_name}, ${b.profiles.first_name}`
        : sortConfig.key === 'profiles.grade'
        ? b.profiles.grade || ''
        : sortConfig.key === 'profiles.rank'
        ? b.profiles.rank || ''
        : b[sortConfig.key as keyof PTTest];

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
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search cadets..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 w-64" />
          </div>

          {/* Date Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Filter by date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus className="p-3 pointer-events-auto" />
              <div className="p-3 border-t">
                <Button variant="outline" size="sm" onClick={() => setSelectedDate(undefined)} className="w-full">
                  Clear Filter
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Bulk Entry Button */}
        <div className="flex gap-2">
          {canCreate && <>
              <Button onClick={onOpenBulkDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Bulk PT Test
              </Button>
              <Button variant="outline" onClick={onOpenBulkDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add PT Tests
              </Button>
            </>}
        </div>
      </div>

      {/* PT Tests Display */}
      {sortedData.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No PT tests found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('cadet_name')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Cadet
                      {getSortIcon('cadet_name')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('profiles.grade')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Grade
                      {getSortIcon('profiles.grade')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('date')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Date
                      {getSortIcon('date')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('push_ups')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Push-Ups
                      {getSortIcon('push_ups')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('sit_ups')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Sit-Ups
                      {getSortIcon('sit_ups')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('plank_time')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Plank Time
                      {getSortIcon('plank_time')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('mile_time')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Mile Time
                      {getSortIcon('mile_time')}
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">
                      {test.profiles.last_name}, {test.profiles.first_name}
                    </TableCell>
                    <TableCell>
                      {test.profiles.grade ? (
                        <Badge variant="outline" className="text-xs">
                          {test.profiles.grade}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(test.date), 'MMM d, yyyy')}
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>;
};