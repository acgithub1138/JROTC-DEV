import React, { useState } from 'react';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCompetitionResources } from '@/hooks/competition-portal/useCompetitionResources';
import { useCompetitionResourcesPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useIsMobile } from '@/hooks/use-mobile';
import { AddResourceModal } from '@/components/competition-portal/modals/AddResourceModal';
import { EditResourceModal } from '@/components/competition-portal/modals/EditResourceModal';
import { format } from 'date-fns';
interface CompetitionResourcesTabProps {
  competitionId: string;
}
export const CompetitionResourcesTab: React.FC<CompetitionResourcesTabProps> = ({
  competitionId
}) => {
  const isMobile = useIsMobile();
  const {
    resources,
    isLoading,
    createResource,
    updateResource,
    deleteResource
  } = useCompetitionResources(competitionId);
  const {
    canCreate,
    canView,
    canUpdate,
    canDelete
  } = useCompetitionResourcesPermissions();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [deletingResourceId, setDeletingResourceId] = useState(null);
  
  const handleEdit = (resource) => {
    setEditingResource(resource);
  };

  const handleDelete = async (id) => {
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
        {canCreate && <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Resource
          </Button>}
      </div>

      {!canView ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>You don't have permission to view resources</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No resources assigned for this competition</p>
        </div>
      ) : isMobile ? (
          <div className="space-y-4">
            {resources.map(resource => (
              <Card key={resource.id}>
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
                      <p className="text-sm">{resource.start_time ? format(new Date(resource.start_time), 'MMM, d yyyy HH:mm') : '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">End:</span>
                      <p className="text-sm">{resource.end_time ? format(new Date(resource.end_time), 'MMM, d yyyy HH:mm') : '-'}</p>
                    </div>
                     {(canUpdate || canDelete) && (
                       <div className="flex flex-wrap gap-2 pt-2">
                         {canUpdate && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => handleEdit(resource)}>
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit Resource</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {canDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700 hover:border-red-300"
                                disabled={deletingResourceId === resource.id}
                              >
                                {deletingResourceId === resource.id ? (
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4 mr-1" />
                                )}
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
                                <AlertDialogAction 
                                  onClick={() => handleDelete(resource.id)}
                                  disabled={deletingResourceId === resource.id}
                                >
                                  {deletingResourceId === resource.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : <div className="border rounded-lg">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cadet</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map(resource => <TableRow key={resource.id}>
                <TableCell className="py-[8px]">
                  {resource.cadet_profile ? `${resource.cadet_profile.last_name}, ${resource.cadet_profile.first_name}` : 'Unknown Cadet'}
                </TableCell>
                <TableCell>{resource.location || '-'}</TableCell>
                <TableCell>
                  {resource.start_time ? format(new Date(resource.start_time), 'MMM, d yyyy HH:mm') : '-'}
                </TableCell>
                <TableCell>
                  {resource.end_time ? format(new Date(resource.end_time), 'MMM, d yyyy HH:mm') : '-'}
                </TableCell>
                 {(canUpdate || canDelete) && <TableCell>
                     <div className="flex items-center justify-center gap-2">
                       {canUpdate && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleEdit(resource)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit Resource</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                       {canDelete && (
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button 
                               variant="outline" 
                               size="icon" 
                               className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300"
                               disabled={deletingResourceId === resource.id}
                             >
                               {deletingResourceId === resource.id ? (
                                 <Loader2 className="w-3 h-3 animate-spin" />
                               ) : (
                                 <Trash2 className="w-3 h-3" />
                               )}
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
                               <AlertDialogAction 
                                 onClick={() => handleDelete(resource.id)}
                                 disabled={deletingResourceId === resource.id}
                               >
                                 {deletingResourceId === resource.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                 Delete
                               </AlertDialogAction>
                             </AlertDialogFooter>
                           </AlertDialogContent>
                         </AlertDialog>
                       )}
                    </div>
                  </TableCell>}
              </TableRow>)}
          </TableBody>
        </Table>
      </div>}

      <AddResourceModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal} 
        competitionId={competitionId} 
        onResourceAdded={createResource} 
      />
      
      <EditResourceModal
        open={!!editingResource}
        onOpenChange={(open) => !open && setEditingResource(null)}
        resource={editingResource}
        onResourceUpdated={updateResource}
      />
    </div>
  </TooltipProvider>;
};