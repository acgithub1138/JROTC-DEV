import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Check, X } from 'lucide-react';
import { ParsedContact } from '../../utils/contactCsvProcessor';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ContactDataPreviewTableProps {
  contacts: ParsedContact[];
  onUpdate: (id: string, updates: Partial<ParsedContact>) => void;
  onRemove: (id: string) => void;
}

export const ContactDataPreviewTable: React.FC<ContactDataPreviewTableProps> = ({
  contacts,
  onUpdate,
  onRemove,
}) => {
  const { userProfile } = useAuth();
  const [editingRow, setEditingRow] = useState<string | null>(null);

  // Fetch active cadets for matching
  const { data: cadets = [] } = useQuery({
    queryKey: ['active-cadets', userProfile?.school_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('school_id', userProfile?.school_id)
        .eq('active', true)
        .neq('role', 'parent')
        .order('last_name', { ascending: true });

      if (error) throw error;
      return data.map(c => ({
        id: c.id,
        full_name: `${c.last_name}, ${c.first_name}`
      }));
    },
    enabled: !!userProfile?.school_id
  });

  const handleSave = (id: string) => {
    setEditingRow(null);
  };

  const handleCancel = () => {
    setEditingRow(null);
  };

  return (
    <div className="flex-1 overflow-auto p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Cadet</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map(contact => (
            <TableRow key={contact.id} className={!contact.isValid ? 'bg-red-50' : ''}>
              <TableCell>
                {editingRow === contact.id ? (
                  <Input
                    value={contact.name}
                    onChange={e => onUpdate(contact.id, { name: e.target.value })}
                    className="h-8"
                  />
                ) : contact.name}
              </TableCell>
              <TableCell>
                {editingRow === contact.id ? (
                  <Input
                    value={contact.email}
                    onChange={e => onUpdate(contact.id, { email: e.target.value })}
                    className="h-8"
                    type="email"
                  />
                ) : contact.email}
              </TableCell>
              <TableCell>
                {editingRow === contact.id ? (
                  <Input
                    value={contact.phone || ''}
                    onChange={e => onUpdate(contact.id, { phone: e.target.value })}
                    className="h-8"
                    placeholder="(555) 555-5555"
                  />
                ) : contact.phone || '-'}
              </TableCell>
              <TableCell>
                {editingRow === contact.id ? (
                  <Select 
                    value={contact.type} 
                    onValueChange={value => onUpdate(contact.id, { type: value as any })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="relative">Relative</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className="capitalize">
                    {contact.type}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {editingRow === contact.id ? (
                  <Select 
                    value={contact.cadet_id || ''} 
                    onValueChange={value => onUpdate(contact.id, { cadet_id: value || undefined })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select cadet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {cadets.map(cadet => (
                        <SelectItem key={cadet.id} value={cadet.id}>
                          {cadet.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : contact.cadet || contact.cadet_id ? (
                  cadets.find(c => c.id === contact.cadet_id)?.full_name || contact.cadet || 'Unknown'
                ) : '-'}
              </TableCell>
              <TableCell>
                {contact.isValid ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Valid
                  </Badge>
                ) : (
                  <div className="flex flex-col gap-1">
                    <Badge variant="destructive">Invalid</Badge>
                    <span className="text-xs text-red-600">{contact.errors.join(', ')}</span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {editingRow === contact.id ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => handleSave(contact.id)}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancel}>
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => setEditingRow(contact.id)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onRemove(contact.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
