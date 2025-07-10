import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StandardTableWrapper } from '@/components/ui/standard-table';
import { ContactTable } from './components/ContactTable';
import { ContactCards } from './components/ContactCards';
import { AddContactDialog } from './components/AddContactDialog';
import { EditContactDialog } from './components/EditContactDialog';
import { useContacts } from './hooks/useContacts';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserPermissions } from '@/hooks/useUserPermissions';

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
  const { canCreate } = useUserPermissions();
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const isMobile = useIsMobile();

  const {
    contacts,
    isLoading,
    createContact,
    updateContact,
    deleteContact,
  } = useContacts(searchValue);

  return (
    <div className="p-6 space-y-6">
      <StandardTableWrapper
        title="Contact Management"
        description="Manage school contacts including parents, relatives, and friends"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Search contacts by name, email, or phone..."
        actions={
          canCreate('contacts') ? (
            <Button onClick={() => setShowAddContact(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          ) : undefined
        }
      >
        {isMobile ? (
          <ContactCards
            contacts={contacts}
            isLoading={isLoading}
            onEdit={setEditingContact}
            onDelete={deleteContact}
          />
        ) : (
          <ContactTable
            contacts={contacts}
            isLoading={isLoading}
            onEdit={setEditingContact}
            onDelete={deleteContact}
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
    </div>
  );
};

export default ContactManagementPage;