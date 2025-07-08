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
}

export const TeamsTable = ({ teams, onEditTeam, onDeleteTeam, onSendEmail, onViewMembers }: TeamsTableProps) => {
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
            <TableHead className="w-[150px]">Actions</TableHead>
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
                  {team.member_count > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewMembers(team)}
                            className="h-7 px-2"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
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
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSendEmail(team)}
                          className="h-8 w-8 p-0"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Send email to team</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditTeam(team)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit team</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(team)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete team</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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