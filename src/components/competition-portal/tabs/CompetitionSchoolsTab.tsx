import React, { useState } from 'react';
import { Plus, Eye, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useCompetitionSchools } from '@/hooks/competition-portal/useCompetitionSchools';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { AddSchoolModal } from '@/components/competition-portal/modals/AddSchoolModal';
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
  const {
    schools,
    isLoading,
    createSchoolRegistration,
    updateSchoolRegistration
  } = useCompetitionSchools(competitionId);
  const {
    canCreate,
    canEdit
  } = useTablePermissions('cp_comp_schools');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSchoolForEvents, setSelectedSchoolForEvents] = useState<string | null>(null);
  const handleTogglePaid = async (schoolId: string, currentPaid: boolean) => {
    try {
      console.log('Updating payment status for school:', schoolId, 'from', currentPaid, 'to', !currentPaid);
      await updateSchoolRegistration(schoolId, {
        paid: !currentPaid
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
    }
  };
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
        {canCreate && <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Register School
          </Button>}
      </div>

      {schools.length === 0 ? <div className="text-center py-8 text-muted-foreground">
          <p>No schools registered for this competition</p>
        </div> : <TooltipProvider>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School Name</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schools.map((school: CompSchoolWithPaid) => <TableRow key={school.id}>
                      <TableCell className="font-medium">
                        {school.school_name - school.fee || 'Unknown School'}
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setSelectedSchoolForEvents(school.id)}>
                              <Eye className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View registered events</p>
                          </TooltipContent>
                        </Tooltip>
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
                        ${school.fee}
                      </TableCell>
                      <TableCell>
                        <ColorPicker value={school.color || '#3B82F6'} onChange={color => handleColorChange(school.id, color)} disabled={!canEdit} />
                      </TableCell>                
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {canEdit && <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleTogglePaid(school.id, school.paid)}>
                                  <DollarSign className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{school.paid ? 'Mark as unpaid' : 'Mark as paid'}</p>
                              </TooltipContent>
                            </Tooltip>}
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TooltipProvider>}

      <AddSchoolModal open={showAddModal} onOpenChange={setShowAddModal} competitionId={competitionId} onSchoolAdded={createSchoolRegistration} />
      
      <ViewSchoolEventsModal open={!!selectedSchoolForEvents} onOpenChange={() => setSelectedSchoolForEvents(null)} competitionId={competitionId} schoolId={selectedSchoolForEvents || ''} />
    </div>;
};