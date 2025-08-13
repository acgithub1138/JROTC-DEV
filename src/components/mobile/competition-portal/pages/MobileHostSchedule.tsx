import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Settings } from 'lucide-react';
import { useCompetitionSchedule } from '@/hooks/competition-portal/useCompetitionSchedule';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
export const MobileHostSchedule: React.FC = () => {
  const navigate = useNavigate();
  const {
    competitionId
  } = useParams<{
    competitionId: string;
  }>();
  const {
    timezone
  } = useSchoolTimezone();
  const {
    events,
    isLoading
  } = useCompetitionSchedule(competitionId);
  if (isLoading) {
    return <div className="p-4 space-y-4">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}`)} className="mr-3 p-1 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Schedule</h1>
        </div>
        {[...Array(3)].map((_, index) => <Card key={index} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>)}
      </div>;
  }
  return <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <button onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}`)} className="mr-3 p-1 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Schedule</h1>
            <p className="text-sm text-muted-foreground">Event schedules and timing</p>
          </div>
        </div>
        
      </div>

      {/* Schedule View */}
      <div className="space-y-4">
        {events.length > 0 ? events.map(event => <Card key={event.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Event Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm">
                        {event.event_name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center">
                        <MapPin size={12} className="mr-1" />
                        {event.event_location || 'Location TBD'}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-2">
                        <div className="flex items-center">
                          <Clock size={12} className="mr-1" />
                          {formatTimeForDisplay(event.start_time, 'h:mm a', timezone)} - {formatTimeForDisplay(event.end_time, 'h:mm a', timezone)}
                        </div>
                        <div className="flex items-center">
                          <Users size={12} className="mr-1" />
                          {event.timeSlots.filter(slot => slot.assignedSchool).length} / {event.timeSlots.filter(slot => !slot.isLunchBreak).length} scheduled
                        </div>
                      </div>
                    </div>
                    
                  </div>
                  
                  {/* Time Slots Schedule */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Schedule</h4>
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {event.timeSlots.map((slot, index) => <div key={index} className={`flex items-center justify-between p-2 rounded-md text-xs ${slot.isLunchBreak ? 'bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800' : slot.assignedSchool ? 'bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-muted border border-border'}`}>
                          <div className="flex items-center space-x-2">
                            <Clock size={12} className="text-muted-foreground" />
                            <span className="font-mono">
                              {formatTimeForDisplay(slot.time.toISOString(), 'h:mm a', timezone)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {slot.isLunchBreak ? <div className="flex items-center text-orange-700 dark:text-orange-300">
                                <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300">
                                  Lunch Break
                                </Badge>
                              </div> : slot.assignedSchool ? <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full border" style={{
                        backgroundColor: slot.assignedSchool.color || '#3B82F6',
                        borderColor: slot.assignedSchool.color || '#3B82F6'
                      }} />
                                <span className="text-foreground font-medium max-w-24 truncate">
                                  {slot.assignedSchool.name}
                                </span>
                              </div> : <Badge variant="outline" className="text-xs text-muted-foreground">
                                Available
                              </Badge>}
                          </div>
                        </div>)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>) : <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">No Events Scheduled</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add events to this competition to create schedules.
              </p>
              <Button className="bg-primary text-primary-foreground" onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}/events`)}>
                <Calendar size={16} className="mr-2" />
                Manage Events
              </Button>
            </CardContent>
          </Card>}
      </div>
    </div>;
};