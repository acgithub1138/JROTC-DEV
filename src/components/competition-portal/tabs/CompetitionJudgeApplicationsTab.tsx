import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, Mail, Phone, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { useSchoolJudgeApplications } from '@/hooks/judges-portal/useSchoolJudgeApplications';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { formatPhoneNumber } from '@/utils/formatUtils';
interface CompetitionJudgeApplicationsTabProps {
  competitionId: string;
}
export const CompetitionJudgeApplicationsTab = ({
  competitionId
}: CompetitionJudgeApplicationsTabProps) => {
  const {
    applications,
    isLoading,
    approveApplication,
    declineApplication,
    isApproving,
    isDeclining
  } = useSchoolJudgeApplications(competitionId);
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
      pending: {
        variant: 'secondary',
        label: 'Pending'
      },
      approved: {
        variant: 'default',
        label: 'Approved'
      },
      declined: {
        variant: 'destructive',
        label: 'Declined'
      },
      withdrawn: {
        variant: 'outline',
        label: 'Withdrawn'
      }
    };
    const config = variants[status] || {
      variant: 'secondary',
      label: status
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };
  const groupedApplications = {
    pending: applications?.filter(app => app.status === 'pending') || [],
    approved: applications?.filter(app => app.status === 'approved') || [],
    declined: applications?.filter(app => app.status === 'declined') || [],
    withdrawn: applications?.filter(app => app.status === 'withdrawn') || []
  };
  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }
  const renderApplicationsTable = (applications: any[]) => {
    if (applications.length === 0) return null;

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judge Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead>Availability Notes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application.id}>
                <TableCell className="font-medium">
                  {application.cp_judges?.name || 'Unknown Judge'}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {application.cp_judges?.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <a href={`mailto:${application.cp_judges.email}`} className="text-primary hover:underline">
                          {application.cp_judges.email}
                        </a>
                      </div>
                    )}
                    {application.cp_judges?.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <a href={`tel:${application.cp_judges.phone}`} className="text-primary hover:underline">
                          {formatPhoneNumber(application.cp_judges.phone)}
                        </a>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(application.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  {application.availability_notes ? (
                    <div className="max-w-xs">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {application.availability_notes}
                      </p>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    {getStatusBadge(application.status)}
                    {application.decline_reason && (
                      <div className="bg-destructive/10 p-2 rounded text-xs max-w-xs">
                        <p className="font-medium text-destructive mb-1">Decline Reason:</p>
                        <p className="text-muted-foreground">{application.decline_reason}</p>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {application.status === 'pending' && (
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm"
                        onClick={() => handleApproveClick(application)} 
                        disabled={isApproving}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        size="sm"
                        variant="destructive" 
                        onClick={() => handleDeclineClick(application)} 
                        disabled={isDeclining}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };
  return <div className="space-y-6">
      {applications && applications.length === 0 ? <Card className="p-8 text-center">
          <p className="text-muted-foreground">No judge applications received yet.</p>
        </Card> : <>
          {/* Pending Applications */}
          {groupedApplications.pending.length > 0 && <div>
              <h3 className="text-lg font-semibold mb-4">Pending Review ({groupedApplications.pending.length})</h3>
              {renderApplicationsTable(groupedApplications.pending)}
            </div>}

          {/* Approved Applications */}
          {groupedApplications.approved.length > 0 && <div>
              <h3 className="text-lg font-semibold mb-4">Approved ({groupedApplications.approved.length})</h3>
              {renderApplicationsTable(groupedApplications.approved)}
            </div>}

          {/* Declined Applications */}
          {groupedApplications.declined.length > 0 && <div>
              <h3 className="text-lg font-semibold mb-4">Declined ({groupedApplications.declined.length})</h3>
              {renderApplicationsTable(groupedApplications.declined)}
            </div>}

          {/* Withdrawn Applications */}
          {groupedApplications.withdrawn.length > 0 && <div>
              <h3 className="text-lg font-semibold mb-4">Withdrawn ({groupedApplications.withdrawn.length})</h3>
              {renderApplicationsTable(groupedApplications.withdrawn)}
            </div>}
        </>}

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
            <Textarea id="decline-reason" placeholder="e.g., We have enough judges for this competition..." value={declineReason} onChange={e => setDeclineReason(e.target.value)} rows={4} />
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
    </div>;
};