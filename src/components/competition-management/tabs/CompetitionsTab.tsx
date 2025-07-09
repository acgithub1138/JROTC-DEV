import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, ArrowUpDown } from 'lucide-react';
import { BasicCompetitionTable } from '../components/BasicCompetitionTable';
import { CompetitionDialog } from '../components/CompetitionDialog';
import { AddEventDialog } from '../components/AddEventDialog';
import { ViewScoreSheetDialog } from '../components/ViewScoreSheetDialog';
import { useCompetitions } from '../hooks/useCompetitions';
import { useCompetitionEvents } from '../hooks/useCompetitionEvents';
import { useSortableTable } from '@/hooks/useSortableTable';
import type { Database } from '@/integrations/supabase/types';
import { formatCompetitionDateFull } from '@/utils/dateUtils';
type Competition = Database['public']['Tables']['competitions']['Row'];
interface CompetitionsTabProps {
  readOnly?: boolean;
}

export const CompetitionsTab = ({ readOnly = false }: CompetitionsTabProps) => {
  const navigate = useNavigate();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const {
    competitions,
    isLoading,
    createCompetition,
    updateCompetition,
    deleteCompetition
  } = useCompetitions();
  const {
    createEvent
  } = useCompetitionEvents(selectedCompetition?.id);

  // Filter competitions based on search term
  const filteredCompetitions = useMemo(() => {
    if (!searchTerm) return competitions;
    const searchLower = searchTerm.toLowerCase();
    return competitions.filter(comp => 
      comp.name.toLowerCase().includes(searchLower) || 
      comp.location?.toLowerCase().includes(searchLower) || 
      formatCompetitionDateFull(comp.competition_date).includes(searchLower)
    );
  }, [competitions, searchTerm]);

  // Add sorting functionality
  const {
    sortedData,
    sortConfig,
    handleSort
  } = useSortableTable({
    data: filteredCompetitions,
    defaultSort: {
      key: 'competition_date',
      direction: 'desc'
    }
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
    navigate(`/competitions/score-sheets/${competition.id}`);
  };
  const handleEventCreated = async (eventData: any) => {
    try {
      await createEvent(eventData);
      setShowAddEventDialog(false);
      setSelectedCompetition(null);
    } catch (error) {
      console.error('Failed to create event:', error);
      // Keep dialog open on error so user can retry
    }
  };
  return <div className="space-y-6">
      <div>
        
        
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Search competitions by name, date, or location..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Button variant="outline" onClick={() => handleSort('competition_date')} className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4" />
            Sort by Date {sortConfig?.key === 'competition_date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </Button>
        </div>
        {!readOnly && (
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Competition
          </Button>
        )}
      </div>

      <BasicCompetitionTable 
        competitions={sortedData} 
        isLoading={isLoading} 
        onEdit={readOnly ? undefined : setEditingCompetition} 
        onDelete={readOnly ? undefined : deleteCompetition} 
        onAddEvent={readOnly ? undefined : handleAddEvent} 
        onViewScoreSheets={handleViewScoreSheets} 
      />

      {!readOnly && (
        <>
          <CompetitionDialog open={showAddDialog || !!editingCompetition} onOpenChange={open => {
            if (!open) {
              setShowAddDialog(false);
              setEditingCompetition(null);
            }
          }} competition={editingCompetition as any} onSubmit={handleSubmit} />

          {selectedCompetition && <AddEventDialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog} competitionId={selectedCompetition.id} onEventCreated={handleEventCreated} />}
        </>
      )}
    </div>;
};