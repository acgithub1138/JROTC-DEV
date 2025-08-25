import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { useAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement, Announcement } from '@/hooks/useAnnouncements';
import { AnnouncementDialog } from './AnnouncementDialog';
import { AnnouncementViewer } from './components/AnnouncementViewer';
import { Plus, Edit, Trash2, Eye, Calendar, AlertCircle, User, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
const AnnouncementManagementPage = () => {
  const {
    canCreate,
    canEdit,
    canDelete,
    canViewDetails
  } = useTablePermissions('announcements');
  const {
    data: announcements,
    isLoading
  } = useAnnouncements();
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

  // Filter announcements based on active tab
  const filteredAnnouncements = announcements?.filter(announcement => activeTab === 'active' ? announcement.is_active : !announcement.is_active) || [];
  const handleCreate = () => {
    setSelectedAnnouncement(null);
    setDialogMode('create');
    setIsDialogOpen(true);
  };
  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setDialogMode('edit');
    setIsDialogOpen(true);
  };
  const handleView = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsViewDialogOpen(true);
  };
  const handleSubmit = async (data: any) => {
    try {
      if (dialogMode === 'create') {
        await createMutation.mutateAsync(data);
      } else {
        await updateMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error('Error submitting announcement:', error);
    }
  };
  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteAnnouncementId(null);
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };
  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'bg-red-100 text-red-800';
    if (priority >= 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };
  const getPriorityLabel = (priority: number) => {
    if (priority >= 8) return 'High';
    if (priority >= 5) return 'Medium';
    return 'Low';
  };
  if (isLoading) {
    return <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Announcements</h1>
            <p className="text-muted-foreground">Manage school announcements</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>)}
        </div>
      </div>;
  }
  return <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">
            Manage school announcements and important notifications
          </p>
        </div>
        {canCreate && <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Announcement
          </Button>}
      </div>

      {/* Announcements Table with Tabs */}
      <Card>
        <CardHeader className="py-[8px]">
          <CardTitle>Announcements</CardTitle>
        </CardHeader>
        <CardContent className="py-[8px]">
          <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'active' | 'inactive')}>
            <TabsList className="grid w-full max-w-[400px] grid-cols-2">
              <TabsTrigger value="active">
                Active ({announcements?.filter(a => a.is_active).length || 0})
              </TabsTrigger>
              <TabsTrigger value="inactive">
                Not Active ({announcements?.filter(a => !a.is_active).length || 0})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-6">
              {filteredAnnouncements.length > 0 ? <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-0">Title</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Publish Date</TableHead>
                      <TableHead>Exp Date</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAnnouncements.map(announcement => <TableRow key={announcement.id}>
                        <TableCell className="font-medium max-w-[300px] py-[6px]">
                          <div className="truncate" title={announcement.title}>
                            {announcement.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getPriorityColor(announcement.priority)}>
                            {getPriorityLabel(announcement.priority)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(announcement.publish_date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          {announcement.expire_date ? format(new Date(announcement.expire_date), 'MMM d, yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={announcement.is_active ? "default" : "outline"}>
                            {announcement.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-start gap-2">
                            {canViewDetails && <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleView(announcement)} title="View">
                                <Eye className="w-3 h-3" />
                              </Button>}
                            {canEdit && <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleEdit(announcement)} title="Edit">
                                <Edit className="w-3 h-3" />
                              </Button>}
                            {canDelete && <Button variant="outline" size="icon" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300" onClick={() => setDeleteAnnouncementId(announcement.id)} title="Delete">
                                <Trash2 className="w-3 h-3" />
                              </Button>}
                          </div>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table> : <div className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No active announcements</h3>
                  <p className="text-muted-foreground text-center">
                    Create your first announcement to keep everyone informed
                  </p>
                </div>}
            </TabsContent>
            
            <TabsContent value="inactive" className="mt-6">
              {filteredAnnouncements.length > 0 ? <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Publish Date</TableHead>
                      <TableHead>Exp Date</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAnnouncements.map(announcement => <TableRow key={announcement.id}>
                        <TableCell className="font-medium max-w-[300px]">
                          <div className="truncate" title={announcement.title}>
                            {announcement.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getPriorityColor(announcement.priority)}>
                            {getPriorityLabel(announcement.priority)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(announcement.publish_date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          {announcement.expire_date ? format(new Date(announcement.expire_date), 'MMM d, yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={announcement.is_active ? "default" : "outline"}>
                            {announcement.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {canViewDetails && <Button variant="ghost" size="sm" onClick={() => handleView(announcement)} title="View">
                                <Eye className="w-4 h-4" />
                              </Button>}
                            {canEdit && <Button variant="ghost" size="sm" onClick={() => handleEdit(announcement)} title="Edit">
                                <Edit className="w-4 h-4" />
                              </Button>}
                            {canDelete && <Button variant="ghost" size="sm" onClick={() => setDeleteAnnouncementId(announcement.id)} title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </Button>}
                          </div>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table> : <div className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No inactive announcements</h3>
                  <p className="text-muted-foreground text-center">
                    All announcements are currently active
                  </p>
                </div>}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <AnnouncementDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} announcement={selectedAnnouncement} onSubmit={handleSubmit} mode={dialogMode} />

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAnnouncement?.title}
              {selectedAnnouncement && <>
                  <Badge variant="secondary" className={getPriorityColor(selectedAnnouncement.priority)}>
                    {getPriorityLabel(selectedAnnouncement.priority)}
                  </Badge>
                  {!selectedAnnouncement.is_active && <Badge variant="outline">Inactive</Badge>}
                </>}
            </DialogTitle>
          </DialogHeader>
          
          {selectedAnnouncement && <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {selectedAnnouncement.author ? `${selectedAnnouncement.author.first_name} ${selectedAnnouncement.author.last_name}` : 'Unknown Author'}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Published {format(new Date(selectedAnnouncement.publish_date), 'PPP')}
                </div>
                {selectedAnnouncement.expire_date && <div className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Expires {format(new Date(selectedAnnouncement.expire_date), 'PPP')}
                  </div>}
              </div>
              
              <div className="border-t pt-4">
                <AnnouncementViewer content={selectedAnnouncement.content} />
              </div>
            </div>}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteAnnouncementId} onOpenChange={() => setDeleteAnnouncementId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteAnnouncementId && handleDelete(deleteAnnouncementId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default AnnouncementManagementPage;