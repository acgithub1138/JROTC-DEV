import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCompetitionSchedule } from '@/hooks/competition-portal/useCompetitionSchedule';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PrintSchedulePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { timezone } = useSchoolTimezone();
  
  // Get parameters from location state
  const searchParams = new URLSearchParams(location.search);
  const competitionId = searchParams.get('competitionId');
  const schoolFilter = searchParams.get('schoolFilter') || 'all';

  const {
    events,
    isLoading
  } = useCompetitionSchedule(competitionId || '');

  // Fetch registered schools for this competition
  const { data: registeredSchools } = useQuery({
    queryKey: ['competition-registered-schools', competitionId],
    queryFn: async () => {
      if (!competitionId) return [];
      
      const { data, error } = await supabase
        .from('cp_comp_schools')
        .select(`
          school_id,
          school_name
        `)
        .eq('competition_id', competitionId);

      if (error) throw error;
      
      return data.map(school => ({
        id: school.school_id,
        name: school.school_name,
        initials: school.school_name?.split(' ').map(word => word[0]).join('').toUpperCase() || ''
      }));
    },
    enabled: !!competitionId
  });

  // Get all time slots
  const getAllTimeSlots = () => {
    const timeSlots = new Set<string>();
    events.forEach(event => {
      event.timeSlots.forEach(slot => {
        timeSlots.add(slot.time.toISOString());
      });
    });
    return Array.from(timeSlots).sort().map(timeStr => new Date(timeStr));
  };

  const getAssignedSchoolForSlot = (eventId: string, timeSlot: Date) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return null;
    const slot = event.timeSlots.find(s => s.time.getTime() === timeSlot.getTime());
    return slot?.assignedSchool || null;
  };

  const shouldShowSlot = (eventId: string, timeSlot: Date) => {
    const assignedSchool = getAssignedSchoolForSlot(eventId, timeSlot);
    
    if (schoolFilter !== 'all') {
      return assignedSchool?.id === schoolFilter;
    }
    
    return true;
  };

  const getPrintScheduleData = () => {
    const allTimeSlots = getAllTimeSlots();
    
    if (schoolFilter === 'all') {
      // Create a grid format with time as Y-axis and events as X-axis
      const timeSlots = allTimeSlots.filter(timeSlot => 
        events.some(event => shouldShowSlot(event.id, timeSlot))
      );
      
      return {
        timeSlots: timeSlots.map(timeSlot => 
          formatTimeForDisplay(timeSlot, TIME_FORMATS.TIME_ONLY_24H, timezone)
        ),
        timeSlotsRaw: timeSlots,
        events: events.map(event => ({
          name: event.event_name,
          location: event.event_location || 'TBD',
          id: event.id
        }))
      };
    } else {
      // Show specific school's schedule
      const schoolSchedule: Array<{ time: string; event: string; location: string }> = [];
      
      allTimeSlots.forEach(timeSlot => {
        events.forEach(event => {
          // Check if this time slot is a lunch break for this event
          const eventDetails = events.find(e => e.id === event.id);
          const isLunchSlot = eventDetails?.timeSlots.find(
            slot => slot.time.getTime() === timeSlot.getTime()
          )?.isLunchBreak;
          
          if (!isLunchSlot) {
            const assignedSchool = getAssignedSchoolForSlot(event.id, timeSlot);
            if (assignedSchool?.id === schoolFilter) {
              schoolSchedule.push({
                time: formatTimeForDisplay(timeSlot, TIME_FORMATS.TIME_ONLY_24H, timezone),
                event: event.event_name,
                location: event.event_location || 'TBD'
              });
            }
          }
        });
      });
      
      return schoolSchedule.sort((a, b) => a.time.localeCompare(b.time));
    }
  };

  // Auto-print when page loads and data is ready
  useEffect(() => {
    if (!isLoading && events.length > 0) {
      const timer = setTimeout(() => {
        window.print();
      }, 500); // Small delay to ensure content is rendered
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, events]);

  // Handle back navigation after printing
  useEffect(() => {
    const handleAfterPrint = () => {
      navigate(-1); // Go back to previous page
    };

    window.addEventListener('afterprint', handleAfterPrint);
    
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [navigate]);

  if (!competitionId) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Error: Missing Competition ID</h1>
        <p className="mt-2 text-muted-foreground">Unable to load schedule without competition information.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading schedule for printing...</p>
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold">No Events Found</h1>
        <p className="mt-2 text-muted-foreground">No events found for this competition.</p>
      </div>
    );
  }

  const allTimeSlots = getAllTimeSlots();
  const printScheduleData = getPrintScheduleData();

  return (
    <div className="min-h-screen bg-white p-8">
      {/* Screen content - hidden when printing */}
      <div className="print:hidden text-center space-y-4">
        <h1 className="text-2xl font-bold">Preparing Schedule for Print...</h1>
        <p className="text-muted-foreground">
          The print dialog should open automatically. If it doesn't, use Ctrl+P (or Cmd+P on Mac).
        </p>
        <button 
          onClick={() => window.print()} 
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Print Schedule
        </button>
        <button 
          onClick={() => navigate(-1)} 
          className="ml-4 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
        >
          Go Back
        </button>
      </div>

      {/* Print content */}
      <div className="hidden print:block">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">Competition Schedule</h1>
          <h2 className="text-lg">
            {schoolFilter === 'all' 
              ? 'All Schools' 
              : registeredSchools?.find(s => s.id === schoolFilter)?.name || 'Selected School'
            }
          </h2>
        </div>
        
        {schoolFilter === 'all' ? (
          // Grid format for all schools: Y-axis = time, X-axis = events
          <table className="w-full border-collapse border border-black text-xs">
            <colgroup>
              <col style={{width: '15%'}} />
              {(printScheduleData as any).events?.map((_: any, index: number) => {
                const eventCount = (printScheduleData as any).events?.length || 1;
                const columnWidth = `${85 / eventCount}%`;
                return <col key={index} style={{width: columnWidth}} />;
              })}
            </colgroup>
            <thead>
              <tr>
                <th className="border border-black p-2 text-left font-bold">Time</th>
                {(printScheduleData as any).events?.map((event: any, index: number) => (
                  <th key={index} className="border border-black p-2 text-center font-bold">
                    <div className="font-semibold">{event.name}</div>
                    <div className="text-xs font-normal text-gray-600">({event.location})</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(printScheduleData as any).timeSlotsRaw?.map((timeSlot: Date, timeIndex: number) => (
                <tr key={timeIndex}>
                  <td className="border border-black p-2 font-medium">
                    {formatTimeForDisplay(timeSlot, TIME_FORMATS.TIME_ONLY_24H, timezone)}
                  </td>
                  {(printScheduleData as any).events?.map((event: any, eventIndex: number) => {
                    // Check if this time slot is a lunch break for this event
                    const eventDetails = events.find(e => e.id === event.id);
                    const isLunchSlot = eventDetails?.timeSlots.find(
                      slot => slot.time.getTime() === timeSlot.getTime()
                    )?.isLunchBreak;
                    
                    if (isLunchSlot) {
                      return (
                        <td key={eventIndex} className="border border-black p-2 text-center">
                          Lunch Break
                        </td>
                      );
                    }
                    
                    const assignedSchool = getAssignedSchoolForSlot(event.id, timeSlot);
                    return (
                      <td key={eventIndex} className="border border-black p-2 text-center">
                        {assignedSchool?.initials || assignedSchool?.name || '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          // Individual school format
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr>
                <th className="border border-black p-3 text-left font-bold">Time</th>
                <th className="border border-black p-3 text-left font-bold">
                  <div>Event</div>
                  <div className="text-xs font-normal">(Location)</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {(printScheduleData as Array<{ time: string; event: string; location: string }>).map((item, index) => (
                <tr key={index}>
                  <td className="border border-black p-3 font-medium">{item.time}</td>
                  <td className="border border-black p-3">
                    <div className="font-medium">{item.event}</div>
                    <div className="text-xs text-gray-600">({item.location})</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PrintSchedulePage;