import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TableActionButtons } from '@/components/ui/table-action-buttons';
import { useModulePermissions } from '@/hooks/usePermissions';
import { X } from 'lucide-react';
import { Incident } from '@/hooks/incidents/useIncidents';
import { useAuth } from '@/contexts/AuthContext';

interface IncidentTableProps {
  incidents: Incident[];
  onIncidentSelect: (incident: Incident) => void;
  onEditIncident: (incident: Incident) => void;
  onCancelIncident: (incident: Incident) => void;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'technical': return 'bg-blue-100 text-blue-800';
    case 'behavioral': return 'bg-purple-100 text-purple-800';
    case 'safety': return 'bg-red-100 text-red-800';
    case 'other': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const IncidentTable: React.FC<IncidentTableProps> = ({ 
  incidents, 
  onIncidentSelect, 
  onEditIncident,
  onCancelIncident
}) => {
  const { userProfile } = useAuth();
  const { canUpdate, canDelete, canViewDetails } = useModulePermissions('incidents');
  const isAdmin = userProfile?.role === 'admin';
  const isInstructor = userProfile?.role === 'instructor';

  const canEditIncident = (incident: Incident) => {
    return isAdmin || incident.submitted_by === userProfile?.id;
  };

  const canCancelIncident = (incident: Incident) => {
    return (isInstructor || isAdmin) && incident.status !== 'cancelled' && incident.status !== 'resolved';
  };

  return (
    <div className="bg-card rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Incident #</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted By</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidents.map((incident) => (
            <TableRow key={incident.id}>
              <TableCell className="font-medium">
                <button
                  onClick={() => canUpdate && canEditIncident(incident) ? onEditIncident(incident) : onIncidentSelect(incident)}
                  className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  {incident.incident_number || 'N/A'}
                </button>
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {incident.title}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={getCategoryColor(incident.category)}>
                  {incident.category.charAt(0).toUpperCase() + incident.category.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {incident.priority.charAt(0).toUpperCase() + incident.priority.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {incident.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </Badge>
              </TableCell>
              <TableCell>
                {incident.submitted_by_profile 
                  ? `${incident.submitted_by_profile.first_name} ${incident.submitted_by_profile.last_name}`
                  : 'Unknown'
                }
              </TableCell>
              <TableCell>
                {incident.assigned_to_profile 
                  ? `${incident.assigned_to_profile.first_name} ${incident.assigned_to_profile.last_name}`
                  : 'Unassigned'
                }
              </TableCell>
              <TableCell>
                {new Date(incident.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <TableActionButtons
                  canView={canViewDetails}
                  canEdit={canUpdate && canEditIncident(incident)}
                  canDelete={canDelete}
                  onView={() => onIncidentSelect(incident)}
                  onEdit={() => onEditIncident(incident)}
                  customActions={[
                    {
                      icon: <X className="w-4 h-4" />,
                      label: "Cancel incident",
                      onClick: () => onCancelIncident(incident),
                      show: canUpdate && canCancelIncident(incident),
                      className: "text-orange-600 hover:text-orange-700"
                    }
                  ]}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {incidents.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No incidents found matching your criteria.
        </div>
      )}
    </div>
  );
};