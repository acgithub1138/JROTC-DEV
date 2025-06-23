
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckSquare, DollarSign, Package, Trophy, AlertTriangle } from 'lucide-react';

const DashboardOverview = () => {
  const stats = [
    {
      title: 'Total Cadets',
      value: '156',
      change: '+8 this month',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Tasks',
      value: '23',
      change: '5 overdue',
      icon: CheckSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Budget Used',
      value: '68%',
      change: '$12,450 remaining',
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Equipment',
      value: '247',
      change: '12 checked out',
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  const recentActivity = [
    { action: 'New cadet enrolled', details: 'John Smith - Grade 10', time: '2 hours ago' },
    { action: 'Task completed', details: 'Uniform inspection checklist', time: '4 hours ago' },
    { action: 'Budget request approved', details: 'Competition travel expenses', time: '1 day ago' },
    { action: 'Equipment returned', details: 'Drill rifle #45 by Cadet Johnson', time: '2 days ago' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-blue-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.details}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-blue-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Users className="w-6 h-6 text-blue-600 mb-2" />
                <p className="font-medium text-sm">Add Cadet</p>
                <p className="text-xs text-gray-500">Enroll new cadet</p>
              </button>
              <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <CheckSquare className="w-6 h-6 text-green-600 mb-2" />
                <p className="font-medium text-sm">Create Task</p>
                <p className="text-xs text-gray-500">Assign new task</p>
              </button>
              <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Package className="w-6 h-6 text-purple-600 mb-2" />
                <p className="font-medium text-sm">Check Out Item</p>
                <p className="text-xs text-gray-500">Equipment checkout</p>
              </button>
              <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <DollarSign className="w-6 h-6 text-yellow-600 mb-2" />
                <p className="font-medium text-sm">Add Expense</p>
                <p className="text-xs text-gray-500">Record expense</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
