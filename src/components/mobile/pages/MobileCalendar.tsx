import React from 'react';
import { MobileHeader } from '../MobileHeader';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const MobileCalendar: React.FC = () => {
  // Mock data for now - this would typically come from your events API
  const upcomingEvents = [
    {
      id: 1,
      title: 'Weekly Drill Practice',
      date: '2024-08-15',
      time: '15:00',
      location: 'Main Gymnasium',
      type: 'drill',
      description: 'Regular weekly drill practice session'
    },
    {
      id: 2,
      title: 'Leadership Meeting',
      date: '2024-08-16',
      time: '16:30',
      location: 'Conference Room A',
      type: 'meeting',
      description: 'Monthly leadership team meeting'
    },
    {
      id: 3,
      title: 'Color Guard Competition',
      date: '2024-08-20',
      time: '08:00',
      location: 'Regional High School',
      type: 'competition',
      description: 'Regional color guard competition'
    }
  ];

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'drill':
        return 'bg-blue-500';
      case 'meeting':
        return 'bg-green-500';
      case 'competition':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <MobileHeader />
      
      <main className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar size={16} />
            <span>Upcoming Events</span>
          </div>

          {upcomingEvents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Calendar size={48} className="text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Events Scheduled</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Check back later for upcoming events and activities.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-3 h-12 rounded-full ${getEventTypeColor(event.type)}`} />
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {event.title}
                        </h3>
                        
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{formatDate(event.date)}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{event.time}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                          <MapPin size={14} />
                          <span>{event.location}</span>
                        </div>
                        
                        {event.description && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {event.description}
                          </p>
                        )}
                        
                        <div className="mt-3">
                          <Badge variant="secondary" className="capitalize">
                            {event.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};