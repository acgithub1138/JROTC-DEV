import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { StandardTableWrapper } from "@/components/ui/standard-table";
import { useIncidents, useMyIncidents, useActiveIncidents, useCompletedIncidents } from "@/hooks/incidents/useIncidents";
import { useIncidentPermissions } from "@/hooks/useModuleSpecificPermissions";
import { useAuth } from "@/contexts/AuthContext";
import IncidentForm from "./IncidentForm";
import IncidentDetailDialog from "./IncidentDetailDialog";
import IncidentTable from "./IncidentTable";
import type { Incident } from "@/hooks/incidents/types";

const IncidentManagementPage: React.FC = () => {
  const { userProfile } = useAuth();
  const { canCreate } = useIncidentPermissions();
  const isAdmin = userProfile?.role === 'admin';
  
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isDetailDialogInEditMode, setIsDetailDialogInEditMode] = useState(false);
  const [isDetailDialogReadOnly, setIsDetailDialogReadOnly] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [activeTab, setActiveTab] = useState("my-incidents");

  // Different queries for different tabs
  const { incidents: myIncidents, isLoading: myIncidentsLoading } = useMyIncidents();
  const { incidents: activeIncidents, isLoading: activeIncidentsLoading } = useActiveIncidents();
  const { incidents: completedIncidents, isLoading: completedIncidentsLoading } = useCompletedIncidents();

  // Get current incidents based on active tab
  const getCurrentIncidents = () => {
    switch (activeTab) {
      case "my-incidents":
        return myIncidents;
      case "all-incidents":
        return activeIncidents;
      case "completed-incidents":
        return completedIncidents;
      default:
        return myIncidents;
    }
  };

  const getCurrentLoading = () => {
    switch (activeTab) {
      case "my-incidents":
        return myIncidentsLoading;
      case "all-incidents":
        return activeIncidentsLoading;
      case "completed-incidents":
        return completedIncidentsLoading;
      default:
        return myIncidentsLoading;
    }
  };

  const currentIncidents = getCurrentIncidents();
  const isLoading = getCurrentLoading();

  // Filter incidents based on search
  const filteredIncidents = useMemo(() => {
    if (!searchValue.trim()) return currentIncidents;
    
    const searchTerm = searchValue.toLowerCase();
    return currentIncidents.filter(incident => 
      incident.title?.toLowerCase().includes(searchTerm) ||
      incident.description?.toLowerCase().includes(searchTerm) ||
      incident.incident_number?.toLowerCase().includes(searchTerm) ||
      incident.status?.toLowerCase().includes(searchTerm) ||
      incident.priority?.toLowerCase().includes(searchTerm)
    );
  }, [currentIncidents, searchValue]);

  const handleIncidentSelect = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsDetailDialogInEditMode(false);
    setIsDetailDialogReadOnly(true);
    setShowDetailDialog(true);
  };

  const handleIncidentSelectForEdit = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsDetailDialogInEditMode(true);
    setIsDetailDialogReadOnly(false);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Incident Management</h1>
          <p className="text-muted-foreground">Track and manage help requests from schools</p>
        </div>
        {canCreate && (
          <Button onClick={handleCreateIncident}>
            <Plus className="h-4 w-4 mr-2" />
            Create Incident
          </Button>
        )}
      </div>

      {isAdmin ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my-incidents">My Incidents</TabsTrigger>
            <TabsTrigger value="all-incidents">All Incidents</TabsTrigger>
            <TabsTrigger value="completed-incidents">Completed Incidents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-incidents" className="space-y-4">
            <StandardTableWrapper
              title="My Incidents"
              description="Incidents assigned to you"
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              searchPlaceholder="Search my incidents..."
            >
              {myIncidentsLoading ? (
                <div>Loading incidents...</div>
              ) : (
                <IncidentTable 
                  incidents={filteredIncidents} 
                  onIncidentSelect={handleIncidentSelect}
                  onIncidentEdit={handleEditIncident}
                  onIncidentSelectForEdit={handleIncidentSelectForEdit}
                />
              )}
            </StandardTableWrapper>
          </TabsContent>
          
          <TabsContent value="all-incidents" className="space-y-4">
            <StandardTableWrapper
              title="All Active Incidents"
              description="All open and in-progress incidents"
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              searchPlaceholder="Search all incidents..."
            >
              {activeIncidentsLoading ? (
                <div>Loading incidents...</div>
              ) : (
                <IncidentTable 
                  incidents={filteredIncidents} 
                  onIncidentSelect={handleIncidentSelect}
                  onIncidentEdit={handleEditIncident}
                  onIncidentSelectForEdit={handleIncidentSelectForEdit}
                />
              )}
            </StandardTableWrapper>
          </TabsContent>
          
          <TabsContent value="completed-incidents" className="space-y-4">
            <StandardTableWrapper
              title="Completed Incidents"
              description="All resolved and closed incidents"
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              searchPlaceholder="Search completed incidents..."
            >
              {completedIncidentsLoading ? (
                <div>Loading incidents...</div>
              ) : (
                <IncidentTable 
                  incidents={filteredIncidents} 
                  onIncidentSelect={handleIncidentSelect}
                  onIncidentEdit={handleEditIncident}
                  onIncidentSelectForEdit={handleIncidentSelectForEdit}
                />
              )}
            </StandardTableWrapper>
          </TabsContent>
        </Tabs>
      ) : (
        <StandardTableWrapper
          title="Incidents"
          description="Your incidents and help requests"
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Search incidents..."
        >
          {myIncidentsLoading ? (
            <div>Loading incidents...</div>
          ) : (
            <IncidentTable 
              incidents={filteredIncidents} 
              onIncidentSelect={handleIncidentSelect}
              onIncidentEdit={handleEditIncident}
              onIncidentSelectForEdit={handleIncidentSelectForEdit}
            />
          )}
        </StandardTableWrapper>
      )}

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
          onClose={() => {
            setShowDetailDialog(false);
            setIsDetailDialogInEditMode(false);
            setIsDetailDialogReadOnly(false);
          }}
          onEdit={handleEditIncident}
          initialEditMode={isDetailDialogInEditMode}
          isReadOnly={isDetailDialogReadOnly}
        />
      )}
    </div>
  );
};

export default IncidentManagementPage;