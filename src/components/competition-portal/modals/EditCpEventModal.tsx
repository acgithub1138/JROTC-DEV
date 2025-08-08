import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JROTC_PROGRAM_OPTIONS } from '../../competition-management/utils/constants';
import { useCompetitionTemplates } from '../../competition-management/hooks/useCompetitionTemplates';
import type { Database } from '@/integrations/supabase/types';
type CpEvent = Database['public']['Tables']['cp_events']['Row'];
type CpEventUpdate = Database['public']['Tables']['cp_events']['Update'];
interface EditCpEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CpEvent | null;
  onEventUpdate: (id: string, updates: CpEventUpdate) => Promise<any>;
  onSuccess: () => void;
}
export const EditCpEventModal: React.FC<EditCpEventModalProps> = ({
  open,
  onOpenChange,
  event,
  onEventUpdate,
  onSuccess
}) => {
  const { templates, isLoading: templatesLoading } = useCompetitionTemplates();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    score_sheet: '',
    jrotc_program: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        description: event.description || '',
        score_sheet: event.score_sheet || '',
        jrotc_program: event.jrotc_program || ''
      });
    }
  }, [event]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !formData.name.trim()) return;
    setIsLoading(true);
    try {
      await onEventUpdate(event.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        score_sheet: formData.score_sheet.trim() || null,
        jrotc_program: formData.jrotc_program as any || null
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsLoading(false);
    }
  };
  if (!event) return null;
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Event Name *</Label>
            <Input id="name" value={formData.name} onChange={e => setFormData(prev => ({
            ...prev,
            name: e.target.value
          }))} placeholder="Enter event name" required />
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {isLoading ? 'Updating...' : 'Update Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>;
};