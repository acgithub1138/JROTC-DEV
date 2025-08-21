import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Calendar, MapPin, Users, Trophy, ExternalLink, ArrowLeft } from 'lucide-react';
import { useCompetitions } from '@/hooks/competition-portal/useCompetitions';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const MobileOpenCompetitions: React.FC = () => {
  const navigate = useNavigate();
  const { competitions, isLoading } = useCompetitions();
  const { userProfile } = useAuth();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter for public competitions
  const openCompetitions = competitions.filter(comp => comp.is_public);

  // Fetch user's registrations
  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!userProfile?.school_id) return;

      const { data, error } = await supabase
        .from('cp_comp_schools')
        .select('*')
        .eq('school_id', userProfile.school_id);

      if (!error) {
        setRegistrations(data || []);
      }
    };

    fetchRegistrations();
  }, [userProfile?.school_id]);

  // Filter competitions based on search term and exclude registered ones
  const filteredOpenCompetitions = openCompetitions.filter(comp => {
    const matchesSearch = comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.hosting_school?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isNotRegistered = !registrations.some(reg => reg.competition_id === comp.id);
    
    return matchesSearch && isNotRegistered;
  });

  // Get registered competitions
  const registeredCompetitions = openCompetitions.filter(comp =>
    registrations.some(reg => reg.competition_id === comp.id)
  );

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/mobile/competition-portal')}
            className="mr-3 p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Open Competitions</h1>
            <p className="text-sm text-muted-foreground">Browse and join public competitions</p>
          </div>
        </div>
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header with Search */}
      <div className="mb-4">
        <div className="flex items-center mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/mobile/competition-portal')}
            className="mr-3 p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Open Competitions</h1>
            <p className="text-sm text-muted-foreground">Browse and join public competitions</p>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search competitions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="open">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="registered">Registered</TabsTrigger>
        </TabsList>

        <TabsContent value="open">
          <div className="space-y-3">
            {filteredOpenCompetitions.length > 0 ? (
              filteredOpenCompetitions.map((competition) => (
            <Card key={competition.id} className="bg-card border-border hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm line-clamp-2">
                        {competition.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {competition.description || 'No description provided'}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <ExternalLink size={12} className="mr-1" />
                      Open
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar size={12} className="mr-1" />
                      {new Date(competition.start_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <MapPin size={12} className="mr-1" />
                      <button
                        onClick={() => {
                          const addressParts = [
                            competition.location?.split(',')[0] || competition.hosting_school,
                            competition.address,
                            competition.city,
                            competition.state,
                            competition.zip
                          ].filter(Boolean);
                          const fullAddress = addressParts.join(', ');
                          const mapsUrl = `https://www.google.com/maps/place/${fullAddress.replace(/ /g, '+')}`;
                          window.open(mapsUrl, '_blank');
                        }}
                        className="text-xs text-left hover:text-primary transition-colors"
                      >
                        <div className="font-medium">
                          {competition.location?.split(',')[0] || competition.hosting_school || 'Location TBD'}
                        </div>
                        {competition.address && <div>{competition.address}</div>}
                        {(competition.city || competition.state || competition.zip) && (
                          <div>
                            {[competition.city, competition.state].filter(Boolean).join(', ')} {competition.zip}
                          </div>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Users size={12} className="mr-1" />
                      <span>Registration open</span>
                    </div>
                    <div className="flex items-center">
                      <Trophy size={12} className="mr-1" />
                      <span>{competition.is_public ? 'Public' : 'Private'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      Hosted by: {competition.hosting_school || 'External'}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs h-7"
                      onClick={() => navigate(`/mobile/competition-portal/register?competitionId=${competition.id}`)}
                    >
                      Register
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-foreground mb-2">No Open Competitions</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    There are no public competitions available at the moment. Check back later or consider hosting your own competition.
                  </p>
                  <Button variant="outline" className="text-foreground border-border">
                    <Trophy size={16} className="mr-2" />
                    Host a Competition
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="registered">
          <div className="space-y-3">
            {registeredCompetitions.length > 0 ? (
              registeredCompetitions.map((competition) => {
                const registration = registrations.find(reg => reg.competition_id === competition.id);
                
                return (
                <Card key={competition.id} className="bg-card border-border hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-sm line-clamp-2">
                            {competition.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {competition.description || 'No description provided'}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                          Registered
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar size={12} className="mr-1" />
                          {new Date(competition.start_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <MapPin size={12} className="mr-1" />
                          <button
                            onClick={() => {
                              const addressParts = [
                                competition.location?.split(',')[0] || competition.hosting_school,
                                competition.address,
                                competition.city,
                                competition.state,
                                competition.zip
                              ].filter(Boolean);
                              const fullAddress = addressParts.join(', ');
                              const mapsUrl = `https://www.google.com/maps/place/${fullAddress.replace(/ /g, '+')}`;
                              window.open(mapsUrl, '_blank');
                            }}
                            className="text-xs text-left hover:text-primary transition-colors"
                          >
                            <div className="font-medium">
                              {competition.location?.split(',')[0] || competition.hosting_school || 'Location TBD'}
                            </div>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-muted-foreground">
                          Status: Registered
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-7"
                          onClick={() => navigate(`/mobile/competition-portal/register?competitionId=${competition.id}&registrationId=${registration?.id}`)}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-foreground mb-2">No Registered Competitions</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You have not registered for any competitions yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};