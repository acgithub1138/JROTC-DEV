import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Eye } from 'lucide-react';
import { Incident } from '@/hooks/incidents/useIncidents';
import { useAuth } from '@/contexts/AuthContext';

interface IncidentTableProps {
  incidents: Incident[];
  onIncidentSelect: (incident: Incident) => void;
  onEditIncident: (incident: Incident) => void;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

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
  onEditIncident 
}) => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';

  const canEditIncident = (incident: Incident) => {
    return isAdmin || incident.submitted_by === userProfile?.id;
  };

  return (
    <div className="bg-card rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Incident #</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Severity</TableHead>
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
                {incident.incident_number || 'N/A'}
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
                <Badge variant="secondary" className={getSeverityColor(incident.severity)}>
                  {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
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
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onIncidentSelect(incident)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {canEditIncident(incident) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditIncident(incident)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </div>
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