import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, X, UserPlus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { User } from '../types';
import { getRoleIcon, getRoleColor } from './UserRoleUtils';

interface UserTableProps {
  users: User[];
  activeTab: 'active' | 'disabled';
  selectedUsers: Set<string>;
  onSelectUser: (userId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  allSelectableSelected: boolean;
  canEditUser: (user: User) => boolean;
  canDisableUser: (user: User) => boolean;
  canEnableUser: (user: User) => boolean;
  sortField?: 'name' | 'role' | 'school' | 'created';
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: 'name' | 'role' | 'school' | 'created') => void;
  onEditUser: (user: User) => void;
  onDisableUser: (user: User) => void;
  onEnableUser: (user: User) => void;
}

export const UserTable = ({
  users,
  activeTab,
  selectedUsers,
  onSelectUser,
  onSelectAll,
  allSelectableSelected,
  canEditUser,
  canDisableUser,
  canEnableUser,
  sortField = 'name',
  sortDirection = 'asc',
  onSort,
  onEditUser,
  onDisableUser,
  onEnableUser,
}: UserTableProps) => {
  const isMobile = useIsMobile();
  const getSortIcon = (field: string) => {
    if (!onSort || sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 ml-1" /> : 
      <ArrowDown className="w-4 h-4 ml-1" />;
  };

  const handleHeaderClick = (field: 'name' | 'role' | 'school' | 'created') => {
    if (onSort) {
      onSort(field);
    }
  };
  if (isMobile) {
    // Mobile Card View
    return (
      <div className="space-y-4">
        {users.map((user) => (
          <Card key={user.id} className={activeTab === 'disabled' ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {(activeTab === 'active' ? canDisableUser(user) : canEnableUser(user)) && (
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={(checked) => onSelectUser(user.id, checked as boolean)}
                      aria-label={`Select ${user.first_name} ${user.last_name}`}
                    />
                  )}
                  <h3 className="font-semibold text-lg">
                    {user.first_name} {user.last_name}
                  </h3>
                </div>
                <div className="flex gap-2">
                  {canEditUser(user) && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => onEditUser(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit user</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {activeTab === 'active' && canDisableUser(user) && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon" 
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:border-red-300"
                            onClick={() => onDisableUser(user)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Disable user</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {activeTab === 'disabled' && canEnableUser(user) && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => onEnableUser(user)}
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Enable user</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Role:</span>
                  <Badge variant="secondary" className={`${getRoleColor(user.user_roles?.role_name || user.role)} flex items-center gap-1 w-fit`}>
                    {getRoleIcon(user.user_roles?.role_name || user.role)}
                    {(user.user_roles?.role_name || user.role).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">School:</span>
                  <span className="text-right">{user.schools?.name || 'No school assigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop Table View
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={allSelectableSelected}
              onCheckedChange={onSelectAll}
              aria-label="Select all users"
            />
          </TableHead>
          <TableHead 
            className="cursor-pointer hover:bg-muted/50 select-none"
            onClick={() => handleHeaderClick('name')}
          >
            <div className="flex items-center">
              Name
              {getSortIcon('name')}
            </div>
          </TableHead>
          <TableHead 
            className="cursor-pointer hover:bg-muted/50 select-none"
            onClick={() => handleHeaderClick('role')}
          >
            <div className="flex items-center">
              Role
              {getSortIcon('role')}
            </div>
          </TableHead>
          <TableHead 
            className="cursor-pointer hover:bg-muted/50 select-none"
            onClick={() => handleHeaderClick('school')}
          >
            <div className="flex items-center">
              School
              {getSortIcon('school')}
            </div>
          </TableHead>
          <TableHead 
            className="cursor-pointer hover:bg-muted/50 select-none"
            onClick={() => handleHeaderClick('created')}
          >
            <div className="flex items-center">
              Created
              {getSortIcon('created')}
            </div>
          </TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id} className={activeTab === 'disabled' ? 'opacity-60' : ''}>
            <TableCell className="py-2">
              {(activeTab === 'active' ? canDisableUser(user) : canEnableUser(user)) ? (
                <Checkbox
                  checked={selectedUsers.has(user.id)}
                  onCheckedChange={(checked) => onSelectUser(user.id, checked as boolean)}
                  aria-label={`Select ${user.first_name} ${user.last_name}`}
                />
              ) : null}
            </TableCell>
            <TableCell className="font-medium py-2">
              {user.first_name} {user.last_name}
            </TableCell>
            
            <TableCell className="py-2">
              <Badge variant="secondary" className={`${getRoleColor(user.user_roles?.role_name || user.role)} flex items-center gap-1 w-fit`}>
                {getRoleIcon(user.user_roles?.role_name || user.role)}
                {(user.user_roles?.role_name || user.role).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </TableCell>
            <TableCell className="py-2">
              {user.schools?.name || 'No school assigned'}
            </TableCell>
            <TableCell className="py-2">
              {new Date(user.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right py-2">
              <div className="flex items-center justify-center gap-2">
                {canEditUser(user) && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon" className="h-6 w-6"
                          onClick={() => onEditUser(user)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit user</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {activeTab === 'active' && canDisableUser(user) && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300"
                          onClick={() => onDisableUser(user)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Disable user</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {activeTab === 'disabled' && canEnableUser(user) && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon" className="h-6 w-6"
                          onClick={() => onEnableUser(user)}
                        >
                          <UserPlus className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enable user</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};