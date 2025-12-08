import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CalendarDays, MapPin, Users, Trophy, DollarSign, Eye, Clock, MapPin as LocationIcon, X, Calendar, FileText, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { useDebouncedValue } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { CompetitionRegistrationModal } from './CompetitionRegistrationModal';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { OpenCompetitionCards } from './components/OpenCompetitionCards';
import { ScheduleTab } from './components/ScheduleTab';
import { useEvents } from '@/components/calendar/hooks/useEvents';
import { useOpenCompsOpenPermissions, useOpenCompsRegisteredPermissions, useOpenCompsSchedulePermissions } from '@/hooks/useModuleSpecificPermissions';
import DOMPurify from 'dompurify';
const SOPTextModal = ({
  isOpen,
  onClose,
  sopText
}: {
  isOpen: boolean;
  onClose: () => void;
  sopText: string;
}) => <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Standard Operating Procedure</DialogTitle>
      </DialogHeader>
      <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{
      __html: DOMPurify.sanitize(sopText)
    }} />
    </DialogContent>
  </Dialog>;
export const OpenCompetitionsPage = () => {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const {
    userProfile
  } = useAuth();
  const isMobile = useIsMobile();
  const {
    deleteEvent
  } = useEvents({
    eventType: '',
    assignedTo: ''
  });
  const openPermissions = useOpenCompsOpenPermissions();
  const registeredPermissions = useOpenCompsRegisteredPermissions();
  const {
    canAccess: canAccessSchedule
  } = useOpenCompsSchedulePermissions();
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [competitionToCancel, setCompetitionToCancel] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSOPModalOpen, setIsSOPModalOpen] = useState(false);
  const [selectedSOPText, setSelectedSOPText] = useState('');
  const [isScoreCardModalOpen, setIsScoreCardModalOpen] = useState(false);
  const [selectedScoreSheetTemplate, setSelectedScoreSheetTemplate] = useState<any>(null);
  const debouncedSearch = useDebouncedValue(searchTerm, 300);
  const {
    data: competitions,
    isLoading,
    error
  } = useQuery({
    queryKey: ['open-competitions'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('cp_competitions').select('*').eq('status', 'open').eq('is_public', true).order('start_date', {
        ascending: true
      });
      if (error) throw error;
      
      // Fetch registration counts for each competition
      const competitionsWithCounts = await Promise.all(
        (data || []).map(async (competition) => {
          const { count } = await supabase
            .from('cp_comp_schools')
            .select('*', { count: 'exact', head: true })
            .eq('competition_id', competition.id)
            .neq('status', 'canceled');
          
          return {
            ...competition,
            registered_count: count || 0
          };
        })
      );
      
      return competitionsWithCounts;
    }
  });
  const filteredCompetitions = React.useMemo(() => {
    const list = competitions || [];
    const q = (debouncedSearch || '').trim().toLowerCase();
    if (!q) return list;
    return list.filter((c: any) => {
      const programRaw = c.program ? String(c.program) : '';
      const programFormatted = programRaw.replace(/_/g, ' ');
      const haystack = [c.name, c.location, c.address, c.city, c.state, c.zip, c.program, programFormatted, c.hosting_school, c.description].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [competitions, debouncedSearch]);

  // Query to check which competitions the user's school is registered for
  const {
    data: registrations,
    refetch: refetchRegistrations
  } = useQuery({
    queryKey: ['school-registrations', userProfile?.school_id],
    queryFn: async () => {
      if (!userProfile?.school_id) return [];
      const {
        data,
        error
      } = await supabase.from('cp_event_registrations').select('competition_id, event_id, status').eq('school_id', userProfile.school_id).neq('status', 'canceled');
      if (error) throw error;
      return data;
    },
    enabled: !!userProfile?.school_id
  });

  // Query to get current registrations for the selected competition
  const {
    data: currentRegistrations
  } = useQuery({
    queryKey: ['current-registrations', selectedCompetitionId, userProfile?.school_id],
    queryFn: async () => {
      if (!selectedCompetitionId || !userProfile?.school_id) return [];
      const {
        data,
        error
      } = await supabase.from('cp_event_registrations').select('event_id').eq('competition_id', selectedCompetitionId).eq('school_id', userProfile.school_id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompetitionId && !!userProfile?.school_id && isRegistrationModalOpen
  });

  // Query to get current schedules for the selected competition
  const {
    data: currentSchedules
  } = useQuery({
    queryKey: ['current-schedules', selectedCompetitionId, userProfile?.school_id],
    queryFn: async () => {
      if (!selectedCompetitionId || !userProfile?.school_id) return [];
      const {
        data,
        error
      } = await supabase.from('cp_event_schedules').select('event_id, scheduled_time').eq('competition_id', selectedCompetitionId).eq('school_id', userProfile.school_id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompetitionId && !!userProfile?.school_id && isRegistrationModalOpen
  });
  const {
    data: competitionEvents,
    isLoading: isEventsLoading
  } = useQuery({
    queryKey: ['competition-events', selectedCompetitionId],
    queryFn: async () => {
      if (!selectedCompetitionId) return [];
      const {
        data,
        error
      } = await supabase.from('cp_comp_events').select(`
          *,
          competition_event_types!event(name),
          competition_templates!score_sheet(id, template_name, scores, jrotc_program, description)
        `).eq('competition_id', selectedCompetitionId).order('start_time', {
        ascending: true
      });
      if (error) throw error;
      const transformedData = data.map(event => ({
        ...event,
        event: {
          name: event.competition_event_types?.name || 'Unknown Event',
          description: '' // Add empty description since it doesn't exist in the table
        },
        scoreSheetTemplate: event.competition_templates || null
      }));
      return transformedData;
    },
    enabled: !!selectedCompetitionId && (isModalOpen || isRegistrationModalOpen)
  });
  const handleRegisterInterest = (competitionId: string) => {
    setSelectedCompetitionId(competitionId);
    setIsRegistrationModalOpen(true);
  };
  const handleViewDetails = (competitionId: string) => {
    setSelectedCompetitionId(competitionId);
    setIsModalOpen(true);
  };
  const isRegistered = (competitionId: string) => {
    return registrations?.some(reg => reg.competition_id === competitionId) ?? false;
  };
  const openCompetitionsList = React.useMemo(() => {
    return (filteredCompetitions || []).filter((c: any) => !isRegistered(c.id));
  }, [filteredCompetitions, registrations]);
  const registeredCompetitionsList = React.useMemo(() => {
    return (filteredCompetitions || []).filter((c: any) => isRegistered(c.id));
  }, [filteredCompetitions, registrations]);
  const handleCancelRegistration = (competitionId: string) => {
    setCompetitionToCancel(competitionId);
    setIsCancelDialogOpen(true);
  };
  const confirmCancelRegistration = async () => {
    if (!competitionToCancel || !userProfile?.school_id) return;
    try {
      // Get the calendar_event_id before deleting the registration
      const {
        data: compSchool
      } = await supabase.from('cp_comp_schools').select('calendar_event_id').eq('competition_id', competitionToCancel).eq('school_id', userProfile.school_id).single();

      // Delete calendar event if it exists
      if (compSchool?.calendar_event_id) {
        try {
          await deleteEvent(compSchool.calendar_event_id);
        } catch (calendarError) {
          console.error('Error deleting calendar event:', calendarError);
          // Don't block cancellation if calendar deletion fails
        }
      }

      // Delete cp_event_schedules records for this school and competition
      const {
        error: scheduleError
      } = await supabase.from('cp_event_schedules').delete().eq('competition_id', competitionToCancel).eq('school_id', userProfile.school_id);
      if (scheduleError) throw scheduleError;

      // Delete cp_event_registrations for this school and competition
      const {
        error: regError
      } = await supabase.from('cp_event_registrations').delete().eq('competition_id', competitionToCancel).eq('school_id', userProfile.school_id);
      if (regError) throw regError;

      // Delete cp_comp_schools entry for this school and competition
      const {
        error: schoolError
      } = await supabase.from('cp_comp_schools').delete().eq('competition_id', competitionToCancel).eq('school_id', userProfile.school_id);
      if (schoolError) throw schoolError;
      toast({
        title: "Registration Cancelled",
        description: "Your registration has been successfully cancelled and scheduled events removed."
      });
      refetchRegistrations();
    } catch (error) {
      console.error('Error cancelling registration:', error);
      toast({
        title: "Error",
        description: "Failed to cancel registration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCancelDialogOpen(false);
      setCompetitionToCancel(null);
    }
  };

  const generatePrintableContent = () => {
    if (!selectedScoreSheetTemplate?.scores?.criteria) return '';

    return selectedScoreSheetTemplate.scores.criteria.map((field: any, index: number) => {
      const fieldType = field.type || 'text';
      const fieldName = field.name || `Field ${index + 1}`;
      const isBoldGray = field.pauseField || field.type === 'bold_gray' || field.type === 'pause';

      if (fieldType === 'section_header') {
        return `<div class="section-header">${fieldName}</div>`;
      }

      if (fieldType === 'label' || fieldType === 'bold_gray' || fieldType === 'pause') {
        if (isBoldGray) {
          return `<div class="bold-gray">${fieldName}${field.fieldInfo ? `<div class="field-info">${field.fieldInfo}</div>` : ''}</div>`;
        }
        return `<div class="field"><span class="field-name">${fieldName}</span>${field.fieldInfo ? `<div class="field-info">${field.fieldInfo}</div>` : ''}</div>`;
      }

      if (fieldType === 'penalty') {
        return `<div class="field penalty"><div><span class="field-name">${fieldName}</span><span class="score-range">Penalty Field</span></div>${field.fieldInfo ? `<div class="field-info">${field.fieldInfo}</div>` : ''}</div>`;
      }

      return `<div class="field"><div><span class="field-name">${fieldName}</span><span class="score-range">${field.maxValue ? `0-${field.maxValue}` : 'Score'}</span></div>${field.fieldInfo ? `<div class="field-info">${field.fieldInfo}</div>` : ''}</div>`;
    }).join('');
  };

  const handlePrintScoreCard = () => {
    if (!selectedScoreSheetTemplate) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Print Blocked",
        description: "Please allow pop-ups to print the score card.",
        variant: "destructive"
      });
      return;
    }
    
    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Score Card: ${selectedScoreSheetTemplate.template_name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              max-width: 800px;
              margin: 0 auto;
            }
            h1 { 
              border-bottom: 2px solid #333; 
              padding-bottom: 10px; 
            }
            .section-header { 
              font-size: 18px; 
              font-weight: bold; 
              margin-top: 20px; 
              border-bottom: 2px solid #0066cc; 
              padding-bottom: 5px; 
              color: #0066cc;
            }
            .field { 
              padding: 8px 0; 
              border-bottom: 1px solid #ddd; 
            }
            .field-name { 
              font-weight: 500; 
            }
            .field-info { 
              font-size: 14px; 
              color: #666; 
              margin-top: 4px; 
            }
            .penalty { 
              color: #cc0000; 
            }
            .bold-gray { 
              background: #f0f0f0; 
              padding: 8px; 
              font-weight: bold;
              margin: 8px 0;
            }
            .score-range { 
              float: right; 
              color: #666; 
            }
            @media print {
              body { padding: 10px; }
            }
          </style>
        </head>
        <body>
          <h1>Score Card: ${selectedScoreSheetTemplate.template_name}</h1>
          ${selectedScoreSheetTemplate.description ? `<p style="color: #666; margin-bottom: 20px;">${selectedScoreSheetTemplate.description}</p>` : ''}
          ${generatePrintableContent()}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(content);
    printWindow.document.close();
  };
  if (error) {
    return <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Competitions</h1>
          <p className="text-gray-600">There was an error loading the competitions. Please try again later.</p>
        </div>
      </div>;
  }
  return <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Competition Registration</h1>
        <p className="text-gray-600 mt-2">
          Browse and register interest in upcoming competitions hosted by other schools.
        </p>
      </div>

      <div className="max-w-xl">
        <label htmlFor="competition-search" className="text-sm font-medium mb-2 block">Search competitions</label>
        <Input id="competition-search" placeholder="Search by name, location, address, city, state, zip, program, hosting school" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {isLoading ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>)}
        </div> : <Tabs defaultValue="open">
          <TabsList className={`grid w-full grid-cols-${[openPermissions.canAccess, registeredPermissions.canAccess, canAccessSchedule].filter(Boolean).length}`}>
            {openPermissions.canAccess && <TabsTrigger value="open">Open ({openCompetitionsList?.length || 0})</TabsTrigger>}
            {registeredPermissions.canAccess && <TabsTrigger value="registered">Registered ({registeredCompetitionsList?.length || 0})</TabsTrigger>}
            {canAccessSchedule && <TabsTrigger value="schedule">Schedule</TabsTrigger>}
          </TabsList>

          {openPermissions.canAccess && <TabsContent value="open">
              {openCompetitionsList && openCompetitionsList.length > 0 ? <OpenCompetitionCards competitions={openCompetitionsList} registrations={registrations || []} onViewDetails={handleViewDetails} onRegisterInterest={handleRegisterInterest} onCancelRegistration={handleCancelRegistration} permissions={openPermissions} /> : <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Open Competitions</h3>
                  <p className="text-gray-600">
                    There are currently no open competitions available for registration.
                    Check back later for new opportunities!
                  </p>
                </div>}
            </TabsContent>}

          {registeredPermissions.canAccess && <TabsContent value="registered">
              {registeredCompetitionsList && registeredCompetitionsList.length > 0 ? <OpenCompetitionCards competitions={registeredCompetitionsList} registrations={registrations || []} onViewDetails={handleViewDetails} onRegisterInterest={handleRegisterInterest} onCancelRegistration={handleCancelRegistration} permissions={registeredPermissions} /> : <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Registered Competitions</h3>
                  <p className="text-gray-600">
                    You have not registered for any competitions yet.
                  </p>
                </div>}
            </TabsContent>}

          {canAccessSchedule && <TabsContent value="schedule">
              <ScheduleTab registeredCompetitions={registeredCompetitionsList} />
            </TabsContent>}

          {!openPermissions.canAccess && !registeredPermissions.canAccess && !canAccessSchedule && <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
              <p className="text-gray-600">
                You don't have permission to view this content.
              </p>
            </div>}
        </Tabs>}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Competition Events
              {selectedCompetitionId && competitions && <span className="text-sm font-normal text-muted-foreground ml-2">
                  - {competitions.find(c => c.id === selectedCompetitionId)?.name}
                </span>}
            </DialogTitle>
          </DialogHeader>


          <div className="space-y-4">
            {isEventsLoading ? <div className="space-y-4">
                {[...Array(3)].map((_, i) => <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </div>)}
              </div> : competitionEvents && competitionEvents.length > 0 ? <div className="space-y-4">
                {competitionEvents.map(event => <Card key={event.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">
                            {event.competition_event_types?.name || 'Event Name Not Available'}
                          </h3>
                          {(event as any).fee && <Badge variant="secondary">
                              <DollarSign className="w-3 h-3 mr-1" />
                              ${((event as any).fee as number).toFixed(2)}
                            </Badge>}
                        </div>
                        
                        

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {event.start_time && <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                <strong>Start:</strong> {format(new Date(event.start_time), 'MMM d, yyyy h:mm a')}
                              </span>
                            </div>}
                          
                          {event.end_time && <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                <strong>End:</strong> {format(new Date(event.end_time), 'MMM d, yyyy h:mm a')}
                              </span>
                            </div>}
                          
                          {event.location && <div className="flex items-center gap-2">
                              <LocationIcon className="w-4 h-4" />
                              <span>
                                <strong>Location:</strong> {event.location}
                              </span>
                            </div>}
                          
                          {event.max_participants && <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>
                                <strong>Max Participants:</strong> {event.max_participants}
                              </span>
                            </div>}
                        </div>

                        {event.notes && <div className="pt-2 border-t">
                            <p className="text-sm text-muted-foreground">
                              <strong>Notes:</strong> {event.notes}
                            </p>
                          </div>}

                        {event.scoreSheetTemplate && (
                          <div className="pt-3 border-t flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedScoreSheetTemplate(event.scoreSheetTemplate);
                                setIsScoreCardModalOpen(true);
                              }}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              View Score Card
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>)}
              </div> : <div className="text-center py-8 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No events found for this competition.</p>
              </div>}
          </div>
        </DialogContent>
      </Dialog>

      <CompetitionRegistrationModal isOpen={isRegistrationModalOpen} onClose={() => {
      setIsRegistrationModalOpen(false);
      refetchRegistrations();
    }} competition={selectedCompetitionId && competitions ? competitions.find(c => c.id === selectedCompetitionId) || null : null} events={competitionEvents || []} isLoading={isEventsLoading} currentRegistrations={currentRegistrations || []} currentSchedules={currentSchedules || []} />

      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Registration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your registration for this competition? 
              This will cancel your registration for all events in this competition and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Registration</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelRegistration} className="bg-destructive hover:bg-destructive/90">
              Cancel Registration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SOPTextModal isOpen={isSOPModalOpen} onClose={() => setIsSOPModalOpen(false)} sopText={selectedSOPText} />

      {/* Score Card Modal */}
      <Dialog open={isScoreCardModalOpen} onOpenChange={setIsScoreCardModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Score Card: {selectedScoreSheetTemplate?.template_name || 'Score Sheet'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedScoreSheetTemplate?.scores ? (
            <div className="space-y-4">
              {selectedScoreSheetTemplate.scores.criteria && Array.isArray(selectedScoreSheetTemplate.scores.criteria) ? (
                <div className="space-y-3">
                  {selectedScoreSheetTemplate.scores.criteria.map((field: any, index: number) => {
                    const fieldType = field.type || 'text';
                    const fieldName = field.name || `Field ${index + 1}`;
                    const isBoldGray = field.pauseField || field.type === 'bold_gray' || field.type === 'pause';

                    if (fieldType === 'section_header') {
                      return (
                        <div key={index} className="border-b-2 border-primary pb-2 mt-4">
                          <h3 className="text-lg font-bold text-primary">{fieldName}</h3>
                        </div>
                      );
                    }

                    if (fieldType === 'label' || fieldType === 'bold_gray' || fieldType === 'pause') {
                      return (
                        <div key={index} className="py-2">
                          {isBoldGray ? (
                            <div className="bg-muted px-3 py-2 rounded">
                              <span className="font-bold">{fieldName}</span>
                            </div>
                          ) : (
                            <span className="font-medium">{fieldName}</span>
                          )}
                          {field.fieldInfo && <p className="text-sm text-muted-foreground mt-1">{field.fieldInfo}</p>}
                        </div>
                      );
                    }

                    if (fieldType === 'penalty') {
                      return (
                        <div key={index} className="py-2 border-b space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-destructive">{fieldName}</span>
                            <span className="text-sm text-muted-foreground">Penalty Field</span>
                          </div>
                          {field.fieldInfo && <p className="text-sm text-muted-foreground">{field.fieldInfo}</p>}
                        </div>
                      );
                    }

                    return (
                      <div key={index} className="border-b space-y-1 py-2">
                        <div className="flex items-center justify-between">
                          <span className={isBoldGray ? "font-bold bg-muted px-3 py-2 rounded" : "font-medium"}>
                            {fieldName}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {field.maxValue ? `0-${field.maxValue}` : 'Score'}
                          </span>
                        </div>
                        {field.fieldInfo && <p className="text-sm text-muted-foreground">{field.fieldInfo}</p>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No scoring criteria defined for this event.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No score card available for this event.</p>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrintScoreCard}
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};