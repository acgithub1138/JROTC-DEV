import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarDays, MapPin, Users, Trophy, DollarSign, Eye, X, FileText } from "lucide-react";
import { format } from "date-fns";
import { convertToUI } from "@/utils/timezoneUtils";
import { useSchoolTimezone } from "@/hooks/useSchoolTimezone";
import { useOpenCompsOpenPermissions } from "@/hooks/useModuleSpecificPermissions";
import DOMPurify from "dompurify";
interface Competition {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
  max_participants?: number;
  registration_deadline?: string;
  fee?: number;
  program?: string;
  hosting_school?: string;
  sop?: string;
  sop_link?: string;
  sop_text?: string;
  registered_count?: number;
}
interface OpenCompetitionCardsProps {
  competitions: Competition[];
  registrations: any[];
  onViewDetails: (competitionId: string) => void;
  onRegisterInterest: (competitionId: string) => void;
  onCancelRegistration: (competitionId: string) => void;
  permissions?: {
    canRead: boolean;
    canViewDetails: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
}
export const OpenCompetitionCards: React.FC<OpenCompetitionCardsProps> = ({
  competitions,
  registrations,
  onViewDetails,
  onRegisterInterest,
  onCancelRegistration,
  permissions,
}) => {
  const navigate = useNavigate();
  const defaultPermissions = useOpenCompsOpenPermissions();
  const { canRead, canViewDetails, canCreate, canUpdate, canDelete } = permissions || defaultPermissions;
  const { timezone } = useSchoolTimezone();
  const [showSopModal, setShowSopModal] = useState(false);
  const [selectedSopText, setSelectedSopText] = useState("");
  const [selectedCompetitionName, setSelectedCompetitionName] = useState("");
  const isRegistered = (competitionId: string) => {
    return registrations?.some((reg) => reg.competition_id === competitionId) ?? false;
  };
  const handleViewSop = (sopText: string, competitionName: string) => {
    setSelectedSopText(sopText);
    setSelectedCompetitionName(competitionName);
    setShowSopModal(true);
  };

  // Check if user can read records
  if (!canRead) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-gray-600">You don't have permission to view competitions.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {competitions.map((competition) => (
        <Card key={competition.id} className="hover:shadow-lg transition-shadow relative flex flex-col h-full">
          {isRegistered(competition.id) && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
              <Badge variant="default" className="bg-green-500 text-white">
                Registered
              </Badge>
            </div>
          )}
          <CardHeader className={isRegistered(competition.id) ? "pt-12" : ""}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg line-clamp-2">
                  {canViewDetails ? (
                    <button
                      onClick={() => {
                        // Navigate to score sheet page for this competition
                        window.location.href = `/app/competitions/score-sheets/${competition.id}`;
                      }}
                      className="text-left hover:text-primary hover:underline transition-colors cursor-pointer w-full"
                    >
                      {competition.name}
                    </button>
                  ) : (
                    competition.name
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  {competition.description || "No description available"}
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-1 ml-2">
                <Badge 
                  variant="secondary" 
                  className="text-white"
                  style={{
                    backgroundColor: 
                      competition.program === 'air_force' ? '#003f87' :
                      competition.program === 'army' ? '#454B1B' :
                      competition.program === 'navy' ? '#000080' :
                      competition.program === 'marine_corps' ? '#940000' :
                      undefined
                  }}
                >
                  <Trophy className="w-3 h-3 mr-1" />
                  {competition.program?.replace("_", " ").toUpperCase() || "N/A"}
                </Badge>
                {competition.max_participants && (
                  <span className="text-xs text-muted-foreground">
                    {competition.registered_count || 0}/{competition.max_participants} registered
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col h-full space-y-4">
            <div className="flex-1 space-y-2 text-sm text-muted-foreground">
              {competition.fee && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-medium text-green-600">${competition.fee.toFixed(2)} entry fee</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                <span>
                  {(() => {
                    const startDate = new Date(competition.start_date);
                    const endDate = competition.end_date ? new Date(competition.end_date) : startDate;
                    const startTime = convertToUI(competition.start_date, timezone, 'time');
                    const endTime = competition.end_date ? convertToUI(competition.end_date, timezone, 'time') : startTime;
                    const isSameDay = format(startDate, "yyyy-MM-dd") === format(endDate, "yyyy-MM-dd");
                    const isSameMonth = format(startDate, "MMM yyyy") === format(endDate, "MMM yyyy");
                    
                    if (isSameDay) {
                      return `${format(startDate, "MMM d, yyyy")} - ${startTime} - ${endTime}`;
                    } else if (isSameMonth) {
                      return `${format(startDate, "MMM d")}-${format(endDate, "d, yyyy")} - ${startTime} - ${endTime}`;
                    } else {
                      return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")} - ${startTime} - ${endTime}`;
                    }
                  })()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>
                  <a
                    href={`https://www.google.com/maps/place/${competition.location.replace(/ /g, "+")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline cursor-pointer"
                  >
                    {competition.location}
                  </a>
                </span>
              </div>
              {competition.max_participants && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Max {competition.max_participants} participants</span>
                </div>
              )}
              {competition.registration_deadline && (
                <div className="text-sm">
                  <strong>Registration Deadline:</strong>{" "}
                  {format(new Date(competition.registration_deadline), "MMM d, yyyy")}
                </div>
              )}
              <div className="text-sm">
                <strong>Hosting School:</strong> {competition.hosting_school || "Not specified"}
              </div>
              {(competition.sop_link || competition.sop_text) && (
                <div className="flex items-center gap-2">
                  <span>
                    <strong>SOP:</strong>{" "}
                    {competition.sop_link ? (
                      <a
                        href={competition.sop_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline cursor-pointer"
                      >
                        {competition.sop_link}
                      </a>
                    ) : competition.sop_text ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 text-primary hover:text-primary-dark"
                        onClick={() => handleViewSop(competition.sop_text, competition.name)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    ) : null}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-1 pt-2 border-t">
              {canViewDetails && (
                <Button variant="outline" size="sm" className="flex-1" onClick={() => onViewDetails(competition.id)}>
                  <Eye className="w-3 h-3 mr-1" />
                  Events
                </Button>
              )}
              {isRegistered(competition.id) ? (
                <>
                  {canUpdate && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        navigate(`/app/competition-portal/open-competitions/${competition.id}/open_comp_record`)
                      }
                    >
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => onCancelRegistration(competition.id)}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {canCreate && (
                    competition.max_participants && (competition.registered_count || 0) >= competition.max_participants ? (
                      <Badge variant="secondary" className="flex-1 justify-center py-2">
                        Full
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          navigate(`/app/competition-portal/open-competitions/${competition.id}/open_comp_record`)
                        }
                      >
                        Register
                      </Button>
                    )
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* SOP Modal */}
      <Dialog open={showSopModal} onOpenChange={setShowSopModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Standard Operating Procedures</DialogTitle>
            <DialogDescription>{selectedCompetitionName}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <div
              className="prose dark:prose-invert max-w-none text-sm leading-relaxed p-4 bg-muted rounded-md"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(selectedSopText),
              }}
            ></div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSopModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
