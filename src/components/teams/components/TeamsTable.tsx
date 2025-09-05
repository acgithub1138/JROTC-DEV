import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, Trash2, Mail, Eye } from 'lucide-react';
import { TeamWithMembers } from '../types';

interface TeamsTableProps {
  teams: TeamWithMembers[];
  onEditTeam: (team: TeamWithMembers) => void;
  onDeleteTeam: (teamId: string) => Promise<boolean>;
  onSendEmail: (team: TeamWithMembers) => void;
  onViewMembers: (team: TeamWithMembers) => void;
  canUpdate: boolean;
  canDelete: boolean;
  canViewDetails: boolean;
}

export const TeamsTable = ({ teams, onEditTeam, onDeleteTeam, onSendEmail, onViewMembers, canUpdate, canDelete, canViewDetails }: TeamsTableProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<TeamWithMembers | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteClick = (team: TeamWithMembers) => {
    setTeamToDelete(team);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!teamToDelete) return;
    
    setDeleteLoading(true);
    const success = await onDeleteTeam(teamToDelete.id);
    setDeleteLoading(false);
    
    if (success) {
      setDeleteDialogOpen(false);
      setTeamToDelete(null);
    }
  };

  if (teams.length === 0) {
    return null;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Team Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Team Lead</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => (
            <TableRow key={team.id}>
              <TableCell className="font-medium py-2">{team.name}</TableCell>
              <TableCell className="py-2">
                {team.description || (
                  <span className="text-muted-foreground">No description</span>
                )}
              </TableCell>
              <TableCell className="py-2">
                {team.team_lead ? (
                  <span className="font-medium">
                    {team.team_lead.last_name}, {team.team_lead.first_name}
                  </span>
                ) : (
                  <span className="text-muted-foreground">No team lead assigned</span>
                )}
              </TableCell>
              <TableCell className="py-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{team.member_count}</span> members
                  {team.member_count > 0 && canViewDetails && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon" className="h-6 w-6"
                            onClick={() => onViewMembers(team)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View team members</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </TableCell>
              <TableCell className="py-2">
                {new Date(team.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="py-2">
                <div className="flex items-center justify-center gap-2">
                  {canUpdate && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon" className="h-6 w-6"
                            onClick={() => onSendEmail(team)}
                          >
                            <Mail className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Send email to team</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {canUpdate && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon" className="h-6 w-6"
                            onClick={() => onEditTeam(team)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit team</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {canDelete && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300"
                            onClick={() => handleDeleteClick(team)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete team</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{teamToDelete?.name}"? This action cannot be undone.
              All team members will be removed from this team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? 'Deleting...' : 'Delete Team'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};