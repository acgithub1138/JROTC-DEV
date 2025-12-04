import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { CPCadet } from "@/hooks/competition-portal/useCPCadets";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
interface CPCadetsTableProps {
  cadets: CPCadet[];
  onView: (cadet: CPCadet) => void;
  onEdit: (cadet: CPCadet) => void;
  onDelete: (cadet: CPCadet) => void;
  canEdit: boolean;
  canDelete: boolean;
  canViewDetails: boolean;
}
type SortField = "name" | "grade" | "email";
type SortDirection = "asc" | "desc";
const gradeColors: Record<string, string> = {
  Freshman: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "9th Grade": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  Sophomore: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "10th Grade": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Junior: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  "11th Grade": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Senior: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  "12th Grade": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  Graduate: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};
export function CPCadetsTable({
  cadets,
  onView,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  canViewDetails,
}: CPCadetsTableProps) {
  const isMobile = useIsMobile();
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  const sortedCadets = [...cadets].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "name":
        comparison = `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`);
        break;
      case "grade":
        comparison = (a.grade || "").localeCompare(b.grade || "");
        break;
      case "email":
        comparison = (a.email || "").localeCompare(b.email || "");
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortDirection === "asc" ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />;
  };
  if (isMobile) {
    return (
      <div className="space-y-3">
        {sortedCadets.map((cadet) => (
          <div key={cadet.id} className="bg-card border rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-foreground">
                  {cadet.last_name}, {cadet.first_name}
                </p>
                <p className="text-sm text-muted-foreground">{cadet.email}</p>
              </div>
              <Badge className={gradeColors[cadet.grade] || "bg-gray-100 text-gray-800"}>{cadet.grade || "N/A"}</Badge>
            </div>
            <div className="flex gap-2 pt-2">
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(cadet)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {canDelete && (
                <Button variant="outline" size="sm" onClick={() => onDelete(cadet)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
        {sortedCadets.length === 0 && <div className="text-center py-8 text-muted-foreground">No cadets found</div>}
      </div>
    );
  }
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort("name")} className="p-0 h-auto font-medium">
                Name <SortIcon field="name" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort("grade")} className="p-0 h-auto font-medium">
                Grade <SortIcon field="grade" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort("email")} className="p-0 h-auto font-medium">
                Email <SortIcon field="email" />
              </Button>
            </TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCadets.map((cadet) => (
            <TableRow key={cadet.id}>
              <TableCell className="font-medium py-[6px]">
                {cadet.last_name}, {cadet.first_name}
              </TableCell>
              <TableCell>
                <Badge className={gradeColors[cadet.grade] || "bg-gray-100 text-gray-800"}>
                  {cadet.grade || "N/A"}
                </Badge>
              </TableCell>
              <TableCell>{cadet.email}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-center gap-2">
                  {canEdit && (
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onEdit(cadet)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300"
                      onClick={() => onDelete(cadet)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {sortedCadets.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                No cadets found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
