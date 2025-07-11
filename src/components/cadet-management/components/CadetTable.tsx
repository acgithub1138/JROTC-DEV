
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TableActionButtons } from '@/components/ui/table-action-buttons';
import { useCadetPermissions } from '@/hooks/useModuleSpecificPermissions';
import { CheckCircle, X } from 'lucide-react';
import { useSortableTable } from '@/hooks/useSortableTable';
import { Profile } from '../types';
import { getGradeColor } from '@/utils/gradeColors';

interface CadetTableProps {
  profiles: Profile[];
  activeTab: string;
  onEditProfile: (profile: Profile) => void;
  onViewProfile: (profile: Profile) => void;
  onToggleStatus: (profile: Profile) => void;
  selectedCadets: string[];
  onSelectCadet: (cadetId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
}

export const CadetTable = ({ 
  profiles, 
  activeTab, 
  onEditProfile, 
  onViewProfile,
  onToggleStatus,
  selectedCadets,
  onSelectCadet,
onSelectAll
}: CadetTableProps) => {
  const { canViewDetails: canView, canUpdate: canEdit, canDelete } = useCadetPermissions();
  const { sortedData: sortedProfiles, sortConfig, handleSort } = useSortableTable({
    data: profiles,
    defaultSort: { key: 'last_name', direction: 'asc' }
  });
  
  const allSelected = profiles.length > 0 && selectedCadets.length === profiles.length;
  const someSelected = selectedCadets.length > 0 && selectedCadets.length < profiles.length;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => onSelectAll(checked as boolean)}
              aria-label={someSelected ? "Some selected" : allSelected ? "All selected" : "None selected"}
            />
          </TableHead>
          <SortableTableHead sortKey="last_name" currentSort={sortConfig} onSort={handleSort}>
            Name
          </SortableTableHead>
          <SortableTableHead sortKey="role" currentSort={sortConfig} onSort={handleSort}>
            Role
          </SortableTableHead>
          <SortableTableHead sortKey="grade" currentSort={sortConfig} onSort={handleSort}>
            Grade
          </SortableTableHead>
          <SortableTableHead sortKey="rank" currentSort={sortConfig} onSort={handleSort}>
            Rank
          </SortableTableHead>
          <SortableTableHead sortKey="flight" currentSort={sortConfig} onSort={handleSort}>
            Flight
          </SortableTableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedProfiles.map((profile) => (
          <TableRow 
            key={profile.id} 
            className={`
              ${activeTab === 'inactive' ? "opacity-60" : ""}
              ${selectedCadets.includes(profile.id) ? "bg-blue-50" : ""}
            `}
          >
            <TableCell className="py-2">
              <Checkbox
                checked={selectedCadets.includes(profile.id)}
                onCheckedChange={(checked) => onSelectCadet(profile.id, checked as boolean)}
              />
            </TableCell>
            <TableCell className="font-medium py-2">
              {profile.last_name}, {profile.first_name}
            </TableCell>
            
            <TableCell className="capitalize py-2">{profile.role.replace('_', ' ')}</TableCell>
            <TableCell className="py-2">
              {profile.grade ? (
                <Badge className={`text-xs ${getGradeColor(profile.grade)}`}>
                  {profile.grade}
                </Badge>
              ) : (
                '-'
              )}
            </TableCell>
            <TableCell className="py-2">{profile.rank || '-'}</TableCell>
            <TableCell className="py-2">{profile.flight || '-'}</TableCell>
            <TableCell className="text-right py-2">
              {activeTab === 'active' ? (
                <TableActionButtons
                  canView={canView}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onView={() => onViewProfile(profile)}
                  onEdit={() => onEditProfile(profile)}
                  customActions={[
                    {
                      icon: <X className="w-4 h-4" />,
                      label: "Deactivate profile",
                      onClick: () => onToggleStatus(profile),
                      show: canDelete
                    }
                  ]}
                />
              ) : (
                <TableActionButtons
                  canView={canView}
                  onView={() => onViewProfile(profile)}
                  customActions={[
                    {
                      icon: <><CheckCircle className="w-4 h-4 mr-1" />Activate</>,
                      label: "Activate profile",
                      onClick: () => onToggleStatus(profile),
                      show: canDelete
                    }
                  ]}
                />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
