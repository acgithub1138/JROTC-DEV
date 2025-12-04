import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCPCadets, CPCadet } from '@/hooks/competition-portal/useCPCadets';
import { useCPCadetsPermissions } from '@/hooks/useModuleSpecificPermissions';
import { CPCadetsTable } from './components/CPCadetsTable';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

export function CPCadetsPage() {
  const navigate = useNavigate();
  const { cadets, isLoading, deleteCadet, isDeleting } = useCPCadets();
  const { canView, canCreate, canEdit, canDelete, canViewDetails } = useCPCadetsPermissions();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [cadetToDelete, setCadetToDelete] = useState<CPCadet | null>(null);

  const filteredCadets = cadets.filter((cadet) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      cadet.first_name?.toLowerCase().includes(searchLower) ||
      cadet.last_name?.toLowerCase().includes(searchLower) ||
      cadet.email?.toLowerCase().includes(searchLower) ||
      cadet.grade?.toLowerCase().includes(searchLower)
    );
  });

  const handleView = (cadet: CPCadet) => {
    navigate(`/app/competition-portal/cadets_record?mode=view&id=${cadet.id}`);
  };

  const handleEdit = (cadet: CPCadet) => {
    navigate(`/app/competition-portal/cadets_record?mode=edit&id=${cadet.id}`);
  };

  const handleDelete = (cadet: CPCadet) => {
    setCadetToDelete(cadet);
  };

  const confirmDelete = async () => {
    if (cadetToDelete) {
      await deleteCadet(cadetToDelete.id);
      setCadetToDelete(null);
    }
  };

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">Cadets</h1>
        <div className="flex gap-2">
          {canCreate && (
            <>
              <Button
                variant="outline"
                onClick={() => navigate('/app/competition-portal/cadets_bulk_upload')}
              >
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
              <Button onClick={() => navigate('/app/competition-portal/cadets_record?mode=create')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Cadet
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search cadets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <CPCadetsTable
          cadets={filteredCadets}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canEdit={canEdit}
          canDelete={canDelete}
          canViewDetails={canViewDetails}
        />
      )}

      <AlertDialog open={!!cadetToDelete} onOpenChange={() => setCadetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cadet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {cadetToDelete?.last_name}, {cadetToDelete?.first_name}? 
              This action will deactivate the cadet account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
