import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useCompetitionSchools } from '@/hooks/competition-portal/useCompetitionSchools';
import { useCompetitionSchoolsPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useIsMobile } from '@/hooks/use-mobile';
import { ViewSchoolEventsModal } from '@/components/competition-portal/modals/ViewSchoolEventsModal';
import { ColorPicker } from '@/components/ui/color-picker';
import type { Database } from '@/integrations/supabase/types';

// Extend the type to include the paid and color fields
type CompSchoolWithPaid = Database['public']['Tables']['cp_comp_schools']['Row'] & {
  paid: boolean;
  color: string;
};
interface CompetitionSchoolsTabProps {
  competitionId: string;
}
export const CompetitionSchoolsTab: React.FC<CompetitionSchoolsTabProps> = ({
  competitionId
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const {
    schools,
    isLoading,
    createSchoolRegistration,
    updateSchoolRegistration,
    refetch
  } = useCompetitionSchools(competitionId);
  const {
    canCreate,
    canView,
    canViewDetails,
    canUpdate,
    canDelete
  } = useCompetitionSchoolsPermissions();
  const [selectedSchoolForEvents, setSelectedSchoolForEvents] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('school_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };
  const sortedSchools = schools.sort((a, b) => {
    if (!sortField) return 0;
    let aValue: any = '';
    let bValue: any = '';
    switch (sortField) {
      case 'school_name':
        aValue = (a.school_name || 'unknown school').toLowerCase();
        bValue = (b.school_name || 'unknown school').toLowerCase();
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'paid':
        aValue = a.paid ? 1 : 0;
        bValue = b.paid ? 1 : 0;
        break;
      case 'fee':
        aValue = a.total_fee || 0;
        bValue = b.total_fee || 0;
        break;
      default:
        return 0;
    }
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  const handleColorChange = async (schoolId: string, newColor: string) => {
    try {
      await updateSchoolRegistration(schoolId, {
        color: newColor
      });
    } catch (error) {
      console.error('Error updating school color:', error);
    }
  };
  if (isLoading) {
    return <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)}
      </div>;
  }
  return <div className="space-y-4">
      <div className="flex items-center justify-between py-[8px]">
        <h2 className="text-lg font-semibold">Registered Schools</h2>
        {canCreate && <Button onClick={() => navigate(`/app/competition-portal/competition-details/${competitionId}/school_record?mode=create`)}>
            <Plus className="w-4 h-4 mr-2" />
            Register School
          </Button>}
      </div>

      {!canView ? <div className="text-center py-8 text-muted-foreground">
          <p>You don't have permission to view schools</p>
        </div> : schools.length === 0 ? <div className="text-center py-8 text-muted-foreground">
          <p>No schools registered for this competition</p>
        </div> : <TooltipProvider>
          {isMobile ? <div className="space-y-4">
              {sortedSchools.map((school: CompSchoolWithPaid) => <Card key={school.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{school.school_name || 'Unknown School'}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Status:</span>
                        <Badge variant={school.status === 'confirmed' ? 'default' : school.status === 'cancelled' ? 'destructive' : 'secondary'}>
                          {school.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Payment:</span>
                        <Badge variant={school.paid ? 'default' : 'secondary'}>
                          {school.paid ? 'Paid' : 'Unpaid'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Fee:</span>
                        <p className="text-sm">$ {school.total_fee}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Color:</span>
                        <div className="w-6 h-6 rounded border border-border" style={{
                  backgroundColor: school.color || '#3B82F6'
                }} />
                      </div>
                      <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 pt-2">
                        {canViewDetails && <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedSchoolForEvents(school.id)}>
                                <Eye className="w-4 h-4 mr-1" />
                                Events
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View registered events</p>
                            </TooltipContent>
                          </Tooltip>}
                        {canUpdate && <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => navigate(`/app/competition-portal/competition-details/${competitionId}/score_sheet_record?mode=create&school_id=${school.id}`)}>
                                  <Plus className="w-4 h-4 mr-1" />
                                  Add Score
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Add event score sheet</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => navigate(`/app/competition-portal/competition-details/${competitionId}/school_record?mode=edit&id=${school.id}`)}>
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit school registration</p>
                              </TooltipContent>
                            </Tooltip>
                          </>}
                      </div>
                    </div>
                  </CardContent>
                </Card>)}
            </div> : <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button onClick={() => handleSort('school_name')} className="flex items-center gap-2 hover:text-foreground font-medium">
                          School Name {getSortIcon('school_name')}
                        </button>
                      </TableHead>
                      <TableHead>Events</TableHead>
                      <TableHead>
                        <button onClick={() => handleSort('status')} className="flex items-center gap-2 hover:text-foreground font-medium">
                          Status {getSortIcon('status')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button onClick={() => handleSort('paid')} className="flex items-center gap-2 hover:text-foreground font-medium">
                          Paid {getSortIcon('paid')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button onClick={() => handleSort('fee')} className="flex items-center gap-2 hover:text-foreground font-medium">
                          Fee {getSortIcon('fee')}
                        </button>
                      </TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSchools.map((school: CompSchoolWithPaid) => <TableRow key={school.id}>
                        <TableCell className="font-medium py-[8px]">
                          {school.school_name || 'Unknown School'}
                        </TableCell>
                        <TableCell>
                          {canViewDetails && <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setSelectedSchoolForEvents(school.id)}>
                                  <Eye className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View registered events</p>
                              </TooltipContent>
                            </Tooltip>}
                        </TableCell>                        
                        <TableCell>
                          <Badge variant={school.status === 'confirmed' ? 'default' : school.status === 'cancelled' ? 'destructive' : 'secondary'}>
                            {school.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={school.paid ? 'default' : 'secondary'}>
                            {school.paid ? 'Paid' : 'Unpaid'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          $ {school.total_fee}
                        </TableCell>
                         <TableCell>
                           <div className="w-6 h-6 rounded border border-border" style={{
                    backgroundColor: school.color || '#3B82F6'
                  }} />
                         </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {canUpdate && <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Add event score sheet</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => navigate(`/app/competition-portal/competition-details/${competitionId}/school_record?mode=edit&id=${school.id}`)}>
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit school registration</p>
                                  </TooltipContent>
                                </Tooltip>
                              </>}
                          </div>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>}
        </TooltipProvider>}

      <ViewSchoolEventsModal open={!!selectedSchoolForEvents} onOpenChange={() => setSelectedSchoolForEvents(null)} competitionId={competitionId} schoolId={selectedSchoolForEvents || ''} />
    </div>;
};