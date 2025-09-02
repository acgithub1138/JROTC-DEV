import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Eye } from 'lucide-react';
import { useCPJudgesPermissions } from '@/hooks/useModuleSpecificPermissions';
interface Judge {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  available: boolean;
  created_at: string;
}
interface JudgesTableProps {
  judges: Judge[];
  isLoading: boolean;
  onView: (judge: Judge) => void;
  onEdit: (judge: Judge) => void;
  onDelete: (judge: Judge) => void;
  selectedJudges: string[];
  onSelectJudge: (judgeId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  getSortIcon: (field: string) => React.ReactNode;
}
export const JudgesTable: React.FC<JudgesTableProps> = ({
  judges,
  isLoading,
  onView,
  onEdit,
  onDelete,
  selectedJudges,
  onSelectJudge,
  onSelectAll,
  sortField,
  sortDirection,
  onSort,
  getSortIcon
}) => {
  const {
    canView,
    canEdit,
    canDelete
  } = useCPJudgesPermissions();
  
  const isAllSelected = judges.length > 0 && selectedJudges.length === judges.length;
  const isIndeterminate = selectedJudges.length > 0 && selectedJudges.length < judges.length;
  if (isLoading) {
    return <div className="text-center py-8">Loading judges...</div>;
  }
  if (judges.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">
        No judges found. Create your first judge to get started.
      </div>;
  }
  return <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
                aria-label="Select all judges"
                className={isIndeterminate ? "data-[state=checked]:bg-primary data-[state=checked]:opacity-50" : ""}
              />
            </TableHead>
            <TableHead>
              <button 
                onClick={() => onSort('name')}
                className="flex items-center gap-2 hover:text-foreground font-medium"
              >
                Name {getSortIcon('name')}
              </button>
            </TableHead>
            <TableHead>
              <button 
                onClick={() => onSort('phone')}
                className="flex items-center gap-2 hover:text-foreground font-medium"
              >
                Phone {getSortIcon('phone')}
              </button>
            </TableHead>
            <TableHead>
              <button 
                onClick={() => onSort('email')}
                className="flex items-center gap-2 hover:text-foreground font-medium"
              >
                Email {getSortIcon('email')}
              </button>
            </TableHead>
            <TableHead>
              <button 
                onClick={() => onSort('status')}
                className="flex items-center gap-2 hover:text-foreground font-medium"
              >
                Status {getSortIcon('status')}
              </button>
            </TableHead>
            <TableHead>
              <button 
                onClick={() => onSort('created_at')}
                className="flex items-center gap-2 hover:text-foreground font-medium"
              >
                Created {getSortIcon('created_at')}
              </button>
            </TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {judges.map(judge => <TableRow key={judge.id}>
              <TableCell>
                <Checkbox
                  checked={selectedJudges.includes(judge.id)}
                  onCheckedChange={(checked) => onSelectJudge(judge.id, checked as boolean)}
                  aria-label={`Select ${judge.name}`}
                />
              </TableCell>
              <TableCell className="font-medium py-[8px]">{judge.name}</TableCell>
              <TableCell>{judge.phone || '-'}</TableCell>
              <TableCell>{judge.email || '-'}</TableCell>
              <TableCell>
                <Badge variant={judge.available ? 'default' : 'secondary'}>
                  {judge.available ? 'Available' : 'Unavailable'}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(judge.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  {canView && (
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onView(judge)}>
                      <Eye className="w-3 h-3" />
                    </Button>
                  )}
                  {canEdit && (
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onEdit(judge)}>
                      <Edit className="w-3 h-3" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button variant="outline" size="icon" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300" onClick={() => onDelete(judge)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </div>;
};