import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Edit2, Save, X, Plus, Trash2, GripVertical } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ActionsManagementProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
}

export const ActionsManagement: React.FC<ActionsManagementProps> = ({ isDialogOpen, setIsDialogOpen }) => {
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Form state for new action
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    description: '',
    is_active: true,
    sort_order: 0
  });

  // Fetch actions
  const {
    data: actions = [],
    isLoading
  } = useQuery({
    queryKey: ['permission_actions'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('permission_actions').select('*').order('sort_order');
      if (error) throw error;
      return data;
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      ...actionData
    }: any) => {
      const {
        data,
        error
      } = await supabase.from('permission_actions').update(actionData).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['permission_actions']
      });
      setEditingAction(null);
      setEditForm({});
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating action',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (actionData: any) => {
      const {
        data,
        error
      } = await supabase.from('permission_actions').insert([actionData]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['permission_actions']
      });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating action',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const {
        error
      } = await supabase.from('permission_actions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['permission_actions']
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting action',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  const resetForm = () => {
    setFormData({
      name: '',
      label: '',
      description: '',
      is_active: true,
      sort_order: 0
    });
  };
  const handleEdit = (action: any) => {
    setEditingAction(action.id);
    setEditForm({
      name: action.name,
      label: action.label,
      description: action.description || '',
      is_active: (action as any).is_active !== false,
      sort_order: (action as any).sort_order || 0
    });
  };
  const handleSave = () => {
    if (!editingAction) return;
    updateMutation.mutate({
      id: editingAction,
      ...editForm
    });
  };
  const handleCancel = () => {
    setEditingAction(null);
    setEditForm({});
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };
  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle>Permission Actions</CardTitle>
          <CardDescription>Loading actions...</CardDescription>
        </CardHeader>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <CardTitle>Permission Actions Management</CardTitle>
        <CardDescription>
          Manage permission actions that can be assigned to roles for each module.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Action</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Action Name</Label>
                  <Input id="name" value={formData.name} onChange={e => setFormData({
                  ...formData,
                  name: e.target.value
                })} required placeholder="e.g., create, read, update, delete" />
                </div>

                <div>
                  <Label htmlFor="label">Display Label</Label>
                  <Input id="label" value={formData.label} onChange={e => setFormData({
                  ...formData,
                  label: e.target.value
                })} required placeholder="e.g., Create, Read, Update, Delete" />
                </div>
                
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input id="description" value={formData.description} onChange={e => setFormData({
                  ...formData,
                  description: e.target.value
                })} placeholder="Brief description of what this action allows" />
                </div>
                
                <div>
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input id="sort_order" type="number" value={formData.sort_order} onChange={e => setFormData({
                  ...formData,
                  sort_order: parseInt(e.target.value) || 0
                })} />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="is_active" checked={formData.is_active} onCheckedChange={checked => setFormData({
                  ...formData,
                  is_active: !!checked
                })} />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending || !formData.name.trim() || !formData.label.trim()}>
                    Create
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Order</TableHead>
              <TableHead>Action Label</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actions.map(action => <TableRow key={action.id}>
                <TableCell>
                  <div className="flex items-center">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <span className="ml-2 text-sm">{(action as any).sort_order || 0}</span>
                  </div>
                </TableCell>
                <TableCell className="py-[8px]">
                  {editingAction === action.id ? <Input value={editForm.label || ''} onChange={e => setEditForm(prev => ({
                ...prev,
                label: e.target.value
              }))} className="w-full" /> : <span className="font-medium">{action.label}</span>}
                </TableCell>
                <TableCell>
                  {editingAction === action.id ? <Input value={editForm.description || ''} onChange={e => setEditForm(prev => ({
                ...prev,
                description: e.target.value
              }))} className="w-full" placeholder="Brief description" /> : <span className="text-sm text-muted-foreground">
                      {action.description || 'No description'}
                    </span>}
                </TableCell>
                <TableCell>
                  {editingAction === action.id ? <div className="flex items-center space-x-2">
                      <Switch checked={editForm.is_active !== false} onCheckedChange={checked => setEditForm(prev => ({
                  ...prev,
                  is_active: checked
                }))} />
                      <Label className="text-sm">Active</Label>
                    </div> : <Badge variant={(action as any).is_active !== false ? 'default' : 'secondary'}>
                      {(action as any).is_active !== false ? 'Active' : 'Inactive'}
                    </Badge>}
                </TableCell>
                <TableCell className="text-right">
                  {editingAction === action.id ? <div className="flex items-center justify-center gap-2">
                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={handleCancel} disabled={updateMutation.isPending}>
                        <X className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={handleSave} disabled={updateMutation.isPending || !editForm.label?.trim()}>
                        <Save className="w-3 h-3" />
                      </Button>
                    </div> : <div className="flex items-center justify-center gap-2">
                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => handleEdit(action)} disabled={updateMutation.isPending}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300" onClick={() => deleteMutation.mutate(action.id)} disabled={deleteMutation.isPending}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>}
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </CardContent>
    </Card>;
};