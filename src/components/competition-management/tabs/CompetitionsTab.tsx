import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, ArrowUpDown } from 'lucide-react';
import { ColumnSelector } from '@/components/ui/column-selector';
import { BasicCompetitionTable } from '../components/BasicCompetitionTable';
import { CompetitionDialog } from '../components/CompetitionDialog';
import { AddEventDialog } from '../components/AddEventDialog';
import { ViewScoreSheetDialog } from '../components/ViewScoreSheetDialog';
import { useCompetitions } from '../hooks/useCompetitions';
import { useCompetitionEvents } from '../hooks/useCompetitionEvents';
import { useSortableTable } from '@/hooks/useSortableTable';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { useCompetitionPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import type { Database } from '@/integrations/supabase/types';
import { formatCompetitionDateFull } from '@/utils/dateUtils';
type Competition = Database['public']['Tables']['competitions']['Row'];
interface CompetitionsTabProps {
  readOnly?: boolean;
}

const defaultColumns = [
  { key: 'name', label: 'Name', enabled: true },
  { key: 'date', label: 'Date', enabled: true },
  { key: 'overall_placement', label: 'Overall Placement', enabled: true },
  { key: 'overall_armed_placement', label: 'Overall Armed', enabled: true },
  { key: 'overall_unarmed_placement', label: 'Overall Unarmed', enabled: true },
  { key: 'armed_regulation', label: 'Armed Regulation', enabled: false },
  { key: 'armed_exhibition', label: 'Armed Exhibition', enabled: false },
  { key: 'armed_color_guard', label: 'Armed Color Guard', enabled: false },
  { key: 'armed_inspection', label: 'Armed Inspection', enabled: false },
  { key: 'unarmed_regulation', label: 'Unarmed Regulation', enabled: false },
  { key: 'unarmed_exhibition', label: 'Unarmed Exhibition', enabled: false },
  { key: 'unarmed_color_guard', label: 'Unarmed Color Guard', enabled: false },
  { key: 'unarmed_inspection', label: 'Unarmed Inspection', enabled: false },
];

export const CompetitionsTab = ({ readOnly = false }: CompetitionsTabProps) => {
  const navigate = useNavigate();
  const { canCreate, canUpdate, canDelete } = useCompetitionPermissions();
  const { canViewDetails } = useTablePermissions('competitions');
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
  
  const {
    columns,
    enabledColumns,
    visibleColumns,
    toggleColumn,
    isLoading: columnsLoading
  } = useColumnPreferences('competitions', defaultColumns);

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
    navigate(`/app/competitions/score-sheets/${competition.id}`);
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
        <div className="flex items-center gap-2">
          <ColumnSelector 
            columns={columns}
            onToggleColumn={toggleColumn}
            isLoading={columnsLoading}
          />
          {!readOnly && canCreate && (
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Competition
            </Button>
          )}
        </div>
      </div>

      <BasicCompetitionTable 
        competitions={sortedData} 
        isLoading={isLoading} 
        onEdit={readOnly || !canUpdate ? undefined : setEditingCompetition} 
        onDelete={readOnly || !canDelete ? undefined : deleteCompetition} 
        onAddEvent={readOnly || !canCreate ? undefined : handleAddEvent}
        onViewScoreSheets={canViewDetails ? handleViewScoreSheets : undefined}
        visibleColumns={visibleColumns}
        canViewDetails={canViewDetails}
      />

      {!readOnly && canCreate && (
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