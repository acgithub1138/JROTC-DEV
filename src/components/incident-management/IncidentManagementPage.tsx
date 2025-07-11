import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { StandardTableWrapper } from "@/components/ui/standard-table";
import { useIncidents } from "@/hooks/incidents/useIncidents";
import { useIncidentPermissions } from "@/hooks/useModuleSpecificPermissions";
import IncidentForm from "./IncidentForm";
import IncidentDetailDialog from "./IncidentDetailDialog";
import IncidentTable from "./IncidentTable";
import type { Incident } from "@/hooks/incidents/types";

const IncidentManagementPage: React.FC = () => {
  const { incidents, isLoading } = useIncidents();
  const { canCreate } = useIncidentPermissions();
  
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Filter incidents based on search
  const filteredIncidents = useMemo(() => {
    if (!searchValue.trim()) return incidents;
    
    const searchTerm = searchValue.toLowerCase();
    return incidents.filter(incident => 
      incident.title?.toLowerCase().includes(searchTerm) ||
      incident.description?.toLowerCase().includes(searchTerm) ||
      incident.incident_number?.toLowerCase().includes(searchTerm) ||
      incident.status?.toLowerCase().includes(searchTerm) ||
      incident.priority?.toLowerCase().includes(searchTerm)
    );
  }, [incidents, searchValue]);

  const handleIncidentSelect = (incident: Incident) => {
    setSelectedIncident(incident);
    setShowDetailDialog(true);
  };

  const handleEditIncident = (incident: Incident) => {
    setEditingIncident(incident);
    setShowDetailDialog(false);
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

  if (isLoading) {
    return <div className="p-6">Loading incidents...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <StandardTableWrapper
        title="Incident Management"
        description="Track and manage help requests from schools"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Search incidents..."
        actions={
          canCreate && (
            <Button onClick={handleCreateIncident}>
              <Plus className="h-4 w-4 mr-2" />
              Create Incident
            </Button>
          )
        }
      >
        <IncidentTable 
          incidents={filteredIncidents} 
          onIncidentSelect={handleIncidentSelect}
        />
      </StandardTableWrapper>

      {showCreateForm && (
        <IncidentForm
          isOpen={showCreateForm}
          onClose={handleCloseCreateForm}
        />
      )}

      {editingIncident && (
        <IncidentForm
          incident={editingIncident}
          isOpen={!!editingIncident}
          onClose={handleCloseEditForm}
        />
      )}

      {selectedIncident && (
        <IncidentDetailDialog
          incident={selectedIncident}
          isOpen={showDetailDialog}
          onClose={() => setShowDetailDialog(false)}
          onEdit={handleEditIncident}
        />
      )}
    </div>
  );
};

export default IncidentManagementPage;