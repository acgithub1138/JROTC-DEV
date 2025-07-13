import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, X } from "lucide-react";
import { format } from "date-fns";
import type { Incident } from "@/hooks/incidents/types";
import { useIncidentPermissions } from "@/hooks/useModuleSpecificPermissions";
import { useAuth } from "@/contexts/AuthContext";

interface IncidentTableProps {
  incidents: Incident[];
  onIncidentSelect: (incident: Incident) => void;
  onIncidentEdit?: (incident: Incident) => void;
  onIncidentSelectForEdit?: (incident: Incident) => void;
  onIncidentDelete?: (incident: Incident) => void;
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
  onIncidentEdit,
  onIncidentSelectForEdit,
  onIncidentDelete
}) => {
  const { userProfile } = useAuth();
  const {
    canUpdate,
    canUpdateAssigned,
    canView,
    canDelete
  } = useIncidentPermissions();
  const canEdit = canUpdate || canUpdateAssigned;

  if (incidents.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">
        No incidents found.
      </div>;
  }

  return <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">Incident #</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidents.map(incident => <TableRow key={incident.id}>
              <TableCell className="text-center py-[8px]">
                <button 
                  onClick={() => onIncidentSelect(incident)} 
                  className="text-blue-600 hover:text-blue-800 hover:underline transition-colors font-bold"
                >
                  {incident.incident_number}
                </button>
              </TableCell>
              <TableCell>{incident.title}</TableCell>
              <TableCell>
                <Badge variant="secondary" className={getStatusBadgeClass(incident.status)}>
                  {incident.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={getPriorityBadgeClass(incident.priority)}>
                  {incident.priority}
                </Badge>
              </TableCell>
              <TableCell>
                {incident.assigned_to_admin 
                  ? (userProfile?.role === 'admin' 
                      ? ((incident as any).assigned_to_admin_profile 
                          ? `${(incident as any).assigned_to_admin_profile.last_name}, ${(incident as any).assigned_to_admin_profile.first_name}` 
                          : 'Admin')
                      : 'Admin')
                  : 'Unassigned'}
              </TableCell>
              <TableCell>
                {(incident as any).created_by_profile 
                  ? `${(incident as any).created_by_profile.last_name}, ${(incident as any).created_by_profile.first_name}` 
                  : (userProfile?.role === 'admin' ? 'Unknown' : 'User')}
              </TableCell>
              <TableCell>
                {format(new Date(incident.created_at), "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  {canView && <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onIncidentSelect(incident)}>
                      <Eye className="h-3 w-3" />
                    </Button>}
                  {canDelete && incident.status !== 'canceled' && <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-6 w-6 text-destructive hover:text-destructive" 
                      onClick={() => onIncidentDelete && onIncidentDelete(incident)}
                    >
                      <X className="h-3 w-3" />
                    </Button>}
                </div>
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </div>;
};

export default IncidentTable;