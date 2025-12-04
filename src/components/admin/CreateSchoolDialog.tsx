import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format, addYears } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { COMMON_TIMEZONES } from '@/utils/timezoneUtils';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { FileUpload } from '@/components/ui/file-upload';
interface CreateSchoolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
interface NewSchool {
  name: string;
  initials: string;
  contact: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  jrotc_program: 'air_force' | 'army' | 'coast_guard' | 'navy' | 'marine_corps' | 'space_force';
  comp_analytics: boolean;
  comp_hosting: boolean;
  subscription_start?: string;
  subscription_end?: string;
  referred_by: string;
  notes: string;
  timezone: string;
  logo_url?: string;
}
export const CreateSchoolDialog = ({
  open,
  onOpenChange
}: CreateSchoolDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const initialSchool: NewSchool = {
    name: '',
    initials: '',
    contact: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
    jrotc_program: 'air_force',
    comp_analytics: false,
    comp_hosting: false,
    subscription_start: undefined,
    subscription_end: undefined,
    referred_by: '',
    notes: '',
    timezone: 'America/New_York'
  };
  const [newSchool, setNewSchool] = useState<NewSchool>(initialSchool);
  const {
    hasUnsavedChanges,
    resetChanges
  } = useUnsavedChanges({
    initialData: initialSchool,
    currentData: newSchool,
    enabled: open
  });
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
      toast.error('Failed to upload logo');
      return null;
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // First create the school
      const {
        data,
        error
      } = await supabase.from('schools').insert([newSchool]).select().single();
      if (error) {
        toast.error('Failed to create school: ' + error.message);
        return;
      }

      let logoUrl = null;
      
      // Upload logo if a file was selected
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile, data.id);
        if (logoUrl) {
          // Update the school with the logo URL
          const { error: updateError } = await supabase
            .from('schools')
            .update({ logo_url: logoUrl })
            .eq('id', data.id);
          
          if (updateError) {
            console.error('Error updating school with logo:', updateError);
            // Don't fail the creation, just warn
            toast.error('School created but logo upload failed');
          }
        }
      }

      toast.success('School created successfully');

      // Reset form
      setNewSchool(initialSchool);
      setLogoFile(null);
      resetChanges();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating school:', error);
      toast.error('Failed to create school');
    } finally {
      setIsLoading(false);
    }
  };
  const handleOpenChange = (open: boolean) => {
    if (!open && hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      return;
    }
    onOpenChange(open);
  };
  const handleDiscardChanges = () => {
    setNewSchool(initialSchool);
    setLogoFile(null);
    resetChanges();
    setShowUnsavedDialog(false);
    onOpenChange(false);
  };
  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };
  return <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New School</DialogTitle>
          <DialogDescription>
            Add a new school to the system with JROTC program details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">School Name</Label>
              <Input id="name" value={newSchool.name} onChange={e => setNewSchool({
                ...newSchool,
                name: e.target.value
              })} placeholder="Enter school name" required />
            </div>
            <div>
              <Label htmlFor="initials">School Initials</Label>
              <Input id="initials" value={newSchool.initials} onChange={e => setNewSchool({
                ...newSchool,
                initials: e.target.value
              })} placeholder="Enter school initials" />
            </div>
          </div>

          <FileUpload
            label="School Logo"
            accept="image/*"
            maxSize={5}
            onFileSelect={setLogoFile}
            disabled={isUploadingLogo}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact">Contact</Label>
              <Input id="contact" value={newSchool.contact} onChange={e => setNewSchool({
                ...newSchool,
                contact: e.target.value
              })} placeholder="Enter contact person" />
            </div>
            <div>
              <Label htmlFor="jrotc_program">JROTC Program</Label>
              <Select value={newSchool.jrotc_program} onValueChange={value => setNewSchool({
                ...newSchool,
                jrotc_program: value as typeof newSchool.jrotc_program
              })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="air_force">Air Force JROTC</SelectItem>
                  <SelectItem value="army">Army JROTC</SelectItem>
                  <SelectItem value="coast_guard">Coast Guard JROTC</SelectItem>
                  <SelectItem value="navy">Navy JROTC</SelectItem>
                  <SelectItem value="marine_corps">Marine Corps JROTC</SelectItem>
                  <SelectItem value="space_force">Space Force JROTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={newSchool.address} onChange={e => setNewSchool({
              ...newSchool,
              address: e.target.value
            })} placeholder="Enter street address" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={newSchool.city} onChange={e => setNewSchool({
                ...newSchool,
                city: e.target.value
              })} placeholder="Enter city" />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input id="state" value={newSchool.state} onChange={e => setNewSchool({
                ...newSchool,
                state: e.target.value
              })} placeholder="Enter state" />
            </div>
            <div>
              <Label htmlFor="zip_code">ZIP Code</Label>
              <Input id="zip_code" value={newSchool.zip_code} onChange={e => setNewSchool({
                ...newSchool,
                zip_code: e.target.value
              })} placeholder="Enter ZIP code" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={newSchool.phone} onChange={e => setNewSchool({
                ...newSchool,
                phone: e.target.value
              })} placeholder="Enter phone number" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={newSchool.email} onChange={e => setNewSchool({
                ...newSchool,
                email: e.target.value
              })} placeholder="Enter email address" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subscription_start">Subscription Start</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newSchool.subscription_start ? format(new Date(newSchool.subscription_start), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={newSchool.subscription_start ? new Date(newSchool.subscription_start) : undefined} onSelect={date => {
                    const startDate = date ? date.toISOString().split('T')[0] : undefined;
                    const endDate = date ? addYears(date, 1).toISOString().split('T')[0] : undefined;
                    setNewSchool({
                      ...newSchool,
                      subscription_start: startDate,
                      subscription_end: endDate
                    });
                  }} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subscription_end">Subscription End</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newSchool.subscription_end ? format(new Date(newSchool.subscription_end), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={newSchool.subscription_end ? new Date(newSchool.subscription_end) : undefined} onSelect={date => setNewSchool({
                    ...newSchool,
                    subscription_end: date ? date.toISOString().split('T')[0] : undefined
                  })} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referred_by">Referred By</Label>
            <Input id="referred_by" value={newSchool.referred_by} onChange={e => setNewSchool({
              ...newSchool,
              referred_by: e.target.value
            })} placeholder="Who referred this school?" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="comp_analytics" checked={newSchool.comp_analytics} onCheckedChange={checked => setNewSchool({
                  ...newSchool,
                  comp_analytics: checked as boolean
                })} />
                <Label htmlFor="comp_analytics">Competition Tracking</Label>
              </div>
            </div>
            <div className="space-y-2">
              
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="comp_hosting" checked={newSchool.comp_hosting} onCheckedChange={checked => setNewSchool({
                  ...newSchool,
                  comp_hosting: checked as boolean
                })} />
                <Label htmlFor="comp_hosting">Competition Hosting</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={newSchool.notes} onChange={e => setNewSchool({
              ...newSchool,
              notes: e.target.value
            })} placeholder="Additional notes about this school..." rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={newSchool.timezone} onValueChange={value => setNewSchool({
              ...newSchool,
              timezone: value
            })}>
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-md z-50">
                {COMMON_TIMEZONES.map(tz => <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading || isUploadingLogo}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isUploadingLogo}>
              {(isLoading || isUploadingLogo) ? 'Creating...' : 'Create School'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <UnsavedChangesDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog} onDiscard={handleDiscardChanges} onCancel={handleContinueEditing} />
    </>;
};