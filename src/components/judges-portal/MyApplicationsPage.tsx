import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Building2, AlertCircle } from 'lucide-react';
import { useJudgeApplications } from '@/hooks/judges-portal/useJudgeApplications';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

export const MyApplicationsPage = () => {
  const navigate = useNavigate();
  const [judgeId, setJudgeId] = useState<string | undefined>();
  const { applications, isLoading, withdrawApplication, isWithdrawing } = useJudgeApplications(judgeId);
  
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  
  // Get judge ID
  useState(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from('cp_judges')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle()
          .then(({ data: judge }) => {
            if (judge) setJudgeId(judge.id);
          });
      }
    });
  });

  const handleWithdrawClick = (applicationId: string) => {
    setSelectedApplicationId(applicationId);
    setWithdrawDialogOpen(true);
  };

  const handleConfirmWithdraw = () => {
    if (selectedApplicationId) {
      withdrawApplication(selectedApplicationId, {
        onSuccess: () => {
          setWithdrawDialogOpen(false);
          setSelectedApplicationId(null);
        }
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', label: 'Pending Review' },
      approved: { variant: 'default', label: 'Approved' },
      declined: { variant: 'destructive', label: 'Declined' },
      withdrawn: { variant: 'outline', label: 'Withdrawn' }
    };
    
    const config = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const groupedApplications = {
    pending: applications?.filter(app => app.status === 'pending') || [],
    approved: applications?.filter(app => app.status === 'approved') || [],
    declined: applications?.filter(app => app.status === 'declined') || [],
    withdrawn: applications?.filter(app => app.status === 'withdrawn') || []
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const ApplicationCard = ({ application }: { application: any }) => (
    <Card key={application.id} className="p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="text-lg font-semibold">
              {application.cp_competitions?.name || 'Competition'}
            </h3>
            {getStatusBadge(application.status)}
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm mb-3">
            {application.cp_competitions?.start_date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(application.cp_competitions.start_date), 'MMM d, yyyy')} - {' '}
                  {format(new Date(application.cp_competitions.end_date), 'MMM d, yyyy')}
                </span>
              </div>
            )}
            
            {application.cp_competitions?.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{application.cp_competitions.location}</span>
              </div>
            )}
            
            {application.cp_competitions?.hosting_school && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{application.cp_competitions.hosting_school}</span>
              </div>
            )}
          </div>

          {application.availability_notes && (
            <div className="bg-muted p-3 rounded-lg mb-3">
              <p className="text-sm font-medium mb-1">Your Notes:</p>
              <p className="text-sm text-muted-foreground">{application.availability_notes}</p>
            </div>
          )}

          {application.decline_reason && (
            <div className="bg-destructive/10 p-3 rounded-lg mb-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive mb-1">Reason for Decline:</p>
                <p className="text-sm text-muted-foreground">{application.decline_reason}</p>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Applied on {format(new Date(application.created_at), 'MMM d, yyyy')}
          </p>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/app/judges-portal/competitions/${application.competition_id}`)}
          >
            View Competition
          </Button>
          
          {application.status === 'pending' && (
            <Button
              variant="destructive"
              onClick={() => handleWithdrawClick(application.id)}
            >
              Withdraw
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Applications</h1>
        <p className="text-muted-foreground">
          Manage your competition judge applications
        </p>
      </div>

      {applications && applications.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">You haven't applied to any competitions yet.</p>
          <Button onClick={() => navigate('/app/judges-portal/open-competitions')}>
            Browse Competitions
          </Button>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Pending Applications */}
          {groupedApplications.pending.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Pending Review</h2>
              <div className="space-y-4">
                {groupedApplications.pending.map(app => (
                  <ApplicationCard key={app.id} application={app} />
                ))}
              </div>
            </div>
          )}

          {/* Approved Applications */}
          {groupedApplications.approved.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Approved</h2>
              <div className="space-y-4">
                {groupedApplications.approved.map(app => (
                  <ApplicationCard key={app.id} application={app} />
                ))}
              </div>
            </div>
          )}

          {/* Declined Applications */}
          {groupedApplications.declined.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Declined</h2>
              <div className="space-y-4">
                {groupedApplications.declined.map(app => (
                  <ApplicationCard key={app.id} application={app} />
                ))}
              </div>
            </div>
          )}

          {/* Withdrawn Applications */}
          {groupedApplications.withdrawn.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Withdrawn</h2>
              <div className="space-y-4">
                {groupedApplications.withdrawn.map(app => (
                  <ApplicationCard key={app.id} application={app} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Withdraw Confirmation Dialog */}
      <AlertDialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to withdraw this application? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmWithdraw} disabled={isWithdrawing}>
              {isWithdrawing ? 'Withdrawing...' : 'Withdraw Application'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
