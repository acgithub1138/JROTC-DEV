import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Calendar, MapPin, Users, Trophy, ExternalLink } from 'lucide-react';
import { useCompetitions } from '@/hooks/competition-portal/useCompetitions';

export const MobileOpenCompetitions: React.FC = () => {
  const { competitions, isLoading } = useCompetitions();

  // Filter for public competitions
  const openCompetitions = competitions.filter(comp => comp.is_public);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground mb-1">Open Competitions</h1>
          <p className="text-sm text-muted-foreground">Browse and join public competitions</p>
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
        <h1 className="text-2xl font-bold text-foreground mb-1">Open Competitions</h1>
        <p className="text-sm text-muted-foreground mb-3">Browse and join public competitions</p>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search competitions..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Competitions List */}
      <div className="space-y-3">
        {openCompetitions.length > 0 ? (
          openCompetitions.map((competition) => (
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
                      {competition.location || 'Location TBD'}
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
                    <Button variant="outline" size="sm" className="text-xs h-7">
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
    </div>
  );
};