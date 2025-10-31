import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Phone, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSchoolJudgeApplications } from "@/hooks/judges-portal/useSchoolJudgeApplications";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatPhoneNumber } from "@/utils/formatUtils";
interface CompetitionJudgeApplicationsTabProps {
  competitionId: string;
}
export const CompetitionJudgeApplicationsTab = ({ competitionId }: CompetitionJudgeApplicationsTabProps) => {
  const { applications, isLoading, approveApplication, declineApplication, isApproving, isDeclining } =
    useSchoolJudgeApplications(competitionId);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [declineReason, setDeclineReason] = useState("");
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
        },
      });
    }
  };
  const handleDeclineClick = (application: any) => {
    setSelectedApplication(application);
    setDeclineReason("");
    setDeclineDialogOpen(true);
  };
  const handleConfirmDecline = () => {
    if (selectedApplication) {
      declineApplication(
        {
          applicationId: selectedApplication.id,
          declineReason: declineReason.trim() || undefined,
        },
        {
          onSuccess: () => {
            setDeclineDialogOpen(false);
            setSelectedApplication(null);
            setDeclineReason("");
          },
        },
      );
    }
  };
  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: {
        variant: "secondary",
        label: "Pending",
      },
      approved: {
        variant: "default",
        label: "Approved",
      },
      declined: {
        variant: "destructive",
        label: "Declined",
      },
      withdrawn: {
        variant: "outline",
        label: "Withdrawn",
      },
    };
    const config = variants[status] || {
      variant: "secondary",
      label: status,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };
  const groupedApplications = {
    pending: applications?.filter((app) => app.status === "pending") || [],
    approved: applications?.filter((app) => app.status === "approved") || [],
    declined: applications?.filter((app) => app.status === "declined") || [],
    withdrawn: applications?.filter((app) => app.status === "withdrawn") || [],
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
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
              <TableHead>Decline Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application.id}>
                <TableCell className="font-medium">{application.cp_judges?.name || "Unknown Judge"}</TableCell>
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
                  {format(new Date(application.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  {application.availability_notes ? (
                    <div className="max-w-xs">
                      <p className="text-sm text-muted-foreground line-clamp-2">{application.availability_notes}</p>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    {getStatusBadge(application.status)}
                    {application.status === "pending" && (
                      <div className="flex gap-4">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" onClick={() => handleApproveClick(application)} disabled={isApproving}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Approve</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => handleDeclineClick(application)}
                              disabled={isDeclining}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Decline</TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {application.decline_reason ? (
                    <div className="bg-destructive/10 p-2 rounded text-sm max-w-xs">
                      <p className="text-muted-foreground">{application.decline_reason}</p>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };
  return (
    <div className="space-y-6">
      {applications && applications.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No judge applications received yet.</p>
        </Card>
      ) : (
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Pending ({groupedApplications.pending.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({groupedApplications.approved.length})</TabsTrigger>
            <TabsTrigger value="declined">Declined ({groupedApplications.declined.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {groupedApplications.pending.length > 0 ? (
              renderApplicationsTable(groupedApplications.pending)
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No pending applications.</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            {groupedApplications.approved.length > 0 ? (
              renderApplicationsTable(groupedApplications.approved)
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No approved applications.</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="declined" className="mt-6">
            {groupedApplications.declined.length > 0 ? (
              renderApplicationsTable(groupedApplications.declined)
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No declined applications.</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
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
              {isApproving ? "Approving..." : "Approve"}
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
            <p className="text-sm text-muted-foreground">This reason will be visible to the judge</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDecline} disabled={isDeclining}>
              {isDeclining ? "Declining..." : "Decline Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
