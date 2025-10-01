import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEventPermissions } from '@/hooks/useModuleSpecificPermissions';

interface EventAssignmentSectionProps {
  eventId: string;
}

interface Assignment {
  id: string;
  assignee_type: 'team' | 'cadet';
  assignee_id: string;
  role?: string;
  status: 'assigned' | 'confirmed' | 'declined' | 'completed';
  assignee_name?: string;
}

interface Team {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
}

export const EventAssignmentSection: React.FC<EventAssignmentSectionProps> = ({
  eventId,
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [newAssignment, setNewAssignment] = useState({
    type: 'team' as 'team' | 'cadet',
    assigneeId: '',
    role: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const { canUpdate } = useEventPermissions();

  useEffect(() => {
    fetchData();
  }, [eventId, userProfile?.school_id]);

  const fetchData = async () => {
    if (!userProfile?.school_id) return;

    setIsLoading(true);
    try {
      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('event_assignments')
        .select('*')
        .eq('event_id', eventId);

      if (assignmentsError) throw assignmentsError;

      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('school_id', userProfile.school_id);

      if (teamsError) throw teamsError;

      // Fetch profiles (cadets)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('school_id', userProfile.school_id)
        .eq('active', true);

      if (profilesError) throw profilesError;

      // Enrich assignments with names
      const enrichedAssignments = assignmentsData?.map(assignment => {
        let assignee_name = '';
        if (assignment.assignee_type === 'team') {
          const team = teamsData?.find(t => t.id === assignment.assignee_id);
          assignee_name = team?.name || 'Unknown Team';
        } else {
          const profile = profilesData?.find(p => p.id === assignment.assignee_id);
          assignee_name = profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown Cadet';
        }
        return { ...assignment, assignee_name };
      }) || [];

      setAssignments(enrichedAssignments);
      setTeams(teamsData || []);
      setProfiles(profilesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assignment data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addAssignment = async () => {
    if (!newAssignment.assigneeId) return;

    try {
      const { data, error } = await supabase
        .from('event_assignments')
        .insert({
          event_id: eventId,
          assignee_type: newAssignment.type,
          assignee_id: newAssignment.assigneeId,
          role: newAssignment.role || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Add name to the new assignment
      let assignee_name = '';
      if (newAssignment.type === 'team') {
        const team = teams.find(t => t.id === newAssignment.assigneeId);
        assignee_name = team?.name || 'Unknown Team';
      } else {
        const profile = profiles.find(p => p.id === newAssignment.assigneeId);
        assignee_name = profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown Cadet';
      }

      setAssignments(prev => [...prev, { ...data, assignee_name }]);
      setNewAssignment({ type: 'team', assigneeId: '', role: '' });
      
      toast({
        title: 'Success',
        description: 'Assignment added successfully',
      });
    } catch (error) {
      console.error('Error adding assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add assignment',
        variant: 'destructive',
      });
    }
  };

  const removeAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('event_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      
      toast({
        title: 'Success',
        description: 'Assignment removed successfully',
      });
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove assignment',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Assignments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing assignments */}
        <div className="space-y-2">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center gap-2">
                <Badge variant={assignment.assignee_type === 'team' ? 'default' : 'secondary'}>
                  {assignment.assignee_type}
                </Badge>
                <span className="font-medium">{assignment.assignee_name}</span>
                {assignment.role && (
                  <span className="text-sm text-muted-foreground">({assignment.role})</span>
                )}
              </div>
              {canUpdate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAssignment(assignment.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Add new assignment */}
        {canUpdate && (
          <div className="space-y-2 p-3 border rounded bg-muted/50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <Select 
                value={newAssignment.type} 
                onValueChange={(value: 'team' | 'cadet') => 
                  setNewAssignment(prev => ({ ...prev, type: value, assigneeId: '' }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="cadet">Cadet</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={newAssignment.assigneeId} 
                onValueChange={(value) => 
                  setNewAssignment(prev => ({ ...prev, assigneeId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${newAssignment.type}`} />
                </SelectTrigger>
                <SelectContent>
                  {newAssignment.type === 'team' 
                    ? teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))
                    : profiles
                        .sort((a, b) => a.last_name.localeCompare(b.last_name))
                        .map(profile => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.last_name}, {profile.first_name}
                          </SelectItem>
                        ))
                  }
                </SelectContent>
              </Select>

              <input
                type="text"
                placeholder="Role (optional)"
                className="px-3 py-2 border rounded text-sm"
                value={newAssignment.role}
                onChange={(e) => setNewAssignment(prev => ({ ...prev, role: e.target.value }))}
              />

              <Button 
                type="button"
                onClick={addAssignment}
                disabled={!newAssignment.assigneeId}
                size="sm"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
