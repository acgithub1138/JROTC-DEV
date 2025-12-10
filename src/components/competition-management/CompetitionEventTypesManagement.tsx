import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Trophy, Globe } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCompetitionEventTypes } from './hooks/useCompetitionEventTypes';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { usePermissionContext } from '@/contexts/PermissionContext';

interface CompetitionEventTypesManagementProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
}

const CompetitionEventTypesManagement: React.FC<CompetitionEventTypesManagementProps> = ({ isDialogOpen, setIsDialogOpen }) => {
  const {
    userProfile
  } = useAuth();
  const {
    eventTypes,
    isLoading,
    addEventType,
    isAddingEventType
  } = useCompetitionEventTypes();
  const { toast } = useToast();
  const { hasPermission } = usePermissionContext();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newEventTypeName, setNewEventTypeName] = useState('');
  const [newEventTypeInitials, setNewEventTypeInitials] = useState('');
  const [newEventTypeWeight, setNewEventTypeWeight] = useState('1.0');

  // Only show for admin users since event types are global
  if (userProfile?.role !== 'admin') {
    return <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            Only administrators can manage competition event types.
          </CardDescription>
        </CardHeader>
      </Card>;
  }
  const handleOpenCreateDialog = () => {
    setNewEventTypeName('');
    setNewEventTypeInitials('');
    setNewEventTypeWeight('1.0');
    setIsDialogOpen(true);
  };
  const handleCloseCreateDialog = () => {
    setIsDialogOpen(false);
    setNewEventTypeName('');
    setNewEventTypeInitials('');
    setNewEventTypeWeight('1.0');
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTypeName.trim()) {
      toast({
        title: 'Error',
        description: 'Event type name is required',
        variant: 'destructive'
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const weightValue = parseFloat(newEventTypeWeight);
      await addEventType(newEventTypeName.trim(), newEventTypeInitials.trim() || undefined, weightValue);
      handleCloseCreateDialog();
    } catch (error) {
      console.error('Error creating event type:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDelete = async (eventTypeName: string) => {
    setDeleteTarget(eventTypeName);
  };
  const confirmDelete = async () => {
    if (deleteTarget) {
      // TODO: Implement delete functionality in the hook
      toast({
        title: 'Delete Functionality',
        description: 'Delete functionality will be implemented in the next phase',
        variant: 'destructive'
      });
      setDeleteTarget(null);
    }
  };
  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle>Competition Event Types</CardTitle>
          <CardDescription>Loading event types...</CardDescription>
        </CardHeader>
      </Card>;
  }
  return <>
      <Card className="bg-white">
        <CardContent className="pt-6">
          {eventTypes.length === 0 ? <div className="text-center text-muted-foreground py-8">
              No event types found. Create your first competition event type to get started.
            </div> : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Initials</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...eventTypes].sort((a, b) => a.name.localeCompare(b.name)).map(eventType => <TableRow key={eventType.id}>
                    <TableCell className="font-medium py-[8px]">{eventType.name}</TableCell>
                    <TableCell className="py-[8px]">{eventType.initials || '-'}</TableCell>
                    <TableCell className="py-[8px]">{eventType.weight?.toFixed(1) || '1.0'}</TableCell>
                    <TableCell>
                      {eventType.is_default && <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <Globe className="w-3 h-3" />
                          Default
                        </Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!eventType.is_default && hasPermission('comp_event_types', 'delete') ? <Button variant="outline" size="icon" onClick={() => handleDelete(eventType.name)} className="text-red-600 hover:text-red-700 h-8 w-8 p-0" title="Delete event type">
                            <Trash2 className="w-4 h-4" />
                          </Button> : <Badge variant="outline">Protected</Badge>}
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Competition Event Type</DialogTitle>
            <DialogDescription>
              Create a new competition event type for drill competitions
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Event Type Name</Label>
                <Input id="name" value={newEventTypeName} onChange={e => setNewEventTypeName(e.target.value)} placeholder="e.g., Armed Solo Exhibition, Unarmed Dual Exhibition" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="initials">Initials (Optional)</Label>
                <Input id="initials" value={newEventTypeInitials} onChange={e => setNewEventTypeInitials(e.target.value)} placeholder="e.g., ASE, UDE" maxLength={10} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="weight">Weight (1.0 - 2.0)</Label>
                <Input 
                  id="weight" 
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="2.0"
                  value={newEventTypeWeight} 
                  onChange={e => {
                    let value = e.target.value;
                    if (value === '' || value === '.' || value === '1.' || value === '2.') {
                      setNewEventTypeWeight(value);
                      return;
                    }
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                      const clampedValue = Math.min(2.0, Math.max(1.0, numValue));
                      setNewEventTypeWeight(clampedValue.toFixed(1));
                    }
                  }}
                  onBlur={() => {
                    const numValue = parseFloat(newEventTypeWeight);
                    if (isNaN(numValue) || numValue < 1.0) {
                      setNewEventTypeWeight("1.0");
                    } else if (numValue > 2.0) {
                      setNewEventTypeWeight("2.0");
                    } else {
                      setNewEventTypeWeight(numValue.toFixed(1));
                    }
                  }}
                  placeholder="1.0 - 2.0" 
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseCreateDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isAddingEventType}>
                {isSubmitting || isAddingEventType ? 'Creating...' : 'Create'}
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
              Are you sure you want to delete the event type "{deleteTarget}"? 
              This action cannot be undone and may affect existing competitions.
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
export default CompetitionEventTypesManagement;