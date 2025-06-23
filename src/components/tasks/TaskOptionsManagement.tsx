
import React, { useState } from 'react';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OptionFormData {
  value: string;
  label: string;
  color_class: string;
  sort_order: number;
}

const TaskOptionsManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const { statusOptions, createStatusOption, updateStatusOption, deleteStatusOption } = useTaskStatusOptions();
  const { priorityOptions, createPriorityOption, updatePriorityOption, deletePriorityOption } = useTaskPriorityOptions();
  
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [priorityDialogOpen, setPriorityDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<any>(null);
  const [editingPriority, setEditingPriority] = useState<any>(null);
  
  const [statusForm, setStatusForm] = useState<OptionFormData>({
    value: '',
    label: '',
    color_class: 'bg-gray-100 text-gray-800',
    sort_order: 0
  });
  
  const [priorityForm, setPriorityForm] = useState<OptionFormData>({
    value: '',
    label: '',
    color_class: 'bg-gray-100 text-gray-800',
    sort_order: 0
  });

  // Only show for admin users
  if (userProfile?.role !== 'admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task Options Management</CardTitle>
          <CardDescription>Access restricted to administrators</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const colorOptions = [
    { value: 'bg-gray-100 text-gray-800', label: 'Gray' },
    { value: 'bg-blue-100 text-blue-800', label: 'Blue' },
    { value: 'bg-green-100 text-green-800', label: 'Green' },
    { value: 'bg-yellow-100 text-yellow-800', label: 'Yellow' },
    { value: 'bg-orange-100 text-orange-800', label: 'Orange' },
    { value: 'bg-red-100 text-red-800', label: 'Red' },
    { value: 'bg-purple-100 text-purple-800', label: 'Purple' },
  ];

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStatus) {
      updateStatusOption({ ...statusForm, id: editingStatus.id });
    } else {
      createStatusOption(statusForm);
    }
    setStatusDialogOpen(false);
    setEditingStatus(null);
    setStatusForm({ value: '', label: '', color_class: 'bg-gray-100 text-gray-800', sort_order: 0 });
  };

  const handlePrioritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPriority) {
      updatePriorityOption({ ...priorityForm, id: editingPriority.id });
    } else {
      createPriorityOption(priorityForm);
    }
    setPriorityDialogOpen(false);
    setEditingPriority(null);
    setPriorityForm({ value: '', label: '', color_class: 'bg-gray-100 text-gray-800', sort_order: 0 });
  };

  const editStatus = (status: any) => {
    setEditingStatus(status);
    setStatusForm({
      value: status.value,
      label: status.label,
      color_class: status.color_class,
      sort_order: status.sort_order
    });
    setStatusDialogOpen(true);
  };

  const editPriority = (priority: any) => {
    setEditingPriority(priority);
    setPriorityForm({
      value: priority.value,
      label: priority.label,
      color_class: priority.color_class,
      sort_order: priority.sort_order
    });
    setPriorityDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Options Management</CardTitle>
        <CardDescription>Manage status and priority options for tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="status">Status Options</TabsTrigger>
            <TabsTrigger value="priority">Priority Options</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Status Options</h3>
              <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingStatus(null);
                    setStatusForm({ value: '', label: '', color_class: 'bg-gray-100 text-gray-800', sort_order: statusOptions.length + 1 });
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Status
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingStatus ? 'Edit Status' : 'Add New Status'}</DialogTitle>
                    <DialogDescription>
                      Configure the status option for tasks
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleStatusSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="status-value">Value</Label>
                      <Input
                        id="status-value"
                        value={statusForm.value}
                        onChange={(e) => setStatusForm({ ...statusForm, value: e.target.value })}
                        placeholder="e.g., in_progress"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="status-label">Label</Label>
                      <Input
                        id="status-label"
                        value={statusForm.label}
                        onChange={(e) => setStatusForm({ ...statusForm, label: e.target.value })}
                        placeholder="e.g., In Progress"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="status-color">Color</Label>
                      <select
                        id="status-color"
                        value={statusForm.color_class}
                        onChange={(e) => setStatusForm({ ...statusForm, color_class: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        {colorOptions.map((color) => (
                          <option key={color.value} value={color.value}>
                            {color.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="status-sort">Sort Order</Label>
                      <Input
                        id="status-sort"
                        type="number"
                        value={statusForm.sort_order}
                        onChange={(e) => setStatusForm({ ...statusForm, sort_order: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit">{editingStatus ? 'Update' : 'Create'}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statusOptions.map((status) => (
                  <TableRow key={status.id}>
                    <TableCell>{status.label}</TableCell>
                    <TableCell><code>{status.value}</code></TableCell>
                    <TableCell>
                      <Badge className={status.color_class}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>{status.sort_order}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => editStatus(status)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteStatusOption(status.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="priority" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Priority Options</h3>
              <Dialog open={priorityDialogOpen} onOpenChange={setPriorityDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingPriority(null);
                    setPriorityForm({ value: '', label: '', color_class: 'bg-gray-100 text-gray-800', sort_order: priorityOptions.length + 1 });
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Priority
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingPriority ? 'Edit Priority' : 'Add New Priority'}</DialogTitle>
                    <DialogDescription>
                      Configure the priority option for tasks
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handlePrioritySubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="priority-value">Value</Label>
                      <Input
                        id="priority-value"
                        value={priorityForm.value}
                        onChange={(e) => setPriorityForm({ ...priorityForm, value: e.target.value })}
                        placeholder="e.g., high"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="priority-label">Label</Label>
                      <Input
                        id="priority-label"
                        value={priorityForm.label}
                        onChange={(e) => setPriorityForm({ ...priorityForm, label: e.target.value })}
                        placeholder="e.g., High"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="priority-color">Color</Label>
                      <select
                        id="priority-color"
                        value={priorityForm.color_class}
                        onChange={(e) => setPriorityForm({ ...priorityForm, color_class: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        {colorOptions.map((color) => (
                          <option key={color.value} value={color.value}>
                            {color.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="priority-sort">Sort Order</Label>
                      <Input
                        id="priority-sort"
                        type="number"
                        value={priorityForm.sort_order}
                        onChange={(e) => setPriorityForm({ ...priorityForm, sort_order: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit">{editingPriority ? 'Update' : 'Create'}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priorityOptions.map((priority) => (
                  <TableRow key={priority.id}>
                    <TableCell>{priority.label}</TableCell>
                    <TableCell><code>{priority.value}</code></TableCell>
                    <TableCell>
                      <Badge className={priority.color_class}>{priority.label}</Badge>
                    </TableCell>
                    <TableCell>{priority.sort_order}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => editPriority(priority)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deletePriorityOption(priority.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TaskOptionsManagement;
