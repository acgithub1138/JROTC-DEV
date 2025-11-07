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
import { TablePagination } from '@/components/ui/table-pagination';
import { getPaginatedItems, getTotalPages } from '@/utils/pagination';

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
  const [currentPage, setCurrentPage] = useState(1);
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
    setCurrentPage(1);
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

  const paginatedContacts = getPaginatedItems(sortedContacts, currentPage);
  const totalPages = getTotalPages(sortedContacts.length);

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
    const paginatedIds = paginatedContacts.map(c => c.id);
    const allPaginatedSelected = paginatedIds.every(id => selectedContacts.includes(id));
    
    if (allPaginatedSelected) {
      // Deselect all from current page
      setSelectedContacts(prev => prev.filter(id => !paginatedIds.includes(id)));
    } else {
      // Select all from current page
      setSelectedContacts(prev => [...new Set([...prev, ...paginatedIds])]);
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
    <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-x-hidden min-w-0">
      <div className="space-y-3">
        <div className="flex justify-between items-start gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">Contact Management</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage school contacts including parents, relatives, and friends
            </p>
          </div>
          {/* Desktop buttons */}
          <div className="hidden sm:flex gap-2 flex-shrink-0">
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

        {/* Mobile buttons - Below header */}
        {isMobile && (
          <div className="space-y-2">
            {selectedContacts.length > 0 && canDeletePermission && (
              <Button 
                variant="destructive" 
                onClick={handleBulkDelete}
                className="w-full"
              >
                Delete Selected ({selectedContacts.length})
              </Button>
            )}
            {canCreate && (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => navigate('/app/contacts/bulk-import')} className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Import
                </Button>
                <Button onClick={handleAddContact} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <StandardTableWrapper
        title=""
        description=""
        searchValue={searchValue}
        onSearchChange={(value) => {
          setSearchValue(value);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search contacts by name, email, or phone..."
      >
        {isMobile ? (
          <ContactCards
            contacts={paginatedContacts}
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
            contacts={paginatedContacts}
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
        
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedContacts.length}
          onPageChange={setCurrentPage}
        />
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