import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { StandardTable, StandardTableHeader, StandardTableBody } from '@/components/ui/standard-table';
import { TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Contact } from '../ContactManagementPage';

interface ContactTableProps {
  contacts: Contact[];
  isLoading: boolean;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
}

export const ContactTable: React.FC<ContactTableProps> = ({
  contacts,
  isLoading,
  onEdit,
  onDelete,
}) => {
  const getStatusBadge = (status: Contact['status']) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      semi_active: 'bg-yellow-100 text-yellow-800',
      not_active: 'bg-red-100 text-red-800',
    };

    const labels = {
      active: 'Active',
      semi_active: 'Semi-Active',
      not_active: 'Not Active',
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getTypeBadge = (type: Contact['type']) => {
    const variants = {
      parent: 'bg-blue-100 text-blue-800',
      relative: 'bg-purple-100 text-purple-800',
      friend: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      parent: 'Parent',
      relative: 'Relative',
      friend: 'Friend',
    };

    return (
      <Badge className={variants[type]}>
        {labels[type]}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <StandardTable>
        <StandardTableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </StandardTableHeader>
        <StandardTableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
            </TableRow>
          ))}
        </StandardTableBody>
      </StandardTable>
    );
  }

  return (
    <StandardTable>
      <StandardTableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Email</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </StandardTableHeader>
      <StandardTableBody
        emptyMessage="No contacts found"
        colSpan={6}
      >
        {contacts.map((contact) => (
          <TableRow key={contact.id}>
            <TableCell className="font-medium">{contact.name}</TableCell>
            <TableCell>{getTypeBadge(contact.type)}</TableCell>
            <TableCell>{getStatusBadge(contact.status)}</TableCell>
            <TableCell>{contact.phone || '-'}</TableCell>
            <TableCell>{contact.email || '-'}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(contact)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit contact</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(contact.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete contact</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </StandardTableBody>
    </StandardTable>
  );
};