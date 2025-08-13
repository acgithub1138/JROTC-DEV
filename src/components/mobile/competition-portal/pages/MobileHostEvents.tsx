import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Clock, Users, MapPin, Plus, Settings } from 'lucide-react';
import { useCompetitionEvents } from '@/hooks/competition-portal/useCompetitionEvents';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';

export const MobileHostEvents: React.FC = () => {
  const navigate = useNavigate();
  const { competitionId } = useParams<{ competitionId: string }>();
  const { timezone } = useSchoolTimezone();
  
  const { events, isLoading } = useCompetitionEvents(competitionId);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}`)}
            className="mr-3 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Events</h1>
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
        <div className="flex items-center">
          <button
            onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}`)}
            className="mr-3 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Events</h1>
            <p className="text-sm text-muted-foreground">Manage competition events</p>
          </div>
        </div>
        <Button size="sm" className="bg-primary text-primary-foreground">
          <Plus size={16} className="mr-1" />
          Add
        </Button>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {events.length > 0 ? (
          events.map((event) => (
            <Card key={event.id} className="bg-card border-border hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm line-clamp-2">
                        {event.cp_events?.name || 'Unnamed Event'}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.location || 'Location TBD'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <Trophy size={12} className="mr-1" />
                      Active
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    {event.start_time && (
                      <div className="flex items-center">
                        <Clock size={12} className="mr-1" />
                        {formatTimeForDisplay(event.start_time, TIME_FORMATS.DATETIME_12H, timezone)}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Users size={12} className="mr-1" />
                      {event.registration_count || 0} registered
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Max: {event.max_participants || 'Unlimited'} participants
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs h-7 w-7 p-0"
                      onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}/events/${event.id}/edit`)}
                    >
                      <Settings size={12} />
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
              <h3 className="font-medium text-foreground mb-2">No Events Created</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first competition event to get started.
              </p>
              <Button className="bg-primary text-primary-foreground">
                <Plus size={16} className="mr-2" />
                Create First Event
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};