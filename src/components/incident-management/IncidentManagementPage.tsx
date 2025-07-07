import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { IncidentForm } from './IncidentForm';
import { IncidentTable } from './IncidentTable';
import { IncidentDetailDialog } from './IncidentDetailDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { TablePagination } from '@/components/ui/table-pagination';
import { useIncidents, Incident } from '@/hooks/incidents/useIncidents';
import { useAuth } from '@/contexts/AuthContext';
import { getPaginatedItems, getTotalPages } from '@/utils/pagination';

const IncidentManagementPage: React.FC = () => {
  const { incidents } = useIncidents();
  const { userProfile } = useAuth();
  const isMobile = useIsMobile();
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPageMyIncidents, setCurrentPageMyIncidents] = useState(1);
  const [currentPageAllIncidents, setCurrentPageAllIncidents] = useState(1);
  const [currentPageAssigned, setCurrentPageAssigned] = useState(1);
  const [currentPageResolved, setCurrentPageResolved] = useState(1);

  const isAdmin = userProfile?.role === 'admin';

  const handleIncidentSelect = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsDetailDialogOpen(true);
  };

  const handleEditIncident = (incident: Incident) => {
    setEditingIncident(incident);
  };

  const handleCreateIncident = () => {
    setShowCreateForm(true);
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
  };

  const handleCloseEditForm = () => {
    setEditingIncident(null);
  };

  // Filter incidents based on search term
  const filterIncidents = (incidentList: Incident[]) => {
    if (!searchTerm) return incidentList;
    
    return incidentList.filter(incident =>
      incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.incident_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.submitted_by_profile?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.submitted_by_profile?.last_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Filter incidents based on tab selection
  const myIncidents = filterIncidents(
    incidents.filter(incident => incident.submitted_by === userProfile?.id)
  );
  
  const allIncidents = filterIncidents(incidents);
  
  const assignedIncidents = filterIncidents(
    incidents.filter(incident => incident.assigned_to === userProfile?.id)
  );
  
  const resolvedIncidents = filterIncidents(
    incidents.filter(incident => incident.status === 'resolved' || incident.resolved_at)
  );

  // Pagination logic for each tab
  const myIncidentsPages = getTotalPages(myIncidents.length);
  const allIncidentsPages = getTotalPages(allIncidents.length);
  const assignedIncidentsPages = getTotalPages(assignedIncidents.length);
  const resolvedIncidentsPages = getTotalPages(resolvedIncidents.length);

  const paginatedMyIncidents = getPaginatedItems(myIncidents, currentPageMyIncidents);
  const paginatedAllIncidents = getPaginatedItems(allIncidents, currentPageAllIncidents);
  const paginatedAssignedIncidents = getPaginatedItems(assignedIncidents, currentPageAssigned);
  const paginatedResolvedIncidents = getPaginatedItems(resolvedIncidents, currentPageResolved);

  // Reset pagination when search changes
  React.useEffect(() => {
    setCurrentPageMyIncidents(1);
    setCurrentPageAllIncidents(1);
    setCurrentPageAssigned(1);
    setCurrentPageResolved(1);
  }, [searchTerm]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Incident Management</h1>
        <Button onClick={handleCreateIncident} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Report Incident
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search incidents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue={isAdmin ? "allincidents" : "myincidents"} className="w-full">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {!isAdmin && <TabsTrigger value="myincidents">My Incidents</TabsTrigger>}
          {isAdmin && <TabsTrigger value="allincidents">All Incidents</TabsTrigger>}
          {isAdmin && <TabsTrigger value="assigned">Assigned to Me</TabsTrigger>}
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        {!isAdmin && (
          <TabsContent value="myincidents" className="space-y-4">
            <IncidentTable 
              incidents={paginatedMyIncidents}
              onIncidentSelect={handleIncidentSelect}
              onEditIncident={handleEditIncident}
            />
            <TablePagination
              currentPage={currentPageMyIncidents}
              totalPages={myIncidentsPages}
              totalItems={myIncidents.length}
              onPageChange={setCurrentPageMyIncidents}
            />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="allincidents" className="space-y-4">
            <IncidentTable 
              incidents={paginatedAllIncidents}
              onIncidentSelect={handleIncidentSelect}
              onEditIncident={handleEditIncident}
            />
            <TablePagination
              currentPage={currentPageAllIncidents}
              totalPages={allIncidentsPages}
              totalItems={allIncidents.length}
              onPageChange={setCurrentPageAllIncidents}
            />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="assigned" className="space-y-4">
            <IncidentTable 
              incidents={paginatedAssignedIncidents}
              onIncidentSelect={handleIncidentSelect}
              onEditIncident={handleEditIncident}
            />
            <TablePagination
              currentPage={currentPageAssigned}
              totalPages={assignedIncidentsPages}
              totalItems={assignedIncidents.length}
              onPageChange={setCurrentPageAssigned}
            />
          </TabsContent>
        )}

        <TabsContent value="resolved" className="space-y-4">
          <IncidentTable 
            incidents={paginatedResolvedIncidents}
            onIncidentSelect={handleIncidentSelect}
            onEditIncident={handleEditIncident}
          />
          <TablePagination
            currentPage={currentPageResolved}
            totalPages={resolvedIncidentsPages}
            totalItems={resolvedIncidents.length}
            onPageChange={setCurrentPageResolved}
          />
        </TabsContent>
      </Tabs>

      {/* Create Incident Form */}
      <IncidentForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        mode="create"
      />

      {/* Edit Incident Form */}
      {editingIncident && (
        <IncidentForm
          open={!!editingIncident}
          onOpenChange={handleCloseEditForm}
          mode="edit"
          incident={editingIncident}
        />
      )}

      {/* Incident Detail Dialog */}
      {selectedIncident && (
        <IncidentDetailDialog
          incident={selectedIncident}
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          onEdit={handleEditIncident}
        />
      )}
    </div>
  );
};

export default IncidentManagementPage;