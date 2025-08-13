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
        
        
      </div>

      {/* Quick Actions */}
      <Card className="bg-card border-border">
        
        <CardContent className="py-[16px]">
          <div className="space-y-3">
            <button 
              className="w-full p-4 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors flex items-center text-left py-[16px]"
              onClick={() => navigate('/mobile/competition-portal/hosting')}
            >
              <Trophy className="h-5 w-5 mr-3 flex-shrink-0" />
              <span className="font-medium">Host Competitions</span>
            </button>
            <button 
              className="w-full p-4 bg-blue-500/10 text-blue-600 rounded-lg hover:bg-blue-500/20 transition-colors flex items-center text-left"
              onClick={() => navigate('/mobile/competition-portal/open')}
            >
              <Search className="h-5 w-5 mr-3 flex-shrink-0" />
              <span className="font-medium">Open Competitions</span>
            </button>
            <button 
              className="w-full p-4 bg-green-500/10 text-green-600 rounded-lg hover:bg-green-500/20 transition-colors flex items-center text-left"
              onClick={() => navigate('/mobile/competition-portal/my-competitions')}
            >
              <Users className="h-5 w-5 mr-3 flex-shrink-0" />
              <span className="font-medium">My Competitions</span>
            </button>
            
          </div>
        </CardContent>
      </Card>
    </div>;
};