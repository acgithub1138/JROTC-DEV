import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Calendar, Users, Target, TrendingUp, Award } from 'lucide-react';

const CompetitionDashboard = () => {
  // Mock data - replace with real data from your hooks/API
  const dashboardStats = [
    {
      title: 'Active Competitions',
      value: '12',
      description: '+2 from last month',
      icon: Trophy,
      color: 'text-yellow-500'
    },
    {
      title: 'Upcoming Events',
      value: '8',
      description: 'Next 30 days',
      icon: Calendar,
      color: 'text-blue-500'
    },
    {
      title: 'Participating Teams',
      value: '45',
      description: 'Across all competitions',
      icon: Users,
      color: 'text-green-500'
    },
    {
      title: 'Total Participants',
      value: '324',
      description: '+18 new registrations',
      icon: Target,
      color: 'text-purple-500'
    },
    {
      title: 'Average Score',
      value: '87.3',
      description: '+2.1% from last period',
      icon: TrendingUp,
      color: 'text-emerald-500'
    },
    {
      title: 'Awards Given',
      value: '156',
      description: 'Total this season',
      icon: Award,
      color: 'text-orange-500'
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Competition Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of competition activities and performance metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardStats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Competitions</CardTitle>
            <CardDescription>Latest competition results and activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Regional Drill Championships</p>
                  <p className="text-sm text-muted-foreground">Completed • March 15, 2024</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">1st Place</p>
                  <p className="text-sm text-muted-foreground">92.5 avg</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">State Color Guard Competition</p>
                  <p className="text-sm text-muted-foreground">In Progress • March 22, 2024</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-blue-600">Ongoing</p>
                  <p className="text-sm text-muted-foreground">12 teams</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Leadership Skills Competition</p>
                  <p className="text-sm text-muted-foreground">Scheduled • April 5, 2024</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-yellow-600">Upcoming</p>
                  <p className="text-sm text-muted-foreground">8 teams</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Team performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Armed Drill</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">85%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Unarmed Drill</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">92%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Color Guard</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">78%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Academic Testing</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '89%' }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">89%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompetitionDashboard;