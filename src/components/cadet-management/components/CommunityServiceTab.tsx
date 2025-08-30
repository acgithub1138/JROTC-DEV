import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { useSortableTable } from '@/hooks/useSortableTable';
import { useDebounce } from 'use-debounce';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';

interface CommunityServiceTabProps {
  searchTerm?: string;
}

interface CommunityService {
  id: string;
  cadet_id: string;
  date: string;
  hours: number | null;
  activity: string | null;
  organization: string | null;
  notes: string | null;
  profiles: {
    first_name: string;
    last_name: string;
    grade: string | null;
    rank: string | null;
  };
}

export const CommunityServiceTab = ({
  searchTerm: externalSearchTerm = ''
}: CommunityServiceTabProps) => {
  const { userProfile } = useAuth();
  const { canView, canViewDetails, canEdit: canUpdate, canDelete, canCreate } = useTablePermissions('community_service');
  const { timezone } = useSchoolTimezone();
  
  const searchTerm = externalSearchTerm;
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [selectedDate, setSelectedDate] = useState<Date>();

  // Mock data query - replace with actual table when implemented
  const { data: communityService = [], isLoading } = useQuery({
    queryKey: ['community-service', userProfile?.school_id, selectedDate, debouncedSearchTerm],
    queryFn: async () => {
      // TODO: Replace with actual community_service table query
      return [];
    },
    enabled: !!userProfile?.school_id
  });

  const filteredCommunityService = React.useMemo(() => {
    if (!searchTerm) return communityService;
    return communityService.filter((service: CommunityService) => 
      `${service.profiles.first_name} ${service.profiles.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [communityService, searchTerm]);

  const { sortedData, sortConfig, handleSort } = useSortableTable({
    data: filteredCommunityService,
    defaultSort: { key: 'date', direction: 'desc' },
    customSortFn: (a, b, sortConfig) => {
      const aValue = sortConfig.key === 'cadet_name' 
        ? `${a.profiles.last_name}, ${a.profiles.first_name}`
        : sortConfig.key === 'profiles.grade' 
        ? a.profiles.grade || ''
        : sortConfig.key === 'profiles.rank'
        ? a.profiles.rank || ''
        : a[sortConfig.key as keyof CommunityService];
        
      const bValue = sortConfig.key === 'cadet_name'
        ? `${b.profiles.last_name}, ${b.profiles.first_name}`
        : sortConfig.key === 'profiles.grade'
        ? b.profiles.grade || ''
        : sortConfig.key === 'profiles.rank'
        ? b.profiles.rank || ''
        : b[sortConfig.key as keyof CommunityService];

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
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Date Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Filter by date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
              <div className="p-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(undefined)}
                  className="w-full"
                >
                  Clear Filter
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Add Button */}
        <div className="flex gap-2">
          {canCreate && (
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Service Hours
            </Button>
          )}
        </div>
      </div>

      {/* Community Service Display */}
      {sortedData.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No community service records found</p>
            <p className="text-sm text-muted-foreground mt-2">
              This feature is coming soon - community service hour tracking will be available here.
            </p>
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
                      onClick={() => handleSort('hours')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Hours
                      {getSortIcon('hours')}
                    </Button>
                  </TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Organization</TableHead>
                  {(canUpdate || canDelete) && (
                    <TableHead className="text-center">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium py-[6px]">
                      {service.profiles.last_name}, {service.profiles.first_name}
                    </TableCell>
                    <TableCell>
                      {service.profiles.grade ? (
                        <Badge variant="outline" className="text-xs">
                          {service.profiles.grade}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {formatTimeForDisplay(service.date, TIME_FORMATS.SHORT_DATE, timezone)}
                    </TableCell>
                    <TableCell className="text-center">
                      {service.hours || '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {service.activity || '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {service.organization || '-'}
                    </TableCell>
                    {(canUpdate || canDelete) && (
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Action buttons will be added when implementing full functionality */}
                          <span className="text-xs text-muted-foreground">Coming soon</span>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};