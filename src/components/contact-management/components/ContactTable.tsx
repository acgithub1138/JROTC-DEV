import React from 'react';
import { StandardTable, StandardTableHeader, StandardTableBody } from '@/components/ui/standard-table';
import { TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TableActionButtons } from '@/components/ui/table-action-buttons';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { Contact } from '../ContactManagementPage';
interface ContactTableProps {
  contacts: Contact[];
  isLoading: boolean;
  onEdit: (contact: Contact) => void;
  onView: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onNavigateToRecord: (contact: Contact) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  getSortIcon?: (field: string) => React.ReactNode;
  selectedContacts: string[];
  onSelectContact: (contactId: string) => void;
  onSelectAll: () => void;
}
export const ContactTable: React.FC<ContactTableProps> = ({
  contacts,
  isLoading,
  onEdit,
  onView,
  onDelete,
  onNavigateToRecord,
  sortField,
  sortDirection,
  onSort,
  getSortIcon,
  selectedContacts,
  onSelectContact,
  onSelectAll
}) => {
  const {
    canEdit: canUpdate,
    canDelete,
    canViewDetails
  } = useTablePermissions('contacts');
  const getStatusBadge = (status: Contact['status']) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      semi_active: 'bg-yellow-100 text-yellow-800',
      not_active: 'bg-red-100 text-red-800'
    };
    const labels = {
      active: 'Active',
      semi_active: 'Semi-Active',
      not_active: 'Not Active'
    };
    return <Badge className={variants[status]}>
        {labels[status]}
      </Badge>;
  };
  const getTypeBadge = (type: Contact['type'], typeOther?: string | null) => {
    const variants = {
      parent: 'bg-blue-100 text-blue-800',
      relative: 'bg-purple-100 text-purple-800',
      friend: 'bg-gray-100 text-gray-800',
      other: 'bg-orange-100 text-orange-800',
    };
    const labels = {
      parent: 'Parent',
      relative: 'Relative',
      friend: 'Friend',
      other: typeOther || 'Other',
    };
    return <Badge className={variants[type]}>
        {labels[type]}
      </Badge>;
  };
  if (isLoading) {
    return <StandardTable>
        <StandardTableHeader>
          <TableRow>
            {canDelete && <TableHead className="w-12"></TableHead>}
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </StandardTableHeader>
        <StandardTableBody>
          {[...Array(5)].map((_, i) => <TableRow key={i}>
              {canDelete && <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>}
              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
            </TableRow>)}
        </StandardTableBody>
      </StandardTable>;
  }
  return <StandardTable>
      <StandardTableHeader>
        <TableRow>
          {canDelete && (
            <TableHead className="w-12">
              <Checkbox
                checked={selectedContacts.length === contacts.length && contacts.length > 0}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
          )}
          <TableHead>
            {onSort ? (
              <button 
                onClick={() => onSort('name')}
                className="flex items-center gap-2 hover:text-foreground font-medium"
              >
                Name {getSortIcon?.('name')}
              </button>
            ) : (
              'Name'
            )}
          </TableHead>
          <TableHead>
            {onSort ? (
              <button 
                onClick={() => onSort('type')}
                className="flex items-center gap-2 hover:text-foreground font-medium"
              >
                Type {getSortIcon?.('type')}
              </button>
            ) : (
              'Type'
            )}
          </TableHead>
          <TableHead>
            {onSort ? (
              <button 
                onClick={() => onSort('status')}
                className="flex items-center gap-2 hover:text-foreground font-medium"
              >
                Status {getSortIcon?.('status')}
              </button>
            ) : (
              'Status'
            )}
          </TableHead>
          <TableHead>
            {onSort ? (
              <button 
                onClick={() => onSort('phone')}
                className="flex items-center gap-2 hover:text-foreground font-medium"
              >
                Phone {getSortIcon?.('phone')}
              </button>
            ) : (
              'Phone'
            )}
          </TableHead>
          <TableHead>
            {onSort ? (
              <button 
                onClick={() => onSort('email')}
                className="flex items-center gap-2 hover:text-foreground font-medium"
              >
                Email {getSortIcon?.('email')}
              </button>
            ) : (
              'Email'
            )}
          </TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      </StandardTableHeader>
      <StandardTableBody emptyMessage="No contacts found" colSpan={canDelete ? 7 : 6}>
        {contacts.map(contact => <TableRow key={contact.id}>
            {canDelete && (
              <TableCell className="py-[8px]">
                <Checkbox
                  checked={selectedContacts.includes(contact.id)}
                  onCheckedChange={() => onSelectContact(contact.id)}
                />
              </TableCell>
            )}
            <TableCell className="font-medium py-[8px]">
              {canViewDetails ? (
                <button
                  onClick={() => onNavigateToRecord(contact)}
                  className="text-blue-600 hover:text-blue-800 cursor-pointer underline-offset-4 hover:underline text-left font-medium"
                >
                  {contact.name}
                </button>
              ) : (
                <span className="font-medium">{contact.name}</span>
              )}
            </TableCell>
            <TableCell>{getTypeBadge(contact.type, contact.type_other)}</TableCell>
            <TableCell>{getStatusBadge(contact.status)}</TableCell>
            <TableCell>{contact.phone || '-'}</TableCell>
            <TableCell>{contact.email || '-'}</TableCell>
            <TableCell>
               <TableActionButtons
                 canView={false}
                 canEdit={canUpdate}
                 canDelete={canDelete}
                 onEdit={() => onEdit(contact)}
                 onDelete={() => onDelete(contact)}
               />
            </TableCell>
          </TableRow>)}
      </StandardTableBody>
    </StandardTable>;
};