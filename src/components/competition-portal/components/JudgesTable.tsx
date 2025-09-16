import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, Eye, Phone, Mail } from 'lucide-react';
import { useCPJudgesPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useIsMobile } from '@/hooks/use-mobile';
import { EditableJudgeCell } from './EditableJudgeCell';
import { useJudgeTableLogic } from '@/hooks/competition-portal/useJudgeTableLogic';
interface Judge {
  id: string;
  school_id: string;
  name: string;
  phone?: string;
  email?: string;
  available: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
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
  const isMobile = useIsMobile();
  const {
    editState,
    setEditState,
    canEdit: canEditTable,
    cancelEdit,
    saveEdit,
  } = useJudgeTableLogic();
  
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

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={onSelectAll}
              aria-label="Select all judges"
              className={isIndeterminate ? "data-[state=checked]:bg-primary data-[state=checked]:opacity-50" : ""}
            />
            <span className="text-sm text-muted-foreground">
              {selectedJudges.length > 0 ? `${selectedJudges.length} selected` : 'Select all'}
            </span>
          </div>
        </div>
        
        {judges.map((judge) => (
          <Card key={judge.id} className="p-4">
            <CardContent className="p-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedJudges.includes(judge.id)}
                    onCheckedChange={(checked) => onSelectJudge(judge.id, checked as boolean)}
                    aria-label={`Select ${judge.name}`}
                  />
                  <div>
                    <h3 className="font-medium">{judge.name}</h3>
                    <Badge variant={judge.available ? "default" : "secondary"} className="mt-1">
                      {judge.available ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {canView && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onView(judge)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(judge)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onDelete(judge)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                {judge.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>{judge.phone}</span>
                  </div>
                )}
                {judge.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>{judge.email}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop Table View
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
                onClick={() => onSort('available')}
                className="flex items-center gap-2 hover:text-foreground font-medium"
              >
                Status {getSortIcon('available')}
              </button>
            </TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {judges.map(judge => <TableRow key={judge.id} className="group">
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
                <EditableJudgeCell
                  judge={judge}
                  field="available"
                  value={judge.available}
                  displayValue={
                    <Badge variant={judge.available ? 'default' : 'secondary'}>
                      {judge.available ? 'Available' : 'Unavailable'}
                    </Badge>
                  }
                  editState={editState}
                  setEditState={setEditState}
                  onSave={saveEdit}
                  onCancel={cancelEdit}
                  canEdit={canEditTable}
                />
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