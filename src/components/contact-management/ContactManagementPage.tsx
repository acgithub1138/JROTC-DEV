import React, { useState } from 'react';
import { Plus, ArrowUpDown, ArrowUp, ArrowDown, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StandardTableWrapper } from '@/components/ui/standard-table';
import { ContactTable } from './components/ContactTable';
import { ContactCards } from './components/ContactCards';
import { ViewContactDialog } from './components/ViewContactDialog';
import { DeleteContactDialog } from './components/DeleteContactDialog';
import { useContacts } from './hooks/useContacts';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export interface Contact {
  id: string;
  school_id: string;
  cadet_id: string | null;
  name: string;
  status: 'active' | 'semi_active' | 'not_active';
  type: 'parent' | 'relative' | 'friend' | 'other';
  type_other: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

const ContactManagementPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canCreate, canDelete: canDeletePermission } = useTablePermissions('contacts');
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const isMobile = useIsMobile();

  const {
    contacts,
    isLoading,
    deleteContact,
  } = useContacts(searchValue);

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

  const sortedContacts = contacts.sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue: any = '';
    let bValue: any = '';
    
    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'type':
        aValue = a.type;
        bValue = b.type;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'phone':
        aValue = (a.phone || '').toLowerCase();
        bValue = (b.phone || '').toLowerCase();
        break;
      case 'email':
        aValue = (a.email || '').toLowerCase();
        bValue = (b.email || '').toLowerCase();
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleAddContact = () => {
    navigate('/app/contacts/contact_record?mode=create');
  };

  const handleEditContact = (contact: Contact) => {
    navigate(`/app/contacts/contact_record?mode=edit&id=${contact.id}`);
  };

  const handleViewContact = (contact: Contact) => {
    navigate(`/app/contacts/contact_record?mode=view&id=${contact.id}`);
  };

  const handleDeleteContact = (contact: Contact) => {
    setDeletingContact(contact);
  };

  const handleConfirmDelete = async () => {
    if (!deletingContact) return;
    await deleteContact(deletingContact.id);
    setDeletingContact(null);
  };

  const handleSelectContact = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === sortedContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(sortedContacts.map(c => c.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) return;
    
    const count = selectedContacts.length;
    let successCount = 0;
    let failCount = 0;
    
    // Delete all selected contacts without showing individual toasts
    for (const contactId of selectedContacts) {
      try {
        await deleteContact(contactId, false);
        successCount++;
      } catch (error) {
        failCount++;
      }
    }
    
    setSelectedContacts([]);
    
    // Show single toast with results
    if (failCount === 0) {
      toast({
        title: "Success",
        description: `${successCount} contact${successCount > 1 ? 's' : ''} deleted successfully`,
      });
    } else if (successCount > 0) {
      toast({
        title: "Partially Complete",
        description: `${successCount} contact${successCount > 1 ? 's' : ''} deleted, ${failCount} failed`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Error",
        description: `Failed to delete ${failCount} contact${failCount > 1 ? 's' : ''}`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contact Management</h2>
          <p className="text-muted-foreground">
            Manage school contacts including parents, relatives, and friends
          </p>
        </div>
        <div className="flex gap-2">
          {selectedContacts.length > 0 && canDeletePermission && (
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
            >
              Delete Selected ({selectedContacts.length})
            </Button>
          )}
          {canCreate && (
            <>
              <Button variant="outline" onClick={() => navigate('/app/contacts/bulk-import')}>
                <Upload className="w-4 h-4 mr-2" />
                Bulk Import
              </Button>
              <Button onClick={handleAddContact}>
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </>
          )}
        </div>
      </div>

      <StandardTableWrapper
        title=""
        description=""
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Search contacts by name, email, or phone..."
      >
        {isMobile ? (
          <ContactCards
            contacts={sortedContacts}
            isLoading={isLoading}
            onEdit={handleEditContact}
            onView={setViewingContact}
            onNavigateToRecord={handleViewContact}
            onDelete={handleDeleteContact}
            selectedContacts={selectedContacts}
            onSelectContact={handleSelectContact}
          />
        ) : (
          <ContactTable
            contacts={sortedContacts}
            isLoading={isLoading}
            onEdit={handleEditContact}
            onView={setViewingContact}
            onNavigateToRecord={handleViewContact}
            onDelete={handleDeleteContact}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            getSortIcon={getSortIcon}
            selectedContacts={selectedContacts}
            onSelectContact={handleSelectContact}
            onSelectAll={handleSelectAll}
          />
        )}
      </StandardTableWrapper>

      {viewingContact && (
        <ViewContactDialog
          open={!!viewingContact}
          onOpenChange={() => setViewingContact(null)}
          contact={viewingContact}
          onEdit={() => {
            handleEditContact(viewingContact);
            setViewingContact(null);
          }}
        />
      )}

      <DeleteContactDialog 
        open={!!deletingContact} 
        onOpenChange={() => setDeletingContact(null)} 
        contact={deletingContact} 
        onConfirm={handleConfirmDelete} 
        loading={false}
      />
    </div>
  );
};

export default ContactManagementPage;