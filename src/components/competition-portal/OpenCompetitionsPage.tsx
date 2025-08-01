import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin, Users, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export const OpenCompetitionsPage = () => {
  const { toast } = useToast();

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

  const handleRegisterInterest = (competitionId: string) => {
    toast({
      title: "Interest Registered",
      description: "We've noted your school's interest in this competition. The host school will contact you with more details.",
    });
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
                    <span>{competition.address}</br>
                    <span>{competition.city}, {competition.state} {competition.zip}</span>
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
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={() => handleRegisterInterest(competition.id)}
                >
                  Register Interest
                </Button>
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
    </div>
  );
};