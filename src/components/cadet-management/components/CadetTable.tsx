
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, CheckCircle } from 'lucide-react';
import { useSortableTable } from '@/hooks/useSortableTable';
import { Profile } from '../types';
import { getGradeColor } from '@/utils/gradeColors';

interface CadetTableProps {
  profiles: Profile[];
  activeTab: string;
  onEditProfile: (profile: Profile) => void;
  onToggleStatus: (profile: Profile) => void;
  selectedCadets: string[];
  onSelectCadet: (cadetId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
}

export const CadetTable = ({ 
  profiles, 
  activeTab, 
  onEditProfile, 
  onToggleStatus,
  selectedCadets,
  onSelectCadet,
onSelectAll
}: CadetTableProps) => {
  const { sortedData: sortedProfiles, sortConfig, handleSort } = useSortableTable({
    data: profiles
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
          <SortableTableHead sortKey="email" currentSort={sortConfig} onSort={handleSort}>
            Email
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
            <TableCell className="py-2">{profile.email}</TableCell>
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
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditProfile(profile)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleStatus(profile)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleStatus(profile)}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Activate
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
