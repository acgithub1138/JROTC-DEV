import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
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
import {
  CalendarDays,
  MapPin,
  Users,
  Trophy,
  DollarSign,
  Clock,
  ArrowLeft,
  Calendar,
  Loader2,
  Lock,
} from "lucide-react";
import { format, addMinutes } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePortal } from "@/contexts/PortalContext";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { convertToUI } from "@/utils/timezoneUtils";
import { useSchoolTimezone } from "@/hooks/useSchoolTimezone";
import { useEvents } from "@/components/calendar/hooks/useEvents";
import type { Json } from "@/integrations/supabase/types";
import DOMPurify from "dompurify";

interface TimeSlot {
  time: Date;
  label: string;
  available: boolean;
}

interface PreferredTimeRequest {
  window: "morning" | "midday" | "afternoon" | "";
  exact_time?: string;
  notes?: string;
}

interface CompetitionEvent {
  id: string;
  fee: number | null;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  lunch_start_time?: string | null;
  lunch_end_time?: string | null;
  max_participants: number | null;
  interval: number | null;
  notes?: string | null;
  competition_event_types?: {
    name: string;
    description: string | null;
  } | null;
  timeSlots?: TimeSlot[];
}

interface Competition {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
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
  location: string;
}

export const OpenCompetitionRecord: React.FC = () => {
  const { competitionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const { hasMinimumTier } = usePortal();
  const { timezone } = useSchoolTimezone();
  const { createEvent } = useEvents({ eventType: "", assignedTo: "" });

  // Check if user has analytics tier or above (required for time slot selection)
  const canSelectTimeSlot = hasMinimumTier("analytics");

  // Extract competitionId from URL if useParams doesn't work due to nested routing
  const location = useLocation();
  const urlCompetitionId = competitionId || location.pathname.split("/")[4]; // Get the 5th segment of the path

  // Data state
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [events, setEvents] = useState<CompetitionEvent[]>([]);
  const [currentRegistrations, setCurrentRegistrations] = useState<{ event_id: string }[]>([]);
  const [currentSchedules, setCurrentSchedules] = useState<{ event_id: string; scheduled_time: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Registration state
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [initialSelectedEvents, setInitialSelectedEvents] = useState<Set<string>>(new Set());
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<Map<string, string>>(new Map());
  const [initialSelectedTimeSlots, setInitialSelectedTimeSlots] = useState<Map<string, string>>(new Map());
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [occupiedSlots, setOccupiedSlots] = useState<Map<string, Set<string>>>(new Map());
  const [preferredTimeRequests, setPreferredTimeRequests] = useState<Map<string, PreferredTimeRequest>>(new Map());
  const [occupiedLabels, setOccupiedLabels] = useState<Map<string, Map<string, string>>>(new Map());
  const [conflictEventIds, setConflictEventIds] = useState<Set<string>>(new Set());
  const [showSopText, setShowSopText] = useState(false);

  const isEditing = currentRegistrations.length > 0;
  const isRegistered = currentRegistrations.length > 0;

  // Convert sets and maps to arrays for comparison
  const currentEventIds = Array.from(selectedEvents).sort();
  const initialEventIds = Array.from(initialSelectedEvents).sort();
  const currentTimeSlotEntries = Array.from(selectedTimeSlots.entries()).sort();
  const initialTimeSlotEntries = Array.from(initialSelectedTimeSlots.entries()).sort();

  const { hasUnsavedChanges } = useUnsavedChanges({
    initialData: {
      events: initialEventIds,
      timeSlots: initialTimeSlotEntries,
    },
    currentData: {
      events: currentEventIds,
      timeSlots: currentTimeSlotEntries,
    },
  });

  // Fetch competition details
  const fetchCompetition = useCallback(async () => {
    if (!urlCompetitionId) return;

    try {
      const { data: comp, error } = await supabase
        .from("cp_competitions")
        .select("*")
        .eq("id", urlCompetitionId)
        .single();

      if (error) throw error;
      setCompetition(comp);
    } catch (error) {
      console.error("Error fetching competition:", error);
      toast({
        title: "Error",
        description: "Failed to load competition details.",
        variant: "destructive",
      });
    }
  }, [urlCompetitionId]);

  // Fetch competition events
  const fetchEvents = useCallback(async () => {
    if (!urlCompetitionId) return;

    try {
      const { data, error } = await supabase
        .from("cp_comp_events")
        .select(
          `
          *,
          competition_event_types:event(name, description)
        `,
        )
        .eq("competition_id", urlCompetitionId)
        .order("start_time");

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to load competition events.",
        variant: "destructive",
      });
    }
  }, [urlCompetitionId]);

  // Fetch existing registrations
  const fetchRegistrations = useCallback(async () => {
    if (!urlCompetitionId || !userProfile?.school_id) return;

    try {
      const { data: registrations, error: regError } = await supabase
        .from("cp_event_registrations")
        .select("event_id")
        .eq("competition_id", urlCompetitionId)
        .eq("school_id", userProfile.school_id);

      if (regError) throw regError;

      const { data: schedules, error: schedError } = await supabase
        .from("cp_event_schedules")
        .select("event_id, scheduled_time")
        .eq("competition_id", urlCompetitionId)
        .eq("school_id", userProfile.school_id);

      if (schedError) throw schedError;

      setCurrentRegistrations(registrations || []);
      setCurrentSchedules(schedules || []);
    } catch (error) {
      console.error("Error fetching registrations:", error);
    }
  }, [urlCompetitionId, userProfile?.school_id]);

  // Generate time slots for an event
  const generateTimeSlots = (event: CompetitionEvent): TimeSlot[] => {
    if (!event.start_time || !event.end_time) return [];

    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const interval = event.interval || 15;
    const slots: TimeSlot[] = [];

    let current = new Date(start);
    const eventOccupiedSlots = occupiedSlots.get(event.id) || new Set();

    while (current < end) {
      const slotTime = new Date(current);
      const timeString = slotTime.toISOString();

      // Check if this slot is during lunch break
      let isLunchBreak = false;
      if (event.lunch_start_time && event.lunch_end_time) {
        const currentTime = format(current, "HH:mm");
        const lunchStartTime = format(new Date(event.lunch_start_time), "HH:mm");
        const lunchEndTime = format(new Date(event.lunch_end_time), "HH:mm");
        isLunchBreak = currentTime >= lunchStartTime && currentTime < lunchEndTime;
      }

      if (!isLunchBreak) {
        const isAvailable = !eventOccupiedSlots.has(timeString);
        slots.push({
          time: slotTime,
          label: convertToUI(slotTime, timezone, "time"),
          available: isAvailable,
        });
      }

      current = addMinutes(current, interval);
    }

    return slots;
  };

  // Fetch occupied slots
  const fetchOccupiedSlots = useCallback(async () => {
    if (!urlCompetitionId) return;

    try {
      const { data: schedules, error } = await supabase
        .from("cp_event_schedules")
        .select("event_id, scheduled_time, school_id, school_name")
        .eq("competition_id", urlCompetitionId);

      if (error) throw error;

      const { data: compSchools, error: compErr } = await supabase
        .from("cp_comp_schools")
        .select("school_id, school_name")
        .eq("competition_id", urlCompetitionId);
      if (compErr) throw compErr;

      const nameBySchool = new Map<string, string>();
      compSchools?.forEach((row: any) => {
        if (row.school_id) {
          nameBySchool.set(row.school_id, row.school_name || "");
        }
      });

      const occupied = new Map<string, Set<string>>();
      const labels = new Map<string, Map<string, string>>();
      schedules?.forEach((schedule: any) => {
        if (schedule.school_id === userProfile?.school_id) return;
        if (!occupied.has(schedule.event_id)) {
          occupied.set(schedule.event_id, new Set());
        }
        if (!labels.has(schedule.event_id)) {
          labels.set(schedule.event_id, new Map());
        }
        const scheduledTime = new Date(schedule.scheduled_time).toISOString();
        occupied.get(schedule.event_id)!.add(scheduledTime);
        const labelName = nameBySchool.get(schedule.school_id) || schedule.school_name || "Occupied";
        labels.get(schedule.event_id)!.set(scheduledTime, labelName);
      });

      setOccupiedSlots(occupied);
      setOccupiedLabels(labels);
    } catch (error) {
      console.error("Error fetching occupied slots:", error);
    }
  }, [urlCompetitionId, userProfile?.school_id]);

  // Initialize data on component mount
  useEffect(() => {
    if (!urlCompetitionId) return;

    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchCompetition(), fetchEvents(), fetchRegistrations(), fetchOccupiedSlots()]);
      setIsLoading(false);
    };

    loadData();
  }, [urlCompetitionId, userProfile?.school_id]);

  // Initialize selected events and time slots with current registrations
  useEffect(() => {
    if (currentRegistrations.length > 0) {
      const registeredEventIds = new Set(currentRegistrations.map((reg) => reg.event_id));
      setSelectedEvents(registeredEventIds);
      setInitialSelectedEvents(registeredEventIds);

      if (currentSchedules.length > 0) {
        const timeSlotMap = new Map<string, string>();
        currentSchedules.forEach((schedule) => {
          // Convert scheduled_time to ISO string format to match the time slot options
          const scheduledDate = new Date(schedule.scheduled_time);
          timeSlotMap.set(schedule.event_id, scheduledDate.toISOString());
        });
        setSelectedTimeSlots(timeSlotMap);
        setInitialSelectedTimeSlots(timeSlotMap);
      }
    } else {
      setSelectedEvents(new Set());
      setInitialSelectedEvents(new Set());
      setSelectedTimeSlots(new Map());
      setInitialSelectedTimeSlots(new Map());
    }
  }, [currentRegistrations, currentSchedules]);

  // Detect double-booked time slots (same time selected for multiple events)
  const doubleBookedEventIds = useMemo(() => {
    const timeSlotToEvents = new Map<string, string[]>();
    selectedTimeSlots.forEach((timeSlot, eventId) => {
      if (!timeSlotToEvents.has(timeSlot)) {
        timeSlotToEvents.set(timeSlot, []);
      }
      timeSlotToEvents.get(timeSlot)!.push(eventId);
    });

    const doubleBooked = new Set<string>();
    timeSlotToEvents.forEach((eventIds) => {
      if (eventIds.length > 1) {
        eventIds.forEach((id) => doubleBooked.add(id));
      }
    });
    return doubleBooked;
  }, [selectedTimeSlots]);

  const totalCost = useMemo(() => {
    const competitionFee = competition?.fee || 0;
    const eventsFee = Array.from(selectedEvents).reduce((sum, eventId) => {
      const event = events.find((e) => e.id === eventId);
      return sum + (event?.fee || 0);
    }, 0);
    return competitionFee + eventsFee;
  }, [competition?.fee, selectedEvents, events]);

  const handleEventSelection = (eventId: string, checked: boolean) => {
    const newSelectedEvents = new Set(selectedEvents);
    const newSelectedTimeSlots = new Map(selectedTimeSlots);

    if (checked) {
      newSelectedEvents.add(eventId);
    } else {
      newSelectedEvents.delete(eventId);
      newSelectedTimeSlots.delete(eventId);
      setConflictEventIds((prev) => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    }

    setSelectedEvents(newSelectedEvents);
    setSelectedTimeSlots(newSelectedTimeSlots);
  };

  const handleTimeSlotSelection = (eventId: string, timeSlot: string) => {
    const newSelectedTimeSlots = new Map(selectedTimeSlots);
    newSelectedTimeSlots.set(eventId, timeSlot);
    setSelectedTimeSlots(newSelectedTimeSlots);
    setConflictEventIds((prev) => {
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });
  };

  const handlePreferredTimeChange = (eventId: string, field: keyof PreferredTimeRequest, value: string) => {
    setPreferredTimeRequests((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(eventId) || { window: "" as const };
      newMap.set(eventId, { ...current, [field]: value });
      return newMap;
    });
  };

  const handleRegister = async () => {
    if (!competition || !userProfile?.school_id) {
      toast({
        title: "Registration Error",
        description: "Please ensure you are logged in and try again.",
        variant: "destructive",
      });
      return;
    }

    if (selectedEvents.size === 0) {
      toast({
        title: "No Events Selected",
        description: "Please select at least one event to register for.",
        variant: "destructive",
      });
      return;
    }

    // Check that all selected events have time slots OR preferred time requests (except for external users)
    if (userProfile?.role !== "external") {
      const eventsWithoutTimePreferences = Array.from(selectedEvents).filter((eventId) => {
        const event = events.find((e) => e.id === eventId);
        if (!event?.start_time || !event?.end_time) return false; // No time config = no requirement

        // Analytics+ tier: must have time slot selected
        if (canSelectTimeSlot) {
          return !selectedTimeSlots.has(eventId);
        }
        // Basic tier: must have preferred time window selected
        return !preferredTimeRequests.get(eventId)?.window;
      });

      if (eventsWithoutTimePreferences.length > 0) {
        toast({
          title: canSelectTimeSlot ? "Time Slots Required" : "Time Preferences Required",
          description: canSelectTimeSlot
            ? "Please select time slots for all selected events."
            : "Please select a preferred time window for all selected events.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsRegistering(true);

    try {
      if (isEditing) {
        // Delete existing registrations and schedules
        const { error: deleteRegError } = await supabase
          .from("cp_event_registrations")
          .delete()
          .eq("competition_id", competition.id)
          .eq("school_id", userProfile.school_id);
        if (deleteRegError) throw deleteRegError;

        const { error: deleteScheduleError } = await supabase
          .from("cp_event_schedules")
          .delete()
          .eq("competition_id", competition.id)
          .eq("school_id", userProfile.school_id);
        if (deleteScheduleError) throw deleteScheduleError;
      } else {
        // Create calendar event for new registrations (silently)
        try {
          // Insert directly to avoid the success toast from useEvents hook
          await supabase.from("events").insert({
            title: competition.name,
            description: `Competition registration - ${competition.name}`,
            location: competition.location || "",
            start_date: competition.start_date,
            end_date: competition.end_date || competition.start_date,
            event_type: "b04588d5-acae-4141-a0cf-20c46bb1ec72",
            is_all_day: true,
            school_id: userProfile.school_id,
            created_by: userProfile.id,
          });
        } catch (calendarError) {
          console.error("Error creating calendar event:", calendarError);
        }

        // Register for the competition
        const { error: compError } = await supabase.from("cp_comp_schools").insert({
          competition_id: competition.id,
          school_id: userProfile.school_id,
          status: "registered",
          created_by: userProfile.id,
          total_fee: totalCost,
          calendar_event_id: null,
        });
        if (compError) throw compError;
      }

      // Insert new event registrations
      const registrationInserts = Array.from(selectedEvents).map((eventId) => {
        const preferredRequest = !canSelectTimeSlot ? preferredTimeRequests.get(eventId) : null;
        return {
          competition_id: competition.id,
          school_id: userProfile.school_id,
          event_id: eventId,
          status: "registered",
          created_by: userProfile.id,
          preferred_time_request: (preferredRequest?.window ? preferredRequest : null) as unknown as Json,
        };
      });

      const { error: regError } = await supabase.from("cp_event_registrations").insert(registrationInserts);
      if (regError) throw regError;

      // Insert new schedules
      const scheduleInserts = Array.from(selectedTimeSlots.entries()).map(([eventId, timeSlot]) => ({
        competition_id: competition.id,
        school_id: userProfile.school_id,
        event_id: eventId,
        scheduled_time: timeSlot,
        duration: 15,
        created_by: userProfile.id,
        school_name: null,
      }));

      if (scheduleInserts.length > 0) {
        const { error: schedError } = await supabase.from("cp_event_schedules").insert(scheduleInserts);
        if (schedError) throw schedError;
      }

      toast({
        title: isEditing ? "Registration Updated" : "Registration Successful",
        description: isEditing
          ? "Your competition registration has been updated successfully."
          : "You have successfully registered for this competition.",
      });

      // Refresh data
      await fetchRegistrations();
      setInitialSelectedEvents(new Set(selectedEvents));
      setInitialSelectedTimeSlots(new Map(selectedTimeSlots));
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register for the competition. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!competition || !userProfile?.school_id) return;

    setIsCanceling(true);

    try {
      // Delete event registrations
      const { error: regError } = await supabase
        .from("cp_event_registrations")
        .delete()
        .eq("competition_id", competition.id)
        .eq("school_id", userProfile.school_id);
      if (regError) throw regError;

      // Delete schedules
      const { error: schedError } = await supabase
        .from("cp_event_schedules")
        .delete()
        .eq("competition_id", competition.id)
        .eq("school_id", userProfile.school_id);
      if (schedError) throw schedError;

      // Delete associated calendar event
      try {
        const { data: calendarEvents, error: fetchError } = await supabase
          .from("events")
          .select("id")
          .eq("school_id", userProfile.school_id)
          .eq("title", competition.name)
          .eq("event_type", "b04588d5-acae-4141-a0cf-20c46bb1ec72")
          .ilike("description", `%Competition registration - ${competition.name}%`);

        if (fetchError) {
          console.error("Error fetching calendar events:", fetchError);
        } else if (calendarEvents && calendarEvents.length > 0) {
          // Delete the calendar events
          const { error: deleteCalendarError } = await supabase
            .from("events")
            .delete()
            .in(
              "id",
              calendarEvents.map((event) => event.id),
            );

          if (deleteCalendarError) {
            console.error("Error deleting calendar events:", deleteCalendarError);
          }
        }
      } catch (calendarError) {
        console.error("Error handling calendar event deletion:", calendarError);
        // Don't throw here - we don't want to fail the entire cancellation for calendar issues
      }

      // Delete competition registration
      const { error: compError } = await supabase
        .from("cp_comp_schools")
        .delete()
        .eq("competition_id", competition.id)
        .eq("school_id", userProfile.school_id);
      if (compError) throw compError;

      toast({
        title: "Registration Cancelled",
        description: "Your registration and calendar event have been successfully cancelled.",
      });

      // Reset state
      setSelectedEvents(new Set());
      setInitialSelectedEvents(new Set());
      setSelectedTimeSlots(new Map());
      setInitialSelectedTimeSlots(new Map());
      setCurrentRegistrations([]);
      setCurrentSchedules([]);
    } catch (error: any) {
      console.error("Cancellation error:", error);
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCanceling(false);
      setShowCancelDialog(false);
    }
  };

  const handleNavigation = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigate("/app/competition-portal/open-competitions");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Competition Not Found</h1>
          <p className="text-muted-foreground mt-2">
            The competition you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/app/competition-portal/open-competitions")} className="mt-4">
            Back to Competitions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={handleNavigation} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{competition.name}</h1>
          <p className="text-muted-foreground">Competition Details & Registration</p>
        </div>
        {isRegistered && (
          <Badge variant="default" className="ml-auto bg-green-500 text-white">
            Registered
          </Badge>
        )}
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Competition Details */}
            <Card>
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Competition Information
                </CardTitle>
                {competition.program && (
                  <Badge variant="secondary" className="absolute top-4 right-4">
                    {competition.program.replace("_", " ").toUpperCase()}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {competition.description && <p className="text-muted-foreground">{competition.description}</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    <span>
                      <strong>Date:</strong> {format(new Date(competition.start_date), "MMM d, yyyy")}
                      {competition.end_date &&
                        format(new Date(competition.end_date), "MMM d, yyyy") !==
                          format(new Date(competition.start_date), "MMM d, yyyy") &&
                        ` - ${format(new Date(competition.end_date), "MMM d, yyyy")}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>
                      <strong>Location:</strong> {competition.address}, {competition.city}, {competition.state}{" "}
                      {competition.zip}
                    </span>
                  </div>

                  {competition.hosting_school && (
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      <span>
                        <strong>Hosting School:</strong> {competition.hosting_school}
                      </span>
                    </div>
                  )}

                  {competition.max_participants && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>
                        <strong>Max Participants:</strong> {competition.max_participants}
                      </span>
                    </div>
                  )}

                  {competition.registration_deadline && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        <strong>Registration Deadline:</strong>{" "}
                        {format(new Date(competition.registration_deadline), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                </div>

                {/* SOP Section */}
                {(competition.sop_link || competition.sop_text) && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-semibold">Standard Operating Procedures</h4>
                      {competition.sop_link ? (
                        <a
                          href={competition.sop_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View SOP Document
                        </a>
                      ) : competition.sop_text ? (
                        <div>
                          <Button variant="outline" onClick={() => setShowSopText(true)}>
                            View SOP Details
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Events */}
            <Card>
              <CardHeader>
                <CardTitle>Competition Events</CardTitle>
                <CardDescription>
                  Select the events you want to register for and choose your preferred time slots.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {events.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No events available for this competition.</p>
                  </div>
                ) : (
                  events.map((event) => {
                    const timeSlots = generateTimeSlots(event);
                    const isEventSelected = selectedEvents.has(event.id);
                    const hasConflict = conflictEventIds.has(event.id);

                    return (
                      <div
                        key={event.id}
                        className={`border rounded-lg p-4 ${hasConflict ? "border-destructive bg-destructive/5" : ""}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={`event-${event.id}`}
                              checked={isEventSelected}
                              onCheckedChange={(checked) => handleEventSelection(event.id, checked as boolean)}
                            />
                            <div className="space-y-1">
                              <h4 className="font-medium">
                                {event.competition_event_types?.name || "Event Name Not Available"}
                              </h4>
                              {event.competition_event_types?.description && (
                                <p className="text-sm text-muted-foreground">
                                  {event.competition_event_types.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {event.fee && event.fee > 0 && (
                              <Badge variant="secondary">
                                <DollarSign className="w-3 h-3 mr-1" />${event.fee.toFixed(2)}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                          {event.start_time && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                <strong>Start:</strong> {format(new Date(event.start_time), "MMM d, yyyy h:mm a")}
                              </span>
                            </div>
                          )}

                          {event.end_time && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                <strong>End:</strong> {format(new Date(event.end_time), "MMM d, yyyy h:mm a")}
                              </span>
                            </div>
                          )}

                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>
                                <strong>Location:</strong> {event.location}
                              </span>
                            </div>
                          )}

                          {event.max_participants && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>
                                <strong>Max Participants:</strong> {event.max_participants}
                              </span>
                            </div>
                          )}
                        </div>

                        {event.notes && (
                          <div className="mb-3 pt-2 border-t">
                            <p className="text-sm text-muted-foreground">
                              <strong>Notes:</strong> {event.notes}
                            </p>
                          </div>
                        )}

                        {/* Time Slot Selection */}
                        {isEventSelected && timeSlots.length > 0 && (
                          <div className="mt-4 pt-3 border-t">
                            <label className="text-sm font-medium mb-2 block">
                              {canSelectTimeSlot ? "Select Time Slot:" : "Request Preferred Time:"}
                            </label>
                            {userProfile?.role === "external" ? (
                              <div className="w-full p-3 bg-muted rounded-md border">
                                <p className="text-sm text-muted-foreground">
                                  Only subscribers can select their time slots.
                                </p>
                              </div>
                            ) : !canSelectTimeSlot ? (
                              <div className="space-y-3 p-3 bg-muted rounded-md border">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                  <Lock className="h-4 w-4" />
                                  <span>
                                    A Subscription is required to select a time, please request a preferred time (Host
                                    will assign your slot)
                                  </span>
                                </div>

                                {/* Time Window Selection (Required) */}
                                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                                  <label className="text-sm font-medium">Time Window *</label>
                                  <Select
                                    value={preferredTimeRequests.get(event.id)?.window || ""}
                                    onValueChange={(value) => handlePreferredTimeChange(event.id, "window", value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select preference" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="morning">Morning (Early slots)</SelectItem>
                                      <SelectItem value="midday">Midday (Middle slots)</SelectItem>
                                      <SelectItem value="afternoon">Afternoon (Later slots)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Exact Time (Optional) */}
                                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                                  <label className="text-sm font-medium">Exact Time</label>
                                  <Input
                                    type="time"
                                    value={preferredTimeRequests.get(event.id)?.exact_time || ""}
                                    onChange={(e) => handlePreferredTimeChange(event.id, "exact_time", e.target.value)}
                                    className="w-full"
                                  />
                                </div>

                                {/* Notes (Optional) */}
                                <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                                  <label className="text-sm font-medium pt-2">Notes</label>
                                  <Textarea
                                    value={preferredTimeRequests.get(event.id)?.notes || ""}
                                    onChange={(e) => handlePreferredTimeChange(event.id, "notes", e.target.value)}
                                    placeholder="e.g., Transportation constraints..."
                                    rows={2}
                                    className="resize-none"
                                  />
                                </div>
                              </div>
                            ) : (
                              <>
                                <Select
                                  value={selectedTimeSlots.get(event.id) || ""}
                                  onValueChange={(value) => handleTimeSlotSelection(event.id, value)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Choose a time slot" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {timeSlots.map((slot) => {
                                      const occupiedLabel = occupiedLabels.get(event.id)?.get(slot.time.toISOString());

                                      return (
                                        <SelectItem
                                          key={slot.time.toISOString()}
                                          value={slot.time.toISOString()}
                                          disabled={!slot.available}
                                        >
                                          <div className="flex items-center justify-between w-full">
                                            <span>{slot.label}</span>
                                            {!slot.available && occupiedLabel && (
                                              <span className="text-xs text-muted-foreground ml-2">
                                                ({occupiedLabel})
                                              </span>
                                            )}
                                          </div>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                                {doubleBookedEventIds.has(event.id) && (
                                  <p className="text-sm text-destructive mt-1">Double Booked</p>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Registration Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Registration Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Competition Fee:</span>
                    <span>${(competition.fee || 0).toFixed(2)}</span>
                  </div>
                  {Array.from(selectedEvents).map((eventId) => {
                    const event = events.find((e) => e.id === eventId);
                    if (!event) return null;
                    return (
                      <div key={eventId} className="flex justify-between text-sm">
                        <span>{event.competition_event_types?.name}:</span>
                        <span>${(event.fee || 0).toFixed(2)}</span>
                      </div>
                    );
                  })}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total Cost:</span>
                    <span>${totalCost.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {isRegistered ? (
                    <>
                      <Button
                        onClick={handleRegister}
                        disabled={isRegistering || selectedEvents.size === 0}
                        className="w-full"
                      >
                        {isRegistering && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Update Registration
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setShowCancelDialog(true)}
                        disabled={isCanceling}
                        className="w-full"
                      >
                        Cancel Registration
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleRegister}
                      disabled={isRegistering || selectedEvents.size === 0}
                      className="w-full"
                    >
                      {isRegistering && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Register for Competition
                    </Button>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  {selectedEvents.size} event{selectedEvents.size !== 1 ? "s" : ""} selected
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={() => navigate("/app/competition-portal/open-competitions")}
        onCancel={() => setShowUnsavedDialog(false)}
      />

      {/* Cancel Registration Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Registration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your registration for this competition? This will cancel your registration
              for all events and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Registration</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelRegistration}
              disabled={isCanceling}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isCanceling && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Cancel Registration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SOP Text Dialog */}
      {showSopText && competition.sop_text && (
        <AlertDialog open={showSopText} onOpenChange={setShowSopText}>
          <AlertDialogContent className="sm:max-w-[600px] max-h-[80vh]">
            <AlertDialogHeader>
              <AlertDialogTitle>Standard Operating Procedures</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              <div
                className="prose dark:prose-invert max-w-none text-sm leading-relaxed p-4 bg-muted rounded-md"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(competition.sop_text) }}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowSopText(false)}>Close</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};
