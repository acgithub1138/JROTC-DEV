import React, { useState } from 'react';
import { Plus, Edit, Edit2, Trash2, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCompetitionResources } from '@/hooks/competition-portal/useCompetitionResources';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { useIsMobile } from '@/hooks/use-mobile';
import { convertToUI } from '@/utils/timezoneUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
interface CompetitionResourcesTabProps {
  competitionId: string;
}
export const CompetitionResourcesTab: React.FC<CompetitionResourcesTabProps> = ({
  competitionId
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const {
    resources,
    isLoading,
    deleteResource
  } = useCompetitionResources(competitionId);
  const {
    canCreate,
    canEdit,
    canDelete,
    canView,
    canViewDetails
  } = useTablePermissions('cp_comp_resources');
  const {
    timezone
  } = useSchoolTimezone();
  const [deletingResourceId, setDeletingResourceId] = useState(null);
  const [sortField, setSortField] = useState<string>('');
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
  const sortedResources = resources.sort((a, b) => {
    if (!sortField) return 0;
    let aValue: any = '';
    let bValue: any = '';
    switch (sortField) {
      case 'cadet':
        aValue = a.cadet_profile ? `${a.cadet_profile.last_name}, ${a.cadet_profile.first_name}`.toLowerCase() : 'unknown cadet';
        bValue = b.cadet_profile ? `${b.cadet_profile.last_name}, ${b.cadet_profile.first_name}`.toLowerCase() : 'unknown cadet';
        break;
      case 'location':
        aValue = (a.location || '').toLowerCase();
        bValue = (b.location || '').toLowerCase();
        break;
      case 'start_time':
        aValue = a.start_time ? new Date(a.start_time) : new Date(0);
        bValue = b.start_time ? new Date(b.start_time) : new Date(0);
        break;
      case 'end_time':
        aValue = a.end_time ? new Date(a.end_time) : new Date(0);
        bValue = b.end_time ? new Date(b.end_time) : new Date(0);
        break;
      default:
        return 0;
    }
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  const handleView = (resourceId: string) => {
    navigate(`/app/competition-portal/competition-details/${competitionId}/resources_record?mode=view&id=${resourceId}`);
  };
  const handleEdit = (resourceId: string) => {
    navigate(`/app/competition-portal/competition-details/${competitionId}/resources_record?mode=edit&id=${resourceId}`);
  };
  const handleCreate = () => {
    navigate(`/app/competition-portal/competition-details/${competitionId}/resources_record?mode=create`);
  };
  const handleDelete = async id => {
    setDeletingResourceId(id);
    await deleteResource(id);
    setDeletingResourceId(null);
  };
  if (isLoading) {
    return <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)}
      </div>;
  }
  return <TooltipProvider>
    <div className="space-y-4">
      <div className="flex items-center justify-between py-[8px]">
        <h2 className="text-lg font-semibold">Competition Resources</h2>
        {canCreate && <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Resource
          </Button>}
      </div>

      {!canView ? <div className="text-center py-8 text-muted-foreground">
          <p>You don't have permission to view resources</p>
        </div> : resources.length === 0 ? <div className="text-center py-8 text-muted-foreground">
          <p>No resources assigned for this competition</p>
        </div> : isMobile ? <div className="space-y-4">
            {sortedResources.map(resource => <Card key={resource.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {resource.cadet_profile ? `${resource.cadet_profile.last_name}, ${resource.cadet_profile.first_name}` : 'Unknown Cadet'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Location:</span>
                      <p className="text-sm">{resource.location || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Start:</span>
                      <p className="text-sm">{resource.start_time ? convertToUI(resource.start_time, timezone, 'datetime') : '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">End:</span>
                      <p className="text-sm">{resource.end_time ? convertToUI(resource.end_time, timezone, 'datetime') : '-'}</p>
                    </div>
                     {(canEdit || canDelete) && <div className="grid grid-cols-2 gap-2 pt-2">
                         {canEdit && <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => handleEdit(resource.id)}>
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit Resource</p>
                            </TooltipContent>
                          </Tooltip>}
                        {canDelete && <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:border-red-300" disabled={deletingResourceId === resource.id}>
                                {deletingResourceId === resource.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Resource</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this resource assignment for {resource.cadet_profile ? `${resource.cadet_profile.first_name} ${resource.cadet_profile.last_name}` : 'this cadet'}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(resource.id)} disabled={deletingResourceId === resource.id}>
                                  {deletingResourceId === resource.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>}
                      </div>}
                  </div>
                </CardContent>
              </Card>)}
          </div> : <div className="border rounded-lg">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button onClick={() => handleSort('cadet')} className="flex items-center gap-2 hover:text-foreground font-medium">
                  Cadet {getSortIcon('cadet')}
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort('location')} className="flex items-center gap-2 hover:text-foreground font-medium">
                  Location {getSortIcon('location')}
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort('start_time')} className="flex items-center gap-2 hover:text-foreground font-medium">
                  Start {getSortIcon('start_time')}
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort('end_time')} className="flex items-center gap-2 hover:text-foreground font-medium">
                  End {getSortIcon('end_time')}
                </button>
              </TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedResources.map(resource => <TableRow key={resource.id}>
                <TableCell className="py-[8px]">
                  {resource.cadet_profile ? `${resource.cadet_profile.last_name}, ${resource.cadet_profile.first_name}` : 'Unknown Cadet'}
                </TableCell>
                <TableCell>{resource.location || '-'}</TableCell>
                <TableCell>
                  {resource.start_time ? convertToUI(resource.start_time, timezone, 'datetime') : '-'}
                </TableCell>
                <TableCell>
                  {resource.end_time ? convertToUI(resource.end_time, timezone, 'datetime') : '-'}
                </TableCell>
                 {(canViewDetails || canEdit || canDelete) && <TableCell>
                     <div className="flex items-center justify-center gap-2">
                       {canViewDetails && <Tooltip>
                          <TooltipTrigger asChild>
                            
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Resource</p>
                          </TooltipContent>
                        </Tooltip>}
                       {canEdit && <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleEdit(resource.id)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit Resource</p>
                          </TooltipContent>
                        </Tooltip>}
                       {canDelete && <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button variant="outline" size="icon" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300" disabled={deletingResourceId === resource.id}>
                               {deletingResourceId === resource.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>Delete Resource</AlertDialogTitle>
                               <AlertDialogDescription>
                                 Are you sure you want to delete this resource assignment for {resource.cadet_profile ? `${resource.cadet_profile.first_name} ${resource.cadet_profile.last_name}` : 'this cadet'}? This action cannot be undone.
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancel</AlertDialogCancel>
                               <AlertDialogAction onClick={() => handleDelete(resource.id)} disabled={deletingResourceId === resource.id}>
                                 {deletingResourceId === resource.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
      </div>}
    </div>
  </TooltipProvider>;
};