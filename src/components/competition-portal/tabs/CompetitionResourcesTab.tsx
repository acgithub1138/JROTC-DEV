import React, { useState } from 'react';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCompetitionResources } from '@/hooks/competition-portal/useCompetitionResources';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { AddResourceModal } from '@/components/competition-portal/modals/AddResourceModal';
import { EditResourceModal } from '@/components/competition-portal/modals/EditResourceModal';
import { format } from 'date-fns';
interface CompetitionResourcesTabProps {
  competitionId: string;
}
export const CompetitionResourcesTab: React.FC<CompetitionResourcesTabProps> = ({
  competitionId
}) => {
  const {
    resources,
    isLoading,
    createResource,
    updateResource,
    deleteResource
  } = useCompetitionResources(competitionId);
  const {
    canCreate,
    canEdit,
    canDelete
  } = useTablePermissions('cp_comp_resources');
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

      {resources.length === 0 ? <div className="text-center py-8 text-muted-foreground">
          <p>No resources assigned for this competition</p>
        </div> : <div className="border rounded-lg">
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
                {(canEdit || canDelete) && <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      {canEdit && (
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