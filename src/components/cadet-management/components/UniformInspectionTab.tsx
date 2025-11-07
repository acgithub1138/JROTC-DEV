import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, ArrowUpDown, Edit, Trash2 } from 'lucide-react';
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
import { UniformInspectionBulkDialog } from './UniformInspectionBulkDialog';
import { TableActionButtons } from '@/components/ui/table-action-buttons';
import { useIsMobile } from '@/hooks/use-mobile';
interface UniformInspectionTabProps {
  searchTerm?: string;
  selectedDate?: Date;
}
interface UniformInspection {
  id: string;
  cadet_id: string;
  date: string;
  grade: number | null;
  notes: string | null;
  profiles: {
    first_name: string;
    last_name: string;
    grade: string | null;
    rank: string | null;
  };
}
export const UniformInspectionTab = ({
  searchTerm: externalSearchTerm = '',
  selectedDate
}: UniformInspectionTabProps) => {
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
  } = useTablePermissions('uniform_inspection');
  const {
    timezone
  } = useSchoolTimezone();
  const searchTerm = externalSearchTerm;
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [showBulkDialog, setShowBulkDialog] = useState(false);

  // Query uniform inspections from the database
  const {
    data: inspections = [],
    isLoading
  } = useQuery({
    queryKey: ['uniform-inspections', userProfile?.school_id, selectedDate, debouncedSearchTerm],
    queryFn: async () => {
      if (!userProfile?.school_id) return [];
      const {
        data,
        error
      } = await supabase.from('uniform_inspections').select(`
          id,
          cadet_id,
          date,
          grade,
          notes,
          profiles!uniform_inspections_cadet_id_fkey (
            first_name,
            last_name,
            grade,
            rank
          )
        `).eq('school_id', userProfile.school_id).order('date', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching uniform inspections:', error);
        return [];
      }
      let filteredData = data || [];

      // Apply date filter if selected
      if (selectedDate) {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        filteredData = filteredData.filter(inspection => inspection.date === dateStr);
      }
      return filteredData;
    },
    enabled: !!userProfile?.school_id && canView
  });
  const filteredInspections = React.useMemo(() => {
    if (!debouncedSearchTerm) return inspections;
    return inspections.filter(inspection => `${inspection.profiles?.first_name || ''} ${inspection.profiles?.last_name || ''}`.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
  }, [inspections, debouncedSearchTerm]);
  const {
    sortedData,
    sortConfig,
    handleSort
  } = useSortableTable({
    data: filteredInspections,
    defaultSort: {
      key: 'date',
      direction: 'desc'
    },
    customSortFn: (a, b, sortConfig) => {
      const aValue = sortConfig.key === 'cadet_name' ? `${a.profiles.last_name}, ${a.profiles.first_name}` : sortConfig.key === 'profiles.grade' ? a.profiles.grade || '' : sortConfig.key === 'profiles.rank' ? a.profiles.rank || '' : a[sortConfig.key as keyof UniformInspection];
      const bValue = sortConfig.key === 'cadet_name' ? `${b.profiles.last_name}, ${b.profiles.first_name}` : sortConfig.key === 'profiles.grade' ? b.profiles.grade || '' : sortConfig.key === 'profiles.rank' ? b.profiles.rank || '' : b[sortConfig.key as keyof UniformInspection];
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
      {/* Uniform Inspections Display */}
      {sortedData.length === 0 ? <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No uniform inspections found</p>
            {selectedDate && <p className="text-sm text-muted-foreground mt-2">
                Try selecting a different date or clearing the date filter.
              </p>}
          </CardContent>
        </Card> : 
        isMobile ? (
          <div className="space-y-4">
            {sortedData.map(inspection => (
              <Card key={inspection.id}>
                <CardContent className="p-4">
                  <div className="mb-3">
                    <div>
                      <h4 className="font-medium">{inspection.profiles.last_name}, {inspection.profiles.first_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {inspection.profiles.grade && (
                          <Badge variant="outline" className="text-xs">
                            {inspection.profiles.grade}
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {convertToUI(inspection.date, timezone, 'date')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Score:</span>
                      <span className="font-medium">{inspection.grade || '-'}</span>
                    </div>
                    {inspection.notes && (
                      <div>
                        <span className="text-muted-foreground">Notes:</span>
                        <p className="text-sm mt-1">{inspection.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons - Mobile Grid */}
                  {(canUpdate || canDelete) && (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {canUpdate && (
                        <Button 
                          variant="outline" 
                          onClick={() => navigate(`/app/cadets/inspection_edit?id=${inspection.id}`)}
                          className="w-full"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      )}
                      {canDelete && (
                        <Button 
                          variant="outline" 
                          onClick={() => navigate(`/app/cadets/inspection_edit?id=${inspection.id}`)}
                          className="w-full text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
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
                   <Button variant="ghost" onClick={() => handleSort('grade')} className="h-auto p-0 font-medium hover:bg-transparent">
                      Score
                      {getSortIcon('grade')}
                    </Button>
                  </TableHead>
                  <TableHead>Notes</TableHead>
                  {(canUpdate || canDelete) && <TableHead className="text-center">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map(inspection => <TableRow key={inspection.id}>
                    <TableCell className="font-medium py-[6px]">
                      {inspection.profiles.last_name}, {inspection.profiles.first_name}
                    </TableCell>
                    <TableCell>
                      {inspection.profiles.grade ? <Badge variant="outline" className="text-xs">
                          {inspection.profiles.grade}
                        </Badge> : '-'}
                    </TableCell>
                    <TableCell>
                      {convertToUI(inspection.date, timezone, 'date')}
                    </TableCell>
                     <TableCell className="text-center">
                       {inspection.grade || '-'}
                     </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {inspection.notes || '-'}
                    </TableCell>
                    {(canUpdate || canDelete) && <TableCell className="text-center">
                        <TableActionButtons 
                          canEdit={canUpdate} 
                          canDelete={canDelete} 
                          onEdit={() => navigate(`/app/cadets/inspection_edit?id=${inspection.id}`)}
                          onDelete={() => navigate(`/app/cadets/inspection_edit?id=${inspection.id}`)}
                        />
                      </TableCell>}
                  </TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        )}

    </div>;
};