import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, X } from "lucide-react";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useIncidentMutations } from "@/hooks/incidents/useIncidentMutations";
import { useToast } from "@/hooks/use-toast";

interface BulkEditToolbarProps {
  selectedIncidents: string[];
  onClearSelection: () => void;
}

export const BulkEditToolbar: React.FC<BulkEditToolbarProps> = ({
  selectedIncidents,
  onClearSelection,
}) => {
  const [selectedAdminId, setSelectedAdminId] = useState<string>("");
  const { data: adminUsers = [], isLoading: isLoadingAdmins } = useAdminUsers();
  const { updateIncident } = useIncidentMutations();
  const { toast } = useToast();

  const handleBulkAssign = async () => {
    if (!selectedAdminId) {
      toast({
        title: "Error",
        description: "Please select an admin to assign incidents to",
        variant: "destructive",
      });
      return;
    }

    try {
      const assignedAdminId = selectedAdminId === "unassign" ? null : selectedAdminId;
      
      // Update incidents one by one
      const updatePromises = selectedIncidents.map(incidentId =>
        updateIncident.mutateAsync({
          id: incidentId,
          data: { assigned_to_admin: assignedAdminId }
        })
      );

      await Promise.all(updatePromises);

      toast({
        title: "Success",
        description: `Successfully updated ${selectedIncidents.length} incident${selectedIncidents.length > 1 ? 's' : ''}`,
      });

      onClearSelection();
      setSelectedAdminId("");
    } catch (error) {
      console.error("Error updating incidents:", error);
      toast({
        title: "Error",
        description: "Failed to update incidents",
        variant: "destructive",
      });
    }
  };

  if (selectedIncidents.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between p-4 bg-muted/50 border rounded-lg mb-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        <span className="text-sm font-medium">
          {selectedIncidents.length} incident{selectedIncidents.length > 1 ? 's' : ''} selected
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Select value={selectedAdminId} onValueChange={setSelectedAdminId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Assign to admin..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassign">Unassign</SelectItem>
            {adminUsers.map((admin) => (
              <SelectItem key={admin.id} value={admin.id}>
                {admin.last_name}, {admin.first_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          onClick={handleBulkAssign}
          disabled={!selectedAdminId || updateIncident.isPending}
          size="sm"
        >
          {updateIncident.isPending ? "Updating..." : "Apply"}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};