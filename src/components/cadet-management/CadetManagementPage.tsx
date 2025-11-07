import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus } from 'lucide-react';
import { useCadetManagement } from './hooks/useCadetManagement';
import { useCadetMassOperations } from './hooks/useCadetMassOperations';
import { useCadetPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useAuth } from '@/contexts/AuthContext';
import { CadetPageHeader } from './components/CadetPageHeader';
import { CadetSearchBar } from './components/CadetSearchBar';
import { CadetTabsContent } from './components/CadetTabsContent';
import { TablePagination } from '@/components/ui/table-pagination';
import { CadetDialogs } from './components/CadetDialogs';
import { ViewCadetDialog } from './components/ViewCadetDialog';
import { PasswordRecoveryDialog } from './components/PasswordRecoveryDialog';
import { getFilteredProfiles, getPaginatedProfiles, getTotalPages } from './utils/cadetFilters';
import { Profile } from './types';
import { useSortableTable } from '@/hooks/useSortableTable';
import { SortConfig } from '@/components/ui/sortable-table';
const CadetManagementPage = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const {
    canUpdate,
    canCreate
  } = useCadetPermissions();
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
  
  // New state for sub-tab management
  const [activeSubTab, setActiveSubTab] = useState('active');
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
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<Profile | null>(null);
  const [passwordRecoveryOpen, setPasswordRecoveryOpen] = useState(false);
  // Removed PT Test dialog states - now using pages
  const handleOpenPTTestDialog = () => navigate('/app/cadets/pt_test_create?mode=single');
  const handleOpenPTTestBulkDialog = () => navigate('/app/cadets/pt_test_create?mode=bulk');

  // Mass operation dialog states
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [rankDialogOpen, setRankDialogOpen] = useState(false);
  const [flightDialogOpen, setFlightDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const handleEditProfile = (profile: Profile) => {
    if (!canUpdate) return;
    navigate(`/app/cadets/cadet_record?mode=edit&id=${profile.id}`);
  };
  const handleViewProfile = (profile: Profile) => {
    navigate(`/app/cadets/cadet_record?mode=view&id=${profile.id}`);
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
  const handleAddCadetWrapper = (e: React.FormEvent) => {
    handleAddCadet(e, () => setAddDialogOpen(false));
  };
  
  // Step 1: Filter profiles
  const filteredProfiles = getFilteredProfiles(profiles, activeTab, activeSubTab, searchTerm);
  
  // Step 2: Sort filtered profiles (BEFORE pagination)
  const { sortedData: sortedProfiles, sortConfig, handleSort } = useSortableTable({
    data: filteredProfiles,
    defaultSort: { key: 'last_name', direction: 'asc' }
  });
  
  // Step 3: Paginate sorted profiles
  const totalPages = getTotalPages(sortedProfiles.length);
  const paginatedProfiles = getPaginatedProfiles(sortedProfiles, currentPage);
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Clear selection when changing tabs or search
  React.useEffect(() => {
    clearSelection();
  }, [activeTab, activeSubTab, searchTerm]);
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
      <CadetPageHeader 
        onAddCadet={() => navigate('/app/cadets/cadet_record?mode=create')} 
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CadetSearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {userProfile?.user_roles?.role_name === 'admin' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPasswordRecoveryOpen(true)}
                  className="text-orange-600 border-orange-600 hover:bg-orange-50 w-full sm:w-auto"
                >
                  Fix Missing Passwords
                </Button>
              )}
              <div className="text-sm text-muted-foreground text-left">New users will get their password in an email and must reset it when they log in.</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>

          <CadetTabsContent 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            activeSubTab={activeSubTab}
            onSubTabChange={setActiveSubTab}
            profiles={profiles} 
            paginatedProfiles={paginatedProfiles}
            sortConfig={sortConfig}
            onSort={handleSort}
            selectedCadets={selectedCadets} 
            massOperationLoading={massOperationLoading} 
            onEditProfile={handleEditProfile} 
            onViewProfile={handleViewProfile} 
            onToggleStatus={profile => {
              setProfileToToggle(profile);
              setStatusDialogOpen(true);
            }} 
            onSelectCadet={handleSelectCadet} 
            onSelectAll={checked => handleSelectAll(checked, paginatedProfiles)} 
            onRefresh={fetchProfiles} 
            onOpenPTTestDialog={() => navigate('/app/cadets/pt_test_create?mode=bulk')} 
            searchTerm={searchTerm}
            onOpenDeactivateDialog={() => setDeactivateDialogOpen(true)} 
          />

          {sortedProfiles.length === 0 && <div className="text-center py-8 text-muted-foreground">
              No cadets found
            </div>}

          <TablePagination currentPage={currentPage} totalPages={totalPages} totalItems={sortedProfiles.length} onPageChange={handlePageChange} />
        </CardContent>
      </Card>

      <CadetDialogs addDialogOpen={addDialogOpen} setAddDialogOpen={setAddDialogOpen} newCadet={newCadet} setNewCadet={setNewCadet} onAddCadet={handleAddCadetWrapper} editDialogOpen={editDialogOpen} setEditDialogOpen={setEditDialogOpen} editingProfile={editingProfile} setEditingProfile={setEditingProfile} onRefresh={fetchProfiles} statusDialogOpen={statusDialogOpen} setStatusDialogOpen={setStatusDialogOpen} profileToToggle={profileToToggle} onToggleStatus={handleToggleStatusWrapper} statusLoading={statusLoading} bulkImportDialogOpen={bulkImportDialogOpen} setBulkImportDialogOpen={setBulkImportDialogOpen} onBulkImport={handleBulkImport} gradeDialogOpen={gradeDialogOpen} setGradeDialogOpen={setGradeDialogOpen} rankDialogOpen={rankDialogOpen} setRankDialogOpen={setRankDialogOpen} flightDialogOpen={flightDialogOpen} setFlightDialogOpen={setFlightDialogOpen} roleDialogOpen={roleDialogOpen} setRoleDialogOpen={setRoleDialogOpen} deactivateDialogOpen={deactivateDialogOpen} setDeactivateDialogOpen={setDeactivateDialogOpen} selectedCount={selectedCadets.length} massOperationLoading={massOperationLoading} onMassUpdateGrade={handleMassUpdateGrade} onMassUpdateRank={handleMassUpdateRank} onMassUpdateFlight={handleMassUpdateFlight} onMassUpdateRole={handleMassUpdateRole} onMassDeactivate={handleMassDeactivate} />
      
      <ViewCadetDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen} profile={viewingProfile} onEditProfile={handleEditProfile} />
      
      <PasswordRecoveryDialog 
        open={passwordRecoveryOpen} 
        onOpenChange={setPasswordRecoveryOpen} 
      />
      
      {/* PT Test dialog removed - now using pages */}
    </div>;
};
export default CadetManagementPage;