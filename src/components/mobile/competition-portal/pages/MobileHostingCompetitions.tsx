import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, Users, MapPin, Plus } from 'lucide-react';
import { useCompetitions } from '@/hooks/competition-portal/useCompetitions';

export const MobileHostingCompetitions: React.FC = () => {
  const { competitions, isLoading } = useCompetitions();

  // Filter for competitions that are being hosted by this school (internal competitions)
  const hostedCompetitions = competitions.filter(comp => 
    // For now, show all competitions since we're using the portal hook
    true
  );

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground mb-1">Hosting Competitions</h1>
          <p className="text-sm text-muted-foreground">Manage competitions you're hosting</p>
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Hosting Competitions</h1>
          <p className="text-sm text-muted-foreground">Manage competitions you're hosting</p>
        </div>
        <Button 
          size="sm" 
          className="bg-primary text-primary-foreground"
          onClick={() => window.location.href = '/mobile/competition-portal/host'}
        >
          <Plus size={16} className="mr-1" />
          Host
        </Button>
      </div>

      {/* Competitions List */}
      <div className="space-y-3">
        {hostedCompetitions.length > 0 ? (
          hostedCompetitions.map((competition) => (
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
                    <Badge variant="secondary" className="text-xs">
                      <Trophy size={12} className="mr-1" />
                      Hosting
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

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Users size={12} className="mr-1" />
                      <span>0 registered schools</span>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      Manage
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">No Hosted Competitions</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start hosting competitions to manage events and invite other schools.
              </p>
              <Button 
                className="bg-primary text-primary-foreground"
                onClick={() => window.location.href = '/mobile/competition-portal/host'}
              >
                <Plus size={16} className="mr-2" />
                Host Your First Competition
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};