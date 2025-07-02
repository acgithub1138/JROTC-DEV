import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Search, Plus } from 'lucide-react';

import { useCadetManagement } from './hooks/useCadetManagement';
import { useCadetMassOperations } from './hooks/useCadetMassOperations';
import { CadetTable } from './components/CadetTable';
import { AddCadetDialog } from './components/AddCadetDialog';
import { EditCadetDialog } from './components/EditCadetDialog';
import { StatusConfirmationDialog } from './components/StatusConfirmationDialog';
import { MassUpdateToolbar } from './components/MassUpdateToolbar';
import { MassUpdateGradeDialog } from './components/MassUpdateGradeDialog';
import { MassUpdateRankDialog } from './components/MassUpdateRankDialog';
import { MassUpdateFlightDialog } from './components/MassUpdateFlightDialog';
import { MassDeactivateDialog } from './components/MassDeactivateDialog';
import { getFilteredProfiles, getPaginatedProfiles, getTotalPages } from './utils/cadetFilters';
import { Profile } from './types';

const CadetManagementPage = () => {
  const {
    profiles,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    activeTab,
    setActiveTab,
    statusLoading,
    newCadet,
    setNewCadet,
    handleToggleUserStatus,
    handleAddCadet,
    handleSaveProfile,
    fetchProfiles
  } = useCadetManagement();

  const {
    selectedCadets,
    massOperationLoading,
    handleSelectCadet,
    handleSelectAll,
    clearSelection,
    handleBulkUpdateGrade,
    handleBulkUpdateRank,
    handleBulkUpdateFlight,
    handleBulkDeactivate
  } = useCadetMassOperations();

  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [profileToToggle, setProfileToToggle] = useState<Profile | null>(null);

  // Mass operation dialog states
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [rankDialogOpen, setRankDialogOpen] = useState(false);
  const [flightDialogOpen, setFlightDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile(profile);
    setEditDialogOpen(true);
  };

  const handleSaveProfileWrapper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;

    await handleSaveProfile(editingProfile);
    setEditDialogOpen(false);
    setEditingProfile(null);
  };

  const handleToggleStatusWrapper = async () => {
    if (!profileToToggle) return;
    
    await handleToggleUserStatus(profileToToggle);
    setStatusDialogOpen(false);
    setProfileToToggle(null);
  };

  const handleMassUpdateGrade = async (grade: string) => {
    const success = await handleBulkUpdateGrade(grade);
    if (success) {
      fetchProfiles();
    }
    return success;
  };

  const handleMassUpdateRank = async (rank: string) => {
    const success = await handleBulkUpdateRank(rank);
    if (success) {
      fetchProfiles();
    }
    return success;
  };

  const handleMassUpdateFlight = async (flight: string) => {
    const success = await handleBulkUpdateFlight(flight);
    if (success) {
      fetchProfiles();
    }
    return success;
  };

  const handleMassDeactivate = async () => {
    const success = await handleBulkDeactivate();
    if (success) {
      fetchProfiles();
    }
    return success;
  };

  const filteredProfiles = getFilteredProfiles(profiles, activeTab, searchTerm);
  const totalPages = getTotalPages(filteredProfiles.length);
  const paginatedProfiles = getPaginatedProfiles(filteredProfiles, currentPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Clear selection when changing tabs or search
  React.useEffect(() => {
    clearSelection();
  }, [activeTab, searchTerm]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cadet Management</h2>
          <p className="text-muted-foreground">
            Manage cadets and command staff in your school
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Cadet
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Cadets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search cadets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">
                Active ({profiles.filter(p => p.active).length})
              </TabsTrigger>
              <TabsTrigger value="inactive">
                Non-Active ({profiles.filter(p => !p.active).length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-4">
              <MassUpdateToolbar
                selectedCount={selectedCadets.length}
                onUpdateGrade={() => setGradeDialogOpen(true)}
                onUpdateRank={() => setRankDialogOpen(true)}
                onUpdateFlight={() => setFlightDialogOpen(true)}
                onDeactivate={() => setDeactivateDialogOpen(true)}
                loading={massOperationLoading}
              />
              <CadetTable
                profiles={paginatedProfiles}
                activeTab={activeTab}
                onEditProfile={handleEditProfile}
                onToggleStatus={(profile) => {
                  setProfileToToggle(profile);
                  setStatusDialogOpen(true);
                }}
                selectedCadets={selectedCadets}
                onSelectCadet={handleSelectCadet}
                onSelectAll={(checked) => handleSelectAll(checked, paginatedProfiles)}
              />
            </TabsContent>

            <TabsContent value="inactive" className="mt-4">
              <CadetTable
                profiles={paginatedProfiles}
                activeTab={activeTab}
                onEditProfile={handleEditProfile}
                onToggleStatus={(profile) => {
                  setProfileToToggle(profile);
                  setStatusDialogOpen(true);
                }}
                selectedCadets={selectedCadets}
                onSelectCadet={handleSelectCadet}
                onSelectAll={(checked) => handleSelectAll(checked, paginatedProfiles)}
              />
            </TabsContent>
          </Tabs>

          {filteredProfiles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No cadets found
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (totalPages <= 7 || page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <StatusConfirmationDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        profileToToggle={profileToToggle}
        onConfirm={handleToggleStatusWrapper}
        loading={statusLoading}
      />

      <AddCadetDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        newCadet={newCadet}
        setNewCadet={setNewCadet}
        onSubmit={handleAddCadet}
      />

      <EditCadetDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editingProfile={editingProfile}
        setEditingProfile={setEditingProfile}
        onSubmit={handleSaveProfileWrapper}
      />

      <MassUpdateGradeDialog
        open={gradeDialogOpen}
        onOpenChange={setGradeDialogOpen}
        onSubmit={handleMassUpdateGrade}
        selectedCount={selectedCadets.length}
        loading={massOperationLoading}
      />

      <MassUpdateRankDialog
        open={rankDialogOpen}
        onOpenChange={setRankDialogOpen}
        onSubmit={handleMassUpdateRank}
        selectedCount={selectedCadets.length}
        loading={massOperationLoading}
      />

      <MassUpdateFlightDialog
        open={flightDialogOpen}
        onOpenChange={setFlightDialogOpen}
        onSubmit={handleMassUpdateFlight}
        selectedCount={selectedCadets.length}
        loading={massOperationLoading}
      />

      <MassDeactivateDialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
        onConfirm={handleMassDeactivate}
        selectedCount={selectedCadets.length}
        loading={massOperationLoading}
      />
    </div>
  );
};

export default CadetManagementPage;
