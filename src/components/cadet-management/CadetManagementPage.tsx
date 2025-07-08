import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { useCadetManagement } from './hooks/useCadetManagement';
import { useCadetMassOperations } from './hooks/useCadetMassOperations';
import { CadetPageHeader } from './components/CadetPageHeader';
import { CadetSearchBar } from './components/CadetSearchBar';
import { CadetTabsContent } from './components/CadetTabsContent';
import { TablePagination } from '@/components/ui/table-pagination';
import { CadetDialogs } from './components/CadetDialogs';
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
    handleBulkImport,
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
    handleBulkUpdateRole,
    handleBulkDeactivate
  } = useCadetMassOperations();
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [bulkImportDialogOpen, setBulkImportDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [profileToToggle, setProfileToToggle] = useState<Profile | null>(null);

  // Mass operation dialog states
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [rankDialogOpen, setRankDialogOpen] = useState(false);
  const [flightDialogOpen, setFlightDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
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
  const handleMassUpdateRole = async (role: string) => {
    const success = await handleBulkUpdateRole(role);
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
    return <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded"></div>)}
          </div>
        </div>
      </div>;
  }
  return <div className="p-6 space-y-6">
      <CadetPageHeader onAddCadet={() => setAddDialogOpen(true)} onBulkImport={() => setBulkImportDialogOpen(true)} />

      <Card>
        <CardHeader>Default password:
Sh0wc@se
Users will be asked to reset their password when they first log in.</CardHeader>
        <CardContent>
          <CadetSearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

          <CadetTabsContent activeTab={activeTab} onTabChange={setActiveTab} profiles={profiles} paginatedProfiles={paginatedProfiles} selectedCadets={selectedCadets} massOperationLoading={massOperationLoading} onEditProfile={handleEditProfile} onToggleStatus={profile => {
          setProfileToToggle(profile);
          setStatusDialogOpen(true);
        }} onSelectCadet={handleSelectCadet} onSelectAll={checked => handleSelectAll(checked, paginatedProfiles)} onUpdateGrade={() => setGradeDialogOpen(true)} onUpdateRank={() => setRankDialogOpen(true)} onUpdateFlight={() => setFlightDialogOpen(true)} onUpdateRole={() => setRoleDialogOpen(true)} onDeactivate={() => setDeactivateDialogOpen(true)} />

          {filteredProfiles.length === 0 && <div className="text-center py-8 text-muted-foreground">
              No cadets found
            </div>}

          <TablePagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredProfiles.length} onPageChange={handlePageChange} />
        </CardContent>
      </Card>

      <CadetDialogs addDialogOpen={addDialogOpen} setAddDialogOpen={setAddDialogOpen} newCadet={newCadet} setNewCadet={setNewCadet} onAddCadet={handleAddCadet} editDialogOpen={editDialogOpen} setEditDialogOpen={setEditDialogOpen} editingProfile={editingProfile} setEditingProfile={setEditingProfile} onSaveProfile={handleSaveProfileWrapper} statusDialogOpen={statusDialogOpen} setStatusDialogOpen={setStatusDialogOpen} profileToToggle={profileToToggle} onToggleStatus={handleToggleStatusWrapper} statusLoading={statusLoading} bulkImportDialogOpen={bulkImportDialogOpen} setBulkImportDialogOpen={setBulkImportDialogOpen} onBulkImport={handleBulkImport} gradeDialogOpen={gradeDialogOpen} setGradeDialogOpen={setGradeDialogOpen} rankDialogOpen={rankDialogOpen} setRankDialogOpen={setRankDialogOpen} flightDialogOpen={flightDialogOpen} setFlightDialogOpen={setFlightDialogOpen} roleDialogOpen={roleDialogOpen} setRoleDialogOpen={setRoleDialogOpen} deactivateDialogOpen={deactivateDialogOpen} setDeactivateDialogOpen={setDeactivateDialogOpen} selectedCount={selectedCadets.length} massOperationLoading={massOperationLoading} onMassUpdateGrade={handleMassUpdateGrade} onMassUpdateRank={handleMassUpdateRank} onMassUpdateFlight={handleMassUpdateFlight} onMassUpdateRole={handleMassUpdateRole} onMassDeactivate={handleMassDeactivate} />
    </div>;
};
export default CadetManagementPage;