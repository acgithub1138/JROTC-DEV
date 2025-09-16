import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Upload, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { JudgesTable } from './components/JudgesTable';

import { useJudges } from '@/hooks/competition-portal/useJudges';
import { useCPJudgesPermissions } from '@/hooks/useModuleSpecificPermissions';
export const JudgesPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    canView,
    canCreate
  } = useCPJudgesPermissions();
  const {
    judges,
    isLoading,
    deleteJudge,
    bulkUpdateStatus,
    isBulkUpdating
  } = useJudges();
  
  const [deleteConfirmJudge, setDeleteConfirmJudge] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJudges, setSelectedJudges] = useState<string[]>([]);
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

  const handleEdit = (judge: any) => {
    navigate(`/app/competition-portal/judges/judge_record?mode=edit&id=${judge.id}`);
  };

  const handleView = (judge: any) => {
    navigate(`/app/competition-portal/judges/judge_record?mode=view&id=${judge.id}`);
  };

  const handleCreateJudge = () => {
    navigate('/app/competition-portal/judges/judge_record?mode=create');
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

  const handleSelectJudge = (judgeId: string, checked: boolean) => {
    if (checked) {
      setSelectedJudges(prev => [...prev, judgeId]);
    } else {
      setSelectedJudges(prev => prev.filter(id => id !== judgeId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedJudges(filteredAndSortedJudges.map(judge => judge.id));
    } else {
      setSelectedJudges([]);
    }
  };

  const handleBulkStatusUpdate = async (available: boolean) => {
    if (selectedJudges.length === 0) return;
    
    await bulkUpdateStatus({ judgeIds: selectedJudges, available });
    setSelectedJudges([]);
  };

  // Filter and sort judges based on search term and sort options
  const filteredAndSortedJudges = judges
    .filter(judge => 
      judge.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      judge.email && judge.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
      judge.phone && judge.phone.includes(searchTerm)
    )
    .sort((a, b) => {
      if (!sortField) return 0;
      
      let aValue: any = '';
      let bValue: any = '';
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'phone':
          aValue = (a.phone || '').toLowerCase();
          bValue = (b.phone || '').toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'available':
          aValue = a.available ? 1 : 0;
          bValue = b.available ? 1 : 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  
  if (isLoading) {
    return <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading judges...</div>
        </div>
      </div>;
  }

  if (!canView) {
    return <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">You don't have permission to view judges.</div>
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
            <Button variant="outline" onClick={() => navigate('/app/competition-portal/judges/judges_bulk_upload')}>
              <Upload className="w-4 h-4 mr-2" />
              Bulk Upload
            </Button>
            <Button onClick={handleCreateJudge}>
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
      {filteredAndSortedJudges.length === 0 ? <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              {judges.length === 0 ? 'No judges found.' : 'No judges match your search criteria.'}
            </div>
          </CardContent>
        </Card> : <Card>
          <CardContent className="py-[8px]">
            <JudgesTable 
              judges={filteredAndSortedJudges} 
              isLoading={isLoading} 
              onView={handleView}
              onEdit={handleEdit} 
              onDelete={handleDeleteClick}
              selectedJudges={selectedJudges}
              onSelectJudge={handleSelectJudge}
              onSelectAll={handleSelectAll}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              getSortIcon={getSortIcon}
            />
          </CardContent>
        </Card>}


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