import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit2, Save, X, Plus, Trash2, GripVertical, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { IconSelectionModal } from './IconSelectionModal';

// Dynamic icon mapping using lucide-react icons
const getIconComponent = (iconName: string) => {
  // Use the already imported Icons from lucide-react
  const IconComponent = (Icons as any)[iconName];
  return IconComponent || Icons.FileText;
};
type SortColumn = 'sort_order' | 'label' | 'icon' | 'path' | 'is_competition_portal' | 'is_active';
type SortDirection = 'asc' | 'desc' | null;
const ModulesManagement: React.FC = () => {
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);
  const [iconModalType, setIconModalType] = useState<'create' | 'edit'>('create');
  const [sortColumn, setSortColumn] = useState<SortColumn>('sort_order');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Form state for new module
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    icon: 'FileText',
    path: '',
    is_active: true,
    is_competition_portal: false,
    sort_order: 0
  });

  // Fetch modules
  const {
    data: modulesData = [],
    isLoading
  } = useQuery({
    queryKey: ['permission_modules'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('permission_modules').select('*').order('sort_order');
      if (error) throw error;
      return data;
    }
  });

  // Sort modules based on current sort settings
  const modules = useMemo(() => {
    if (!sortColumn || !sortDirection) return modulesData;
    return [...modulesData].sort((a, b) => {
      const aVal = (a as any)[sortColumn];
      const bVal = (b as any)[sortColumn];
      if (sortColumn === 'sort_order') {
        const numA = aVal || 0;
        const numB = bVal || 0;
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }
      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        const result = aVal === bVal ? 0 : aVal ? 1 : -1;
        return sortDirection === 'asc' ? result : -result;
      }
      const strA = (aVal || '').toString().toLowerCase();
      const strB = (bVal || '').toString().toLowerCase();
      const result = strA.localeCompare(strB);
      return sortDirection === 'asc' ? result : -result;
    });
  }, [modulesData, sortColumn, sortDirection]);

  // Handle column sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc');
      if (sortDirection === 'desc') {
        setSortColumn('sort_order');
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Get sort icon for column header
  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return <ChevronsUpDown className="w-4 h-4" />;
    if (sortDirection === 'asc') return <ChevronUp className="w-4 h-4" />;
    if (sortDirection === 'desc') return <ChevronDown className="w-4 h-4" />;
    return <ChevronsUpDown className="w-4 h-4" />;
  };

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      ...moduleData
    }: any) => {
      const {
        data,
        error
      } = await supabase.from('permission_modules').update(moduleData).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['permission_modules']
      });
      toast({
        title: 'Module updated successfully'
      });
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
      const {
        data,
        error
      } = await supabase.from('permission_modules').insert([moduleData]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['permission_modules']
      });
      toast({
        title: 'Module created successfully'
      });
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
      const {
        error
      } = await supabase.from('permission_modules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['permission_modules']
      });
      toast({
        title: 'Module deleted successfully'
      });
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
      label: '',
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
      label: module.label,
      icon: (module as any).icon || 'FileText',
      path: (module as any).path || '',
      is_active: (module as any).is_active !== false,
      is_competition_portal: (module as any).is_competition_portal || false,
      sort_order: (module as any).sort_order || 0
    });
  };
  const handleSave = () => {
    if (!editingModule) return;
    updateMutation.mutate({
      id: editingModule,
      ...editForm
    });
  };
  const handleCancel = () => {
    setEditingModule(null);
    setEditForm({});
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };
  const openIconModal = (type: 'create' | 'edit') => {
    setIconModalType(type);
    setIsIconModalOpen(true);
  };
  const handleIconSelect = (iconName: string) => {
    if (iconModalType === 'create') {
      setFormData({
        ...formData,
        icon: iconName
      });
    } else if (editingModule) {
      setEditForm(prev => ({
        ...prev,
        icon: iconName
      }));
    }
  };
  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle>Permission Modules</CardTitle>
          <CardDescription>Loading modules...</CardDescription>
        </CardHeader>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Permission Modules Management
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Module
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Module</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Module Name</Label>
                  <Input id="name" value={formData.name} onChange={e => setFormData({
                  ...formData,
                  name: e.target.value
                })} required placeholder="e.g., cadets, tasks, budget" />
                </div>

                <div>
                  <Label htmlFor="label">Display Label</Label>
                  <Input id="label" value={formData.label} onChange={e => setFormData({
                  ...formData,
                  label: e.target.value
                })} required placeholder="e.g., Cadets, Tasks, Budget" />
                </div>
                
                <div>
                  <Label htmlFor="icon">Icon</Label>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => openIconModal('create')} className="flex items-center gap-2">
                      {formData.icon ? <>
                          {React.createElement(getIconComponent(formData.icon), {
                        className: "h-4 w-4"
                      })}
                          <span>{formData.icon}</span>
                        </> : <span>Browse Icons</span>}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="path">Path (optional)</Label>
                  <Input id="path" value={formData.path} onChange={e => setFormData({
                  ...formData,
                  path: e.target.value
                })} placeholder="/app/module-name" />
                </div>
                
                <div>
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input id="sort_order" type="number" value={formData.sort_order} onChange={e => setFormData({
                  ...formData,
                  sort_order: parseInt(e.target.value) || 0
                })} />
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="is_active" checked={formData.is_active} onCheckedChange={checked => setFormData({
                    ...formData,
                    is_active: !!checked
                  })} />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="is_competition_portal" checked={formData.is_competition_portal} onCheckedChange={checked => setFormData({
                    ...formData,
                    is_competition_portal: !!checked
                  })} />
                    <Label htmlFor="is_competition_portal">Competition Portal</Label>
                  </div>
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
        </CardTitle>
        <CardDescription>
          Manage permission modules that appear in sidebars and role permissions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px] cursor-pointer select-none" onClick={() => handleSort('sort_order')}>
                <div className="flex items-center space-x-1">
                  <span>Order</span>
                  {getSortIcon('sort_order')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort('label')}>
                <div className="flex items-center space-x-1">
                  <span>Module Label</span>
                  {getSortIcon('label')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort('icon')}>
                <div className="flex items-center space-x-1">
                  <span>Icon</span>
                  {getSortIcon('icon')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort('path')}>
                <div className="flex items-center space-x-1">
                  <span>Path</span>
                  {getSortIcon('path')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort('is_competition_portal')}>
                <div className="flex items-center space-x-1">
                  <span>Competition Portal</span>
                  {getSortIcon('is_competition_portal')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort('is_active')}>
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {getSortIcon('is_active')}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modules.map(module => <TableRow key={module.id}>
                <TableCell>
                  {editingModule === module.id ? <Input type="number" value={editForm.sort_order || 0} onChange={e => setEditForm(prev => ({
                ...prev,
                sort_order: parseInt(e.target.value) || 0
              }))} className="w-20" min="0" /> : <div className="flex items-center">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <span className="ml-2 text-sm">{(module as any).sort_order || 0}</span>
                    </div>}
                </TableCell>
                <TableCell>
                  {editingModule === module.id ? <Input value={editForm.label || ''} onChange={e => setEditForm(prev => ({
                ...prev,
                label: e.target.value
              }))} className="w-full" /> : <span className="font-medium">{module.label}</span>}
                </TableCell>
                <TableCell>
                  {editingModule === module.id ? <Button variant="outline" size="sm" onClick={() => openIconModal('edit')} className="flex items-center gap-2">
                      {React.createElement(getIconComponent(editForm.icon || 'FileText'), {
                  className: "h-4 w-4"
                })}
                      <span>{editForm.icon || 'FileText'}</span>
                    </Button> : <div className="flex items-center space-x-2">
                      {(() => {
                  const IconComponent = getIconComponent((module as any).icon || 'FileText');
                  return <IconComponent className="w-4 h-4" />;
                })()}
                      <Badge variant="outline">{(module as any).icon || 'FileText'}</Badge>
                    </div>}
                </TableCell>
                <TableCell>
                  {editingModule === module.id ? <Input value={editForm.path || ''} onChange={e => setEditForm(prev => ({
                ...prev,
                path: e.target.value
              }))} className="w-full" placeholder="/app/module-name" /> : <span className="text-sm text-muted-foreground">
                      {(module as any).path || 'Not set'}
                    </span>}
                </TableCell>
                <TableCell>
                  {editingModule === module.id ? <div className="flex items-center space-x-2">
                      <Switch checked={editForm.is_competition_portal || false} onCheckedChange={checked => setEditForm(prev => ({
                  ...prev,
                  is_competition_portal: checked
                }))} />
                      <Label className="text-sm">Competition</Label>
                    </div> : <Badge variant={(module as any).is_competition_portal ? 'default' : 'secondary'}>
                      {(module as any).is_competition_portal ? 'Competition' : 'CCC'}
                    </Badge>}
                </TableCell>
                <TableCell>
                  {editingModule === module.id ? <div className="flex items-center space-x-2">
                      <Switch checked={editForm.is_active !== false} onCheckedChange={checked => setEditForm(prev => ({
                  ...prev,
                  is_active: checked
                }))} />
                      <Label className="text-center">Active</Label>
                    </div> : <Badge variant={(module as any).is_active !== false ? 'default' : 'secondary'}>
                      {(module as any).is_active !== false ? 'Active' : 'Inactive'}
                    </Badge>}
                </TableCell>
                <TableCell className="flex items-center justify-center gap-2">
                  {editingModule === module.id ? <div className="flex items-center justify-center gap-2">
                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={handleCancel} disabled={updateMutation.isPending}>
                        <X className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={handleSave} disabled={updateMutation.isPending || !editForm.label?.trim()}>
                        <Save className="w-3 h-3" />
                      </Button>
                    </div> : <div className="flex items-center justify-center gap-2">
                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => handleEdit(module)} disabled={updateMutation.isPending}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300" onClick={() => deleteMutation.mutate(module.id)} disabled={deleteMutation.isPending}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>}
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>

        <IconSelectionModal isOpen={isIconModalOpen} onClose={() => setIsIconModalOpen(false)} selectedIcon={iconModalType === 'create' ? formData.icon : editForm.icon || ''} onIconSelect={handleIconSelect} />
      </CardContent>
    </Card>;
};
export default ModulesManagement;