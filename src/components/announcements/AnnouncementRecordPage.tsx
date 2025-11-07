import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, Announcement } from '@/hooks/useAnnouncements';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { CalendarIcon, ArrowLeft, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AnnouncementRichTextEditor } from './components/AnnouncementRichTextEditor';
import { AttachmentSection } from '@/components/attachments/AttachmentSection';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { AnnouncementViewer } from './components/AnnouncementViewer';
import { useToast } from '@/hooks/use-toast';
import { useAttachments } from '@/hooks/attachments/useAttachments';
import { convertToUTC, convertToUI } from '@/utils/timezoneUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { useIsMobile } from '@/hooks/use-mobile';

type AnnouncementRecordMode = 'create' | 'edit' | 'view';

export const AnnouncementRecordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const isMobile = useIsMobile();
  
  const mode = searchParams.get('mode') as AnnouncementRecordMode || 'view';
  const recordId = searchParams.get('id');

  const { data: announcements } = useAnnouncements();
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const { canCreate, canEdit, canViewDetails } = useTablePermissions('announcements');

  // Find the current announcement if editing/viewing
  const currentAnnouncement = recordId ? announcements?.find(a => a.id === recordId) : null;
  
  // Initialize attachment hooks for file upload (with dummy ID for create mode)
  const { uploadFile } = useAttachments('announcement', currentAnnouncement?.id || 'temp');

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState([0]);
  const [isActive, setIsActive] = useState(true);
  const [publishDate, setPublishDate] = useState<string>('');
  const [expireDate, setExpireDate] = useState<string>('');
  const [hasExpiration, setHasExpiration] = useState<boolean>(false);
  const { timezone } = useSchoolTimezone();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  // Priority mapping helpers
  const getPriorityLabel = (value: number) => {
    switch (value) {
      case 0: return 'Low';
      case 1: return 'Medium';
      case 2: return 'High';
      default: return 'Low';
    }
  };

  const getPriorityValue = (numericPriority: number) => {
    if (numericPriority >= 7) return 2; // High
    if (numericPriority >= 4) return 1; // Medium
    return 0; // Low
  };

  const uploadPendingFiles = async (announcementId: string) => {
    if (pendingFiles.length === 0) return;
    
    setIsUploadingFiles(true);
    try {
      // Upload files one by one and wait for completion
      for (const file of pendingFiles) {
        await uploadFile({
          record_type: 'announcement',
          record_id: announcementId,
          file
        });
      }
      setPendingFiles([]);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploadingFiles(false);
    }
  };

  // Initialize form data
  useEffect(() => {
    if (currentAnnouncement && (mode === 'edit' || mode === 'view')) {
      setTitle(currentAnnouncement.title);
      setContent(currentAnnouncement.content);
      setPriority([getPriorityValue(currentAnnouncement.priority)]);
      setIsActive(currentAnnouncement.is_active);
      setPublishDate(convertToUI(currentAnnouncement.publish_date, timezone, 'dateKey'));
      if (currentAnnouncement.expire_date) {
        setExpireDate(convertToUI(currentAnnouncement.expire_date, timezone, 'dateKey'));
        setHasExpiration(true);
      } else {
        setExpireDate('');
        setHasExpiration(false);
      }
    } else if (mode === 'create') {
      // Reset form for create mode
      setTitle('');
      setContent('');
      setPriority([0]);
      setIsActive(true);
      setPublishDate(format(new Date(), 'yyyy-MM-dd'));
      setExpireDate('');
      setHasExpiration(false);
    }
  }, [currentAnnouncement, mode, timezone]);

  // Track changes for unsaved changes dialog
  useEffect(() => {
    if (mode === 'view') return;
    
    const hasChanges: boolean = mode === 'create' ? 
      (!!title || !!content || priority[0] !== 0 || !isActive || hasExpiration) :
      (currentAnnouncement ? (
        title !== currentAnnouncement.title ||
        content !== currentAnnouncement.content ||
        priority[0] !== getPriorityValue(currentAnnouncement.priority) ||
        isActive !== currentAnnouncement.is_active ||
        publishDate !== convertToUI(currentAnnouncement.publish_date, timezone, 'dateKey') ||
        (hasExpiration && expireDate ? expireDate : '') !== (currentAnnouncement.expire_date ? convertToUI(currentAnnouncement.expire_date, timezone, 'dateKey') : '')
      ) : false);
    
    setHasUnsavedChanges(hasChanges);
  }, [title, content, priority, isActive, publishDate, expireDate, hasExpiration, currentAnnouncement, mode]);

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigate('/app/announcements');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }

    if (!publishDate) {
      toast({ title: "Error", description: "Publish date is required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const data = {
        title: title.trim(),
        content,
        priority: priority[0] === 2 ? 8 : priority[0] === 1 ? 5 : 2,
        is_active: isActive,
        publish_date: convertToUTC(publishDate, '12:00', timezone, { isAllDay: true }),
        expire_date: hasExpiration && expireDate ? convertToUTC(expireDate, '12:00', timezone, { isAllDay: true }) : null
      };

      if (mode === 'create') {
        const newAnnouncement = await createMutation.mutateAsync(data);
        
        // Upload pending files if any
        if (pendingFiles.length > 0) {
          await uploadPendingFiles(newAnnouncement.id);
        }
        
        toast({ title: "Success", description: "Announcement created successfully" });
      } else if (mode === 'edit' && currentAnnouncement) {
        await updateMutation.mutateAsync({ ...data, id: currentAnnouncement.id });
        toast({ title: "Success", description: "Announcement updated successfully" });
      }

      navigate('/app/announcements');
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast({ 
        title: "Error", 
        description: mode === 'create' ? "Failed to create announcement" : "Failed to update announcement", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPageTitle = () => {
    switch (mode) {
      case 'create': return 'Create New Announcement';
      case 'edit': return 'Edit Announcement';
      case 'view': return 'View Announcement';
      default: return 'Announcement';
    }
  };

  // Check permissions
  if (mode === 'create' && !canCreate) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to create announcements.</p>
          <Button onClick={() => navigate('/app/announcements')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Announcements
          </Button>
        </div>
      </div>
    );
  }

  if ((mode === 'edit' || mode === 'view') && !currentAnnouncement) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Announcement Not Found</h2>
          <p className="text-muted-foreground">The announcement you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/app/announcements')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Announcements
          </Button>
        </div>
      </div>
    );
  }

  if (mode === 'edit' && !canEdit) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to edit announcements.</p>
          <Button onClick={() => navigate('/app/announcements')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Announcements
          </Button>
        </div>
      </div>
    );
  }

  if (mode === 'view' && !canViewDetails) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to view announcement details.</p>
          <Button onClick={() => navigate('/app/announcements')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Announcements
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-h-screen overflow-y-auto">
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between'}`}>
        {isMobile && (
          <Button variant="ghost" onClick={handleBack} className="w-fit">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        
        <div className={`flex items-center ${isMobile ? 'flex-col items-start gap-2' : 'space-x-4'}`}>
          {!isMobile && (
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
            {currentAnnouncement && (
              <p className="text-muted-foreground">
                Created {format(new Date(currentAnnouncement.created_at), 'PPP')}
              </p>
            )}
          </div>
        </div>
        
        {mode !== 'view' && (
          <div className={`flex items-center ${isMobile ? 'w-full grid grid-cols-2 gap-2' : 'space-x-2'}`}>
            <Button variant="outline" onClick={handleBack} disabled={isSubmitting} className={isMobile ? 'w-full' : ''}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting} className={isMobile ? 'w-full' : ''}>
              <Save className="w-4 h-4 mr-2" />
              {mode === 'create' ? 'Create' : 'Update'}
            </Button>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto">
        <Card>
        <CardHeader>
          <CardTitle>Announcement Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center space-x-4'}`}>
                <Label className={isMobile ? '' : 'w-24 text-right'}>Title *</Label>
                <div className="flex-1">
                  {mode === 'view' ? (
                    <div className="px-3 py-2 text-sm">{title}</div>
                  ) : (
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter announcement title"
                      required
                    />
                  )}
                </div>
              </div>

              <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center space-x-4'}`}>
                <Label className={isMobile ? '' : 'w-24 text-right'}>Priority</Label>
                <div className="flex-1">
                  {mode === 'view' ? (
                    <div className="px-3 py-2 text-sm">{getPriorityLabel(priority[0])}</div>
                  ) : (
                    <div className="space-y-2">
                      <div className="px-2 py-4">
                        <Slider 
                          value={priority} 
                          onValueChange={setPriority} 
                          max={2} 
                          min={0} 
                          step={1} 
                          className="w-full" 
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Low</span>
                          <span>Medium</span>
                          <span>High</span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Current: {getPriorityLabel(priority[0])}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center space-x-4'}`}>
                <Label className={isMobile ? '' : 'w-24 text-right'}>Active</Label>
                <div className="flex-1">
                  {mode === 'view' ? (
                    <div className="px-3 py-2 text-sm">{isActive ? 'Yes' : 'No'}</div>
                  ) : (
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center space-x-4'}`}>
                <Label className={isMobile ? '' : 'w-32 text-right'}>Publish Date *</Label>
                <div className="flex-1">
                  {mode === 'view' ? (
                    <div className="px-3 py-2 text-sm">
                      {publishDate ? format(new Date(publishDate), 'PPP') : 'Not set'}
                    </div>
                  ) : (
                    <Input
                      type="date"
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                      required
                    />
                  )}
                </div>
              </div>

              <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center space-x-4'}`}>
                <Label className={isMobile ? '' : 'w-32 text-right'}>Set Expiration</Label>
                <div className="flex-1">
                  {mode === 'view' ? (
                    <div className="px-3 py-2 text-sm">{hasExpiration ? 'Yes' : 'No'}</div>
                  ) : (
                    <Switch checked={hasExpiration} onCheckedChange={setHasExpiration} />
                  )}
                </div>
              </div>

              {hasExpiration && (
                <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center space-x-4'}`}>
                  <Label className={isMobile ? '' : 'w-32 text-right'}>Expire Date</Label>
                  <div className="flex-1">
                    {mode === 'view' ? (
                      <div className="px-3 py-2 text-sm">
                        {expireDate ? format(new Date(expireDate), 'PPP') : 'Not set'}
                      </div>
                    ) : (
                      <Input
                        type="date"
                        value={expireDate}
                        onChange={(e) => setExpireDate(e.target.value)}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-start space-x-4'}`}>
              <Label className={isMobile ? '' : 'w-24 text-right mt-2'}>Content *</Label>
              <div className="flex-1">
                {mode === 'view' ? (
                  <div className="border rounded-md p-4 min-h-[200px]">
                    <AnnouncementViewer content={content} />
                  </div>
                ) : (
                  <AnnouncementRichTextEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Write your announcement content here..."
                  />
                )}
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center gap-4'}`}>
              <Label className={isMobile ? '' : 'w-32 text-right text-sm font-medium'}>Attachments</Label>
              <div className="flex-1">
                {mode === 'create' ? (
                  <>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setPendingFiles(prev => [...prev, ...files]);
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                    />
                    {pendingFiles.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-muted-foreground">Files to upload after announcement creation:</p>
                        {pendingFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                            <span>{file.name}</span>
                            <button
                              type="button"
                              onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== index))}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {isUploadingFiles && (
                          <div className="text-sm text-blue-600 font-medium">
                            Uploading files...
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <AttachmentSection
                    recordType="announcement"
                    recordId={currentAnnouncement?.id || ''}
                    canEdit={mode !== 'view'}
                    defaultOpen={false}
                  />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={() => {
          setShowUnsavedDialog(false);
          navigate('/app/announcements');
        }}
        onCancel={() => setShowUnsavedDialog(false)}
      />
    </div>
  );
};