import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trophy, Save } from 'lucide-react';
import { AddressLookupField } from '@/components/calendar/components/AddressLookupField';
import { RichTextBodyField } from '@/components/email-management/dialogs/components/RichTextBodyField';
import { useAuth } from '@/contexts/AuthContext';
import { useCompetitions } from '@/hooks/competition-portal/useCompetitions';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { toast } from 'sonner';
import ReactQuill from 'react-quill';
import { convertToUTC } from '@/utils/timezoneUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { AttachmentSection } from '@/components/attachments/AttachmentSection';
interface FormData {
  name: string;
  description: string;
  location: string;
  start_date: string;
  start_time_hour: string;
  start_time_minute: string;
  end_date: string;
  end_time_hour: string;
  end_time_minute: string;
  program: string;
  fee: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  max_participants: string;
  registration_deadline_date: string;
  registration_deadline_hour: string;
  registration_deadline_minute: string;
  hosting_school: string;
  sop: string;
  sop_link: string;
  sop_text: string;
}
export const CPCompetitionRecordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const competitionId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const isEditMode = !!competitionId && mode !== 'view';
  const isViewMode = mode === 'view';
  const {
    userProfile
  } = useAuth();
  const {
    createCompetition,
    updateCompetition,
    competitions
  } = useCompetitions();

  // Find competition data if editing or viewing
  const existingCompetition = competitionId ? competitions.find(c => c.id === competitionId) : null;
  const initialData: FormData = {
    name: existingCompetition?.name || '',
    description: existingCompetition?.description || '',
    location: existingCompetition?.location || '',
    start_date: existingCompetition?.start_date ? new Date(existingCompetition.start_date).toISOString().split('T')[0] : '',
    start_time_hour: existingCompetition?.start_date ? new Date(existingCompetition.start_date).getHours().toString().padStart(2, '0') : '09',
    start_time_minute: existingCompetition?.start_date ? new Date(existingCompetition.start_date).getMinutes().toString().padStart(2, '0') : '00',
    end_date: existingCompetition?.end_date ? new Date(existingCompetition.end_date).toISOString().split('T')[0] : '',
    end_time_hour: existingCompetition?.end_date ? new Date(existingCompetition.end_date).getHours().toString().padStart(2, '0') : '17',
    end_time_minute: existingCompetition?.end_date ? new Date(existingCompetition.end_date).getMinutes().toString().padStart(2, '0') : '00',
    program: existingCompetition?.program || 'air_force',
    fee: existingCompetition?.fee?.toString() || '',
    address: existingCompetition?.address || '',
    city: existingCompetition?.city || '',
    state: existingCompetition?.state || '',
    zip: existingCompetition?.zip || '',
    max_participants: existingCompetition?.max_participants?.toString() || '',
    registration_deadline_date: existingCompetition?.registration_deadline ? new Date(existingCompetition.registration_deadline).toISOString().split('T')[0] : '',
    registration_deadline_hour: existingCompetition?.registration_deadline ? new Date(existingCompetition.registration_deadline).getHours().toString().padStart(2, '0') : '23',
    registration_deadline_minute: existingCompetition?.registration_deadline ? new Date(existingCompetition.registration_deadline).getMinutes().toString().padStart(2, '0') : '59',
    hosting_school: existingCompetition?.hosting_school || userProfile?.schools?.name || '',
    sop: existingCompetition?.sop || 'none',
    sop_link: existingCompetition?.sop_link || '',
    sop_text: existingCompetition?.sop_text || ''
  };
  const [formData, setFormData] = useState<FormData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const {
    timezone
  } = useSchoolTimezone();

  // Reinitialize form data when competition data becomes available
  useEffect(() => {
    if (existingCompetition && (isEditMode || isViewMode)) {
      const updatedData: FormData = {
        name: existingCompetition.name || '',
        description: existingCompetition.description || '',
        location: existingCompetition.location || '',
        start_date: existingCompetition.start_date ? new Date(existingCompetition.start_date).toISOString().split('T')[0] : '',
        start_time_hour: existingCompetition.start_date ? new Date(existingCompetition.start_date).getHours().toString().padStart(2, '0') : '09',
        start_time_minute: existingCompetition.start_date ? new Date(existingCompetition.start_date).getMinutes().toString().padStart(2, '0') : '00',
        end_date: existingCompetition.end_date ? new Date(existingCompetition.end_date).toISOString().split('T')[0] : '',
        end_time_hour: existingCompetition.end_date ? new Date(existingCompetition.end_date).getHours().toString().padStart(2, '0') : '17',
        end_time_minute: existingCompetition.end_date ? new Date(existingCompetition.end_date).getMinutes().toString().padStart(2, '0') : '00',
        program: existingCompetition.program || 'air_force',
        fee: existingCompetition.fee?.toString() || '',
        address: existingCompetition.address || '',
        city: existingCompetition.city || '',
        state: existingCompetition.state || '',
        zip: existingCompetition.zip || '',
        max_participants: existingCompetition.max_participants?.toString() || '',
        registration_deadline_date: existingCompetition.registration_deadline ? new Date(existingCompetition.registration_deadline).toISOString().split('T')[0] : '',
        registration_deadline_hour: existingCompetition.registration_deadline ? new Date(existingCompetition.registration_deadline).getHours().toString().padStart(2, '0') : '23',
        registration_deadline_minute: existingCompetition.registration_deadline ? new Date(existingCompetition.registration_deadline).getMinutes().toString().padStart(2, '0') : '59',
        hosting_school: existingCompetition.hosting_school || userProfile?.schools?.name || '',
        sop: existingCompetition.sop || 'none',
        sop_link: existingCompetition.sop_link || '',
        sop_text: existingCompetition.sop_text || ''
      };
      setFormData(updatedData);
    }
  }, [existingCompetition, isEditMode, isViewMode, userProfile?.schools?.name]);
  const quillRef = React.useRef<ReactQuill>(null);
  const {
    hasUnsavedChanges
  } = useUnsavedChanges({
    initialData: existingCompetition ? formData : initialData,
    // Use current form data as initial when editing existing competition
    currentData: formData,
    enabled: !isViewMode // Disable unsaved changes tracking in view mode
  });
  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // When start date is set, automatically set end date and registration deadline
      if (field === 'start_date' && value) {
        const startDate = new Date(value);

        // Set end date to same as start date
        newData.end_date = value;

        // Set registration deadline to 7 days before start date at 18:00
        const registrationDeadline = new Date(startDate);
        registrationDeadline.setDate(registrationDeadline.getDate() - 7);
        newData.registration_deadline_date = registrationDeadline.toISOString().split('T')[0];
        newData.registration_deadline_hour = '18';
        newData.registration_deadline_minute = '00';
      }
      return newData;
    });
  };
  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigate('/app/competition-portal/competitions');
    }
  };
  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    navigate('/app/competition-portal/competitions');
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      // Parse location to extract address components if not already filled
      let addressData = {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip
      };

      // If address fields are empty but location is provided, try to parse location
      if (!formData.address && !formData.city && !formData.state && !formData.zip && formData.location) {
        const rawParts = formData.location.split(',').map(p => p.trim()).filter(Boolean);

        // Remove trailing country if present (e.g., USA, United States)
        const countryPattern = /^(usa|us|united states|united states of america)$/i;
        const parts = [...rawParts];
        if (parts.length > 0 && countryPattern.test(parts[parts.length - 1])) {
          parts.pop();
        }
        if (parts.length >= 2) {
          // Detect street part (often the first part with digits). If first part has no digits
          // and second does, it's likely a place name followed by the street.
          let streetIdx = 0;
          if (parts.length >= 3 && !/\d/.test(parts[0]) && /\d/.test(parts[1])) {
            streetIdx = 1;
          }

          // Assign address and city when possible
          addressData.address = parts[streetIdx] || '';
          addressData.city = parts[streetIdx + 1] || '';

          // State and ZIP typically live in the next segment
          const stateZipPart = parts[streetIdx + 2] || '';
          if (stateZipPart) {
            // Match: "TX 75098" or "Texas 75098" or just "TX" / "Texas"
            const m = stateZipPart.match(/^([A-Za-z]{2}|[A-Za-z][A-Za-z\s]+)\s*(\d{5}(?:-\d{4})?)?$/);
            if (m) {
              addressData.state = (m[1] || '').trim();
              if (m[2]) addressData.zip = m[2];
            } else {
              // Sometimes ZIP may be a separate trailing part (rare)
              const last = parts[streetIdx + 3];
              const zipOnly = last && last.match(/^(\d{5}(?:-\d{4})?)$/);
              if (zipOnly) {
                addressData.state = stateZipPart;
                addressData.zip = zipOnly[1];
              } else {
                addressData.state = stateZipPart;
              }
            }
          }

          // If after parsing, we still don't have a street but we do have at least 3 parts,
          // fall back to the simpler mapping: [0]=street, [1]=city, [last]=state/zip
          if (!addressData.address && parts.length >= 3) {
            addressData.address = parts[0];
            addressData.city = parts[1] || '';
            const lastPart = parts[parts.length - 1];
            const m2 = lastPart.match(/^([A-Za-z]{2}|[A-Za-z][A-Za-z\s]+)\s*(\d{5}(?:-\d{4})?)?$/);
            if (m2) {
              addressData.state = (m2[1] || '').trim();
              if (m2[2]) addressData.zip = m2[2];
            } else {
              addressData.state = lastPart;
            }
          }
        }
      }

      // Validate required date/time fields
      if (!formData.start_date || !formData.start_time_hour || !formData.start_time_minute) {
        toast.error('Start date and time are required');
        return;
      }
      if (!formData.end_date || !formData.end_time_hour || !formData.end_time_minute) {
        toast.error('End date and time are required');
        return;
      }

      // Convert to UTC using timezone-aware functions
      const startDateUTC = convertToUTC(formData.start_date, `${formData.start_time_hour}:${formData.start_time_minute}`, timezone);
      const endDateUTC = convertToUTC(formData.end_date, `${formData.end_time_hour}:${formData.end_time_minute}`, timezone);
      const registrationDeadlineUTC = formData.registration_deadline_date ? convertToUTC(formData.registration_deadline_date, `${formData.registration_deadline_hour}:${formData.registration_deadline_minute}`, timezone) : null;

      // Submit data that matches cp_competitions schema
      const submissionData = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        start_date: startDateUTC,
        end_date: endDateUTC,
        program: formData.program as 'air_force' | 'army' | 'coast_guard' | 'navy' | 'marine_corps' | 'space_force',
        fee: formData.fee ? parseFloat(formData.fee) : null,
        address: addressData.address,
        city: addressData.city,
        state: addressData.state,
        zip: addressData.zip,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        registration_deadline: registrationDeadlineUTC,
        hosting_school: formData.hosting_school,
        sop: formData.sop === 'none' ? null : formData.sop,
        sop_link: formData.sop_link,
        sop_text: formData.sop_text
      };
      if (isEditMode && competitionId) {
        await updateCompetition(competitionId, submissionData);
        toast.success('Competition updated successfully');
      } else {
        // Add school_id and created_by for new competitions
        const newCompetitionData = {
          ...submissionData,
          school_id: userProfile?.school_id,
          created_by: userProfile?.id
        };
        await createCompetition(newCompetitionData);
        toast.success('Competition created successfully');
      }
      navigate('/app/competition-portal/competitions');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(isEditMode ? 'Failed to update competition' : 'Failed to create competition');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while waiting for competition data
  if ((isEditMode || isViewMode) && competitionId && !existingCompetition) {
    return <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/competition-portal/competitions')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Loading...</h1>
            <p className="text-muted-foreground">Please wait while we load the competition details.</p>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6 space-y-6">
      {/* Mobile Back Button - shown above header */}
      <div className="md:hidden mb-4">
        <Button variant="outline" size="sm" onClick={handleBackClick} className="flex items-center gap-2 hover:scale-105 transition-transform">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-6 rounded-lg bg-background/60 backdrop-blur-sm border border-primary/20 shadow-lg">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBackClick} className="hidden md:flex items-center gap-2 hover:scale-105 transition-transform">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {isViewMode ? 'View Competition' : isEditMode ? 'Edit Competition' : 'Create Competition'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isViewMode ? 'Competition details (read-only)' : isEditMode ? 'Update the competition details below' : 'Fill in the details to create a new competition'}
              </p>
            </div>
          </div>
        </div>
        {!isViewMode && <Button type="submit" form="competition-form" disabled={isSubmitting} className="hidden md:flex items-center gap-2 hover:scale-105 transition-transform">
            <Save className="h-4 w-4" />
            {isSubmitting ? isEditMode ? 'Updating...' : 'Creating...' : isEditMode ? 'Update' : 'Create'}
          </Button>}
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Mobile action button - shown above the card */}
        {!isViewMode && (
          <div className="md:hidden mb-4">
            <Button type="submit" form="competition-form" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2">
              <Save className="h-4 w-4" />
              {isSubmitting ? isEditMode ? 'Updating...' : 'Creating...' : isEditMode ? 'Update' : 'Create'}
            </Button>
          </div>
        )}

        <Card className="border-primary/20 shadow-lg hover:shadow-xl transition-shadow bg-background/80 backdrop-blur-sm">
          <CardHeader className="border-b border-primary/10">
            <CardTitle className="text-xl font-semibold text-foreground/90">Competition Details</CardTitle>
          </CardHeader>
        <CardContent className="pt-6 py-[8px]">
          <form id="competition-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Competition Name & JROTC Program */}
            <div className="grid grid-cols-1 md:grid-cols-8 gap-4 p-4 rounded-lg bg-accent/10 border border-accent/20 py-[8px]">
              <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-[1fr_3fr] md:items-center gap-2 md:gap-4">
                <Label htmlFor="name" className="font-semibold md:text-right">
                  Competition Name *
                </Label>
                <Input id="name" value={formData.name} onChange={e => updateFormData('name', e.target.value)} disabled={isViewMode} required />
              </div>
              <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-[1fr_3fr] md:items-center gap-2 md:gap-4">
                <Label className="font-semibold md:text-right">JROTC Program *</Label>
                <Select value={formData.program} onValueChange={value => updateFormData('program', value)} disabled={isViewMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select JROTC Program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="air_force">Air Force JROTC</SelectItem>
                    <SelectItem value="army">Army JROTC</SelectItem>
                    <SelectItem value="navy">Navy JROTC</SelectItem>
                    <SelectItem value="marine_corps">Marine Corps JROTC</SelectItem>
                    <SelectItem value="coast_guard">Coast Guard JROTC</SelectItem>
                    <SelectItem value="space_force">Space Force JROTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_7fr] gap-2 md:gap-4 md:items-start p-4 rounded-lg bg-secondary/10 border border-secondary/20 py-[8px]">
              <Label htmlFor="description" className="font-semibold md:text-right md:pt-2">
                Description
              </Label>
              <Textarea id="description" value={formData.description} onChange={e => updateFormData('description', e.target.value)} placeholder="Enter competition description" rows={3} disabled={isViewMode} className="resize-none" />
            </div>

            {/* Start Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_7fr] gap-2 md:gap-4 md:items-center p-4 rounded-lg bg-primary/5 border border-primary/20 py-[8px]">
              <Label className="font-semibold md:text-right">Start Date & Time *</Label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="md:col-span-2">
                  <Input type="date" value={formData.start_date} onChange={e => updateFormData('start_date', e.target.value)} required disabled={isViewMode} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:contents">
                  <div>
                    <Select value={formData.start_time_hour} onValueChange={value => updateFormData('start_time_hour', value)} disabled={isViewMode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({
                          length: 24
                        }, (_, i) => <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                            {i.toString().padStart(2, '0')}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select value={formData.start_time_minute} onValueChange={value => updateFormData('start_time_minute', value)} disabled={isViewMode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({
                          length: 60
                        }, (_, i) => <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                            {i.toString().padStart(2, '0')}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* End Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_7fr] gap-2 md:gap-4 md:items-center p-4 rounded-lg bg-primary/5 border border-primary/20 py-[8px]">
              <Label className="font-semibold md:text-right">End Date & Time *</Label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="md:col-span-2">
                  <Input type="date" value={formData.end_date} onChange={e => updateFormData('end_date', e.target.value)} required disabled={isViewMode} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:contents">
                  <div>
                    <Select value={formData.end_time_hour} onValueChange={value => updateFormData('end_time_hour', value)} disabled={isViewMode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({
                          length: 24
                        }, (_, i) => <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                            {i.toString().padStart(2, '0')}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select value={formData.end_time_minute} onValueChange={value => updateFormData('end_time_minute', value)} disabled={isViewMode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({
                          length: 60
                        }, (_, i) => <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                            {i.toString().padStart(2, '0')}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Deadline */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_7fr] gap-2 md:gap-4 md:items-center p-4 rounded-lg bg-accent/10 border border-accent/20 py-[8px]">
              <Label className="font-semibold md:text-right">Registration Deadline</Label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="md:col-span-2">
                  <Input type="date" value={formData.registration_deadline_date} onChange={e => updateFormData('registration_deadline_date', e.target.value)} disabled={isViewMode} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:contents">
                  <div>
                    <Select value={formData.registration_deadline_hour} onValueChange={value => updateFormData('registration_deadline_hour', value)} disabled={isViewMode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({
                          length: 24
                        }, (_, i) => <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                            {i.toString().padStart(2, '0')}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select value={formData.registration_deadline_minute} onValueChange={value => updateFormData('registration_deadline_minute', value)} disabled={isViewMode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({
                          length: 60
                        }, (_, i) => <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                            {i.toString().padStart(2, '0')}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Hosting School & Location */}
            <div className="grid grid-cols-1 md:grid-cols-8 gap-4 p-4 rounded-lg bg-secondary/10 border border-secondary/20 py-[8px]">
              <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-[1fr_3fr] md:items-center gap-2 md:gap-4">
                <Label htmlFor="hosting_school" className="font-semibold md:text-right">
                  Hosting School
                </Label>
                <Input id="hosting_school" value={formData.hosting_school} onChange={e => updateFormData('hosting_school', e.target.value)} placeholder="Hosting school name" disabled={isViewMode} />
              </div>
              <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-[1fr_3fr] md:items-center gap-2 md:gap-4">
                <Label className="font-semibold md:text-right">Location *</Label>
                <AddressLookupField value={formData.location} onValueChange={value => updateFormData('location', value)} placeholder="Enter competition location or search address" disabled={isViewMode} />
              </div>
            </div>

            {/* Entry Fee & Max Participants */}
            <div className="grid grid-cols-1 md:grid-cols-8 gap-4 p-4 rounded-lg bg-accent/10 border border-accent/20 py-[8px]">
              <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-[1fr_3fr] md:items-center gap-2 md:gap-4">
                <Label className="font-semibold md:text-right">Entry Fee</Label>
                <Input type="number" step="0.01" min="0" value={formData.fee} onChange={e => updateFormData('fee', e.target.value)} placeholder="Entry fee (0.00)" disabled={isViewMode} />
              </div>
              <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-[1fr_3fr] md:items-center gap-2 md:gap-4">
                <Label className="font-semibold md:text-right">Max Participants</Label>
                <Input type="number" min="1" value={formData.max_participants} onChange={e => updateFormData('max_participants', e.target.value)} placeholder="Max participants (unlimited)" disabled={isViewMode} />
              </div>
            </div>

            {/* Competition SOP */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_7fr] gap-2 md:gap-4 md:items-center p-4 rounded-lg bg-primary/5 border border-primary/20 py-[8px]">
              <Label className="font-semibold md:text-right">Competition SOP</Label>
              <Select value={formData.sop} onValueChange={value => updateFormData('sop', value)} disabled={isViewMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select SOP type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="Link">Link</SelectItem>
                  <SelectItem value="Text">Text</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* SOP Link */}
            {formData.sop === 'Link' && <div className="grid grid-cols-1 md:grid-cols-[1fr_7fr] gap-2 md:gap-4 md:items-center p-4 rounded-lg bg-secondary/10 border border-secondary/20 py-[8px]">
                <Label htmlFor="sop_link" className="font-semibold md:text-right">
                  SOP Link
                </Label>
                <Input id="sop_link" type="url" value={formData.sop_link} onChange={e => updateFormData('sop_link', e.target.value)} placeholder="https://example.com/sop" disabled={isViewMode} />
              </div>}

            {/* SOP Text */}
            {formData.sop === 'Text' && <div className="grid grid-cols-1 md:grid-cols-[1fr_7fr] gap-2 md:gap-4 md:items-start p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                <Label className="font-semibold md:text-right md:pt-2">SOP Text</Label>
                <div className="border rounded-md">
                  <ReactQuill ref={quillRef} value={formData.sop_text} onChange={value => updateFormData('sop_text', value)} placeholder="Enter SOP text here..." style={{
                  minHeight: '200px'
                }} readOnly={isViewMode} />
                </div>
              </div>}

            {/* Attachments */}
            {competitionId && (
              <div className="grid grid-cols-1 md:grid-cols-[1fr_7fr] gap-2 md:gap-4 md:items-start p-4 rounded-lg bg-accent/10 border border-accent/20 py-[8px]">
                <Label className="font-semibold md:text-right md:pt-2">Attachments</Label>
                <AttachmentSection
                  recordType="cp_competition"
                  recordId={competitionId}
                  canEdit={!isViewMode}
                  showContentOnly={true}
                />
              </div>
            )}

            {/* Form Actions - Only show in view mode for back button */}
            {isViewMode && <div className="flex justify-end gap-4 pt-6">
                <Button type="button" onClick={handleBackClick} className="hover:scale-105 transition-transform">
                  Back to Competitions
                </Button>
              </div>}
          </form>
        </CardContent>
        </Card>
      </div>

      <UnsavedChangesDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog} onDiscard={handleDiscardChanges} onCancel={() => setShowUnsavedDialog(false)} />
    </div>;
};