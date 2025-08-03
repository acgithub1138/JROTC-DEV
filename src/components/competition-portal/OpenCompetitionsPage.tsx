import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarDays, MapPin, Users, Trophy, DollarSign, Eye, Clock, MapPin as LocationIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export const OpenCompetitionsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: competitions, isLoading, error } = useQuery({
    queryKey: ['open-competitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cp_competitions')
        .select('*')
        .eq('status', 'open')
        .eq('is_public', true)
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: competitionEvents, isLoading: isEventsLoading } = useQuery({
    queryKey: ['competition-events', selectedCompetitionId],
    queryFn: async () => {
      if (!selectedCompetitionId) return [];
      
      const { data, error } = await supabase
        .from('cp_comp_events')
        .select(`
          *,
          event:cp_events(name, description)
        `)
        .eq('competition_id', selectedCompetitionId)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompetitionId && isModalOpen,
  });

  const handleRegisterInterest = (competitionId: string) => {
    toast({
      title: "Interest Registered",
      description: "We've noted your school's interest in this competition. The host school will contact you with more details.",
    });
  };

  const handleViewDetails = (competitionId: string) => {
    setSelectedCompetitionId(competitionId);
    setIsModalOpen(true);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Competitions</h1>
          <p className="text-gray-600">There was an error loading the competitions. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Open Competitions</h1>
        <p className="text-gray-600 mt-2">
          Browse and register interest in upcoming competitions hosted by other schools.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : competitions && competitions.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {competitions.map((competition) => (
            <Card key={competition.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{competition.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {competition.description || 'No description available'}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    <Trophy className="w-3 h-3 mr-1" />
                    {(competition as any).program?.replace('_', ' ').toUpperCase() || 'N/A'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-gray-600">
                  {(competition as any).fee && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-medium text-green-600">
                        {((competition as any).fee as number).toFixed(2)} entry fee
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    <span>
                      {format(new Date(competition.start_date), 'MMM d, yyyy')}
                      {competition.end_date && 
                        format(new Date(competition.end_date), 'MMM d, yyyy') !== format(new Date(competition.start_date), 'MMM d, yyyy') && 
                        ` - ${format(new Date(competition.end_date), 'MMM d, yyyy')}`
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>
                      <div>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([competition.address, competition.city, competition.state, competition.zip].filter(Boolean).join(', '))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline cursor-pointer"
                        >
                          {competition.address}
                        </a>
                      </div>
                      <div>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([competition.address, competition.city, competition.state, competition.zip].filter(Boolean).join(', '))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-primary hover:underline cursor-pointer"
                        >
                          {[competition.city, competition.state].filter(Boolean).join(', ')}{competition.zip ? ` ${competition.zip}` : ''}
                        </a>
                        </div>
                    </span>
                  </div>
                  {competition.max_participants && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Max {competition.max_participants} participants</span>
                    </div>
                  )}
                  {competition.registration_deadline && (
                    <div className="text-sm">
                      <strong>Registration Deadline:</strong> {format(new Date(competition.registration_deadline), 'MMM d, yyyy')}
                    </div>
                  )}
                  <div className="text-sm">
                    <strong>Hosting School:</strong> {(competition as any).hosting_school || 'Not specified'}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => handleViewDetails(competition.id)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={() => handleRegisterInterest(competition.id)}
                  >
                    Register
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Open Competitions</h3>
          <p className="text-gray-600">
            There are currently no open competitions available for registration.
            Check back later for new opportunities!
          </p>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Competition Events
              {selectedCompetitionId && competitions && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  - {competitions.find(c => c.id === selectedCompetitionId)?.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {isEventsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : competitionEvents && competitionEvents.length > 0 ? (
              <div className="space-y-4">
                {competitionEvents.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">
                            {(event.event as any)?.name || 'Event Name Not Available'}
                          </h3>
                          {(event as any).fee && (
                            <Badge variant="secondary">
                              <DollarSign className="w-3 h-3 mr-1" />
                              ${((event as any).fee as number).toFixed(2)}
                            </Badge>
                          )}
                        </div>
                        
                        {(event.event as any)?.description && (
                          <p className="text-muted-foreground">
                            {(event.event as any).description}
                          </p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {event.start_time && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                <strong>Start:</strong> {format(new Date(event.start_time), 'MMM d, yyyy h:mm a')}
                              </span>
                            </div>
                          )}
                          
                          {event.end_time && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                <strong>End:</strong> {format(new Date(event.end_time), 'MMM d, yyyy h:mm a')}
                              </span>
                            </div>
                          )}
                          
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <LocationIcon className="w-4 h-4" />
                              <span>
                                <strong>Location:</strong> {event.location}
                              </span>
                            </div>
                          )}
                          
                          {event.max_participants && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>
                                <strong>Max Participants:</strong> {event.max_participants}
                              </span>
                            </div>
                          )}
                        </div>

                        {event.notes && (
                          <div className="pt-2 border-t">
                            <p className="text-sm text-muted-foreground">
                              <strong>Notes:</strong> {event.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No events found for this competition.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};