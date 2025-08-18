import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { COMMON_TIMEZONES } from '@/utils/timezoneUtils';
import { useToast } from '@/hooks/use-toast';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { FileUpload } from '@/components/ui/file-upload';
import { CalendarIcon } from 'lucide-react';

interface School {
  id: string;
  name: string;
  initials?: string;
  jrotc_program?: 'air_force' | 'army' | 'coast_guard' | 'navy' | 'marine_corps' | 'space_force';
  contact?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  competition_module?: boolean;
  competition_portal?: boolean;
  subscription_start?: string;
  subscription_end?: string;
  timezone?: string;
  logo_url?: string;
}

interface SchoolProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SchoolProfileModal: React.FC<SchoolProfileModalProps> = ({
  open,
  onOpenChange
}) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [school, setSchool] = useState<School | null>(null);
  const [originalSchool, setOriginalSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData: originalSchool || {},
    currentData: school || {},
    enabled: open && !!school
  });

  const fetchSchoolData = async () => {
    if (!userProfile?.school_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('id', userProfile.school_id)
        .single();

      if (error) throw error;

      setSchool(data);
      setOriginalSchool(data);
    } catch (error) {
      console.error('Error fetching school:', error);
      toast({
        title: "Error",
        description: "Failed to fetch school information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && userProfile?.school_id) {
      fetchSchoolData();
    }
  }, [open, userProfile?.school_id]);

  const uploadLogo = async (file: File, schoolId: string): Promise<string | null> => {
    try {
      setIsUploadingLogo(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${schoolId}/logo.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('school-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('school-logos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!school) return;

    try {
      setSaving(true);
      let logoUrl = school.logo_url;
      
      // Upload logo if a new file was selected
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile, school.id);
        if (!logoUrl) return; // Upload failed
      }

      const { error } = await supabase
        .from('schools')
        .update({
          initials: school.initials,
          contact: school.contact,
          address: school.address,
          city: school.city,
          state: school.state,
          zip_code: school.zip_code,
          phone: school.phone,
          email: school.email,
          timezone: school.timezone,
          logo_url: logoUrl
        })
        .eq('id', school.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "School profile updated successfully"
      });

      // Update the original school data to reflect the saved state
      const updatedSchool = { ...school, logo_url: logoUrl };
      setSchool(updatedSchool);
      setOriginalSchool(updatedSchool);
      setLogoFile(null);
      resetChanges();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving school:', error);
      toast({
        title: "Error",
        description: "Failed to save school profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      return;
    }
    onOpenChange(open);
    if (!open) {
      setSchool(null);
      setOriginalSchool(null);
      setLogoFile(null);
    }
  };

  const handleDiscardChanges = () => {
    if (originalSchool) {
      setSchool(originalSchool);
    }
    resetChanges();
    setShowUnsavedDialog(false);
    onOpenChange(false);
    setLogoFile(null);
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };

  const handleFileDelete = () => {
    if (school) {
      setSchool({ ...school, logo_url: null });
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!school) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>School Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* School Name & Initials */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">School Name</Label>
                <Input
                  id="name"
                  value={school.name || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="initials">School Initials</Label>
                <Input
                  id="initials"
                  value={school.initials || ''}
                  onChange={(e) => setSchool({ ...school, initials: e.target.value })}
                  placeholder="Enter school initials"
                />
              </div>
            </div>

            {/* School Logo */}
            <div>
              <FileUpload
                label="School Logo"
                onFileSelect={setLogoFile}
                accept="image/*"
                currentFileUrl={school.logo_url}
                onFileDelete={handleFileDelete}
              />
            </div>

            {/* Contact & JROTC Program */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact">Contact</Label>
                <Input
                  id="contact"
                  value={school.contact || ''}
                  onChange={(e) => setSchool({ ...school, contact: e.target.value })}
                  placeholder="Enter contact name"
                />
              </div>
              <div className="space-y-2">
                <Label>JROTC Program</Label>
                <Input
                  value={school.jrotc_program ? school.jrotc_program.replace('_', ' ').toUpperCase() : ''}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={school.address || ''}
                onChange={(e) => setSchool({ ...school, address: e.target.value })}
                placeholder="Enter street address"
              />
            </div>

            {/* City, State, Zip */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={school.city || ''}
                  onChange={(e) => setSchool({ ...school, city: e.target.value })}
                  placeholder="Enter city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={school.state || ''}
                  onChange={(e) => setSchool({ ...school, state: e.target.value })}
                  placeholder="Enter state"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip_code">ZIP Code</Label>
                <Input
                  id="zip_code"
                  value={school.zip_code || ''}
                  onChange={(e) => setSchool({ ...school, zip_code: e.target.value })}
                  placeholder="Enter zip code"
                />
              </div>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={school.phone || ''}
                  onChange={(e) => setSchool({ ...school, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={school.email || ''}
                  onChange={(e) => setSchool({ ...school, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            {/* Subscription Start & End */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subscription Start</Label>
                <Input
                  value={school.subscription_start ? format(new Date(school.subscription_start), "PPP") : ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Subscription End</Label>
                <Input
                  value={school.subscription_end ? format(new Date(school.subscription_end), "PPP") : ''}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            {/* Competition Tracking & Portal */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Competition Tracking</Label>
                <Input
                  value={school.competition_module ? 'Enabled' : 'Disabled'}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Competition Hosting</Label>
                <Input
                  value={school.competition_portal ? 'Enabled' : 'Disabled'}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={school.timezone || ''}
                onValueChange={(value) => setSchool({ ...school, timezone: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 border-t pt-6">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || isUploadingLogo}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onCancel={handleContinueEditing}
      />
    </>
  );
};