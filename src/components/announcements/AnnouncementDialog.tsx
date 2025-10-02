import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AnnouncementRichTextEditor } from './components/AnnouncementRichTextEditor';
import { AttachmentSection } from '@/components/attachments/AttachmentSection';
import { Announcement } from '@/hooks/useAnnouncements';
import { convertToUTC, convertToUI } from '@/utils/timezoneUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
interface AnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: Announcement | null;
  onSubmit: (data: any) => void;
  mode: 'create' | 'edit';
}
export const AnnouncementDialog: React.FC<AnnouncementDialogProps> = ({
  open,
  onOpenChange,
  announcement,
  onSubmit,
  mode
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState([0]);
  const { timezone } = useSchoolTimezone();

  // Priority mapping helper
  const getPriorityLabel = (value: number) => {
    switch (value) {
      case 0:
        return 'Low';
      case 1:
        return 'Medium';
      case 2:
        return 'High';
      default:
        return 'Low';
    }
  };
  const getPriorityValue = (numericPriority: number) => {
    if (numericPriority >= 7) return 2; // High
    if (numericPriority >= 4) return 1; // Medium
    return 0; // Low
  };
  const [isActive, setIsActive] = useState(true);
  const [publishDate, setPublishDate] = useState<string>('');
  const [expireDate, setExpireDate] = useState<string>('');
  const [hasExpiration, setHasExpiration] = useState(false);
  useEffect(() => {
    if (announcement && mode === 'edit') {
      setTitle(announcement.title);
      setContent(announcement.content);
      setPriority([getPriorityValue(announcement.priority)]);
      setIsActive(announcement.is_active);
      setPublishDate(convertToUI(announcement.publish_date, timezone, 'dateKey'));
      if (announcement.expire_date) {
        setExpireDate(convertToUI(announcement.expire_date, timezone, 'dateKey'));
        setHasExpiration(true);
      } else {
        setExpireDate('');
        setHasExpiration(false);
      }
    } else {
      // Reset form for create mode
      setTitle('');
      setContent('');
      setPriority([0]);
      setIsActive(true);
      const today = new Date();
      setPublishDate(format(today, 'yyyy-MM-dd'));
      setExpireDate('');
      setHasExpiration(false);
    }
  }, [announcement, mode, open, timezone]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      title,
      content,
      priority: priority[0] === 2 ? 8 : priority[0] === 1 ? 5 : 2,
      is_active: isActive,
      publish_date: convertToUTC(publishDate, '12:00', timezone, { isAllDay: true }),
      expire_date: hasExpiration && expireDate ? convertToUTC(expireDate, '12:00', timezone, { isAllDay: true }) : null
    };
    if (mode === 'edit' && announcement) {
      onSubmit({
        ...data,
        id: announcement.id
      });
    } else {
      onSubmit(data);
    }
    onOpenChange(false);
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Announcement' : 'Edit Announcement'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter announcement title" required />
              </div>

              <div>
                <Label>Priority: {getPriorityLabel(priority[0])}</Label>
                <div className="px-2 py-4">
                  <Slider value={priority} onValueChange={setPriority} max={2} min={0} step={1} className="w-full" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="publish_date">Publish Date *</Label>
                <Input
                  id="publish_date"
                  type="date"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="expiration" checked={hasExpiration} onCheckedChange={setHasExpiration} />
                <Label htmlFor="expiration">Set expiration date</Label>
              </div>

              {hasExpiration && <div>
                  <Label htmlFor="expire_date">Expire Date</Label>
                  <Input
                    id="expire_date"
                    type="date"
                    value={expireDate}
                    onChange={(e) => setExpireDate(e.target.value)}
                  />
                </div>}
            </div>
          </div>

          {/* Content Editor */}
          <div>
            <AnnouncementRichTextEditor value={content} onChange={setContent} label="Content *" />
          </div>

          {/* Attachments */}
          {mode === 'edit' && announcement && <AttachmentSection recordType="announcement" recordId={announcement.id} canEdit={true} defaultOpen={false} />}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Create Announcement' : 'Update Announcement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>;
};