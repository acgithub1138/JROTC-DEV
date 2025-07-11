import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { Incident } from "@/hooks/incidents/types";

interface IncidentTableProps {
  incidents: Incident[];
  onIncidentSelect: (incident: Incident) => void;
}

const getStatusBadgeClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case 'resolved':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'closed':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const getPriorityBadgeClass = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'low':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
    case 'critical':
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const IncidentTable: React.FC<IncidentTableProps> = ({
  incidents,
  onIncidentSelect,
}) => {
  if (incidents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No incidents found.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">Incident #</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>School</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidents.map((incident) => (
            <TableRow key={incident.id}>
              <TableCell className="text-center">
                <button
                  onClick={() => onIncidentSelect(incident)}
                  className="text-blue-600 hover:text-blue-800 hover:underline transition-colors font-bold"
                >
                  {incident.incident_number}
                </button>
              </TableCell>
              <TableCell>{incident.title}</TableCell>
              <TableCell>
                <Badge 
                  variant="secondary" 
                  className={getStatusBadgeClass(incident.status)}
                >
                  {incident.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge 
                  variant="secondary" 
                  className={getPriorityBadgeClass(incident.priority)}
                >
                  {incident.priority}
                </Badge>
              </TableCell>
              <TableCell>
                {(incident as any).school?.name || 'Unknown'}
              </TableCell>
              <TableCell>
                {format(new Date(incident.created_at), "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onIncidentSelect(incident)}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default IncidentTable;