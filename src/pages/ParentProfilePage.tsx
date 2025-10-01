import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useParentContact } from '@/hooks/useParentContact';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, User, UserCircle } from 'lucide-react';
const ParentProfilePage = () => {
  const {
    contact,
    isLoading
  } = useParentContact();
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
          {contact.phone && <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Phone className="w-4 h-4" />
                Phone
              </div>
              <p className="text-base">{contact.phone}</p>
            </div>}

          {/* Email */}
          {contact.email && <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="w-4 h-4" />
                Email
              </div>
              <p className="text-base">{contact.email}</p>
            </div>}
        </CardContent>
      </Card>
    </div>;
};
export default ParentProfilePage;