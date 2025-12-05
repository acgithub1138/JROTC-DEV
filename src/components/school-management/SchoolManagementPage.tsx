import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Edit,
  Trash2,
  Search,
  Plus,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppAccess, parseAppAccess, getTierLabel, canAccessCCC, getCompetitionTier } from "@/types/appAccess";

interface School {
  id: string;
  name: string;
  initials?: string;
  jrotc_program?: "air_force" | "army" | "coast_guard" | "navy" | "marine_corps" | "space_force";
  contact?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  app_access?: AppAccess;
  subscription_start?: string;
  subscription_end?: string;
  referred_by?: string;
  notes?: string;
  timezone?: string;
  logo_url?: string;
  created_at: string;
}
type SortField =
  | "name"
  | "contact"
  | "ccc_access"
  | "competition_tier"
  | "subscription_start"
  | "subscription_end";
type SortDirection = "asc" | "desc";
const SchoolManagementPage = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const RECORDS_PER_PAGE = 25;
  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase.from("schools").select("*").order("name", {
        ascending: true,
      });
      if (error) throw error;
      setSchools((data || []).map(s => ({ ...s, app_access: parseAppAccess(s.app_access) })) as School[]);
    } catch (error) {
      console.error("Error fetching schools:", error);
      toast({
        title: "Error",
        description: "Failed to fetch schools",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchSchools();
  }, []);
  const handleCreateSchool = () => {
    navigate("/app/school/school_record?mode=create");
  };
  const handleEditSchool = (school: School) => {
    navigate(`/app/school/school_record?mode=edit&id=${school.id}`);
  };
  const handleDeleteSchool = async () => {
    if (!schoolToDelete) return;
    try {
      const { error } = await supabase.from("schools").delete().eq("id", schoolToDelete.id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "School deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSchoolToDelete(null);
      fetchSchools();
    } catch (error) {
      console.error("Error deleting school:", error);
      toast({
        title: "Error",
        description: "Failed to delete school",
        variant: "destructive",
      });
    }
  };

  // Sorting functions
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="w-4 h-4" />;
    }
    return sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };
  const sortSchools = (schools: School[]) => {
    const tierOrder = ['none', 'basic', 'analytics', 'host'];
    return [...schools].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === "ccc_access") {
        aValue = canAccessCCC(a.app_access!) ? 1 : 0;
        bValue = canAccessCCC(b.app_access!) ? 1 : 0;
      } else if (sortField === "competition_tier") {
        aValue = tierOrder.indexOf(getCompetitionTier(a.app_access!));
        bValue = tierOrder.indexOf(getCompetitionTier(b.app_access!));
      } else if (sortField === "subscription_start" || sortField === "subscription_end") {
        aValue = a[sortField] ? new Date(a[sortField]!).getTime() : 0;
        bValue = b[sortField] ? new Date(b[sortField]!).getTime() : 0;
      } else {
        aValue = a[sortField as keyof School];
        bValue = b[sortField as keyof School];
        if (aValue === null || aValue === undefined) aValue = "";
        if (bValue === null || bValue === undefined) bValue = "";
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };
  const filteredSchools = schools.filter(
    (school) =>
      // Filter out the admin school
      school.name !== "Carey Unlimited" &&
      (school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.city?.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // Apply sorting to filtered schools
  const sortedSchools = sortSchools(filteredSchools);
  const totalPages = Math.ceil(sortedSchools.length / RECORDS_PER_PAGE);
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const endIndex = startIndex + RECORDS_PER_PAGE;
  const paginatedSchools = sortedSchools.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Helper function to check if subscription expires within 3 months
  const isSubscriptionExpiringSoon = (endDate: string | undefined) => {
    if (!endDate) return false;
    const today = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(today.getMonth() + 3);
    const subscriptionEnd = new Date(endDate);
    return subscriptionEnd <= threeMonthsFromNow && subscriptionEnd >= today;
  };
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">School Management</h2>
          <p className="text-muted-foreground">Manage schools in the system</p>
        </div>
        <Button onClick={handleCreateSchool}>
          <Plus className="w-4 h-4 mr-2" />
          Add School
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Schools ({filteredSchools.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search schools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isMobile ? (
            // Mobile Card View
            <div className="space-y-4">
              {paginatedSchools.map((school) => (
                <Card
                  key={school.id}
                  className={`${isSubscriptionExpiringSoon(school.subscription_end) ? "border-red-200 bg-red-50" : ""}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3
                        className={`font-semibold text-lg ${isSubscriptionExpiringSoon(school.subscription_end) ? "text-black" : ""}`}
                      >
                        {school.name}
                      </h3>
                      <div className="flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditSchool(school)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit school</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:border-red-300"
                                onClick={() => {
                                  setSchoolToDelete(school);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete school</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Contact:</span>
                        <span>{school.contact || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CCC Portal:</span>
                        <span>{canAccessCCC(school.app_access!) ? "Yes" : "No"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Competition Tier:</span>
                        <span>{getTierLabel(getCompetitionTier(school.app_access!))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subscription Start:</span>
                        <span>
                          {school.subscription_start ? format(new Date(school.subscription_start), "MM/dd/yyyy") : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subscription End:</span>
                        <span>
                          {school.subscription_end ? format(new Date(school.subscription_end), "MM/dd/yyyy") : "-"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // Desktop Table View
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort("name")}
                    >
                      <span className="flex items-center gap-2">
                        Name
                        {getSortIcon("name")}
                      </span>
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort("contact")}
                    >
                      <span className="flex items-center gap-2">
                        Contact
                        {getSortIcon("contact")}
                      </span>
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort("ccc_access")}
                    >
                      <span className="flex items-center gap-2">
                        CCC Portal
                        {getSortIcon("ccc_access")}
                      </span>
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort("competition_tier")}
                    >
                      <span className="flex items-center gap-2">
                        Competition Tier
                        {getSortIcon("competition_tier")}
                      </span>
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort("subscription_start")}
                    >
                      <span className="flex items-center gap-2">
                        Subscription Start
                        {getSortIcon("subscription_start")}
                      </span>
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort("subscription_end")}
                    >
                      <span className="flex items-center gap-2">
                        Subscription End
                        {getSortIcon("subscription_end")}
                      </span>
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSchools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell
                      className={`font-medium py-2 ${isSubscriptionExpiringSoon(school.subscription_end) ? "bg-red-100 text-black" : ""}`}
                    >
                      {school.name}
                    </TableCell>
                    <TableCell className="py-2">{school.contact || "-"}</TableCell>
                    <TableCell className="py-2">{canAccessCCC(school.app_access!) ? "Yes" : "No"}</TableCell>
                    <TableCell className="py-2">{getTierLabel(getCompetitionTier(school.app_access!))}</TableCell>
                    <TableCell className="py-2">
                      {school.subscription_start ? format(new Date(school.subscription_start), "MM/dd/yyyy") : "-"}
                    </TableCell>
                    <TableCell className="py-2">
                      {school.subscription_end ? format(new Date(school.subscription_end), "MM/dd/yyyy") : "-"}
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <div className="flex items-center justify-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleEditSchool(school)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit school</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300"
                                onClick={() => {
                                  setSchoolToDelete(school);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete school</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filteredSchools.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No schools found</div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from(
                    {
                      length: totalPages,
                    },
                    (_, i) => i + 1,
                  ).map((page) => {
                    if (
                      totalPages <= 7 ||
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete School Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete School</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to delete this school? This action cannot be undone.</p>
            {schoolToDelete && (
              <div className="bg-gray-50 p-3 rounded">
                <p>
                  <strong>Name:</strong> {schoolToDelete.name}
                </p>
                <p>
                  <strong>Contact:</strong> {schoolToDelete.contact}
                </p>
                <p>
                  <strong>City:</strong> {schoolToDelete.city}
                </p>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteSchool}>
                Delete School
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default SchoolManagementPage;
