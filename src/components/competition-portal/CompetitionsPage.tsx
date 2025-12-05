import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CopyCompetitionModal } from "./components/CopyCompetitionModal";
import { useHostedCompetitions } from "@/hooks/competition-portal/useHostedCompetitions";
import { CalendarDays, MapPin, Users, Plus, Search, Filter, Edit, Eye, X, GitCompareArrows, Copy } from "lucide-react";
import { format } from "date-fns";
import { convertToUI } from "@/utils/timezoneUtils";
import { useSchoolTimezone } from "@/hooks/useSchoolTimezone";
import { toast } from "sonner";
import { useTablePermissions } from "@/hooks/useTablePermissions";
import { useCPCompetitionPermissions } from "@/hooks/useModuleSpecificPermissions";
const STATUS_OPTIONS = [{
  value: "draft",
  label: "Draft"
}, {
  value: "open",
  label: "Open"
}, {
  value: "registration_closed",
  label: "Registration Closed"
}, {
  value: "in_progress",
  label: "In Progress"
}, {
  value: "completed",
  label: "Completed"
}, {
  value: "cancelled",
  label: "Cancelled"
}];
interface Competition {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  location: string;
  max_participants?: number;
  registration_deadline?: string;
  status: string;
  is_public: boolean;
  school_id: string;
  created_at: string;
  created_by?: string;
}
interface School {
  id: string;
  name: string;
}
const CompetitionsPage = () => {
  const navigate = useNavigate();
  const {
    userProfile
  } = useAuth();
  const {
    canCreate
  } = useTablePermissions("cp_competitions");
  const {
    canViewDetails,
    canEdit,
    canDelete,
    canManage
  } = useCPCompetitionPermissions();
  const {
    competitions,
    isLoading: loading,
    refetch: refetchCompetitions
  } = useHostedCompetitions();
  const { timezone } = useSchoolTimezone();
  const [schools, setSchools] = useState<School[]>([]);
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"active" | "non-active">("active");
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [competitionToCancel, setCompetitionToCancel] = useState<Competition | null>(null);
  useEffect(() => {
    fetchSchools();
    fetchRegistrationCounts();
  }, []);
  const fetchSchools = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("schools").select("id, name").order("name");
      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error("Error fetching schools:", error);
    }
  };
  const fetchRegistrationCounts = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("cp_comp_schools").select("competition_id");
      if (error) throw error;

      // Count registrations per competition
      const counts: Record<string, number> = {};
      data?.forEach(registration => {
        counts[registration.competition_id] = (counts[registration.competition_id] || 0) + 1;
      });
      setRegistrationCounts(counts);
    } catch (error) {
      console.error("Error fetching registration counts:", error);
    }
  };
  const getSchoolName = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    return school?.name || "Unknown School";
  };
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "draft":
        return "secondary";
      case "open":
        return "default";
      case "registration_closed":
        return "outline";
      case "in_progress":
        return "default";
      case "completed":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };
  const filteredAndSortedCompetitions = competitions.filter(competition => {
    const matchesSearch = competition.name.toLowerCase().includes(searchTerm.toLowerCase()) || competition.location.toLowerCase().includes(searchTerm.toLowerCase()) || getSchoolName(competition.school_id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || competition.status === statusFilter;

    // Filter by active/non-active tab
    const isActive = ["draft", "open", "registration_closed", "in_progress"].includes(competition.status);
    const matchesTab = activeTab === "active" ? isActive : !isActive;
    return matchesSearch && matchesStatus && matchesTab;
  });
  // Remove unused modal functions and state
  const canCreateCompetition = canCreate;
  const handleViewCompetition = (competition: Competition) => {
    navigate(`/app/competition-portal/competition-details/${competition.id}`);
  };
  const handleOpenEdit = (competition: Competition) => {
    navigate(`/app/competition-portal/competitions/competition_record?mode=edit&id=${competition.id}`);
  };
  const handleEditSubmit = async (data: any) => {
    // This function is no longer needed since we navigate to the page
    refetchCompetitions();
  };
  const handleCancelCompetitionClick = (competition: Competition) => {
    setCompetitionToCancel(competition);
    setShowCancelDialog(true);
  };
  const handleCancelCompetition = async () => {
    if (!competitionToCancel) return;
    try {
      const {
        error
      } = await supabase.from("cp_competitions").update({
        status: "cancelled"
      }).eq("id", competitionToCancel.id);
      if (error) throw error;
      toast.success("Competition cancelled successfully");
      refetchCompetitions();
      setShowCancelDialog(false);
      setCompetitionToCancel(null);
    } catch (error) {
      console.error("Error cancelling competition:", error);
      toast.error("Failed to cancel competition");
    }
  };
  const handleCopyCompetition = (competition: Competition) => {
    setSelectedCompetition(competition);
    setShowCopyModal(true);
  };
  const handleCopySubmit = async (name: string, startDate: Date, endDate: Date) => {
    if (!selectedCompetition) return;
    try {
      setIsCopying(true);

      // Copy competition logic
      const {
        data: newCompetition,
        error: copyError
      } = await supabase.from("cp_competitions").insert({
        name,
        description: selectedCompetition.description,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        location: selectedCompetition.location,
        max_participants: selectedCompetition.max_participants,
        registration_deadline: selectedCompetition.registration_deadline,
        status: "draft",
        is_public: selectedCompetition.is_public,
        school_id: selectedCompetition.school_id,
        created_by: userProfile?.id
      }).select().single();
      if (copyError) throw copyError;
      toast.success("Competition copied successfully");
      setShowCopyModal(false);
      setSelectedCompetition(null);
      refetchCompetitions();
    } catch (error) {
      console.error("Error copying competition:", error);
      toast.error("Failed to copy competition");
    } finally {
      setIsCopying(false);
    }
  };
  const handleStatusChange = async (competitionId: string, newStatus: string) => {
    try {
      setUpdatingStatus(competitionId);
      const {
        error
      } = await supabase.from("cp_competitions").update({
        status: newStatus
      }).eq("id", competitionId);
      if (error) throw error;
      toast.success("Competition status updated successfully");
      refetchCompetitions();
    } catch (error) {
      console.error("Error updating competition status:", error);
      toast.error("Failed to update competition status");
    } finally {
      setUpdatingStatus(null);
    }
  };
  if (loading) {
    return <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading competitions...</div>
        </div>
      </div>;
  }
  return <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-black ">
              Competitions
            </h1>
            <p className="text-muted-foreground text-lg">Manage drill competitions and events</p>
          </div>
          {canCreateCompetition && <Button onClick={() => navigate("/app/competition-portal/competitions/competition_record")} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300">
              <Plus className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Create Competition</span>
            </Button>}
        </div>

        {/* Active/Non-Active Tabs */}
        <Tabs value={activeTab} onValueChange={value => setActiveTab(value as "active" | "non-active")}>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="non-active">Non-Active</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {/* Filters */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input placeholder="Search competitions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-11 h-11 border-border/50 focus:border-primary focus:ring-primary/20" />
                    </div>
                  </div>
                  <div className="min-w-[200px]">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-11 border-border/50">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="registration_closed">Registration Closed</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Competitions Grid */}
            {filteredAndSortedCompetitions.length === 0 ? <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="text-muted-foreground text-lg">
                    {competitions.length === 0 ? "No competitions found." : "No competitions match your search criteria."}
                  </div>
                </CardContent>
              </Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedCompetitions.map(competition => <Card key={competition.id} className="group border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-2xl hover:border-primary/30 transition-all duration-300 hover:scale-[1.02]">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-xl truncate text-foreground">{competition.name}</h3>
                        </div>
                        {canManage ? <Select value={competition.status} onValueChange={value => handleStatusChange(competition.id, value)} disabled={updatingStatus === competition.id}>
                            <SelectTrigger className="w-auto h-8 border-none p-0 bg-transparent hover:bg-muted">
                              <Badge variant={getStatusBadgeVariant(competition.status)} className="cursor-pointer whitespace-nowrap">
                                {competition.status.replace("_", " ").toUpperCase()}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent className="bg-background border shadow-md z-50">
                              {STATUS_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>)}
                            </SelectContent>
                          </Select> : <Badge variant={getStatusBadgeVariant(competition.status)} className="whitespace-nowrap">
                            {competition.status.replace("_", " ").toUpperCase()}
                          </Badge>}
                      </div>
                      {competition.description && <CardDescription className="mt-2 line-clamp-2">{competition.description}</CardDescription>}
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {/* Date Information */}
                      <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border/30">
                        <div className="flex items-center text-sm font-medium">
                          <CalendarDays className="w-5 h-5 mr-3 text-primary" />
                          <span className="text-foreground">
                            {format(new Date(competition.start_date), "MMM d, yyyy")} @ {convertToUI(competition.start_date, timezone, 'time')}
                          </span>
                        </div>
                        {competition.start_date !== competition.end_date && <div className="text-sm text-muted-foreground ml-8">
                            to {format(new Date(competition.end_date), "MMM d, yyyy")} @ {convertToUI(competition.end_date, timezone, 'time')}
                          </div>}
                      </div>

                      {/* Location */}
                      <div className="flex items-center text-sm p-3 bg-muted/30 rounded-lg border border-border/30">
                        <MapPin className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                        <span className="truncate font-medium text-foreground">{competition.location}</span>
                      </div>

                      {/* Registered Schools */}
                      <div className="flex items-center text-sm p-3 bg-muted/30 rounded-lg border border-border/30">
                        <Users className="w-5 h-5 mr-3 text-primary" />
                        <span className="font-medium text-foreground">
                          {registrationCounts[competition.id] || 0}
                          {competition.max_participants && ` / ${competition.max_participants}`} Schools Registered
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border/50">
                        {/* View Competition */}
                        {canViewDetails && <Tooltip>
                            <TooltipTrigger asChild></TooltipTrigger>
                            <TooltipContent>
                              <p>View Competition</p>
                            </TooltipContent>
                          </Tooltip>}

                        {/* Edit Competition */}
                        {canEdit && <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => handleOpenEdit(competition)}>
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit Competition Details</p>
                            </TooltipContent>
                          </Tooltip>}

                        {/* Manage Competition */}
                        {canManage && <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => navigate(`/app/competition-portal/competition-details/${competition.id}`)}>
                                <GitCompareArrows className="w-4 h-4 mr-1" />
                                Manage
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Manage Competition</p>
                            </TooltipContent>
                          </Tooltip>}

                        {/* Copy Competition */}
                        {canCreate && <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => handleCopyCompetition(competition)}>
                                <Copy className="w-4 h-4 mr-1" />
                                Copy
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy Competition</p>
                            </TooltipContent>
                          </Tooltip>}

                        {/* Cancel Competition */}
                        {canDelete && ["draft", "open", "registration_closed", "in_progress"].includes(competition.status) && <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:border-red-300" onClick={() => handleCancelCompetitionClick(competition)}>
                                  <X className="w-4 h-4 mr-1" />
                                  Cancel
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Cancel Competition</p>
                              </TooltipContent>
                            </Tooltip>}
                      </div>
                    </CardContent>
                  </Card>)}
              </div>}
          </TabsContent>
        </Tabs>

        {/* Copy Competition Modal */}
        <CopyCompetitionModal isOpen={showCopyModal} onClose={() => setShowCopyModal(false)} onConfirm={handleCopySubmit} originalCompetitionName={selectedCompetition?.name || ""} isLoading={isCopying} />

        {/* Cancel Competition Confirmation Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Competition</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel "{competitionToCancel?.name}"? This action will set the competition
                status to cancelled and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancelCompetition} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Yes, Cancel Competition
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>;
};
export default CompetitionsPage;