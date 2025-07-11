import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
    return <div>Loading incidents...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Incident Management</h1>
        {canCreate && (
          <Button onClick={handleCreateIncident}>
            <Plus className="h-4 w-4 mr-2" />
            Create Incident
          </Button>
        )}
      </div>

      <IncidentTable 
        incidents={incidents} 
        onIncidentSelect={handleIncidentSelect}
      />

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