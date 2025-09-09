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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ArrowLeft, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AnnouncementRichTextEditor } from './components/AnnouncementRichTextEditor';
import { AttachmentSection } from '@/components/attachments/AttachmentSection';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { AnnouncementViewer } from './components/AnnouncementViewer';
import { useToast } from '@/hooks/use-toast';

type AnnouncementRecordMode = 'create' | 'edit' | 'view';

export const AnnouncementRecordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userProfile } = useAuth();
  
  const mode = searchParams.get('mode') as AnnouncementRecordMode || 'view';
  const recordId = searchParams.get('id');

  const { data: announcements } = useAnnouncements();
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const { canCreate, canEdit, canViewDetails } = useTablePermissions('announcements');

  // Find the current announcement if editing/viewing
  const currentAnnouncement = recordId ? announcements?.find(a => a.id === recordId) : null;

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState([0]);
  const [isActive, setIsActive] = useState(true);
  const [publishDate, setPublishDate] = useState<Date | undefined>(new Date());
  const [expireDate, setExpireDate] = useState<Date | undefined>();
  const [hasExpiration, setHasExpiration] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Initialize form data
  useEffect(() => {
    if (currentAnnouncement && (mode === 'edit' || mode === 'view')) {
      setTitle(currentAnnouncement.title);
      setContent(currentAnnouncement.content);
      setPriority([getPriorityValue(currentAnnouncement.priority)]);
      setIsActive(currentAnnouncement.is_active);
      setPublishDate(new Date(currentAnnouncement.publish_date));
      if (currentAnnouncement.expire_date) {
        setExpireDate(new Date(currentAnnouncement.expire_date));
        setHasExpiration(true);
      } else {
        setExpireDate(undefined);
        setHasExpiration(false);
      }
    } else if (mode === 'create') {
      // Reset form for create mode
      setTitle('');
      setContent('');
      setPriority([0]);
      setIsActive(true);
      setPublishDate(new Date());
      setExpireDate(undefined);
      setHasExpiration(false);
    }
  }, [currentAnnouncement, mode]);

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
        publishDate?.toISOString().split('T')[0] !== currentAnnouncement.publish_date.split('T')[0] ||
        (hasExpiration && expireDate ? expireDate.toISOString() : null) !== currentAnnouncement.expire_date
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
        publish_date: publishDate.toISOString(),
        expire_date: hasExpiration && expireDate ? expireDate.toISOString() : null
      };

      if (mode === 'create') {
        const newAnnouncement = await createMutation.mutateAsync(data);
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
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
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              {mode === 'create' ? 'Create Announcement' : 'Update Announcement'}
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
              <div className="flex items-center space-x-4">
                <Label className="w-24 text-right">Title *</Label>
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

              <div className="flex items-center space-x-4">
                <Label className="w-24 text-right">Priority</Label>
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

              <div className="flex items-center space-x-4">
                <Label className="w-24 text-right">Active</Label>
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
              <div className="flex items-center space-x-4">
                <Label className="w-32 text-right">Publish Date *</Label>
                <div className="flex-1">
                  {mode === 'view' ? (
                    <div className="px-3 py-2 text-sm">
                      {publishDate ? format(publishDate, 'PPP') : 'Not set'}
                    </div>
                  ) : (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className={cn("w-full justify-start text-left font-normal", !publishDate && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {publishDate ? format(publishDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={publishDate} onSelect={setPublishDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Label className="w-32 text-right">Set Expiration</Label>
                <div className="flex-1">
                  {mode === 'view' ? (
                    <div className="px-3 py-2 text-sm">{hasExpiration ? 'Yes' : 'No'}</div>
                  ) : (
                    <Switch checked={hasExpiration} onCheckedChange={setHasExpiration} />
                  )}
                </div>
              </div>

              {hasExpiration && (
                <div className="flex items-center space-x-4">
                  <Label className="w-32 text-right">Expire Date</Label>
                  <div className="flex-1">
                    {mode === 'view' ? (
                      <div className="px-3 py-2 text-sm">
                        {expireDate ? format(expireDate, 'PPP') : 'Not set'}
                      </div>
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            className={cn("w-full justify-start text-left font-normal", !expireDate && "text-muted-foreground")}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {expireDate ? format(expireDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={expireDate} onSelect={setExpireDate} initialFocus />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <Label className="w-24 text-right mt-2">Content *</Label>
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
          <Card>
            <CardHeader className="py-[8px]">
              <CardTitle className="flex items-center justify-between">
                <AttachmentSection 
                  recordType="announcement" 
                  recordId={currentAnnouncement?.id || 'temp'} 
                  canEdit={mode !== 'view'} 
                  defaultOpen={true} 
                  showTitleWithCount={true} 
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AttachmentSection 
                recordType="announcement" 
                recordId={currentAnnouncement?.id || 'temp'} 
                canEdit={mode !== 'view'} 
                defaultOpen={true} 
                showContentOnly={true} 
              />
            </CardContent>
          </Card>
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