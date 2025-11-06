import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Edit2, Save, X, Plus, Trash2, GripVertical, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
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
interface ModulesManagementProps {
  isDialogOpen?: boolean;
  setIsDialogOpen?: (open: boolean) => void;
}
const ModulesManagement: React.FC<ModulesManagementProps> = ({
  isDialogOpen: externalDialogOpen,
  setIsDialogOpen: externalSetDialogOpen
}) => {
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);
  const isDialogOpen = externalDialogOpen !== undefined ? externalDialogOpen : internalDialogOpen;
  const setIsDialogOpen = externalSetDialogOpen || setInternalDialogOpen;
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>('sort_order');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

  // Form state for new module
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    icon: 'FileText',
    path: '',
    parent_module: '',
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
      setEditingModuleId(null);
      resetForm();
      setIsDialogOpen(false);
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
      parent_module: '',
      is_active: true,
      is_competition_portal: false,
      sort_order: 0
    });
    setEditingModuleId(null);
  };
  const handleEdit = (module: any) => {
    setEditingModuleId(module.id);
    setFormData({
      name: module.name,
      label: module.label,
      icon: (module as any).icon || 'FileText',
      path: (module as any).path || '',
      parent_module: (module as any).parent_module || '',
      is_active: (module as any).is_active !== false,
      is_competition_portal: (module as any).is_competition_portal || false,
      sort_order: (module as any).sort_order || 0
    });
    setIsDialogOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      parent_module: formData.parent_module || null
    };
    if (editingModuleId) {
      updateMutation.mutate({
        id: editingModuleId,
        ...submitData
      });
    } else {
      createMutation.mutate(submitData);
    }
  };
  const handleIconSelect = (iconName: string) => {
    setFormData({
      ...formData,
      icon: iconName
    });
  };
  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle>Permission Modules</CardTitle>
          <CardDescription>Loading modules...</CardDescription>
        </CardHeader>
      </Card>;
  }
  return <>
    <Dialog open={isDialogOpen} onOpenChange={open => {
      setIsDialogOpen(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingModuleId ? 'Edit Module' : 'Create New Module'}</DialogTitle>
        </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="label">Display Label</Label>
                  <Input id="label" value={formData.label} onChange={e => {
              const displayLabel = e.target.value;
              const moduleName = displayLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
              setFormData({
                ...formData,
                label: displayLabel,
                name: moduleName
              });
            }} required placeholder="e.g., Cadets, Tasks, Budget" />
                </div>

                <div>
                  <Label htmlFor="name">Module Name</Label>
                  <Input id="name" value={formData.name} onChange={e => setFormData({
              ...formData,
              name: e.target.value
            })} required placeholder="e.g., cadets, tasks, budget" />
                </div>
                
                <div>
                  <Label htmlFor="icon">Icon</Label>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsIconModalOpen(true)} className="flex items-center gap-2">
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
                  <Label htmlFor="parent_module">Parent Module (optional)</Label>
                  <Select value={formData.parent_module || "none"} onValueChange={value => setFormData({
              ...formData,
              parent_module: value === "none" ? '' : value
            })}>
                    <SelectTrigger id="parent_module">
                      <SelectValue placeholder="Select parent module" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {modules.map(module => <SelectItem key={module.id} value={module.id}>
                          {module.label}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
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
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || !formData.name.trim() || !formData.label.trim()}>
                    {editingModuleId ? 'Save Changes' : 'Create'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
              setIsDialogOpen(false);
              resetForm();
            }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
    
    <Card>
      
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
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modules.map(module => <TableRow key={module.id}>
                <TableCell>
                  <div className="flex items-center">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <span className="ml-2 text-sm">{(module as any).sort_order || 0}</span>
                  </div>
                </TableCell>
                <TableCell className="py-[8px]">
                  <span className="font-medium">{module.label}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {(() => {
                    const IconComponent = getIconComponent((module as any).icon || 'FileText');
                    return <IconComponent className="w-4 h-4" />;
                  })()}
                    <Badge variant="outline">{(module as any).icon || 'FileText'}</Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {(module as any).path || 'Not set'}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={(module as any).is_competition_portal ? 'default' : 'secondary'}>
                    {(module as any).is_competition_portal ? 'Competition' : 'CCC'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={(module as any).is_active !== false ? 'default' : 'secondary'}>
                    {(module as any).is_active !== false ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-center gap-2">
                    <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => handleEdit(module)}>
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300" onClick={() => deleteMutation.mutate(module.id)} disabled={deleteMutation.isPending}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>

        <IconSelectionModal isOpen={isIconModalOpen} onClose={() => setIsIconModalOpen(false)} selectedIcon={formData.icon} onIconSelect={handleIconSelect} />
      </CardContent>
    </Card>
  </>;
};
export default ModulesManagement;