import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Trophy, Globe } from 'lucide-react';
import { useCompetitionEventTypes } from './hooks/useCompetitionEventTypes';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const CompetitionEventTypesManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const { eventTypes, isLoading, addEventType, isAddingEventType } = useCompetitionEventTypes();
  const { toast } = useToast();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newEventTypeName, setNewEventTypeName] = useState('');

  // Only show for admin users since event types are global
  if (userProfile?.role !== 'admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            Only administrators can manage competition event types.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleOpenCreateDialog = () => {
    setNewEventTypeName('');
    setShowCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setShowCreateDialog(false);
    setNewEventTypeName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTypeName.trim()) {
      toast({
        title: 'Error',
        description: 'Event type name is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addEventType(newEventTypeName.trim());
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
        variant: 'destructive',
      });
      setDeleteTarget(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Competition Event Types</CardTitle>
          <CardDescription>Loading event types...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Competition Event Types
              </CardTitle>
              <CardDescription>
                Manage competition event types for drill competitions
              </CardDescription>
            </div>
            <Button onClick={handleOpenCreateDialog} disabled={isAddingEventType}>
              <Plus className="w-4 h-4 mr-2" />
              Create Event Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {eventTypes.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No event types found. Create your first competition event type to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {eventTypes.map((eventType) => (
                <div
                  key={eventType.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{eventType.name}</span>
                      {eventType.is_default && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          Default
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!eventType.is_default && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(eventType.name)}
                        className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                        title="Delete event type"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    {eventType.is_default && (
                      <Badge variant="outline">Protected</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
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
                <Input
                  id="name"
                  value={newEventTypeName}
                  onChange={(e) => setNewEventTypeName(e.target.value)}
                  placeholder="e.g., Armed Solo Exhibition, Unarmed Dual Exhibition"
                  required
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
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Event Type
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CompetitionEventTypesManagement;