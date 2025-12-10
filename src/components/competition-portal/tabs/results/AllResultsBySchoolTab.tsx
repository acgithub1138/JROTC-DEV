import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface JudgeScore {
  judgeNumber?: number;
  score: number;
}

interface SchoolAgg {
  schoolId: string;
  schoolName: string;
  judges: JudgeScore[];
  total: number;
}

interface EventGroup {
  event: string;
  eventId: string;
  schools: SchoolAgg[];
  judgeNumbers: number[];
}

interface AllResultsBySchoolTabProps {
  grouped: Map<string, EventGroup>;
  schoolMap: Record<string, string>;
}

interface SchoolEventResult {
  eventName: string;
  eventId: string;
  judges: JudgeScore[];
  total: number;
  placement: number;
}

export const AllResultsBySchoolTab: React.FC<AllResultsBySchoolTabProps> = ({ grouped, schoolMap }) => {
  // Reorganize data by school
  const schoolResults = React.useMemo(() => {
    const results: Record<string, {
      schoolId: string;
      schoolName: string;
      events: SchoolEventResult[];
      grandTotal: number;
    }> = {};

    grouped.forEach((eventData, eventName) => {
      // Calculate placements for this event
      const sortedSchools = [...eventData.schools].sort((a, b) => b.total - a.total);
      const placementMap: Record<string, number> = {};
      sortedSchools.forEach((school, idx) => {
        placementMap[school.schoolId] = idx + 1;
      });

      eventData.schools.forEach((school) => {
        if (!results[school.schoolId]) {
          results[school.schoolId] = {
            schoolId: school.schoolId,
            schoolName: school.schoolName,
            events: [],
            grandTotal: 0,
          };
        }
        results[school.schoolId].events.push({
          eventName,
          eventId: eventData.eventId,
          judges: school.judges,
          total: school.total,
          placement: placementMap[school.schoolId],
        });
        results[school.schoolId].grandTotal += school.total;
      });
    });

    // Sort events within each school alphabetically
    Object.values(results).forEach((school) => {
      school.events.sort((a, b) => a.eventName.localeCompare(b.eventName));
    });

    // Sort schools by name
    return Object.values(results).sort((a, b) => a.schoolName.localeCompare(b.schoolName));
  }, [grouped]);

  if (schoolResults.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">No results to display.</div>;
  }

  return (
    <div className="space-y-6">
      {schoolResults.map((school) => (
        <Card key={school.schoolId}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>{school.schoolName}</span>
              <span className="text-lg font-semibold text-primary">
                Total: {school.grandTotal.toLocaleString()} pts
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead className="text-center">Judges</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Place</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {school.events.map((event) => (
                  <TableRow key={event.eventId}>
                    <TableCell className="font-medium">{event.eventName}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2 flex-wrap">
                        {event.judges
                          .sort((a, b) => (a.judgeNumber ?? 9999) - (b.judgeNumber ?? 9999))
                          .map((j, idx) => (
                            <span key={idx} className="text-xs bg-muted px-2 py-1 rounded">
                              {j.judgeNumber !== undefined ? `J${j.judgeNumber}: ` : ""}
                              {j.score}
                            </span>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{event.total}</TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        event.placement === 1 ? "bg-yellow-500 text-yellow-950" :
                        event.placement === 2 ? "bg-gray-300 text-gray-800" :
                        event.placement === 3 ? "bg-amber-600 text-amber-50" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {event.placement}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
