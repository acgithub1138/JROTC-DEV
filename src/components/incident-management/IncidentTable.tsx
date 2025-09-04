import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, X } from "lucide-react";
import { format } from "date-fns";
import type { Incident } from "@/hooks/incidents/types";
import { useIncidentPermissions } from "@/hooks/useModuleSpecificPermissions";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface IncidentTableProps {
  incidents: Incident[];
  onIncidentSelect: (incident: Incident) => void;
  onIncidentView?: (incident: Incident) => void;
  onIncidentEdit?: (incident: Incident) => void;
  onIncidentSelectForEdit?: (incident: Incident) => void;
  onIncidentDelete?: (incident: Incident) => void;
  selectedIncidents?: string[];
  onIncidentToggle?: (incidentId: string) => void;
  showBulkSelect?: boolean;
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
  onIncidentView,
  onIncidentEdit,
  onIncidentSelectForEdit,
  onIncidentDelete,
  selectedIncidents = [],
  onIncidentToggle,
  showBulkSelect = false
}) => {
  const { userProfile } = useAuth();
  const isMobile = useIsMobile();
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

  // Mobile card view
  if (isMobile) {
    return (
      <div className="space-y-4">
        {incidents.map(incident => (
          <Card key={incident.id} className="w-full">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {showBulkSelect && (
                    <Checkbox
                      checked={selectedIncidents.includes(incident.id)}
                      onCheckedChange={() => onIncidentToggle?.(incident.id)}
                    />
                  )}
                  <CardTitle className="text-lg">
                  {canView ? (
                    <button 
                      onClick={() => onIncidentView ? onIncidentView(incident) : onIncidentSelect(incident)} 
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      {incident.incident_number}
                    </button>
                  ) : (
                    <span>{incident.incident_number}</span>
                  )}
                  </CardTitle>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary" className={getStatusBadgeClass(incident.status)}>
                    {incident.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant="secondary" className={getPriorityBadgeClass(incident.priority)}>
                    {incident.priority}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium">{incident.title}</h4>
              </div>
              
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Created By:</span>
                  <p className="font-medium">
                    {(incident as any).created_by_profile 
                      ? `${(incident as any).created_by_profile.last_name}, ${(incident as any).created_by_profile.first_name}` 
                      : (userProfile?.role === 'admin' ? 'Unknown' : 'User')}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Created: {format(new Date(incident.created_at), "MMM d, yyyy")}
                </span>
                {canDelete && incident.status !== 'canceled' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive" 
                          onClick={() => onIncidentDelete && onIncidentDelete(incident)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Cancel Incident</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop table view
  return <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {showBulkSelect && (
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIncidents.length === incidents.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      incidents.forEach(incident => 
                        !selectedIncidents.includes(incident.id) && onIncidentToggle?.(incident.id)
                      );
                    } else {
                      selectedIncidents.forEach(id => onIncidentToggle?.(id));
                    }
                  }}
                />
              </TableHead>
            )}
            <TableHead className="text-center">Incident #</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidents.map(incident => <TableRow key={incident.id}>
              {showBulkSelect && (
                <TableCell>
                  <Checkbox
                    checked={selectedIncidents.includes(incident.id)}
                    onCheckedChange={() => onIncidentToggle?.(incident.id)}
                  />
                </TableCell>
              )}
              <TableCell className="text-center py-[8px]">
                {canView ? (
                  <button 
                    onClick={() => onIncidentView ? onIncidentView(incident) : onIncidentSelect(incident)} 
                    className="text-blue-600 hover:text-blue-800 hover:underline transition-colors font-bold"
                  >
                    {incident.incident_number}
                  </button>
                ) : (
                  <span className="font-bold">{incident.incident_number}</span>
                )}
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
                {(incident as any).created_by_profile 
                  ? `${(incident as any).created_by_profile.last_name}, ${(incident as any).created_by_profile.first_name}` 
                  : (userProfile?.role === 'admin' ? 'Unknown' : 'User')}
              </TableCell>
              <TableCell>
                {format(new Date(incident.created_at), "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  <TooltipProvider>
                    {canDelete && incident.status !== 'canceled' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6 text-destructive hover:text-destructive" 
                            onClick={() => onIncidentDelete && onIncidentDelete(incident)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Cancel Incident</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </div>;
};

export default IncidentTable;