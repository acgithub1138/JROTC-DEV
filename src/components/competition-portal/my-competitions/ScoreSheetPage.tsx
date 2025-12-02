import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Plus } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { EventSelector } from './components/score-sheet-viewer/EventSelector';
import { SchoolSelector } from './components/score-sheet-viewer/SchoolSelector';
import { ScoreSheetTable } from './components/score-sheet-viewer/ScoreSheetTable';
import { useScoreSheetData } from './components/score-sheet-viewer/hooks/useScoreSheetData';
import { useCompetitions } from './hooks/useCompetitions';
import { useCompetitionEvents } from './hooks/useCompetitionEvents';
import { useCompetitionSchools } from '@/hooks/competition-portal/useCompetitionSchools';
import { useTablePermissions } from '@/hooks/useTablePermissions';

export const ScoreSheetPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const competitionId = React.useMemo(() => {
    const match = location.pathname.match(/my-competitions\/score-sheets\/([^/?]+)/);
    return match?.[1] || '';
  }, [location.pathname]);
  
  // Check if this is a portal competition
  const searchParams = new URLSearchParams(location.search);
  const isPortalCompetition = searchParams.get('source') === 'portal';
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [showAllSchools, setShowAllSchools] = useState<boolean>(false);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);

  // Get competition data
  const { competitions, isLoading: compsLoading } = useCompetitions();
  const competition = competitions.find(comp => comp.id === competitionId);
  const { canCreate } = useTablePermissions('competitions');

  const { events, schoolMap, isLoading, refetch } = useScoreSheetData(competition, true);
  const { schools: allSchools } = useCompetitionSchools(competitionId);

  // Build school options from events
  const schoolOptions = Array.from(new Set(events.map((e: any) => e.school_id)))
    .filter(Boolean)
    .map((id: string) => ({ id, name: schoolMap?.[id] || 'Unknown School' }));

  // Events available for the selected school
  const eventsForSelectedSchool = selectedSchoolId
    ? (events as any[]).filter(e => e.school_id === selectedSchoolId)
    : [];

  // Get unique event types for the selected school
  const uniqueEventTypes = [...new Set(eventsForSelectedSchool.map(event => event.competition_event_types?.name).filter(Boolean))];

  useEffect(() => {
    // Default to first school when options load
    if (!selectedSchoolId && schoolOptions.length > 0) {
      setSelectedSchoolId(schoolOptions[0].id);
    }
  }, [schoolOptions, selectedSchoolId]);

  useEffect(() => {
    // Reset selected event when school changes
    setSelectedEvent('');
    setFilteredEvents([]);
  }, [selectedSchoolId]);

  useEffect(() => {
    if (selectedEvent === 'all') {
      // Show all events for selected school(s)
      if (showAllSchools && selectedSchoolIds.length > 0) {
        const filtered = (events as any[]).filter(event => 
          selectedSchoolIds.includes(event.school_id)
        );
        setFilteredEvents(filtered);
      } else if (!showAllSchools && selectedSchoolId) {
        const filtered = (events as any[]).filter(event => 
          event.school_id === selectedSchoolId
        );
        setFilteredEvents(filtered);
      } else {
        setFilteredEvents([]);
      }
    } else if (showAllSchools && selectedEvent && selectedSchoolIds.length > 0) {
      const filtered = (events as any[]).filter(event => 
        selectedSchoolIds.includes(event.school_id) && 
        event.competition_event_types?.name === selectedEvent
      );
      setFilteredEvents(filtered);
    } else if (!showAllSchools && selectedSchoolId && selectedEvent) {
      const filtered = (events as any[]).filter(event => 
        event.school_id === selectedSchoolId && 
        event.competition_event_types?.name === selectedEvent
      );
      setFilteredEvents(filtered);
    } else {
      setFilteredEvents([]);
    }
  }, [selectedSchoolId, selectedEvent, events, showAllSchools, selectedSchoolIds]);

  const handleBack = () => {
    navigate('/app/competition-portal/my-competitions');
  };

  const handleAddEvent = () => {
    const returnPath = `/app/competition-portal/my-competitions/score-sheets/${competitionId}`;
    navigate(`/app/competition-portal/my-competitions/add_competition_event?competitionId=${competitionId}&returnPath=${encodeURIComponent(returnPath)}`);
  };

  const handleSchoolSelection = (schoolId: string, checked: boolean) => {
    if (checked) {
      setSelectedSchoolIds(prev => [...prev, schoolId]);
    } else {
      setSelectedSchoolIds(prev => prev.filter(id => id !== schoolId));
    }
  };

  const handleToggleChange = (checked: boolean) => {
    setShowAllSchools(checked);
    if (!checked) {
      setSelectedSchoolIds([]);
    }
  };

  // Group events by school for multi-school view
  const groupedEvents = selectedSchoolIds.reduce((acc, schoolId) => {
    const schoolEvents = filteredEvents.filter(event => event.school_id === schoolId);
    if (schoolEvents.length > 0) {
      acc[schoolId] = {
        name: schoolMap?.[schoolId] || allSchools.find(s => s.school_id === schoolId)?.school_name || 'Unknown School',
        events: schoolEvents
      };
    }
    return acc;
  }, {} as Record<string, { name: string; events: any[] }>);

  // Group events by event type when "All" is selected
  const groupedByEventType = selectedEvent === 'all' ? filteredEvents.reduce((acc, event) => {
    const eventType = event.competition_event_types?.name || 'Unknown Event';
    if (!acc[eventType]) {
      acc[eventType] = [];
    }
    acc[eventType].push(event);
    return acc;
  }, {} as Record<string, any[]>) : {};

  if (compsLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto text-muted-foreground">Loading competition...</div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Competitions
            </Button>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            Competition not found
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Score Sheets for {competition.name}</h1>
          <div className="flex gap-2">
            {canCreate && !isPortalCompetition && (
              <Button onClick={handleAddEvent}>
                <Plus className="w-4 h-4 mr-2" />
                Add Score Sheet
              </Button>
            )}
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Competitions
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-6 flex-wrap">
              {!showAllSchools && (
                <SchoolSelector
                  schools={schoolOptions}
                  selectedSchoolId={selectedSchoolId}
                  onSchoolChange={setSelectedSchoolId}
                />
              )}
              <EventSelector
                events={showAllSchools ? events : eventsForSelectedSchool}
                selectedEvent={selectedEvent}
                onEventChange={setSelectedEvent}
              />
              {isPortalCompetition && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="show-all-schools"
                    checked={showAllSchools}
                    onCheckedChange={handleToggleChange}
                  />
                  <label htmlFor="show-all-schools" className="text-sm font-medium">
                    Show All Schools
                  </label>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {showAllSchools && selectedEvent && (
            <div className="space-y-4">
              <div className="text-sm font-medium">Select Schools to View:</div>
              <div className="grid grid-cols-3 gap-4">
                {allSchools
                  .filter(school => 
                    events.some(event => 
                      event.school_id === school.school_id && 
                      event.competition_event_types?.name === selectedEvent
                    )
                  )
                  .map((school) => (
                    <div key={school.school_id} className="flex items-center space-x-2">
                      <Checkbox
                        id={school.school_id}
                        checked={selectedSchoolIds.includes(school.school_id || '')}
                        onCheckedChange={(checked) => 
                          handleSchoolSelection(school.school_id || '', checked as boolean)
                        }
                      />
                      <label
                        htmlFor={school.school_id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {school.school_name}
                      </label>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {showAllSchools && selectedEvent ? (
            selectedSchoolIds.length > 0 ? (
              <div className="space-y-8">
                {Object.entries(groupedEvents).map(([schoolId, schoolData]) => (
                  <div key={schoolId} className="space-y-4">
                    <div className="border-b pb-2">
                      <h3 className="text-lg font-semibold">{schoolData.name}</h3>
                      <div className="text-sm text-muted-foreground">
                        {schoolData.events.length} score sheet{schoolData.events.length !== 1 ? 's' : ''} {selectedEvent !== 'all' ? `for ${selectedEvent}` : ''}
                      </div>
                    </div>
                    {selectedEvent === 'all' ? (
                      <div className="space-y-8">
                        {Object.entries(
                          schoolData.events.reduce((acc, event) => {
                            const eventType = event.competition_event_types?.name || 'Unknown Event';
                            if (!acc[eventType]) acc[eventType] = [];
                            acc[eventType].push(event);
                            return acc;
                          }, {} as Record<string, any[]>)
                        ).map(([eventType, eventsList]) => (
                          <div key={eventType} className="space-y-2">
                            <h4 className="text-md font-medium text-primary">{eventType}</h4>
                            <ScoreSheetTable 
                              events={eventsList as any[]} 
                              onEventsRefresh={refetch}
                              isInternal={!isPortalCompetition}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ScoreSheetTable 
                        events={schoolData.events} 
                        onEventsRefresh={refetch}
                        isInternal={!isPortalCompetition}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Select schools to view their score sheets {selectedEvent !== 'all' ? `for ${selectedEvent}` : ''}
              </div>
            )
          ) : !showAllSchools && selectedEvent && filteredEvents.length > 0 ? (
            selectedEvent === 'all' ? (
              <div className="space-y-8">
                {Object.entries(groupedByEventType).map(([eventType, eventsList]) => (
                  <div key={eventType} className="space-y-4">
                    <div className="border-b pb-2">
                      <h3 className="text-lg font-semibold">{eventType}</h3>
                      <div className="text-sm text-muted-foreground">
                        {(eventsList as any[]).length} score sheet{(eventsList as any[]).length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <ScoreSheetTable 
                      events={eventsList as any[]} 
                      onEventsRefresh={refetch}
                      isInternal={!isPortalCompetition}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredEvents.length} score sheets for {selectedEvent}
                </div>
                
                <ScoreSheetTable 
                  events={filteredEvents} 
                  onEventsRefresh={refetch}
                  isInternal={!isPortalCompetition}
                />
              </div>
            )
          ) : !showAllSchools && selectedEvent && filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No score sheets found {selectedEvent !== 'all' ? `for ${selectedEvent}` : ''}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {uniqueEventTypes.length === 0 ? (
                <div>
                  <p>No events with score sheets found for this competition.</p>
                  <p className="text-sm mt-2">Add some event score sheets first.</p>
                </div>
              ) : showAllSchools ? (
                'Select an event type and schools to view score sheets'
              ) : (
                'Select an event type to view score sheets'
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
