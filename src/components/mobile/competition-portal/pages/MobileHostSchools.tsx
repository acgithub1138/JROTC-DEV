import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, School, DollarSign, Users, Plus, Settings, Eye } from 'lucide-react';
import { useCompetitionSchools } from '@/hooks/competition-portal/useCompetitionSchools';
import { ViewSchoolEventsModal } from '@/components/competition-portal/modals/ViewSchoolEventsModal';

export const MobileHostSchools: React.FC = () => {
  const navigate = useNavigate();
  const { competitionId } = useParams<{ competitionId: string }>();
  const [viewSchoolEventsModal, setViewSchoolEventsModal] = React.useState<{ open: boolean; schoolId: string | null }>({
    open: false,
    schoolId: null
  });
  
  const { schools, isLoading } = useCompetitionSchools(competitionId);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}`)}
            className="mr-3 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Schools</h1>
        </div>
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <button
            onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}`)}
            className="mr-3 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Schools</h1>
            <p className="text-sm text-muted-foreground">Registered schools and payments</p>
          </div>
        </div>
          <Button
            size="sm"
            onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}/schools/add`)}
            className="h-8 w-8 p-0"
          >
            <Plus size={16} />
          </Button>
      </div>

      {/* Schools List */}
      <div className="space-y-3">
        {schools.length > 0 ? (
          schools.map((school) => (
            <Card key={school.id} className="bg-card border-border hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm line-clamp-2">
                        {school.school_name || 'Unnamed School'}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Status: {school.status}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge 
                        variant={school.paid ? "default" : "destructive"} 
                        className="text-xs"
                      >
                        <DollarSign size={12} className="mr-1" />
                        {school.paid ? 'Paid' : 'Unpaid'}
                      </Badge>
                      {school.color && (
                        <div 
                          className="w-4 h-4 rounded-full border border-border"
                          style={{ backgroundColor: school.color }}
                        />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    {school.total_fee && (
                      <div className="flex items-center">
                        <DollarSign size={12} className="mr-1" />
                        ${school.total_fee}
                      </div>
                    )}
                  </div>

                  {school.notes && (
                    <p className="text-xs text-muted-foreground">
                      {school.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs h-7 w-7 p-0"
                      onClick={() => setViewSchoolEventsModal({ open: true, schoolId: school.id })}
                    >
                      <Eye size={12} />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs h-7 w-7 p-0"
                      onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}/schools/${school.id}/edit`)}
                    >
                      <Settings size={12} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <School className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">No Schools Registered</h3>
              <p className="text-sm text-muted-foreground mb-4">
                No schools have registered for this competition yet.
              </p>
              <Button className="bg-primary text-primary-foreground">
                <Plus size={16} className="mr-2" />
                Invite Schools
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* View School Events Modal */}
      <ViewSchoolEventsModal
        open={viewSchoolEventsModal.open}
        onOpenChange={(open) => setViewSchoolEventsModal({ open, schoolId: null })}
        competitionId={competitionId || ''}
        schoolId={viewSchoolEventsModal.schoolId || ''}
      />
    </div>
  );
};