import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CPCompetitionDialog } from './components/CPCompetitionDialog';
import { ViewCompetitionModal } from './ViewCompetitionModal';
import { EditCompetitionModal } from './modals/EditCompetitionModal';
import { CompetitionCards } from './components/CompetitionCards';
import { useIsMobile } from '@/hooks/use-mobile';
import { CalendarDays, MapPin, Users, Plus, Search, Filter, Edit, Eye, X, GitCompareArrows } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'registration_closed', label: 'Registration Closed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];
interface Competition {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  location: string;
  max_participants?: number;
  registration_deadline?: string;
  status: string;
  is_public: boolean;
  school_id: string;
  created_at: string;
  created_by?: string;
}
interface School {
  id: string;
  name: string;
}
const CompetitionsPage = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const isMobile = useIsMobile();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'active' | 'non-active'>('active');
const [showCreateDialog, setShowCreateDialog] = useState(false);
const [showViewModal, setShowViewModal] = useState(false);
const [showEditModal, setShowEditModal] = useState(false);
const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [competitionToCancel, setCompetitionToCancel] = useState<Competition | null>(null);
  useEffect(() => {
    fetchCompetitions();
    fetchSchools();
    fetchRegistrationCounts();
  }, []);
  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('cp_competitions').select('*').order('start_date', {
        ascending: true
      });
      if (error) throw error;
      setCompetitions(data || []);
    } catch (error) {
      console.error('Error fetching competitions:', error);
      toast.error('Failed to load competitions');
    } finally {
      setLoading(false);
    }
  };
  const fetchSchools = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('schools').select('id, name').order('name');
      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const fetchRegistrationCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('cp_comp_schools')
        .select('competition_id');

      if (error) throw error;

      // Count registrations per competition
      const counts: Record<string, number> = {};
      data?.forEach(registration => {
        counts[registration.competition_id] = (counts[registration.competition_id] || 0) + 1;
      });
      
      setRegistrationCounts(counts);
    } catch (error) {
      console.error('Error fetching registration counts:', error);
    }
  };
  const getSchoolName = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    return school?.name || 'Unknown School';
  };
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'open':
        return 'default';
      case 'registration_closed':
        return 'outline';
      case 'in_progress':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };
  const filteredCompetitions = competitions.filter(competition => {
    const matchesSearch = competition.name.toLowerCase().includes(searchTerm.toLowerCase()) || competition.location.toLowerCase().includes(searchTerm.toLowerCase()) || getSchoolName(competition.school_id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || competition.status === statusFilter;
    
    // Filter by active/non-active tab
    const isActive = ['draft', 'open', 'registration_closed', 'in_progress'].includes(competition.status);
    const matchesTab = activeTab === 'active' ? isActive : !isActive;
    
    return matchesSearch && matchesStatus && matchesTab;
  });
  const canCreateCompetition = userProfile?.role === 'admin' || userProfile?.role === 'instructor' || userProfile?.role === 'command_staff';
  const handleCreateCompetition = async (data: any) => {
    try {
      const {
        error
      } = await supabase.from('cp_competitions').insert([{
        ...data,
        school_id: userProfile?.school_id,
        created_by: userProfile?.id,
        status: 'draft'
      }]);
      if (error) throw error;
      toast.success('Competition created successfully');
      fetchCompetitions();
      fetchRegistrationCounts();
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error creating competition:', error);
      toast.error('Failed to create competition');
    }
  };
const handleViewCompetition = (competition: Competition) => {
  setSelectedCompetition(competition);
  setShowViewModal(true);
};
const handleEditCompetition = (competition: Competition) => {
  navigate(`/app/competition-portal/competition-details/${competition.id}`);
};

// Open edit modal directly
const handleOpenEdit = (competition: Competition) => {
  setSelectedCompetition(competition);
  setShowEditModal(true);
};

const handleEditSubmit = async (data: any) => {
  try {
    const { error } = await supabase
      .from('cp_competitions')
      .update(data)
      .eq('id', selectedCompetition?.id);
    if (error) throw error;
    toast.success('Competition updated successfully');
    setShowEditModal(false);
    fetchCompetitions();
  } catch (error) {
    console.error('Error updating competition:', error);
    toast.error('Failed to update competition');
  }
};

  const handleCancelCompetitionClick = (competition: Competition) => {
    setCompetitionToCancel(competition);
    setShowCancelDialog(true);
  };

  const handleCancelCompetition = async () => {
    if (!competitionToCancel) return;

    try {
      const { error } = await supabase
        .from('cp_competitions')
        .update({ status: 'cancelled' })
        .eq('id', competitionToCancel.id);

      if (error) throw error;

      toast.success('Competition cancelled successfully');
      fetchCompetitions();
      setShowCancelDialog(false);
      setCompetitionToCancel(null);
    } catch (error) {
      console.error('Error cancelling competition:', error);
      toast.error('Failed to cancel competition');
    }
  };

  const handleStatusChange = async (competitionId: string, newStatus: string) => {
    try {
      setUpdatingStatus(competitionId);
      const { error } = await supabase
        .from('cp_competitions')
        .update({ status: newStatus })
        .eq('id', competitionId);

      if (error) throw error;

      toast.success('Competition status updated successfully');
      fetchCompetitions();
    } catch (error) {
      console.error('Error updating competition status:', error);
      toast.error('Failed to update competition status');
    } finally {
      setUpdatingStatus(null);
    }
  };
  if (loading) {
    return <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading competitions...</div>
        </div>
      </div>;
  }
  return <TooltipProvider>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Competitions</h1>
          <p className="text-muted-foreground">Manage tournament competitions and events</p>
        </div>
        {canCreateCompetition && <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Competition
          </Button>}
      </div>

      {/* Active/Non-Active Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'active' | 'non-active')}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="non-active">Non-Active</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-6">

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search competitions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="min-w-[200px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="registration_closed">Registration Closed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitions Table/Cards */}
      {filteredCompetitions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              {competitions.length === 0 ? 'No competitions found.' : 'No competitions match your search criteria.'}
            </div>
          </CardContent>
        </Card>
      ) : isMobile ? (
        <CompetitionCards
          competitions={filteredCompetitions}
          registrationCounts={registrationCounts}
          userProfile={userProfile}
          getStatusBadgeVariant={getStatusBadgeVariant}
          handleViewCompetition={handleViewCompetition}
          handleEditCompetition={handleEditCompetition}
          handleCancelCompetitionClick={handleCancelCompetitionClick}
          handleStatusChange={handleStatusChange}
          updatingStatus={updatingStatus}
          getSchoolName={getSchoolName}
        />
      ) : (
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered Schools</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompetitions.map(competition => (
                    <TableRow key={competition.id}>
                      <TableCell className="py-[8px]">
<button onClick={() => navigate(`/app/competition-portal/competition-details/${competition.id}`)} className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left">
  {competition.name}
</button>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {competition.description ? <span className="text-sm">{competition.description}</span> : <span className="text-sm text-muted-foreground">-</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <CalendarDays className="w-4 h-4 mr-1 text-muted-foreground" />
                            {format(new Date(competition.start_date), 'MMM d, yyyy')}
                          </div>
                          {competition.start_date !== competition.end_date && <div className="text-xs text-muted-foreground">
                              to {format(new Date(competition.end_date), 'MMM d, yyyy')}
                            </div>}
                        </div>
                      </TableCell>
                       <TableCell>
                         {(competition.school_id === userProfile?.school_id || userProfile?.role === 'admin') ? (
                           <Select
                             value={competition.status}
                             onValueChange={(value) => handleStatusChange(competition.id, value)}
                             disabled={updatingStatus === competition.id}
                           >
                             <SelectTrigger className="w-auto h-8 border-none p-0 bg-transparent hover:bg-muted">
                               <Badge variant={getStatusBadgeVariant(competition.status)} className="cursor-pointer">
                                 {competition.status.replace('_', ' ').toUpperCase()}
                               </Badge>
                             </SelectTrigger>
                             <SelectContent className="bg-background border shadow-md z-50">
                               {STATUS_OPTIONS.map((option) => (
                                 <SelectItem key={option.value} value={option.value}>
                                   {option.label}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         ) : (
                           <Badge variant={getStatusBadgeVariant(competition.status)}>
                             {competition.status.replace('_', ' ').toUpperCase()}
                           </Badge>
                         )}
                       </TableCell>
                       <TableCell>
                         <div className="flex items-center">
                           <Users className="w-4 h-4 mr-1 text-muted-foreground" />
                           {registrationCounts[competition.id] || 0}
                           {competition.max_participants && ` / ${competition.max_participants}`}
                         </div>
                       </TableCell>
<TableCell>
  <div className="flex items-center justify-center gap-2">
    {/* View Competition */}
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleViewCompetition(competition)}>
          <Eye className="w-3 h-3" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>View</p>
      </TooltipContent>
    </Tooltip>

    {(competition.school_id === userProfile?.school_id || userProfile?.role === 'admin') && (
      <>
        {/* Edit Competition */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleOpenEdit(competition)}>
              <Edit className="w-3 h-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Edit</p>
          </TooltipContent>
        </Tooltip>

        {/* Manage Competition */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleEditCompetition(competition)}>
              <GitCompareArrows className="w-3 h-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Manage Competition</p>
          </TooltipContent>
        </Tooltip>
                                
                                {['draft', 'open', 'registration_closed', 'in_progress'].includes(competition.status) && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300" 
                                        onClick={() => handleCancelCompetitionClick(competition)}
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Cancel Competition</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </>
                            )}
                          </div>
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

        </TabsContent>
      </Tabs>

{/* Create Competition Dialog */}
<CPCompetitionDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSubmit={handleCreateCompetition} />

{/* View Competition Modal */}
 <ViewCompetitionModal 
  competition={selectedCompetition} 
  open={showViewModal} 
  onOpenChange={setShowViewModal} 
  hostSchoolName={selectedCompetition ? getSchoolName(selectedCompetition.school_id) : ''} 
  onCompetitionUpdated={fetchCompetitions}
/>

{/* Edit Competition Modal */}
<EditCompetitionModal 
  open={showEditModal}
  onOpenChange={setShowEditModal}
  competition={selectedCompetition}
  onSubmit={handleEditSubmit}
/>

      {/* Cancel Competition Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Competition</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel "{competitionToCancel?.name}"? This action will set the competition status to cancelled and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelCompetition} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Cancel Competition
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </TooltipProvider>;
};
export default CompetitionsPage;