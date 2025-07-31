import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompetitionDialog } from '@/components/competition-management/components/CompetitionDialog';
import { CalendarDays, MapPin, Users, Plus, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Competition {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  location: string;
  max_participants?: number;
  registration_deadline?: string;
  registered_schools: string[];
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
  const { userProfile } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchCompetitions();
    fetchSchools();
  }, []);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cp_competitions')
        .select('*')
        .order('start_date', { ascending: true });

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
      const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const getSchoolName = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    return school?.name || 'Unknown School';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'open': return 'default';
      case 'registration_closed': return 'outline';
      case 'in_progress': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const filteredCompetitions = competitions.filter(competition => {
    const matchesSearch = competition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         competition.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getSchoolName(competition.school_id).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || competition.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const canCreateCompetition = userProfile?.role === 'admin' || 
                               userProfile?.role === 'instructor' || 
                               userProfile?.role === 'command_staff';

  const handleCreateCompetition = async (data: any) => {
    try {
      const { error } = await supabase
        .from('cp_competitions')
        .insert([{
          ...data,
          school_id: userProfile?.school_id,
          created_by: userProfile?.id,
          status: 'draft'
        }]);

      if (error) throw error;
      
      toast.success('Competition created successfully');
      fetchCompetitions();
    } catch (error) {
      console.error('Error creating competition:', error);
      toast.error('Failed to create competition');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading competitions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Competitions</h1>
          <p className="text-muted-foreground">Manage tournament competitions and events</p>
        </div>
        {canCreateCompetition && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Competition
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search competitions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
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

      {/* Competitions Table */}
      {filteredCompetitions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              {competitions.length === 0 ? 'No competitions found.' : 'No competitions match your search criteria.'}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Competitions</CardTitle>
            <CardDescription>
              Showing {filteredCompetitions.length} of {competitions.length} competitions
            </CardDescription>
          </CardHeader>
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
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompetitions.map((competition) => (
                    <TableRow key={competition.id}>
                      <TableCell>
                        <div className="font-medium">{competition.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {competition.description ? (
                            <span className="text-sm">{competition.description}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <CalendarDays className="w-4 h-4 mr-1 text-muted-foreground" />
                            {format(new Date(competition.start_date), 'MMM d, yyyy')}
                          </div>
                          {competition.start_date !== competition.end_date && (
                            <div className="text-xs text-muted-foreground">
                              to {format(new Date(competition.end_date), 'MMM d, yyyy')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(competition.status)}>
                          {competition.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1 text-muted-foreground" />
                          {competition.registered_schools.length}
                          {competition.max_participants && ` / ${competition.max_participants}`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {/* Custom actions can be added here in the future */}
                          <span className="text-sm text-muted-foreground">-</span>
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

      {/* Create Competition Dialog */}
      <CompetitionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateCompetition}
      />
    </div>
  );
};

export default CompetitionsPage;