import { useMyAssignments } from "@/hooks/judges-portal/useMyAssignments";
import { convertToUI } from "@/utils/timezoneUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calendar, MapPin, Clock, ClipboardCheck } from "lucide-react";
import { useSchoolTimezone } from "@/hooks/useSchoolTimezone";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
export const MyAssignmentsWidget = () => {
  const {
    competitions,
    isLoading,
    error
  } = useMyAssignments();
  const {
    timezone
  } = useSchoolTimezone();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle>My Assignments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>;
  }
  if (error) {
    return <Card>
        <CardHeader>
          <CardTitle>My Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Error loading assignments: {error.message}</p>
        </CardContent>
      </Card>;
  }
  if (competitions.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle>My Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No upcoming judging assignments</p>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <CardTitle>My Assignments</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={[]} className="space-y-4">
          {competitions.map(competition => <AccordionItem key={competition.competition_id} value={competition.competition_id} className="border-l-4 border-judge pl-3 border-b-0">
              <AccordionTrigger className="hover:no-underline py-2">
                <div className="text-left w-full">
                  <h3 className="font-semibold text-lg">{competition.competition_name}</h3>
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {convertToUI(competition.competition_start_date, timezone, "date")}
                        {competition.competition_start_date !== competition.competition_end_date && ` - ${convertToUI(competition.competition_end_date, timezone, "date")}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{competition.competition_location}</span>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="ml-4 space-y-2 pb-4">
                {competition.assignments.map(assignment => <div key={assignment.assignment_id} className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                      <div className="flex-1 order-1 md:order-none">
                        <div className="font-medium text-lg">{assignment.event_name || "Event Assignment"}</div>
                        {assignment.event_start_time && <div className="hidden md:flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1 w-full">
                            <Clock className="w-[14px] h-[14px]" />
                            <span className="text-sm font-medium">
                              {convertToUI(assignment.event_start_time, timezone, "time")}
                              {assignment.event_end_time && ` - ${convertToUI(assignment.event_end_time, timezone, "time")}`}
                            </span>
                            {assignment.event_location && <>
                                <span>•</span>
                                <span className="text-sm font-medium">{assignment.event_location}</span>
                              </>}
                          </div>}
                        {assignment.assignment_details && <p className="text-xs text-muted-foreground mt-1">{assignment.assignment_details}</p>}
                      </div>
                      {assignment.event_id && <Button size="sm" onClick={() => {
                  const path = isMobile ? `/app/judges-portal/m_judge_event/${assignment.event_id}?competitionId=${competition.competition_id}` : `/app/judges-portal/judge_event/${assignment.event_id}?competitionId=${competition.competition_id}`;
                  navigate(path);
                }} className="shrink-0 order-3 md:order-none">
                          <ClipboardCheck className="h-4 w-4 mr-1" />
                          Judge Event
                        </Button>}
                      {assignment.event_start_time && <div className="flex md:hidden flex-wrap items-center gap-2 text-xs text-muted-foreground w-full order-2">
                          <Clock className="h-3 w-3" />
                          <span>
                            {convertToUI(assignment.event_start_time, timezone, "time")}
                            {assignment.event_end_time && ` - ${convertToUI(assignment.event_end_time, timezone, "time")}`}
                          </span>
                          {assignment.event_location && <>
                              <span>•</span>
                              <span>{assignment.event_location}</span>
                            </>}
                        </div>}
                    </div>
                  </div>)}
              </AccordionContent>
            </AccordionItem>)}
        </Accordion>
      </CardContent>
    </Card>;
};