import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { JudgesTable } from './components/JudgesTable';
import { JudgeDialog } from './components/JudgeDialog';
import { useJudges } from '@/hooks/competition-portal/useJudges';
import { useTablePermissions } from '@/hooks/useTablePermissions';

export const JudgesPage: React.FC = () => {
  const { canCreate } = useTablePermissions('cp_judges');
  const { judges, isLoading, createJudge, updateJudge, deleteJudge } = useJudges();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingJudge, setEditingJudge] = useState<any>(null);

  const handleEdit = (judge: any) => {
    setEditingJudge(judge);
  };

  const handleDelete = async (id: string) => {
    await deleteJudge(id);
  };

  const handleSubmit = async (data: any) => {
    if (editingJudge) {
      await updateJudge({ id: editingJudge.id, ...data });
    } else {
      await createJudge(data);
    }
    setShowCreateDialog(false);
    setEditingJudge(null);
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setEditingJudge(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Judges</h1>
          <p className="text-muted-foreground mt-2">
            Manage judges for your competitions
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Judge
          </Button>
        )}
      </div>

      <JudgesTable
        judges={judges}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <JudgeDialog
        open={showCreateDialog || !!editingJudge}
        onOpenChange={handleCloseDialog}
        judge={editingJudge}
        onSubmit={handleSubmit}
      />
    </div>
  );
};