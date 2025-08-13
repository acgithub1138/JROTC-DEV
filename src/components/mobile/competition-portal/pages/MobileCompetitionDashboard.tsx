import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, Users, Calendar, TrendingUp, Search } from 'lucide-react';

export const MobileCompetitionDashboard: React.FC = () => {

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground mb-1">Competition Portal</h1>
        <p className="text-sm text-muted-foreground">
          Track competitions, events, and team performance
        </p>
      </div>

      {/* Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <button className="w-full p-4 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors flex items-center text-left">
              <Trophy className="h-5 w-5 mr-3 flex-shrink-0" />
              <span className="font-medium">Host Competition</span>
            </button>
            <button className="w-full p-4 bg-blue-500/10 text-blue-600 rounded-lg hover:bg-blue-500/20 transition-colors flex items-center text-left">
              <Search className="h-5 w-5 mr-3 flex-shrink-0" />
              <span className="font-medium">Find Competitions</span>
            </button>
            <button className="w-full p-4 bg-green-500/10 text-green-600 rounded-lg hover:bg-green-500/20 transition-colors flex items-center text-left">
              <Users className="h-5 w-5 mr-3 flex-shrink-0" />
              <span className="font-medium">Manage Teams</span>
            </button>
            <button className="w-full p-4 bg-purple-500/10 text-purple-600 rounded-lg hover:bg-purple-500/20 transition-colors flex items-center text-left">
              <Calendar className="h-5 w-5 mr-3 flex-shrink-0" />
              <span className="font-medium">View Schedule</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};