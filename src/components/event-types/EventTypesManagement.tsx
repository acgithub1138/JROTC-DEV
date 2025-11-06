import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Edit2, Plus, Palette, Globe } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEventTypes, EventType } from '@/components/calendar/hooks/useEventTypes';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { usePermissionContext } from '@/contexts/PermissionContext';
interface EventTypeFormData {
  value: string;
  label: string;
  color: string;
}
interface EventTypesManagementProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
}

const EventTypesManagement: React.FC<EventTypesManagementProps> = ({ isDialogOpen, setIsDialogOpen }) => {
  const {
    userProfile
  } = useAuth();
  const {
    eventTypes,
    isLoading,
    createEventType,
    updateEventType,
    deleteEventType
  } = useEventTypes();
  const { toast } = useToast();
  const { hasPermission } = usePermissionContext();
  const [editingEventType, setEditingEventType] = useState<EventType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EventType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<EventTypeFormData>({
    value: '',
    label: '',
    color: '#3B82F6'
  });

  // Only show for admin users since event types are global
  if (userProfile?.role !== 'admin') {
    return <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            Only administrators can manage event types and colors.
          </CardDescription>
        </CardHeader>
      </Card>;
  }
  const handleOpenDialog = (eventType?: EventType) => {
    if (eventType) {
      setEditingEventType(eventType);
      setFormData({
        value: eventType.value,
        label: eventType.label,
        color: eventType.color || '#3B82F6'
      });
    } else {
      setEditingEventType(null);
      setFormData({
        value: '',
        label: '',
        color: '#3B82F6'
      });
    }
    setIsDialogOpen(true);
  };
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEventType(null);
    setFormData({
      value: '',
      label: '',
      color: '#3B82F6'
    });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.value.trim() || !formData.label.trim()) {
      toast({
        title: 'Error',
        description: 'Event type value and name are required',
        variant: 'destructive'
      });
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingEventType) {
        await updateEventType(editingEventType.id, {
          value: formData.value.trim(),
          label: formData.label.trim(),
          color: formData.color
        });
      } else {
        await createEventType(formData.value.trim(), formData.label.trim(), formData.color);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving event type:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDelete = async (eventType: EventType) => {
    if (eventType.is_default) {
      toast({
        title: 'Cannot Delete',
        description: 'Global default event types cannot be deleted, but you can edit them',
        variant: 'destructive'
      });
      return;
    }
    setDeleteTarget(eventType);
  };
  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteEventType(deleteTarget.id);
      setDeleteTarget(null);
    }
  };
  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle>Event Types & Colors</CardTitle>
          <CardDescription>Loading event types...</CardDescription>
        </CardHeader>
      </Card>;
  }
  return <>
      <Card className="bg-white">
        <CardContent className="pt-6">
          {eventTypes.length === 0 ? <div className="text-center text-muted-foreground py-8">
              No event types found. Create your first event type to get started.
            </div> : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Color</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...eventTypes].sort((a, b) => (a.order || 0) - (b.order || 0)).map(eventType => <TableRow key={eventType.id}>
                    <TableCell>
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300" style={{
                  backgroundColor: eventType.color || '#3B82F6'
                }} />
                    </TableCell>
                    <TableCell className="font-medium py-[8px]">{eventType.label}</TableCell>
                    <TableCell className="text-muted-foreground">{eventType.value}</TableCell>
                    <TableCell>
                      {eventType.is_default && <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <Globe className="w-3 h-3" />
                          Global
                        </Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        {hasPermission('cal_event_types', 'update') && (
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleOpenDialog(eventType)} title="Edit">
                            <Edit className="w-3 h-3" />
                          </Button>
                        )}
                        {hasPermission('cal_event_types', 'delete') && (
                          <Button variant="outline" size="icon" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300" onClick={() => handleDelete(eventType)} title="Delete" disabled={eventType.is_default}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEventType ? 'Edit Event Type' : 'Create Event Type'}
            </DialogTitle>
            <DialogDescription>
              {editingEventType ? `Update the event type name and color${editingEventType.is_default ? ' (Global Default)' : ''}` : 'Create a new event type with a custom color'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="value">Event Type Value</Label>
                <Input id="value" value={formData.value} onChange={e => setFormData(prev => ({
                ...prev,
                value: e.target.value
              }))} placeholder="e.g., training, competition, meeting" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="label">Event Type Name</Label>
                <Input id="label" value={formData.label} onChange={e => setFormData(prev => ({
                ...prev,
                label: e.target.value
              }))} placeholder="e.g., Training, Competition, Meeting" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center gap-3">
                  <input type="color" id="color" value={formData.color} onChange={e => setFormData(prev => ({
                  ...prev,
                  color: e.target.value
                }))} className="w-12 h-10 border border-gray-300 rounded cursor-pointer" />
                  <Input value={formData.color} onChange={e => setFormData(prev => ({
                  ...prev,
                  color: e.target.value
                }))} placeholder="#3B82F6" pattern="^#[0-9A-Fa-f]{6}$" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingEventType ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the event type "{deleteTarget?.label}"? 
              This action cannot be undone and may affect existing calendar events.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Event Type
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>;
};
export default EventTypesManagement;