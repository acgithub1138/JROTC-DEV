import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, Users, Calendar, TrendingUp, Search } from 'lucide-react';

export const MobileCompetitionDashboard: React.FC = () => {
  const dashboardStats = [
    {
      title: 'Active Competitions',
      value: '3',
      change: '2 hosting, 1 participating',
      icon: Trophy,
      color: 'text-yellow-600'
    },
    {
      title: 'Upcoming Events',
      value: '7',
      change: 'Next: State Championship',
      icon: Calendar,
      color: 'text-blue-600'
    },
    {
      title: 'Teams Registered',
      value: '12',
      change: '8 different events',
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Performance',
      value: '85%',
      change: 'Average placement',
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ];

  const recentActivities = [
    {
      title: 'State Championship Registration Open',
      time: '2 hours ago',
      type: 'new',
      status: 'Open'
    },
    {
      title: 'Regional Drill Meet - Results Posted',
      time: '1 day ago',
      type: 'result',
      status: '2nd Place'
    },
    {
      title: 'Winter Competition - Team Selected',
      time: '3 days ago',
      type: 'team',
      status: 'Confirmed'
    }
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground mb-1">Competition Portal</h1>
        <p className="text-sm text-muted-foreground">
          Track competitions, events, and team performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {dashboardStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground truncate">{stat.title}</p>
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{stat.change}</p>
                  </div>
                  <Icon className={`h-6 w-6 ${stat.color} flex-shrink-0 ml-2`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activities */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center">
            <Award className="mr-2 h-5 w-5 text-primary" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-2 hover:bg-muted/50 transition-colors rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm line-clamp-2">
                    {activity.title}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-muted-foreground text-xs">
                      {activity.time}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {activity.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-3 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
              <Trophy className="h-5 w-5 mx-auto mb-1" />
              <span className="text-xs font-medium">Host Competition</span>
            </button>
            <button className="p-3 bg-blue-500/10 text-blue-600 rounded-lg hover:bg-blue-500/20 transition-colors">
              <Search className="h-5 w-5 mx-auto mb-1" />
              <span className="text-xs font-medium">Find Competitions</span>
            </button>
            <button className="p-3 bg-green-500/10 text-green-600 rounded-lg hover:bg-green-500/20 transition-colors">
              <Users className="h-5 w-5 mx-auto mb-1" />
              <span className="text-xs font-medium">Manage Teams</span>
            </button>
            <button className="p-3 bg-purple-500/10 text-purple-600 rounded-lg hover:bg-purple-500/20 transition-colors">
              <Calendar className="h-5 w-5 mx-auto mb-1" />
              <span className="text-xs font-medium">View Schedule</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};