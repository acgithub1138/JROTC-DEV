import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { JROTC_PROGRAM_OPTIONS } from '../../competition-management/utils/constants';
import { useCompetitionTemplates } from '../../competition-management/hooks/useCompetitionTemplates';
import { useCompetitionEventTypes } from '../../competition-management/hooks/useCompetitionEventTypes';
interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onEventCreate: (eventData: {
    name: string;
    description?: string | null;
    score_sheet?: string | null;
    jrotc_program?: string | null;
  }) => Promise<any>;
}
export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  onEventCreate
}) => {
  const { templates, isLoading: templatesLoading } = useCompetitionTemplates();
  const { eventTypes, isLoading: eventTypesLoading } = useCompetitionEventTypes();
  
  const initialData = {
    name: '',
    description: '',
    score_sheet: '',
    jrotc_program: ''
  };
  
  const [formData, setFormData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData,
    currentData: formData,
    enabled: open
  });
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(newOpen);
      if (!newOpen) {
        setFormData(initialData);
        resetChanges();
      }
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    setFormData(initialData);
    resetChanges();
    onOpenChange(false);
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    setIsLoading(true);
    try {
      await onEventCreate({
        name: formData.name,
        description: formData.description.trim() || null,
        score_sheet: formData.score_sheet.trim() || null,
        jrotc_program: formData.jrotc_program || null
      });
      setFormData(initialData);
      resetChanges();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Event Name *</Label>
              <Select value={formData.name} onValueChange={value => setFormData(prev => ({
                ...prev,
                name: value
              }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event name" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map(eventType => (
                    <SelectItem key={eventType.id} value={eventType.name}>
                      {eventType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="jrotc_program">Event Type</Label>
              <Select value={formData.jrotc_program} onValueChange={value => setFormData(prev => ({
              ...prev,
              jrotc_program: value
            }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {JROTC_PROGRAM_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={e => setFormData(prev => ({
              ...prev,
              description: e.target.value
            }))} placeholder="Enter event description" rows={3} />
            </div>

            <div>
              <Label htmlFor="score_sheet">Score Sheet Template</Label>
              <Select value={formData.score_sheet} onValueChange={value => setFormData(prev => ({
                ...prev,
                score_sheet: value
              }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select score sheet template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.template_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !formData.name || eventTypesLoading}>
                {isLoading ? 'Creating...' : 'Create Event'}
              </Button>
            </div>
          </form>
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