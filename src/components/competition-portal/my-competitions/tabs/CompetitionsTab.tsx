import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, ArrowUpDown } from 'lucide-react';
import { ColumnSelector } from '@/components/ui/column-selector';
import { CompetitionPlacementCards } from '../components/CompetitionPlacementCards';

import { ViewCompetitionDialog } from '../components/ViewCompetitionDialog';

import { DeleteCompetitionDialog } from '../components/DeleteCompetitionDialog';
import { useCompetitions } from '../hooks/useCompetitions';
import { useCompetitionEvents } from '../hooks/useCompetitionEvents';
import { useSortableTable } from '@/hooks/useSortableTable';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { useCompetitionPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import type { Database } from '@/integrations/supabase/types';
import { convertToUI } from '@/utils/timezoneUtils';
import { useAuth } from '@/contexts/AuthContext';

type Competition = Database['public']['Tables']['competitions']['Row'];
type ExtendedCompetition = Competition & {
  source_type: 'internal' | 'portal';
  source_competition_id: string;
};

interface CompetitionsTabProps {
  readOnly?: boolean;
}

const defaultColumns = [
  { key: 'name', label: 'Name', enabled: true },
  { key: 'source_type', label: 'Source', enabled: true },
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

const formatCompetitionDateFull = (date: string) => {
  return new Date(date).toLocaleDateString();
};

export const CompetitionsTab = ({ readOnly = false }: CompetitionsTabProps) => {
  const navigate = useNavigate();
  const { canCreate, canUpdate, canDelete } = useCompetitionPermissions();
  const [viewingCompetition, setViewingCompetition] = useState<ExtendedCompetition | null>(null);
  const [deletingCompetition, setDeletingCompetition] = useState<ExtendedCompetition | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');

  const {
    competitions,
    isLoading,
    createCompetition,
    updateCompetition,
    deleteCompetition
  } = useCompetitions();

  
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


  const handleAddEvent = (competition: ExtendedCompetition) => {
    navigate(`/app/competition-portal/my-competitions/add_competition_event?competitionId=${competition.id}&returnPath=${encodeURIComponent('/app/competition-portal/my-competitions')}`);
  };

  const handleViewScoreSheets = (competition: ExtendedCompetition) => {
    navigate(`/app/competition-portal/my-competitions/score-sheets/${competition.id}?source=${competition.source_type}&sourceId=${competition.source_competition_id}`);
  };


  const handleDeleteCompetition = (competition: ExtendedCompetition) => {
    setDeletingCompetition(competition);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCompetition) return;
    await deleteCompetition(deletingCompetition.id);
    setDeletingCompetition(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search competitions by name, date, or location..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
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
        <div className="flex items-center gap-2">
          {!readOnly && canCreate && (
            <Button onClick={() => navigate('/app/competition-portal/my-competitions/add_competition')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Competition
            </Button>
          )}
        </div>
      </div>

      <CompetitionPlacementCards 
        competitions={sortedData} 
        isLoading={isLoading} 
      onEdit={readOnly || !canUpdate ? undefined : (competition) => {
        // Don't allow editing portal events
        if (competition.source_type === 'portal') return;
        navigate(`/app/competition-portal/my-competitions/add_competition?mode=edit&id=${competition.id}`);
      }}
        onDelete={readOnly || !canDelete ? undefined : (competition) => {
          // Don't allow deleting portal events
          if (competition.source_type === 'portal') return;
          handleDeleteCompetition(competition);
        }}
        onAddEvent={readOnly || !canCreate ? undefined : handleAddEvent}
        onView={handleViewScoreSheets}
        canEdit={canUpdate && !readOnly}
        canDelete={canDelete && !readOnly}
        canAddEvent={canCreate && !readOnly}
      />


      {viewingCompetition && (
        <ViewCompetitionDialog
          open={!!viewingCompetition}
          onOpenChange={() => setViewingCompetition(null)}
          competition={viewingCompetition}
          onEdit={() => {
            navigate(`/app/competition-portal/my-competitions/add_competition?mode=edit&id=${viewingCompetition.id}`);
            setViewingCompetition(null);
          }}
        />
      )}


      <DeleteCompetitionDialog 
        open={!!deletingCompetition} 
        onOpenChange={() => setDeletingCompetition(null)} 
        competition={deletingCompetition} 
        onConfirm={handleConfirmDelete} 
        loading={false}
      />
    </div>
  );
};
