
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { 
  Users, 
  Edit, 
  Search 
} from 'lucide-react';

interface Cadet {
  id: string;
  profile_id: string;
  school_id: string;
  grade?: string;
  rank?: string;
  flight?: string;
  job_role?: string;
  created_at: string;
  updated_at: string;
  profile: {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
}

interface Rank {
  id: string;
  rank: string;
  abbreviation: string;
}

interface JobRole {
  id: string;
  role: string;
}

const CadetManagementPage = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCadet, setEditingCadet] = useState<Cadet | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const RECORDS_PER_PAGE = 25;

  const gradeOptions = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];
  const flightOptions = ['Alpha', 'Bravo', 'Charlie', 'Delta'];

  const fetchCadets = async () => {
    try {
      const { data, error } = await supabase
        .from('cadets')
        .select(`
          *,
          profile:profiles(first_name, last_name, email, role)
        `)
        .eq('school_id', userProfile?.school_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCadets(data || []);
    } catch (error) {
      console.error('Error fetching cadets:', error);
      toast({
        title: "Error",
        description: "Failed to fetch cadets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRanks = async () => {
    if (!userProfile?.schools?.jrotc_program) return;

    try {
      const { data, error } = await supabase
        .from('ranks')
        .select('*')
        .eq('program', userProfile.schools.jrotc_program)
        .order('rank');

      if (error) throw error;
      setRanks(data || []);
    } catch (error) {
      console.error('Error fetching ranks:', error);
    }
  };

  const fetchJobRoles = async () => {
    if (!userProfile?.schools?.jrotc_program) return;

    try {
      const { data, error } = await supabase
        .from('job_board_roles')
        .select('*')
        .eq('program', userProfile.schools.jrotc_program)
        .order('role');

      if (error) throw error;
      setJobRoles(data || []);
    } catch (error) {
      console.error('Error fetching job roles:', error);
    }
  };

  useEffect(() => {
    if (userProfile?.school_id) {
      fetchCadets();
      fetchRanks();
      fetchJobRoles();
    }
  }, [userProfile?.school_id]);

  const handleEditCadet = (cadet: Cadet) => {
    setEditingCadet(cadet);
    setEditDialogOpen(true);
  };

  const handleSaveCadet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCadet) return;

    try {
      const { error } = await supabase
        .from('cadets')
        .update({
          grade: editingCadet.grade,
          rank: editingCadet.rank,
          flight: editingCadet.flight,
          job_role: editingCadet.job_role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingCadet.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Cadet updated successfully",
      });

      setEditDialogOpen(false);
      setEditingCadet(null);
      fetchCadets();
    } catch (error) {
      console.error('Error updating cadet:', error);
      toast({
        title: "Error",
        description: "Failed to update cadet",
        variant: "destructive",
      });
    }
  };

  const filteredCadets = cadets.filter(cadet =>
    cadet.profile.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cadet.profile.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cadet.profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cadet.grade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cadet.rank?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cadet.flight?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cadet.job_role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCadets.length / RECORDS_PER_PAGE);
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const endIndex = startIndex + RECORDS_PER_PAGE;
  const paginatedCadets = filteredCadets.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
          <h2 className="text-3xl font-bold tracking-tight">Cadet Management</h2>
          <p className="text-muted-foreground">
            Manage cadets and command staff in your school
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Cadets ({filteredCadets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search cadets..."
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
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Rank</TableHead>
                <TableHead>Flight</TableHead>
                <TableHead>Job Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCadets.map((cadet) => (
                <TableRow key={cadet.id}>
                  <TableCell className="font-medium">
                    {cadet.profile.first_name} {cadet.profile.last_name}
                  </TableCell>
                  <TableCell>{cadet.profile.email}</TableCell>
                  <TableCell className="capitalize">{cadet.profile.role.replace('_', ' ')}</TableCell>
                  <TableCell>{cadet.grade || '-'}</TableCell>
                  <TableCell>{cadet.rank || '-'}</TableCell>
                  <TableCell>{cadet.flight || '-'}</TableCell>
                  <TableCell>{cadet.job_role || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCadet(cadet)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCadets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No cadets found
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

      {/* Edit Cadet Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Cadet Information</DialogTitle>
          </DialogHeader>
          {editingCadet && (
            <form onSubmit={handleSaveCadet} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={`${editingCadet.profile.first_name} ${editingCadet.profile.last_name}`}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={editingCadet.profile.email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Select
                    value={editingCadet.grade || ""}
                    onValueChange={(value) => setEditingCadet({
                      ...editingCadet,
                      grade: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeOptions.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flight">Flight</Label>
                  <Select
                    value={editingCadet.flight || ""}
                    onValueChange={(value) => setEditingCadet({
                      ...editingCadet,
                      flight: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select flight" />
                    </SelectTrigger>
                    <SelectContent>
                      {flightOptions.map((flight) => (
                        <SelectItem key={flight} value={flight}>
                          {flight}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rank">Rank</Label>
                  <Select
                    value={editingCadet.rank || ""}
                    onValueChange={(value) => setEditingCadet({
                      ...editingCadet,
                      rank: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rank" />
                    </SelectTrigger>
                    <SelectContent>
                      {ranks.map((rank) => (
                        <SelectItem key={rank.id} value={rank.rank || ""}>
                          {rank.rank} {rank.abbreviation && `(${rank.abbreviation})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job_role">Job Role</Label>
                  <Select
                    value={editingCadet.job_role || ""}
                    onValueChange={(value) => setEditingCadet({
                      ...editingCadet,
                      job_role: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select job role" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobRoles.map((role) => (
                        <SelectItem key={role.id} value={role.role || ""}>
                          {role.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Update Cadet
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CadetManagementPage;
