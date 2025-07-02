import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JobBoardWithCadet } from '../types';

interface ConnectionSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobBoardWithCadet | null;
  onSave: (jobId: string, updates: any) => void;
  loading: boolean;
}

const HANDLE_OPTIONS = [
  { value: 'top-target', label: 'Top' },
  { value: 'bottom-source', label: 'Bottom' },
  { value: 'left-target', label: 'Left' },
  { value: 'right-source', label: 'Right' },
];

export const ConnectionSettingsDialog = ({ 
  open, 
  onOpenChange, 
  job, 
  onSave, 
  loading 
}: ConnectionSettingsDialogProps) => {
  const [settings, setSettings] = useState({
    reports_to_source_handle: 'bottom-source',
    reports_to_target_handle: 'top-target',
    assistant_source_handle: 'right-source',
    assistant_target_handle: 'left-target',
  });

  useEffect(() => {
    if (job) {
      setSettings({
        reports_to_source_handle: job.reports_to_source_handle || 'bottom-source',
        reports_to_target_handle: job.reports_to_target_handle || 'top-target',
        assistant_source_handle: job.assistant_source_handle || 'right-source',
        assistant_target_handle: job.assistant_target_handle || 'left-target',
      });
    }
  }, [job]);

  const handleSave = () => {
    if (!job) return;
    onSave(job.id, settings);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connection Settings - {job.role}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {job.reports_to && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Reports To Connection</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From this role (source)</Label>
                  <Select
                    value={settings.reports_to_source_handle}
                    onValueChange={(value) => 
                      setSettings(prev => ({ ...prev, reports_to_source_handle: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HANDLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>To {job.reports_to} (target)</Label>
                  <Select
                    value={settings.reports_to_target_handle}
                    onValueChange={(value) => 
                      setSettings(prev => ({ ...prev, reports_to_target_handle: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HANDLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {job.assistant && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Assistant Connection</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From this role (source)</Label>
                  <Select
                    value={settings.assistant_source_handle}
                    onValueChange={(value) => 
                      setSettings(prev => ({ ...prev, assistant_source_handle: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HANDLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>To {job.assistant} (target)</Label>
                  <Select
                    value={settings.assistant_target_handle}
                    onValueChange={(value) => 
                      setSettings(prev => ({ ...prev, assistant_target_handle: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HANDLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};