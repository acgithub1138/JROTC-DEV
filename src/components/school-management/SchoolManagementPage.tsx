
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, addYears } from 'date-fns';
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { CreateSchoolDialog } from '@/components/admin/CreateSchoolDialog';
import { 
  Building2, 
  Edit, 
  Trash2, 
  Search, 
  Plus,
  CalendarIcon
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface School {
  id: string;
  name: string;
  jrotc_program?: 'air_force' | 'army' | 'coast_guard' | 'navy' | 'marine_corps' | 'space_force';
  contact?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  competition_module?: boolean;
  subscription_start?: string;
  subscription_end?: string;
  referred_by?: string;
  notes?: string;
  created_at: string;
}

const SchoolManagementPage = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createSchoolOpen, setCreateSchoolOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);

  const RECORDS_PER_PAGE = 25;

  const emptySchool: Omit<School, 'id' | 'created_at'> = {
    name: '',
    jrotc_program: undefined,
    contact: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
    competition_module: false,
    subscription_start: undefined,
    subscription_end: undefined,
    referred_by: '',
    notes: '',
  };

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast({
        title: "Error",
        description: "Failed to fetch schools",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleCreateSchool = () => {
    setCreateSchoolOpen(true);
  };

  const handleEditSchool = (school: School) => {
    setEditingSchool(school);
    setEditDialogOpen(true);
  };

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool) return;

    try {
      const { error } = await supabase
        .from('schools')
        .update({
          name: editingSchool.name,
          jrotc_program: editingSchool.jrotc_program,
          contact: editingSchool.contact,
          address: editingSchool.address,
          city: editingSchool.city,
          state: editingSchool.state,
          zip_code: editingSchool.zip_code,
          phone: editingSchool.phone,
          email: editingSchool.email,
          competition_module: editingSchool.competition_module,
          subscription_start: editingSchool.subscription_start,
          subscription_end: editingSchool.subscription_end,
          referred_by: editingSchool.referred_by,
          notes: editingSchool.notes,
        })
        .eq('id', editingSchool.id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "School updated successfully",
      });

      setEditDialogOpen(false);
      setEditingSchool(null);
      fetchSchools();
    } catch (error) {
      console.error('Error saving school:', error);
      toast({
        title: "Error",
        description: "Failed to save school",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSchool = async () => {
    if (!schoolToDelete) return;

    try {
      const { error } = await supabase
        .from('schools')
        .delete()
        .eq('id', schoolToDelete.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "School deleted successfully",
      });

      setDeleteDialogOpen(false);
      setSchoolToDelete(null);
      fetchSchools();
    } catch (error) {
      console.error('Error deleting school:', error);
      toast({
        title: "Error",
        description: "Failed to delete school",
        variant: "destructive",
      });
    }
  };

  const filteredSchools = schools.filter(school =>
    // Filter out the admin school
    school.name !== 'Carey Unlimited' &&
    (school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.city?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredSchools.length / RECORDS_PER_PAGE);
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const endIndex = startIndex + RECORDS_PER_PAGE;
  const paginatedSchools = filteredSchools.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Helper function to check if subscription expires within 3 months
  const isSubscriptionExpiringSoon = (endDate: string | undefined) => {
    if (!endDate) return false;
    
    const today = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(today.getMonth() + 3);
    
    const subscriptionEnd = new Date(endDate);
    return subscriptionEnd <= threeMonthsFromNow && subscriptionEnd >= today;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">School Management</h2>
          <p className="text-muted-foreground">
            Manage schools in the system
          </p>
        </div>
        <Button onClick={handleCreateSchool}>
          <Plus className="w-4 h-4 mr-2" />
          Add School
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Schools ({filteredSchools.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search schools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Comp Module</TableHead>
                <TableHead>Subscription Start</TableHead>
                <TableHead>Subscription End</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSchools.map((school) => (
                <TableRow key={school.id}>
                  <TableCell className={`font-medium py-2 ${isSubscriptionExpiringSoon(school.subscription_end) ? 'text-red-600' : ''}`}>
                    {school.name}
                  </TableCell>
                  <TableCell className="py-2">{school.contact || '-'}</TableCell>
                  <TableCell className="py-2">{school.competition_module ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="py-2">
                    {school.subscription_start 
                      ? format(new Date(school.subscription_start), "MM/dd/yyyy")
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="py-2">
                    {school.subscription_end 
                      ? format(new Date(school.subscription_end), "MM/dd/yyyy")
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-right py-2">
                    <div className="flex items-center justify-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon" className="h-6 w-6"
                              onClick={() => handleEditSchool(school)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit school</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300"
                              onClick={() => {
                                setSchoolToDelete(school);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete school</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredSchools.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No schools found
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (totalPages <= 7 || page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create School Dialog */}
      <CreateSchoolDialog 
        open={createSchoolOpen} 
        onOpenChange={(open) => {
          setCreateSchoolOpen(open);
          if (!open) {
            fetchSchools(); // Refresh the list when dialog closes
          }
        }} 
      />

      {/* Edit School Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit School</DialogTitle>
          </DialogHeader>
          {editingSchool && (
            <form onSubmit={handleSaveSchool} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">School Name *</Label>
                  <Input
                    id="name"
                    value={editingSchool.name}
                    onChange={(e) => setEditingSchool({
                      ...editingSchool,
                      name: e.target.value
                    })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jrotc_program">JROTC Program</Label>
                  <Select 
                    value={editingSchool.jrotc_program || ''} 
                    onValueChange={(value) => setEditingSchool({
                      ...editingSchool,
                      jrotc_program: value as School['jrotc_program']
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select JROTC Program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="air_force">Air Force JROTC</SelectItem>
                      <SelectItem value="army">Army JROTC</SelectItem>
                      <SelectItem value="coast_guard">Coast Guard JROTC</SelectItem>
                      <SelectItem value="navy">Navy JROTC</SelectItem>
                      <SelectItem value="marine_corps">Marine Corps JROTC</SelectItem>
                      <SelectItem value="space_force">Space Force JROTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact">Contact</Label>
                <Input
                  id="contact"
                  value={editingSchool.contact || ''}
                  onChange={(e) => setEditingSchool({
                    ...editingSchool,
                    contact: e.target.value
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={editingSchool.address || ''}
                  onChange={(e) => setEditingSchool({
                    ...editingSchool,
                    address: e.target.value
                  })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={editingSchool.city || ''}
                    onChange={(e) => setEditingSchool({
                      ...editingSchool,
                      city: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={editingSchool.state || ''}
                    onChange={(e) => setEditingSchool({
                      ...editingSchool,
                      state: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    value={editingSchool.zip_code || ''}
                    onChange={(e) => setEditingSchool({
                      ...editingSchool,
                      zip_code: e.target.value
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={editingSchool.phone || ''}
                    onChange={(e) => setEditingSchool({
                      ...editingSchool,
                      phone: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editingSchool.email || ''}
                    onChange={(e) => setEditingSchool({
                      ...editingSchool,
                      email: e.target.value
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subscription_start">Subscription Start</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editingSchool.subscription_start 
                          ? format(new Date(editingSchool.subscription_start), "PPP")
                          : <span>Pick a date</span>
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editingSchool.subscription_start ? new Date(editingSchool.subscription_start) : undefined}
                        onSelect={(date) => {
                          const startDate = date ? date.toISOString().split('T')[0] : undefined;
                          const endDate = date ? addYears(date, 1).toISOString().split('T')[0] : undefined;
                          setEditingSchool({
                            ...editingSchool,
                            subscription_start: startDate,
                            subscription_end: endDate
                          });
                        }}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscription_end">Subscription End</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editingSchool.subscription_end 
                          ? format(new Date(editingSchool.subscription_end), "PPP")
                          : <span>Pick a date</span>
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editingSchool.subscription_end ? new Date(editingSchool.subscription_end) : undefined}
                        onSelect={(date) => setEditingSchool({
                          ...editingSchool,
                          subscription_end: date ? date.toISOString().split('T')[0] : undefined
                        })}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="referred_by">Referred By</Label>
                  <Input
                    id="referred_by"
                    value={editingSchool.referred_by || ''}
                    onChange={(e) => setEditingSchool({
                      ...editingSchool,
                      referred_by: e.target.value
                    })}
                    placeholder="Who referred this school?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="competition_module">Competition Module</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="competition_module"
                      checked={editingSchool.competition_module || false}
                      onCheckedChange={(checked) => setEditingSchool({
                        ...editingSchool,
                        competition_module: checked as boolean
                      })}
                    />
                    <Label htmlFor="competition_module">Enable Competition Module</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={editingSchool.notes || ''}
                  onChange={(e) => setEditingSchool({
                    ...editingSchool,
                    notes: e.target.value
                  })}
                  placeholder="Additional notes about this school..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Update School
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete School Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete School</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to delete this school? This action cannot be undone.</p>
            {schoolToDelete && (
              <div className="bg-gray-50 p-3 rounded">
                <p><strong>Name:</strong> {schoolToDelete.name}</p>
                <p><strong>Contact:</strong> {schoolToDelete.contact}</p>
                <p><strong>City:</strong> {schoolToDelete.city}</p>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteSchool}>
                Delete School
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchoolManagementPage;
