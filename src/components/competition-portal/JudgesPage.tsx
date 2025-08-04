import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Upload, ChevronDown } from 'lucide-react';
import { JudgesTable } from './components/JudgesTable';
import { JudgeDialog } from './components/JudgeDialog';
import { JudgesBulkImportDialog } from './components/JudgesBulkImportDialog';
import { useJudges } from '@/hooks/competition-portal/useJudges';
import { useTablePermissions } from '@/hooks/useTablePermissions';
export const JudgesPage: React.FC = () => {
  const {
    canCreate
  } = useTablePermissions('cp_judges');
  const {
    judges,
    isLoading,
    createJudge,
    updateJudge,
    deleteJudge,
    bulkImportJudges,
    bulkUpdateStatus,
    isBulkUpdating
  } = useJudges();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [editingJudge, setEditingJudge] = useState<any>(null);
  const [deleteConfirmJudge, setDeleteConfirmJudge] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJudges, setSelectedJudges] = useState<string[]>([]);
  const handleEdit = (judge: any) => {
    setEditingJudge(judge);
  };

  const handleDeleteClick = (judge: any) => {
    setDeleteConfirmJudge(judge);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmJudge) {
      await deleteJudge(deleteConfirmJudge.id);
      setDeleteConfirmJudge(null);
    }
  };
  const handleSubmit = async (data: any) => {
    if (editingJudge) {
      await updateJudge({
        id: editingJudge.id,
        ...data
      });
    } else {
      await createJudge(data);
    }
    setShowCreateDialog(false);
    setEditingJudge(null);
  };
  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setEditingJudge(null);
  };

  const handleSelectJudge = (judgeId: string, checked: boolean) => {
    if (checked) {
      setSelectedJudges(prev => [...prev, judgeId]);
    } else {
      setSelectedJudges(prev => prev.filter(id => id !== judgeId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedJudges(filteredJudges.map(judge => judge.id));
    } else {
      setSelectedJudges([]);
    }
  };

  const handleBulkStatusUpdate = async (available: boolean) => {
    if (selectedJudges.length === 0) return;
    
    await bulkUpdateStatus({ judgeIds: selectedJudges, available });
    setSelectedJudges([]);
  };

  // Filter judges based on search term
  const filteredJudges = judges.filter(judge => judge.name.toLowerCase().includes(searchTerm.toLowerCase()) || judge.email && judge.email.toLowerCase().includes(searchTerm.toLowerCase()) || judge.phone && judge.phone.includes(searchTerm));
  if (isLoading) {
    return <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading judges...</div>
        </div>
      </div>;
  }
  return <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Judges</h1>
          <p className="text-muted-foreground">Manage judges for your competitions</p>
        </div>
        {canCreate && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowBulkImportDialog(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Bulk Upload
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Judge
            </Button>
          </div>
        )}
      </div>

      {/* Search Filter & Bulk Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search judges..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
            {selectedJudges.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedJudges.length} selected
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={isBulkUpdating}>
                      Bulk Actions
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate(true)}>
                      Mark as Available
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate(false)}>
                      Mark as Unavailable
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Judges Table */}
      {filteredJudges.length === 0 ? <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              {judges.length === 0 ? 'No judges found.' : 'No judges match your search criteria.'}
            </div>
          </CardContent>
        </Card> : <Card>
          <CardContent className="py-[8px]">
            <JudgesTable 
              judges={filteredJudges} 
              isLoading={isLoading} 
              onEdit={handleEdit} 
              onDelete={handleDeleteClick}
              selectedJudges={selectedJudges}
              onSelectJudge={handleSelectJudge}
              onSelectAll={handleSelectAll}
            />
          </CardContent>
        </Card>}

      <JudgeDialog open={showCreateDialog || !!editingJudge} onOpenChange={handleCloseDialog} judge={editingJudge} onSubmit={handleSubmit} />
      <JudgesBulkImportDialog 
        open={showBulkImportDialog} 
        onOpenChange={setShowBulkImportDialog} 
        onBulkImport={bulkImportJudges}
      />

      <AlertDialog open={!!deleteConfirmJudge} onOpenChange={(open) => !open && setDeleteConfirmJudge(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Judge</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the judge "{deleteConfirmJudge?.name}"? This action cannot be undone and will permanently remove the judge from your competition portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete Judge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};