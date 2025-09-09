import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Calendar, MapPin, Users, Clock } from 'lucide-react';
// Utility function to format dates/times
const formatTimeDisplay = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

interface Competition {
  id: string;
  name: string;
  description?: string;
  location: string;
  start_date: string;
  end_date: string;
  registration_deadline?: string;
  max_participants?: number;
  fee?: number;
  program?: string;
  hosting_school?: string;
  status: string;
}

interface CompetitionEvent {
  id: string;
  name: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  fee?: number;
}

export const ExternalCompetitions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const schoolId = searchParams.get('school_id');
  
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [events, setEvents] = useState<Record<string, CompetitionEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      
      // Fetch public competitions
      const { data, error } = await supabase
        .from('cp_competitions')
        .select('*')
        .eq('is_public', true)
        .eq('status', 'published')
        .gte('end_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      if (error) throw error;
      setCompetitions(data || []);

      // Fetch events for each competition
      if (data && data.length > 0) {
        await fetchEvents(data.map(comp => comp.id));
      }
    } catch (error) {
      console.error('Error fetching competitions:', error);
      toast({
        title: "Error",
        description: "Failed to load competitions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async (competitionIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('cp_comp_events')
        .select(`
          id,
          competition_id,
          location,
          start_time,
          end_time,
          fee,
          event
        `)
        .in('competition_id', competitionIds);

      // Get event names separately
      const eventIds = data?.map(event => event.event).filter(Boolean) || [];
      const { data: eventData } = await supabase
        .from('cp_events')
        .select('id, name')
        .in('id', eventIds);

      const eventNamesMap = new Map(eventData?.map(e => [e.id, e.name]) || []);

      if (error) throw error;

      const eventsByCompetition: Record<string, CompetitionEvent[]> = {};
      data?.forEach(event => {
        const competitionId = event.competition_id;
        if (!eventsByCompetition[competitionId]) {
          eventsByCompetition[competitionId] = [];
        }
        eventsByCompetition[competitionId].push({
          id: event.id,
          name: eventNamesMap.get(event.event) || 'Unknown Event',
          start_time: event.start_time,
          end_time: event.end_time,
          location: event.location,
          fee: event.fee
        });
      });

      setEvents(eventsByCompetition);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleRegister = async (competitionId: string) => {
    if (!schoolId) {
      toast({
        title: "Error",
        description: "School ID is required. Please register your school first.",
        variant: "destructive"
      });
      return;
    }

    setRegistering(competitionId);

    try {
      // Check if already registered
      const { data: existing } = await supabase
        .from('cp_comp_schools')
        .select('id')
        .eq('competition_id', competitionId)
        .eq('school_id', schoolId)
        .single();

      if (existing) {
        toast({
          title: "Already Registered",
          description: "Your school is already registered for this competition.",
          variant: "destructive"
        });
        return;
      }

      // Register for competition
      const { error } = await supabase
        .from('cp_comp_schools')
        .insert({
          competition_id: competitionId,
          school_id: schoolId,
          status: 'registered',
          registration_source: 'external'
        });

      if (error) throw error;

      toast({
        title: "Registration Successful",
        description: "Your school has been registered for the competition."
      });

      // Refresh competitions to update registration status
      fetchCompetitions();

    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setRegistering(null);
    }
  };

  const filteredCompetitions = competitions.filter(comp =>
    comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.hosting_school?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary-foreground to-primary p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center text-primary-foreground">Loading competitions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-foreground to-primary p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/external/register')}
            className="text-primary-foreground hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Registration
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">
            Available Competitions
          </h1>
          <p className="text-primary-foreground/80">
            Browse and register for JROTC competitions
          </p>
        </div>

        <div className="mb-6">
          <Input
            placeholder="Search competitions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md mx-auto bg-card/80"
          />
        </div>

        <div className="grid gap-6">
          {filteredCompetitions.map((competition) => (
            <Card key={competition.id} className="bg-card/95 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-2">{competition.name}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatTimeDisplay(competition.start_date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {competition.location}
                      </div>
                      {competition.hosting_school && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {competition.hosting_school}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {competition.program || 'All Programs'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                {competition.description && (
                  <p className="text-muted-foreground mb-4">{competition.description}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium mb-2">Competition Details</h4>
                    <div className="space-y-1 text-sm">
                      <div>Start: {formatTimeDisplay(competition.start_date)}</div>
                      <div>End: {formatTimeDisplay(competition.end_date)}</div>
                      {competition.registration_deadline && (
                        <div>Registration Deadline: {formatTimeDisplay(competition.registration_deadline)}</div>
                      )}
                      {competition.max_participants && (
                        <div>Max Participants: {competition.max_participants}</div>
                      )}
                      {competition.fee && (
                        <div>Fee: ${competition.fee}</div>
                      )}
                    </div>
                  </div>

                  {events[competition.id] && events[competition.id].length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Events</h4>
                      <div className="space-y-1 text-sm">
                        {events[competition.id].slice(0, 3).map((event) => (
                          <div key={event.id} className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {event.name}
                            {event.start_time && (
                              <span className="text-xs text-muted-foreground">
                                - {formatTimeDisplay(event.start_time)}
                              </span>
                            )}
                          </div>
                        ))}
                        {events[competition.id].length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{events[competition.id].length - 3} more events
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={() => handleRegister(competition.id)}
                  disabled={registering === competition.id || !schoolId}
                  className="w-full sm:w-auto"
                >
                  {registering === competition.id ? 'Registering...' : 'Register for Competition'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCompetitions.length === 0 && (
          <div className="text-center text-primary-foreground/80 py-12">
            {searchTerm ? 'No competitions match your search.' : 'No competitions available at this time.'}
          </div>
        )}
      </div>
    </div>
  );
};