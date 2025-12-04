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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const schoolSchema = z.object({
  initials: z.string().optional(),
  contact: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  phone: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(val.replace(/[\s\-\(\)\.]/g, ''));
  }, {
    message: "Please enter a valid phone number"
  }),
  email: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val);
  }, {
    message: "Please enter a valid email address"
  }),
  timezone: z.string().optional()
});

type SchoolFormData = z.infer<typeof schoolSchema>;

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
  comp_analytics?: boolean;
  comp_hosting?: boolean;
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

  const form = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      initials: '',
      contact: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      phone: '',
      email: '',
      timezone: ''
    }
  });

  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData: originalSchool || {},
    currentData: { ...school, ...form.getValues() },
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
      form.reset({
        initials: data.initials || '',
        contact: data.contact || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zip_code: data.zip_code || '',
        phone: data.phone || '',
        email: data.email || '',
        timezone: data.timezone || ''
      });
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
      
      // Delete any existing logo files for this school first
      const { data: existingFiles } = await supabase.storage
        .from('school-logos')
        .list(schoolId);
      
      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles
          .filter(file => file.name.startsWith('logo.'))
          .map(file => `${schoolId}/${file.name}`);
        
        if (filesToDelete.length > 0) {
          await supabase.storage
            .from('school-logos')
            .remove(filesToDelete);
        }
      }
      
      const { error: uploadError } = await supabase.storage
        .from('school-logos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('school-logos')
        .getPublicUrl(fileName);

      // Add cache busting parameter
      return `${publicUrl}?t=${Date.now()}`;
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

  const handleSave = async (data: SchoolFormData) => {
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
          initials: data.initials,
          contact: data.contact,
          address: data.address,
          city: data.city,
          state: data.state,
          zip_code: data.zip_code,
          phone: data.phone,
          email: data.email,
          timezone: data.timezone,
          logo_url: logoUrl
        })
        .eq('id', school.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "School profile updated successfully"
      });

      // Update the original school data to reflect the saved state
      const updatedSchool = { ...school, ...data, logo_url: logoUrl };
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
      form.reset({
        initials: originalSchool.initials || '',
        contact: originalSchool.contact || '',
        address: originalSchool.address || '',
        city: originalSchool.city || '',
        state: originalSchool.state || '',
        zip_code: originalSchool.zip_code || '',
        phone: originalSchool.phone || '',
        email: originalSchool.email || '',
        timezone: originalSchool.timezone || ''
      });
    }
    resetChanges();
    setShowUnsavedDialog(false);
    onOpenChange(false);
    setLogoFile(null);
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };

  const handleFileDelete = async () => {
    if (!school) return;

    try {
      // Delete the actual file from storage if it exists
      if (school.logo_url) {
        const urlParts = school.logo_url.split('/');
        const fileName = urlParts[urlParts.length - 1].split('?')[0]; // Remove cache busting params
        const filePath = `${school.id}/${fileName}`;
        
        await supabase.storage
          .from('school-logos')
          .remove([filePath]);
      }

      // Update the local state to remove the logo URL
      setSchool({ ...school, logo_url: null });
      
      toast({
        title: "Success",
        description: "Logo deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting logo:', error);
      toast({
        title: "Error",
        description: "Failed to delete logo",
        variant: "destructive"
      });
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
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
                <FormField
                  control={form.control}
                  name="initials"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Initials</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter school initials"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <FormField
                  control={form.control}
                  name="contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter contact name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter street address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* City, State, Zip */}
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter city"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter state"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zip_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter zip code"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter phone number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter email address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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

              {/* Competition Analytics & Hosting */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Competition Analytics</Label>
                  <Input
                    value={school.comp_analytics ? 'Enabled' : 'Disabled'}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Competition Hosting</Label>
                  <Input
                    value={school.comp_hosting ? 'Enabled' : 'Disabled'}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* Timezone */}
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COMMON_TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 border-t pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || isUploadingLogo}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
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