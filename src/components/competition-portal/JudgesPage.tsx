import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search } from 'lucide-react';
import { JudgesTable } from './components/JudgesTable';
import { JudgeDialog } from './components/JudgeDialog';
import { useJudges } from '@/hooks/competition-portal/useJudges';
import { useTablePermissions } from '@/hooks/useTablePermissions';
export const JudgesPage: React.FC = () => {
  const {
    canCreate
  } = useTablePermissions('cp_judges');
  const {
    judges,
    isLoading,
    createJudge,
    updateJudge,
    deleteJudge
  } = useJudges();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingJudge, setEditingJudge] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const handleEdit = (judge: any) => {
    setEditingJudge(judge);
  };
  const handleDelete = async (id: string) => {
    await deleteJudge(id);
  };
  const handleSubmit = async (data: any) => {
    if (editingJudge) {
      await updateJudge({
        id: editingJudge.id,
        ...data
      });
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

  // Filter judges based on search term
  const filteredJudges = judges.filter(judge => judge.name.toLowerCase().includes(searchTerm.toLowerCase()) || judge.email && judge.email.toLowerCase().includes(searchTerm.toLowerCase()) || judge.phone && judge.phone.includes(searchTerm));
  if (isLoading) {
    return <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading judges...</div>
        </div>
      </div>;
  }
  return <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Judges</h1>
          <p className="text-muted-foreground">Manage judges for your competitions</p>
        </div>
        {canCreate && <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Judge
          </Button>}
      </div>

      {/* Search Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search judges..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Judges Table */}
      {filteredJudges.length === 0 ? <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              {judges.length === 0 ? 'No judges found.' : 'No judges match your search criteria.'}
            </div>
          </CardContent>
        </Card> : <Card>
          <CardContent className="py-[8px]">
            <JudgesTable judges={filteredJudges} isLoading={isLoading} onEdit={handleEdit} onDelete={handleDelete} />
          </CardContent>
        </Card>}

      <JudgeDialog open={showCreateDialog || !!editingJudge} onOpenChange={handleCloseDialog} judge={editingJudge} onSubmit={handleSubmit} />
    </div>;
};