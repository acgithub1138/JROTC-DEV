import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, UserX, UserPlus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
          <TableHead className="text-right">Actions</TableHead>
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
              <Badge variant="secondary" className={`${getRoleColor(user.role)} flex items-center gap-1 w-fit`}>
                {getRoleIcon(user.role)}
                {user.role.replace('_', ' ').toUpperCase()}
              </Badge>
            </TableCell>
            <TableCell className="py-2">
              {user.schools?.name || 'No school assigned'}
            </TableCell>
            <TableCell className="py-2">
              {new Date(user.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right py-2">
              <div className="flex items-center justify-end gap-2">
                {canEditUser(user) && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
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
                          size="sm"
                          onClick={() => onDisableUser(user)}
                        >
                          <UserX className="w-4 h-4" />
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
                          variant="default"
                          size="sm"
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};