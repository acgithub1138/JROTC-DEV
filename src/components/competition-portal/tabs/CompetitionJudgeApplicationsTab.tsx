import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { useSchoolJudgeApplications } from '@/hooks/judges-portal/useSchoolJudgeApplications';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface CompetitionJudgeApplicationsTabProps {
  competitionId: string;
}

export const CompetitionJudgeApplicationsTab = ({ competitionId }: CompetitionJudgeApplicationsTabProps) => {
  const { applications, isLoading, approveApplication, declineApplication, isApproving, isDeclining } = 
    useSchoolJudgeApplications(competitionId);
  
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [declineReason, setDeclineReason] = useState('');

  const handleApproveClick = (application: any) => {
    setSelectedApplication(application);
    setApproveDialogOpen(true);
  };

  const handleConfirmApprove = () => {
    if (selectedApplication) {
      approveApplication(selectedApplication.id, {
        onSuccess: () => {
          setApproveDialogOpen(false);
          setSelectedApplication(null);
        }
      });
    }
  };

  const handleDeclineClick = (application: any) => {
    setSelectedApplication(application);
    setDeclineReason('');
    setDeclineDialogOpen(true);
  };

  const handleConfirmDecline = () => {
    if (selectedApplication) {
      declineApplication({
        applicationId: selectedApplication.id,
        declineReason: declineReason.trim() || undefined
      }, {
        onSuccess: () => {
          setDeclineDialogOpen(false);
          setSelectedApplication(null);
          setDeclineReason('');
        }
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', label: 'Pending' },
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
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                {application.cp_judges?.name || 'Unknown Judge'}
              </h3>
            </div>
            {getStatusBadge(application.status)}
          </div>
          
          {/* Contact Information */}
          <div className="space-y-2 mb-4">
            {application.cp_judges?.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${application.cp_judges.email}`} className="text-primary hover:underline">
                  {application.cp_judges.email}
                </a>
              </div>
            )}
            
            {application.cp_judges?.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${application.cp_judges.phone}`} className="text-primary hover:underline">
                  {application.cp_judges.phone}
                </a>
              </div>
            )}
          </div>

          {/* Availability Notes */}
          {application.availability_notes && (
            <div className="bg-muted p-3 rounded-lg mb-3">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Availability & Notes:</p>
              </div>
              <p className="text-sm text-muted-foreground">{application.availability_notes}</p>
            </div>
          )}

          {/* Decline Reason */}
          {application.decline_reason && (
            <div className="bg-destructive/10 p-3 rounded-lg mb-3">
              <p className="text-sm font-medium text-destructive mb-1">Decline Reason:</p>
              <p className="text-sm text-muted-foreground">{application.decline_reason}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Applied on {format(new Date(application.created_at), 'MMM d, yyyy h:mm a')}
          </p>
        </div>
        
        {/* Action Buttons */}
        {application.status === 'pending' && (
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => handleApproveClick(application)}
              disabled={isApproving}
              className="whitespace-nowrap"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeclineClick(application)}
              disabled={isDeclining}
              className="whitespace-nowrap"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Decline
            </Button>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {applications && applications.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No judge applications received yet.</p>
        </Card>
      ) : (
        <>
          {/* Pending Applications */}
          {groupedApplications.pending.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Pending Review ({groupedApplications.pending.length})</h3>
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
              <h3 className="text-lg font-semibold mb-4">Approved ({groupedApplications.approved.length})</h3>
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
              <h3 className="text-lg font-semibold mb-4">Declined ({groupedApplications.declined.length})</h3>
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
              <h3 className="text-lg font-semibold mb-4">Withdrawn ({groupedApplications.withdrawn.length})</h3>
              <div className="space-y-4">
                {groupedApplications.withdrawn.map(app => (
                  <ApplicationCard key={app.id} application={app} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Approve Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Judge Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve {selectedApplication?.cp_judges?.name} as a judge for this competition?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmApprove} disabled={isApproving}>
              {isApproving ? 'Approving...' : 'Approve'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Decline Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Judge Application</DialogTitle>
            <DialogDescription>
              You are declining {selectedApplication?.cp_judges?.name}'s application to judge this competition.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <Label htmlFor="decline-reason">Reason for Decline (Optional)</Label>
            <Textarea
              id="decline-reason"
              placeholder="e.g., We have enough judges for this competition..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              This reason will be visible to the judge
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDecline} disabled={isDeclining}>
              {isDeclining ? 'Declining...' : 'Decline Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
