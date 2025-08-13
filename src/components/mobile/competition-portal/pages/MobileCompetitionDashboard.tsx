import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, Users, Calendar, TrendingUp, Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
export const MobileCompetitionDashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate('/mobile/dashboard');
  };

  return <div className="p-4 space-y-6">
      {/* Welcome Header */}
      <div className="mb-4">
        <div className="flex items-center mb-1">
          <button onClick={handleBackClick} className="flex items-center text-muted-foreground hover:text-foreground transition-colors mr-3">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Competition Portal</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Track competitions, events, and team performance
        </p>
      </div>

      {/* Quick Actions */}
      <Card className="bg-card border-border">
        
        <CardContent className="py-[16px]">
          <div className="space-y-3">
            <button className="w-full p-4 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors flex items-center text-left py-[16px]">
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
    </div>;
};