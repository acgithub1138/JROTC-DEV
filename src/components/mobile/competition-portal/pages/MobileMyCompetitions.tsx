import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Calendar, MapPin, Users, Trophy, Award } from 'lucide-react';
import { useCompetitions } from '@/hooks/competition-portal/useCompetitions';

export const MobileMyCompetitions: React.FC = () => {
  const { competitions, isLoading } = useCompetitions();

  // Show all competitions (both hosted and participating)
  const myCompetitions = competitions;

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground mb-1">My Competitions</h1>
          <p className="text-sm text-muted-foreground">Track your participation and performance</p>
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

  const getStatusBadge = (competition: any) => {
    const now = new Date();
    const startDate = new Date(competition.start_date);
    const endDate = competition.end_date ? new Date(competition.end_date) : null;

    if (endDate && now > endDate) {
      return <Badge variant="secondary" className="text-xs">Completed</Badge>;
    } else if (now >= startDate) {
      return <Badge variant="default" className="text-xs bg-green-500 text-white">Active</Badge>;
    } else {
      return <Badge variant="outline" className="text-xs">Upcoming</Badge>;
    }
  };

  const getParticipationType = (competition: any) => {
    // For now, assume all competitions are participating since we're using portal data
    return { label: 'Participating', icon: Target, color: 'text-blue-600' };
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground mb-1">My Competitions</h1>
        <p className="text-sm text-muted-foreground">Track your participation and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Active</p>
                <p className="text-lg font-bold text-foreground">
                  {myCompetitions.filter(comp => {
                    const now = new Date();
                    const start = new Date(comp.start_date);
                    const end = comp.end_date ? new Date(comp.end_date) : null;
                    return now >= start && (!end || now <= end);
                  }).length}
                </p>
              </div>
              <Award className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Upcoming</p>
                <p className="text-lg font-bold text-foreground">
                  {myCompetitions.filter(comp => new Date(comp.start_date) > new Date()).length}
                </p>
              </div>
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Competitions List */}
      <div className="space-y-3">
        {myCompetitions.length > 0 ? (
          myCompetitions.map((competition) => {
            const participationType = getParticipationType(competition);
            const ParticipationIcon = participationType.icon;
            
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
                      <div className="flex flex-col items-end space-y-1">
                        {getStatusBadge(competition)}
                        <Badge variant="secondary" className="text-xs">
                          <ParticipationIcon size={12} className="mr-1" />
                          {participationType.label}
                        </Badge>
                      </div>
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

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Users size={12} className="mr-1" />
                          <span>Team status: Registered</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="text-xs h-7">
                        View Details
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
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">No Competitions Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start participating in competitions to track your team's progress and achievements.
              </p>
              <Button variant="outline" className="text-foreground border-border">
                <Trophy size={16} className="mr-2" />
                Browse Competitions
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};