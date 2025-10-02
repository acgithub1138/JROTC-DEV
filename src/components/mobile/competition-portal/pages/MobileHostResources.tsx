import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Clock, MapPin, Plus, Settings } from 'lucide-react';
import { useCompetitionResources } from '@/hooks/competition-portal/useCompetitionResources';
import { convertToUI } from '@/utils/timezoneUtils';
import { formatInTimeZone } from 'date-fns-tz';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
export const MobileHostResources: React.FC = () => {
  const navigate = useNavigate();
  const {
    competitionId
  } = useParams<{
    competitionId: string;
  }>();
  const {
    timezone
  } = useSchoolTimezone();
  const {
    resources,
    isLoading
  } = useCompetitionResources(competitionId);
  if (isLoading) {
    return <div className="p-4 space-y-4">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}`)} className="mr-3 p-1 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Resources</h1>
        </div>
        {[...Array(3)].map((_, index) => <Card key={index} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>)}
      </div>;
  }
  return <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <button onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}`)} className="mr-3 p-1 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Resources</h1>
            <p className="text-sm text-muted-foreground">Manage judges and resources</p>
          </div>
        </div>
          <Button size="sm" onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}/resource/add`)} className="h-8 w-8 p-0">
            <Plus size={16} />
          </Button>
      </div>

      {/* Resources List */}
      <div className="space-y-3">
        {resources.length > 0 ? resources.map(resource => <Card key={resource.id} className="bg-card border-border hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm line-clamp-2">
                        {resource.cadet_profile?.first_name} {resource.cadet_profile?.last_name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {resource.location || 'Location TBD'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <Users size={12} className="mr-1" />
                      Resource
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    {resource.start_time && <div className="flex items-center">
                        <Clock size={12} className="mr-1" />
                        {formatInTimeZone(new Date(resource.start_time), timezone, 'M/d/yyyy h:mm a')}
                      </div>}
                    {resource.end_time && <div className="flex items-center">
                        <Clock size={12} className="mr-1" />
                        to {formatInTimeZone(new Date(resource.end_time), timezone, 'M/d/yyyy h:mm a')}
                      </div>}
                  </div>

                  {resource.assignment_details && <p className="text-xs text-muted-foreground">
                      {resource.assignment_details}
                    </p>}

                  <div className="flex items-center justify-end">
                    <Button variant="outline" size="sm" className="text-xs h-7 w-7 p-0" onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}/resource/${resource.id}/edit`)}>
                      <Settings size={12} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>) : <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">No Resources Assigned</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Assign judges and resources to manage your competition.
              </p>
              
            </CardContent>
          </Card>}
      </div>
    </div>;
};