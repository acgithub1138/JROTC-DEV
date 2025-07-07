import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, ArrowUpDown } from 'lucide-react';
import { BasicCompetitionTable } from '../components/BasicCompetitionTable';
import { CompetitionDialog } from '../components/CompetitionDialog';
import { AddEventDialog } from '../components/AddEventDialog';
import { ViewScoreSheetDialog } from '../components/ViewScoreSheetDialog';
import { useCompetitions } from '../hooks/useCompetitions';
import { useSortableTable } from '@/hooks/useSortableTable';
import type { Database } from '@/integrations/supabase/types';

type Competition = Database['public']['Tables']['competitions']['Row'];

export const CompetitionsTab = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [showViewScoreSheetDialog, setShowViewScoreSheetDialog] = useState(false);
  const [viewingCompetition, setViewingCompetition] = useState<Competition | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const {
    competitions,
    isLoading,
    createCompetition,
    updateCompetition,
    deleteCompetition
  } = useCompetitions();

  // Filter competitions based on search term
  const filteredCompetitions = useMemo(() => {
    if (!searchTerm) return competitions;
    
    const searchLower = searchTerm.toLowerCase();
    return competitions.filter(comp => 
      comp.name.toLowerCase().includes(searchLower) ||
      comp.location?.toLowerCase().includes(searchLower) ||
      new Date(comp.competition_date).toLocaleDateString().includes(searchLower)
    );
  }, [competitions, searchTerm]);

  // Add sorting functionality
  const { sortedData, sortConfig, handleSort } = useSortableTable({
    data: filteredCompetitions,
    defaultSort: { key: 'competition_date', direction: 'desc' }
  });

  const handleSubmit = async (data: any) => {
    if (editingCompetition) {
      await updateCompetition(editingCompetition.id, data);
      setEditingCompetition(null);
    } else {
      await createCompetition(data);
      setShowAddDialog(false);
    }
  };

  const handleAddEvent = (competition: Competition) => {
    setSelectedCompetition(competition);
    setShowAddEventDialog(true);
  };

  const handleViewScoreSheets = (competition: Competition) => {
    setViewingCompetition(competition);
    setShowViewScoreSheetDialog(true);
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

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search competitions by name, date, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => handleSort('competition_date')}
          className="flex items-center gap-2"
        >
          <ArrowUpDown className="w-4 h-4" />
          Sort by Date {sortConfig?.key === 'competition_date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
        </Button>
      </div>

      <BasicCompetitionTable
        competitions={sortedData}
        isLoading={isLoading}
        onEdit={setEditingCompetition}
        onDelete={deleteCompetition}
        onAddEvent={handleAddEvent}
        onViewScoreSheets={handleViewScoreSheets}
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

      {selectedCompetition && (
        <AddEventDialog
          open={showAddEventDialog}
          onOpenChange={setShowAddEventDialog}
          competitionId={selectedCompetition.id}
          onEventCreated={() => {
            setShowAddEventDialog(false);
            setSelectedCompetition(null);
          }}
        />
      )}

      <ViewScoreSheetDialog
        open={showViewScoreSheetDialog}
        onOpenChange={setShowViewScoreSheetDialog}
        competition={viewingCompetition}
      />
    </div>
  );
};