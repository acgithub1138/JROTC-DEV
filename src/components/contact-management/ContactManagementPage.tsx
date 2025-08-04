import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StandardTableWrapper } from '@/components/ui/standard-table';
import { ContactTable } from './components/ContactTable';
import { ContactCards } from './components/ContactCards';
import { AddContactDialog } from './components/AddContactDialog';
import { EditContactDialog } from './components/EditContactDialog';
import { ViewContactDialog } from './components/ViewContactDialog';
import { DeleteContactDialog } from './components/DeleteContactDialog';
import { useContacts } from './hooks/useContacts';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTablePermissions } from '@/hooks/useTablePermissions';

export interface Contact {
  id: string;
  school_id: string;
  cadet_id: string | null;
  name: string;
  status: 'active' | 'semi_active' | 'not_active';
  type: 'parent' | 'relative' | 'friend';
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

const ContactManagementPage = () => {
  const { canCreate } = useTablePermissions('contacts');
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const isMobile = useIsMobile();

  const {
    contacts,
    isLoading,
    createContact,
    updateContact,
    deleteContact,
  } = useContacts(searchValue);

  const handleDeleteContact = (contact: Contact) => {
    setDeletingContact(contact);
  };

  const handleConfirmDelete = async () => {
    if (!deletingContact) return;
    await deleteContact(deletingContact.id);
    setDeletingContact(null);
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
          {canCreate && (
            <Button onClick={() => setShowAddContact(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
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
            contacts={contacts}
            isLoading={isLoading}
            onEdit={setEditingContact}
            onDelete={handleDeleteContact}
          />
        ) : (
          <ContactTable
            contacts={contacts}
            isLoading={isLoading}
            onEdit={setEditingContact}
            onView={setViewingContact}
            onDelete={handleDeleteContact}
          />
        )}
      </StandardTableWrapper>

      <AddContactDialog
        open={showAddContact}
        onOpenChange={setShowAddContact}
        onSubmit={createContact}
      />

      {editingContact && (
        <EditContactDialog
          open={!!editingContact}
          onOpenChange={() => setEditingContact(null)}
          contact={editingContact}
          onSubmit={updateContact}
        />
      )}

      {viewingContact && (
        <ViewContactDialog
          open={!!viewingContact}
          onOpenChange={() => setViewingContact(null)}
          contact={viewingContact}
          onEdit={() => {
            setEditingContact(viewingContact);
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