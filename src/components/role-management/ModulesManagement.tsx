import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit2, Save, X, Plus, Trash2, GripVertical } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const iconOptions = [
  'Trophy', 'Calendar', 'Users', 'FileText', 'BarChart3', 'Settings', 
  'Shield', 'Award', 'Target', 'Clipboard', 'Search', 'User', 'Home',
  'Bell', 'Mail', 'Database', 'Key', 'Lock', 'Unlock'
];

export const ModulesManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state for new module
  const [formData, setFormData] = useState({
    name: '',
    icon: 'FileText',
    path: '',
    is_active: true,
    is_competition_portal: false,
    sort_order: 0
  });

  // Fetch modules
  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['permission_modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permission_modules')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data;
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...moduleData }: any) => {
      const { data, error } = await supabase
        .from('permission_modules')
        .update(moduleData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission_modules'] });
      toast({ title: 'Module updated successfully' });
      setEditingModule(null);
      setEditForm({});
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating module',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (moduleData: any) => {
      const { data, error } = await supabase
        .from('permission_modules')
        .insert([moduleData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission_modules'] });
      toast({ title: 'Module created successfully' });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating module',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('permission_modules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission_modules'] });
      toast({ title: 'Module deleted successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting module',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      icon: 'FileText',
      path: '',
      is_active: true,
      is_competition_portal: false,
      sort_order: 0
    });
  };

  const handleEdit = (module: any) => {
    setEditingModule(module.id);
    setEditForm({
      name: module.name,
      icon: (module as any).icon || 'FileText',
      path: (module as any).path || '',
      is_active: (module as any).is_active !== false,
      is_competition_portal: (module as any).is_competition_portal || false,
      sort_order: (module as any).sort_order || 0
    });
  };

  const handleSave = () => {
    if (!editingModule) return;

    updateMutation.mutate({ id: editingModule, ...editForm });
  };

  const handleCancel = () => {
    setEditingModule(null);
    setEditForm({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Permission Modules</CardTitle>
          <CardDescription>Loading modules...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Permission Modules Management
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Module
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Module</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Module Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="icon">Icon</Label>
                  <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map(icon => (
                        <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="path">Path (optional)</Label>
                  <Input
                    id="path"
                    value={formData.path}
                    onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                    placeholder="/app/module-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_competition_portal"
                      checked={formData.is_competition_portal}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_competition_portal: !!checked })}
                    />
                    <Label htmlFor="is_competition_portal">Competition Portal</Label>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                  >
                    Create
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Manage permission modules that appear in sidebars and role permissions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Order</TableHead>
              <TableHead>Module Name</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead>Path</TableHead>
              <TableHead>Competition Portal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modules.map((module) => (
              <TableRow key={module.id}>
                <TableCell>
                  <div className="flex items-center">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <span className="ml-2 text-sm">{(module as any).sort_order || 0}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {editingModule === module.id ? (
                    <Input
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full"
                    />
                  ) : (
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {module.name}
                    </code>
                  )}
                </TableCell>
                <TableCell>
                  {editingModule === module.id ? (
                    <Select 
                      value={editForm.icon || 'FileText'} 
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, icon: value }))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map(icon => (
                          <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline">{(module as any).icon || 'FileText'}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {editingModule === module.id ? (
                    <Input
                      value={editForm.path || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, path: e.target.value }))}
                      className="w-full"
                      placeholder="/app/module-name"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {(module as any).path || 'Not set'}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {editingModule === module.id ? (
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editForm.is_competition_portal || false}
                        onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_competition_portal: checked }))}
                      />
                      <Label className="text-sm">Competition</Label>
                    </div>
                  ) : (
                    <Badge variant={(module as any).is_competition_portal ? 'default' : 'secondary'}>
                      {(module as any).is_competition_portal ? 'Competition' : 'CCC'}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {editingModule === module.id ? (
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editForm.is_active !== false}
                        onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_active: checked }))}
                      />
                      <Label className="text-sm">Active</Label>
                    </div>
                  ) : (
                    <Badge variant={(module as any).is_active !== false ? 'default' : 'secondary'}>
                      {(module as any).is_active !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editingModule === module.id ? (
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={updateMutation.isPending}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={updateMutation.isPending || !editForm.name?.trim()}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(module)}
                        disabled={updateMutation.isPending}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(module.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};