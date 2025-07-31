import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { useTablePermissions } from '@/hooks/useTablePermissions';
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
  onEdit: (judge: Judge) => void;
  onDelete: (id: string) => void;
}
export const JudgesTable: React.FC<JudgesTableProps> = ({
  judges,
  isLoading,
  onEdit,
  onDelete
}) => {
  const {
    canEdit,
    canDelete
  } = useTablePermissions('cp_judges');
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
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {judges.map(judge => <TableRow key={judge.id}>
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
                  {canEdit && <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onEdit(judge)}>
                      <Edit className="w-3 h-3" />
                    </Button>}
                  {canDelete && <Button variant="outline" size="icon" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300" onClick={() => onDelete(judge.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>}
                </div>
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </div>;
};