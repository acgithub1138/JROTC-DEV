import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BasicCompetitionTable } from '../components/BasicCompetitionTable';
import { CompetitionDialog } from '../components/CompetitionDialog';
import { useCompetitions } from '../hooks/useCompetitions';
import type { Database } from '@/integrations/supabase/types';

type Competition = Database['public']['Tables']['competitions']['Row'];

export const CompetitionsTab = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  
  const {
    competitions,
    isLoading,
    createCompetition,
    updateCompetition,
    deleteCompetition
  } = useCompetitions();

  const handleSubmit = async (data: any) => {
    if (editingCompetition) {
      await updateCompetition(editingCompetition.id, data);
      setEditingCompetition(null);
    } else {
      await createCompetition(data);
      setShowAddDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Competitions</h2>
          <p className="text-muted-foreground">
            Manage your competition entries and results
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Competition
        </Button>
      </div>

      <BasicCompetitionTable
        competitions={competitions}
        isLoading={isLoading}
        onEdit={setEditingCompetition}
        onDelete={deleteCompetition}
      />

      <CompetitionDialog
        open={showAddDialog || !!editingCompetition}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingCompetition(null);
          }
        }}
        competition={editingCompetition as any}
        onSubmit={handleSubmit}
      />
    </div>
  );
};