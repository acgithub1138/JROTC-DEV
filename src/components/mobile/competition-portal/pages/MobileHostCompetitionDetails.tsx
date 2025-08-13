import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar, Users, MapPin, Trophy, FileText } from 'lucide-react';

export const MobileHostCompetitionDetails: React.FC = () => {
  const navigate = useNavigate();
  const { competitionId } = useParams<{ competitionId: string }>();

  const navigationItems = [
    {
      title: 'Events',
      description: 'Manage competition events and scoring',
      icon: Trophy,
      path: `/mobile/competition-portal/manage/${competitionId}/events`,
    },
    {
      title: 'Resources',
      description: 'Assign judges and manage resources',
      icon: Users,
      path: `/mobile/competition-portal/manage/${competitionId}/resources`,
    },
    {
      title: 'Schools',
      description: 'View registered schools and payments',
      icon: MapPin,
      path: `/mobile/competition-portal/manage/${competitionId}/schools`,
    },
    {
      title: 'Schedule',
      description: 'Manage event schedules and timing',
      icon: Calendar,
      path: `/mobile/competition-portal/manage/${competitionId}/schedule`,
    },
    {
      title: 'Results',
      description: 'View competition results and scores',
      icon: FileText,
      path: `/mobile/competition-portal/manage/${competitionId}/results`,
    },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => navigate('/mobile/competition-portal')}
          className="mr-3 p-1 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Host Competitions</h1>
          <p className="text-sm text-muted-foreground">Manage your hosted competitions</p>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="space-y-3">
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Card 
              key={item.path} 
              className="bg-card border-border hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate(item.path)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <IconComponent size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-sm">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.description}
                    </p>
                  </div>
                  <div className="text-muted-foreground">
                    <ArrowLeft size={16} className="rotate-180" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};