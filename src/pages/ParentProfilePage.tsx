import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useParentContact } from '@/hooks/useParentContact';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, Phone, User, UserCircle, Edit2, X, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
const ParentProfilePage = () => {
  const {
    contact,
    isLoading,
    refetch
  } = useParentContact();
  const { toast } = useToast();
  
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [tempEmail, setTempEmail] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleEditEmail = () => {
    setTempEmail(contact?.email || '');
    setIsEditingEmail(true);
  };

  const handleEditPhone = () => {
    setTempPhone(contact?.phone || '');
    setIsEditingPhone(true);
  };

  const handleCancelEmail = () => {
    setIsEditingEmail(false);
    setTempEmail('');
  };

  const handleCancelPhone = () => {
    setIsEditingPhone(false);
    setTempPhone('');
  };

  const handleSaveEmail = async () => {
    if (!contact?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ email: tempEmail })
        .eq('id', contact.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Email updated successfully',
      });
      
      setIsEditingEmail(false);
      refetch();
    } catch (error) {
      console.error('Error updating email:', error);
      toast({
        title: 'Error',
        description: 'Failed to update email',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePhone = async () => {
    if (!contact?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ phone: tempPhone })
        .eq('id', contact.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Phone updated successfully',
      });
      
      setIsEditingPhone(false);
      refetch();
    } catch (error) {
      console.error('Error updating phone:', error);
      toast({
        title: 'Error',
        description: 'Failed to update phone',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  if (isLoading) {
    return <div className="p-6 space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
          <p className="text-muted-foreground">View your contact information</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  if (!contact) {
    return <div className="p-6 space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
          <p className="text-muted-foreground">View your contact information</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">No contact information found.</p>
          </CardContent>
        </Card>
      </div>;
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success text-success-foreground';
      case 'semi_active':
        return 'bg-warning text-warning-foreground';
      case 'not_active':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'semi_active':
        return 'Semi-Active';
      case 'not_active':
        return 'Not Active';
      default:
        return status;
    }
  };
  const getTypeLabel = (type: string, typeOther: string | null) => {
    if (type === 'other' && typeOther) {
      return typeOther;
    }
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  return <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
        <p className="text-muted-foreground">View your contact information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="w-5 h-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="w-4 h-4" />
              Name
            </div>
            <p className="text-lg font-medium">{contact.name}</p>
          </div>

          {/* Type */}
          

          {/* Status */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Status</div>
            <Badge className={getStatusColor(contact.status)}>
              {getStatusLabel(contact.status)}
            </Badge>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Phone className="w-4 h-4" />
              Phone
            </div>
            {isEditingPhone ? (
              <div className="flex items-center gap-2">
                <Input
                  type="tel"
                  value={tempPhone}
                  onChange={(e) => setTempPhone(e.target.value)}
                  className="flex-1"
                  disabled={isSaving}
                />
                <Button
                  size="sm"
                  onClick={handleSavePhone}
                  disabled={isSaving}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelPhone}
                  disabled={isSaving}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <p className="text-base flex-1">{contact.phone || 'Not provided'}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleEditPhone}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Mail className="w-4 h-4" />
              Email
            </div>
            {isEditingEmail ? (
              <div className="flex items-center gap-2">
                <Input
                  type="email"
                  value={tempEmail}
                  onChange={(e) => setTempEmail(e.target.value)}
                  className="flex-1"
                  disabled={isSaving}
                />
                <Button
                  size="sm"
                  onClick={handleSaveEmail}
                  disabled={isSaving}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEmail}
                  disabled={isSaving}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <p className="text-base flex-1">{contact.email || 'Not provided'}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleEditEmail}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default ParentProfilePage;