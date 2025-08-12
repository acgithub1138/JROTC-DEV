import React from 'react';
import { 
  CheckSquare, 
  Users, 
  AlertTriangle, 
  Calendar,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const quickStats = [
  { label: 'Tasks Due Today', value: '8', icon: CheckSquare, color: 'text-primary' },
  { label: 'Active Cadets', value: '127', icon: Users, color: 'text-green-600' },
  { label: 'Open Incidents', value: '3', icon: AlertTriangle, color: 'text-destructive' },
  { label: 'Events This Week', value: '12', icon: Calendar, color: 'text-blue-600' },
];

const recentActivities = [
  { id: 1, type: 'task', title: 'Equipment Inventory', time: '2h ago', urgent: true },
  { id: 2, type: 'incident', title: 'Equipment Malfunction', time: '4h ago', urgent: false },
  { id: 3, type: 'cadet', title: 'New Cadet Registration', time: '6h ago', urgent: false },
  { id: 4, type: 'task', title: 'Drill Practice Setup', time: '1d ago', urgent: false },
];

export const MobileDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            className="w-full justify-start" 
            variant="ghost"
            onClick={() => navigate('/mobile/tasks/create')}
          >
            <CheckSquare className="mr-3 h-4 w-4" />
            Create New Task
          </Button>
          <Button 
            className="w-full justify-start" 
            variant="ghost"
            onClick={() => navigate('/mobile/incidents/report')}
          >
            <AlertTriangle className="mr-3 h-4 w-4" />
            Report Incident
          </Button>
          <Button 
            className="w-full justify-start" 
            variant="ghost"
            onClick={() => navigate('/mobile/cadets/search')}
          >
            <Users className="mr-3 h-4 w-4" />
            Find Cadet
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/mobile/activity')}
          >
            View All
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
              <div className={`h-2 w-2 rounded-full ${activity.urgent ? 'bg-destructive' : 'bg-muted-foreground'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3" />
                  {activity.time}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            This Week's Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tasks Completed</span>
              <span className="text-sm font-medium text-foreground">24/30</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '80%' }} />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cadet Attendance</span>
              <span className="text-sm font-medium text-foreground">96%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '96%' }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};