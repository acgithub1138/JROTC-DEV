import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { StandardTableWrapper } from "@/components/ui/standard-table";
import { useIncidents, useMyIncidents, useActiveIncidents, useCompletedIncidents } from "@/hooks/incidents/useIncidents";
import { useIncidentMutations } from "@/hooks/incidents/useIncidentMutations";
import { useIncidentPermissions } from "@/hooks/useModuleSpecificPermissions";
import { useAuth } from "@/contexts/AuthContext";
import IncidentForm from "./IncidentForm";
import IncidentDetailDialog from "./IncidentDetailDialog";
import ViewIncidentDialog from "./components/ViewIncidentDialog";
import { AccessDeniedDialog } from "./AccessDeniedDialog";
import IncidentTable from "./IncidentTable";
import { BulkEditToolbar } from "./BulkEditToolbar";
import type { Incident } from "@/hooks/incidents/types";

const IncidentManagementPage: React.FC = () => {
  const { userProfile } = useAuth();
  const { canCreate, canUpdate, canUpdateAssigned, canDelete } = useIncidentPermissions();
  const isAdmin = userProfile?.role === 'admin';
  
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [activeTab, setActiveTab] = useState("my-incidents");
  const [selectedIncidents, setSelectedIncidents] = useState<string[]>([]);

  // Different queries for different tabs
  const { incidents: myIncidents, isLoading: myIncidentsLoading } = useMyIncidents();
  const { incidents: activeIncidents, isLoading: activeIncidentsLoading } = useActiveIncidents();
  const { incidents: completedIncidents, isLoading: completedIncidentsLoading } = useCompletedIncidents();
  
  const { updateIncident } = useIncidentMutations();

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
    // Check if user has update permissions
    if (canUpdate || canUpdateAssigned) {
      setSelectedIncident(incident);
      setShowEditDialog(true);
    } else {
      setShowAccessDenied(true);
    }
  };

  const handleIncidentView = (incident: Incident) => {
    // View mode - always accessible if user has view permissions
    setSelectedIncident(incident);
    setShowViewDialog(true);
  };

  const handleCreateIncident = () => {
    setShowCreateForm(true);
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
  };

  const handleDeleteIncident = (incident: Incident) => {
    if (canDelete) {
      updateIncident.mutate({
        id: incident.id,
        data: {
          status: 'canceled',
          completed_at: new Date().toISOString()
        }
      });
    }
  };

  const handleIncidentToggle = (incidentId: string) => {
    setSelectedIncidents(prev => 
      prev.includes(incidentId)
        ? prev.filter(id => id !== incidentId)
        : [...prev, incidentId]
    );
  };

  const handleClearSelection = () => {
    setSelectedIncidents([]);
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
              {isAdmin && (
                <BulkEditToolbar
                  selectedIncidents={selectedIncidents}
                  onClearSelection={handleClearSelection}
                />
              )}
              {myIncidentsLoading ? (
                <div>Loading incidents...</div>
              ) : (
                <IncidentTable 
                  incidents={filteredIncidents} 
                  onIncidentSelect={handleIncidentSelect}
                  onIncidentView={handleIncidentView}
                  onIncidentDelete={handleDeleteIncident}
                  selectedIncidents={selectedIncidents}
                  onIncidentToggle={handleIncidentToggle}
                  showBulkSelect={isAdmin}
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
              {isAdmin && (
                <BulkEditToolbar
                  selectedIncidents={selectedIncidents}
                  onClearSelection={handleClearSelection}
                />
              )}
              {activeIncidentsLoading ? (
                <div>Loading incidents...</div>
              ) : (
                <IncidentTable 
                  incidents={filteredIncidents} 
                  onIncidentSelect={handleIncidentSelect}
                  onIncidentView={handleIncidentView}
                  onIncidentDelete={handleDeleteIncident}
                  selectedIncidents={selectedIncidents}
                  onIncidentToggle={handleIncidentToggle}
                  showBulkSelect={isAdmin}
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
              {isAdmin && (
                <BulkEditToolbar
                  selectedIncidents={selectedIncidents}
                  onClearSelection={handleClearSelection}
                />
              )}
              {completedIncidentsLoading ? (
                <div>Loading incidents...</div>
              ) : (
                <IncidentTable 
                  incidents={filteredIncidents} 
                  onIncidentSelect={handleIncidentSelect}
                  onIncidentView={handleIncidentView}
                  onIncidentDelete={handleDeleteIncident}
                  selectedIncidents={selectedIncidents}
                  onIncidentToggle={handleIncidentToggle}
                  showBulkSelect={isAdmin}
                />
              )}
            </StandardTableWrapper>
          </TabsContent>
        </Tabs>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-incidents">Open Incidents</TabsTrigger>
            <TabsTrigger value="completed-incidents">Completed Incidents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-incidents" className="space-y-4">
            <StandardTableWrapper
              title="Open Incidents"
              description="Your open and active incidents"
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              searchPlaceholder="Search open incidents..."
            >
              {myIncidentsLoading ? (
                <div>Loading incidents...</div>
              ) : (
                <IncidentTable 
                  incidents={filteredIncidents} 
                  onIncidentSelect={handleIncidentSelect}
                  onIncidentView={handleIncidentView}
                  onIncidentDelete={handleDeleteIncident}
                />
              )}
            </StandardTableWrapper>
          </TabsContent>
          
          <TabsContent value="completed-incidents" className="space-y-4">
            <StandardTableWrapper
              title="Completed Incidents"
              description="Your resolved and closed incidents"
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
                  onIncidentView={handleIncidentView}
                  onIncidentDelete={handleDeleteIncident}
                />
              )}
            </StandardTableWrapper>
          </TabsContent>
        </Tabs>
      )}

      {showCreateForm && (
        <IncidentForm
          isOpen={showCreateForm}
          onClose={handleCloseCreateForm}
        />
      )}

      {selectedIncident && showEditDialog && (
        <IncidentDetailDialog
          incident={selectedIncident}
          isOpen={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedIncident(null);
          }}
          onEdit={() => {}} // Not needed since the dialog handles updates internally
        />
      )}

      {selectedIncident && showViewDialog && (
        <ViewIncidentDialog
          incident={selectedIncident}
          isOpen={showViewDialog}
          onClose={() => {
            setShowViewDialog(false);
            setSelectedIncident(null);
          }}
          onEdit={(incident) => {
            setSelectedIncident(incident);
            setShowEditDialog(true);
            setShowViewDialog(false);
          }}
        />
      )}

      <AccessDeniedDialog
        isOpen={showAccessDenied}
        onClose={() => setShowAccessDenied(false)}
        message="You do not have permission to edit incidents."
      />
    </div>
  );
};

export default IncidentManagementPage;