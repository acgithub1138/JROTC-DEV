import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { useAnnouncements, useDeleteAnnouncement, Announcement } from '@/hooks/useAnnouncements';
import { Plus, Edit, Trash2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const AnnouncementManagementPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
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
  const deleteMutation = useDeleteAnnouncement();
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

  // Filter announcements based on active tab
  const filteredAnnouncements = announcements?.filter(announcement => activeTab === 'active' ? announcement.is_active : !announcement.is_active) || [];
  
  const handleCreate = () => {
    navigate('/app/announcements/announcements_record?mode=create');
  };
  const handleEdit = (announcement: Announcement) => {
    navigate(`/app/announcements/announcements_record?mode=edit&id=${announcement.id}`);
  };
  const handleView = (announcement: Announcement) => {
    navigate(`/app/announcements/announcements_record?mode=view&id=${announcement.id}`);
  };
  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteAnnouncementId(null);
      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive",
      });
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

  // Render announcement cards for mobile
  const renderAnnouncementCards = (announcements: Announcement[]) => (
    <div className="space-y-4">
      {announcements.map(announcement => (
        <Card key={announcement.id} className="w-full">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">
                {canViewDetails ? (
                  <button 
                    onClick={() => handleView(announcement)} 
                    className="text-blue-600 hover:text-blue-800 hover:underline transition-colors text-left"
                  >
                    {announcement.title}
                  </button>
                ) : (
                  <span>{announcement.title}</span>
                )}
              </CardTitle>
              <div className="flex flex-col gap-1">
                <Badge variant="secondary" className={getPriorityColor(announcement.priority)}>
                  {getPriorityLabel(announcement.priority)}
                </Badge>
                <Badge variant={announcement.is_active ? "default" : "outline"}>
                  {announcement.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Published:</span>
                <p className="font-medium">{format(new Date(announcement.publish_date), 'MMM d, yyyy')}</p>
              </div>
              {announcement.expire_date && (
                <div>
                  <span className="text-muted-foreground">Expires:</span>
                  <p className="font-medium">{format(new Date(announcement.expire_date), 'MMM d, yyyy')}</p>
                </div>
              )}
            </div>
            
            <div className={isMobile ? "grid grid-cols-2 gap-2 pt-2" : "flex justify-end gap-2 pt-2"}>
              {canEdit && (
                <Button 
                  variant="outline" 
                  size={isMobile ? "default" : "icon"} 
                  className={isMobile ? "w-full" : "h-8 w-8"} 
                  onClick={() => handleEdit(announcement)} 
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                  {isMobile && <span className="ml-2">Edit</span>}
                </Button>
              )}
              {canDelete && (
                <Button 
                  variant="outline" 
                  size={isMobile ? "default" : "icon"} 
                  className={isMobile ? "w-full text-red-600 hover:text-red-700 hover:border-red-300" : "h-8 w-8 text-red-600 hover:text-red-700 hover:border-red-300"} 
                  onClick={() => setDeleteAnnouncementId(announcement.id)} 
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                  {isMobile && <span className="ml-2">Delete</span>}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render announcement table for desktop
  const renderAnnouncementTable = (announcements: Announcement[]) => (
    <Table>
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
        {announcements.map(announcement => 
          <TableRow key={announcement.id}>
            <TableCell className="font-medium max-w-[300px] py-[6px]">
              <div 
                className={`truncate transition-colors ${
                  canViewDetails 
                    ? 'cursor-pointer text-blue-600 hover:text-blue-800' 
                    : 'text-foreground'
                }`}
                title={announcement.title}
                onClick={canViewDetails ? () => handleView(announcement) : undefined}
              >
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
              <div className="flex items-center justify-center gap-2">
                {canEdit && 
                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleEdit(announcement)} title="Edit">
                    <Edit className="w-3 h-3" />
                  </Button>
                }
                {canDelete && 
                  <Button variant="outline" size="icon" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300" onClick={() => setDeleteAnnouncementId(announcement.id)} title="Delete">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                }
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Announcements</h1>
            <p className="text-muted-foreground">Manage school announcements</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'justify-between items-center'}`}>
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">
            Manage school announcements and important notifications
          </p>
        </div>
        {canCreate && 
          <Button onClick={handleCreate} className={isMobile ? 'w-full' : ''}>
            <Plus className="w-4 h-4 mr-2" />
            Create Announcement
          </Button>
        }
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
              {filteredAnnouncements.length > 0 ? (
                isMobile ? renderAnnouncementCards(filteredAnnouncements) : renderAnnouncementTable(filteredAnnouncements)
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No active announcements</h3>
                  <p className="text-muted-foreground text-center">
                    Create your first announcement to keep everyone informed
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="inactive" className="mt-6">
              {filteredAnnouncements.length > 0 ? (
                isMobile ? renderAnnouncementCards(filteredAnnouncements) : renderAnnouncementTable(filteredAnnouncements)
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No inactive announcements</h3>
                  <p className="text-muted-foreground text-center">
                    All announcements are currently active
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
            <AlertDialogAction 
              onClick={() => deleteAnnouncementId && handleDelete(deleteAnnouncementId)} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AnnouncementManagementPage;