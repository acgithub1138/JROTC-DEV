import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  UserPlus, 
  Search, 
  Users, 
} from 'lucide-react';
import CreateUserDialog from './CreateUserDialog';
import { UserTable } from './components/UserTable';
import { BulkUserActions } from './components/BulkUserActions';
import { UserEditDialog } from './components/UserEditDialog';
import { UserConfirmationDialogs } from './components/UserConfirmationDialogs';
import { useUserManagement } from './hooks/useUserManagement';
import { useUserPermissions } from './hooks/useUserPermissions';
import { User } from './types';
import { useAuth } from '@/contexts/AuthContext';

const UserAdminPage = () => {
  const { userProfile } = useAuth();
  const {
    users,
    schools,
    loading,
    fetchUsers,
    handleToggleUserStatus,
    handleBulkToggle,
    handleResetPassword,
    updateUser,
  } = useUserManagement();

  const {
    getAllowedRoles,
    canCreateUsers,
    canEditUser,
    canDisableUser,
    canEnableUser,
    canResetPassword,
  } = useUserPermissions();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'active' | 'disabled'>('active');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [userToDisable, setUserToDisable] = useState<User | null>(null);
  const [bulkDisableLoading, setBulkDisableLoading] = useState(false);
  const [bulkDisableDialogOpen, setBulkDisableDialogOpen] = useState(false);
  
  // Bulk selection states
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const RECORDS_PER_PAGE = 25;

  const handleDisableUser = () => {
    if (!userToDisable) return;
    handleToggleUserStatus(userToDisable.id, false);
    setDisableDialogOpen(false);
    setUserToDisable(null);
    setSelectedUsers(new Set());
  };

  const handleEnableUser = (user: User) => {
    handleToggleUserStatus(user.id, true);
  };

  const handleBulkAction = async () => {
    setBulkDisableLoading(true);
    const isDisabling = activeTab === 'active';
    await handleBulkToggle(Array.from(selectedUsers), !isDisabling);
    setSelectedUsers(new Set());
    setBulkDisableDialogOpen(false);
    setBulkDisableLoading(false);
  };

  // Filter users based on search, school, and active tab
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSchool = selectedSchoolId === 'all' || user.school_id === selectedSchoolId;
    const matchesActiveTab = activeTab === 'active' ? user.active : !user.active;
    const isNotAdmin = user.role !== 'admin';
    
    return matchesSearch && matchesSchool && matchesActiveTab && isNotAdmin;
  });

  const totalPages = Math.ceil(filteredUsers.length / RECORDS_PER_PAGE);
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const endIndex = startIndex + RECORDS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const selectableUsers = paginatedUsers
        .filter(user => activeTab === 'active' ? canDisableUser(user) : canEnableUser(user))
        .map(user => user.id);
      setSelectedUsers(new Set(selectableUsers));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const selectableUsersOnPage = paginatedUsers.filter(user => 
    activeTab === 'active' ? canDisableUser(user) : canEnableUser(user)
  );
  const allSelectableSelected = selectableUsersOnPage.length > 0 && 
    selectableUsersOnPage.every(user => selectedUsers.has(user.id));

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedUsers(new Set()); // Clear selections when changing tabs/filters
  }, [searchTerm, selectedSchoolId, activeTab]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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

  const activeUsers = users.filter(u => u.active);
  const disabledUsers = users.filter(u => !u.active);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage users based on your role permissions
          </p>
        </div>
        {canCreateUsers() && (
          <CreateUserDialog 
            allowedRoles={getAllowedRoles()}
            trigger={
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            }
            onUserCreated={fetchUsers}
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'active' | 'disabled')}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="active">
                  Active ({activeUsers.length})
                </TabsTrigger>
                <TabsTrigger value="disabled">
                  Disabled ({disabledUsers.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="w-64">
                <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by school" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Schools</SelectItem>
                    {schools
                      .filter(school => school.name !== 'Carey Unlimited')
                      .map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="active">
              <BulkUserActions
                selectedCount={selectedUsers.size}
                activeTab={activeTab}
                onBulkAction={() => setBulkDisableDialogOpen(true)}
              />

              <UserTable
                users={paginatedUsers}
                activeTab={activeTab}
                selectedUsers={selectedUsers}
                onSelectUser={handleSelectUser}
                onSelectAll={handleSelectAll}
                allSelectableSelected={allSelectableSelected}
                canEditUser={canEditUser}
                canDisableUser={canDisableUser}
                canEnableUser={canEnableUser}
                onEditUser={(user) => {
                  setEditingUser(user);
                  setEditDialogOpen(true);
                }}
                onDisableUser={(user) => {
                  setUserToDisable(user);
                  setDisableDialogOpen(true);
                }}
                onEnableUser={handleEnableUser}
              />
            </TabsContent>

            <TabsContent value="disabled">
              <BulkUserActions
                selectedCount={selectedUsers.size}
                activeTab={activeTab}
                onBulkAction={() => setBulkDisableDialogOpen(true)}
              />

              <UserTable
                users={paginatedUsers}
                activeTab={activeTab}
                selectedUsers={selectedUsers}
                onSelectUser={handleSelectUser}
                onSelectAll={handleSelectAll}
                allSelectableSelected={allSelectableSelected}
                canEditUser={canEditUser}
                canDisableUser={canDisableUser}
                canEnableUser={canEnableUser}
                onEditUser={(user) => {
                  setEditingUser(user);
                  setEditDialogOpen(true);
                }}
                onDisableUser={(user) => {
                  setUserToDisable(user);
                  setDisableDialogOpen(true);
                }}
                onEnableUser={handleEnableUser}
              />
            </TabsContent>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found
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
          </Tabs>
        </CardContent>
      </Card>

      <UserEditDialog
        user={editingUser}
        schools={schools}
        allowedRoles={getAllowedRoles()}
        canResetPassword={canResetPassword}
        isAdmin={userProfile?.role === 'admin'}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUpdateUser={updateUser}
        onResetPassword={handleResetPassword}
      />

      <UserConfirmationDialogs
        disableDialogOpen={disableDialogOpen}
        bulkDialogOpen={bulkDisableDialogOpen}
        bulkLoading={bulkDisableLoading}
        userToDisable={userToDisable}
        selectedCount={selectedUsers.size}
        activeTab={activeTab}
        onDisableDialogChange={setDisableDialogOpen}
        onBulkDialogChange={setBulkDisableDialogOpen}
        onDisableUser={handleDisableUser}
        onBulkAction={handleBulkAction}
      />
    </div>
  );
};

export default UserAdminPage;