import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Phone, Mail, User, Eye } from 'lucide-react';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { Contact } from '../ContactManagementPage';

interface ContactCardsProps {
  contacts: Contact[];
  isLoading: boolean;
  onEdit: (contact: Contact) => void;
  onView?: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onNavigateToRecord: (contact: Contact) => void;
  selectedContacts: string[];
  onSelectContact: (contactId: string) => void;
}

export const ContactCards: React.FC<ContactCardsProps> = ({
  contacts,
  isLoading,
  onEdit,
  onView,
  onDelete,
  onNavigateToRecord,
  selectedContacts,
  onSelectContact,
}) => {
  const { canEdit: canUpdate, canDelete, canViewDetails } = useTablePermissions('contacts');
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

    return (
      <Badge className={variants[type]}>
        {labels[type]}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No contacts found
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {contacts.map((contact) => (
        <Card key={contact.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {canDelete && (
                  <Checkbox
                    checked={selectedContacts.includes(contact.id)}
                    onCheckedChange={() => onSelectContact(contact.id)}
                    className="mt-1"
                  />
                )}
                <div className="flex-1">
                {canViewDetails ? (
                  <button
                    onClick={() => onNavigateToRecord(contact)}
                    className="text-blue-600 hover:text-blue-800 cursor-pointer underline-offset-4 hover:underline text-left"
                  >
                    <CardTitle className="text-lg">{contact.name}</CardTitle>
                  </button>
                ) : (
                  <CardTitle className="text-lg">{contact.name}</CardTitle>
                )}
                <div className="flex space-x-2 mt-1">
                  {getTypeBadge(contact.type, contact.type_other)}
                  {getStatusBadge(contact.status)}
                </div>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {contact.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{contact.phone}</span>
                </div>
              )}
              
              {contact.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{contact.email}</span>
                </div>
              )}

              {contact.notes && (
                <div className="text-sm text-gray-600">
                  <p className="line-clamp-2">{contact.notes}</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2 pt-2">
              {canViewDetails && onView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(contact)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}
              {canUpdate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(contact)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(contact)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};