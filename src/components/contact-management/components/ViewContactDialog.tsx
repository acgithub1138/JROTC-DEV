import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, Mail, FileText, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '../ContactManagementPage';

interface ViewContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
  onEdit?: () => void;
}

interface Cadet {
  id: string;
  first_name: string;
  last_name: string;
}

export const ViewContactDialog: React.FC<ViewContactDialogProps> = ({
  open,
  onOpenChange,
  contact,
  onEdit,
}) => {
  const { userProfile } = useAuth();
  const { canEdit: canUpdate } = useTablePermissions('contacts');
  const [cadet, setCadet] = useState<Cadet | null>(null);

  useEffect(() => {
    const fetchCadet = async () => {
      if (!contact.cadet_id || !userProfile?.school_id) return;

      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', contact.cadet_id)
        .eq('school_id', userProfile.school_id)
        .single();

      setCadet(data);
    };

    if (open && contact.cadet_id) {
      fetchCadet();
    } else {
      setCadet(null);
    }
  }, [open, contact.cadet_id, userProfile?.school_id]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Contact Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-base font-medium">{contact.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <div className="mt-1">{getTypeBadge(contact.type, contact.type_other)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(contact.status)}</div>
                </div>
              </div>

              {cadet && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Associated Cadet</label>
                  <p className="text-base">{cadet.last_name}, {cadet.first_name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-base">{contact.phone || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-base">{contact.email || 'Not provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {contact.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base whitespace-pre-wrap">{contact.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {canUpdate && onEdit && (
              <Button onClick={onEdit} className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};