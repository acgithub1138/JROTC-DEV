import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Calendar, 
  FileText, 
  School, 
  Clock, 
  Trophy,
  ChevronRight 
} from 'lucide-react';

export const MobileManageCompetition: React.FC = () => {
  const navigate = useNavigate();
  const { competitionId } = useParams();

  const navigationItems = [
    {
      title: 'Events',
      description: 'Manage competition events and scoring',
      icon: Trophy,
      path: `/mobile/competition-portal/manage/${competitionId}/events`
    },
    {
      title: 'Resources',
      description: 'Assign resources and personnel',
      icon: FileText,
      path: `/mobile/competition-portal/manage/${competitionId}/resources`
    },
    {
      title: 'Schools',
      description: 'View and manage registered schools',
      icon: School,
      path: `/mobile/competition-portal/manage/${competitionId}/schools`
    },
    {
      title: 'Schedule',
      description: 'Create and manage event schedules',
      icon: Clock,
      path: `/mobile/competition-portal/manage/${competitionId}/schedule`
    },
    {
      title: 'Results',
      description: 'View and publish competition results',
      icon: Calendar,
      path: `/mobile/competition-portal/manage/${competitionId}/results`
    }
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/mobile/competition-portal/hosting')}
          className="mr-3 p-2"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Manage Competition</h1>
          <p className="text-sm text-muted-foreground">Competition management dashboard</p>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="space-y-3">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card 
              key={item.title} 
              className="bg-card border-border hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate(item.path)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};