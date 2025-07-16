import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Power, PowerOff, Trash2, BarChart3 } from "lucide-react";
import type { EmailRule } from "@/hooks/email/useEmailRules";

interface BulkRuleActionsProps {
  rules: EmailRule[];
}

export const BulkRuleActions = ({ rules }: BulkRuleActionsProps) => {
  const [selectedRules, setSelectedRules] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleRuleSelection = (ruleId: string) => {
    const newSelection = new Set(selectedRules);
    if (newSelection.has(ruleId)) {
      newSelection.delete(ruleId);
    } else {
      newSelection.add(ruleId);
    }
    setSelectedRules(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedRules.size === rules.length) {
      setSelectedRules(new Set());
    } else {
      setSelectedRules(new Set(rules.map(rule => rule.id)));
    }
  };

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ruleIds, updates }: { ruleIds: string[], updates: any }) => {
      const { error } = await supabase
        .from("email_rules")
        .update(updates)
        .in("id", ruleIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-rules"] });
      setSelectedRules(new Set());
      toast({
        title: "Success",
        description: "Rules updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update rules: " + error.message,
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ruleIds: string[]) => {
      const { error } = await supabase
        .from("email_rules")
        .delete()
        .in("id", ruleIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-rules"] });
      setSelectedRules(new Set());
      toast({
        title: "Success",
        description: "Rules deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete rules: " + error.message,
        variant: "destructive",
      });
    },
  });

  const selectedRulesList = rules.filter(rule => selectedRules.has(rule.id));
  const activeSelected = selectedRulesList.filter(rule => rule.is_active).length;
  const inactiveSelected = selectedRulesList.filter(rule => !rule.is_active).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Bulk Rule Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selection Header */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedRules.size === rules.length && rules.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm font-medium">
              Select All ({selectedRules.size} of {rules.length} selected)
            </span>
          </div>
          {selectedRules.size > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {activeSelected} active
              </Badge>
              <Badge variant="outline">
                {inactiveSelected} inactive
              </Badge>
            </div>
          )}
        </div>

        {/* Rule Selection List */}
        <div className="max-h-60 overflow-y-auto space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
            >
              <Checkbox
                checked={selectedRules.has(rule.id)}
                onCheckedChange={() => toggleRuleSelection(rule.id)}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{rule.rule_type.replace('_', ' ')}</span>
                  <Badge variant={rule.is_active ? "default" : "secondary"}>
                    {rule.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {rule.trigger_event} event
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Bulk Actions */}
        {selectedRules.size > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkUpdateMutation.mutate({
                ruleIds: Array.from(selectedRules),
                updates: { is_active: true }
              })}
              disabled={bulkUpdateMutation.isPending || activeSelected === selectedRules.size}
              className="flex items-center gap-2"
            >
              <Power className="h-4 w-4" />
              Enable All
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkUpdateMutation.mutate({
                ruleIds: Array.from(selectedRules),
                updates: { is_active: false }
              })}
              disabled={bulkUpdateMutation.isPending || inactiveSelected === selectedRules.size}
              className="flex items-center gap-2"
            >
              <PowerOff className="h-4 w-4" />
              Disable All
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (confirm(`Are you sure you want to delete ${selectedRules.size} rule(s)? This action cannot be undone.`)) {
                  bulkDeleteMutation.mutate(Array.from(selectedRules));
                }
              }}
              disabled={bulkDeleteMutation.isPending}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};