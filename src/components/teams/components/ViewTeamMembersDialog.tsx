import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { TeamWithMembers } from '../types';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { getGradeColor } from '@/utils/gradeColors';
interface ViewTeamMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: TeamWithMembers | null;
}
export const ViewTeamMembersDialog = ({
  open,
  onOpenChange,
  team
}: ViewTeamMembersDialogProps) => {
  const {
    users
  } = useSchoolUsers(true);
  const getTeamMembers = () => {
    if (!team) return [];
    const members = team.team_members.map(member => {
      const user = users.find(u => u.id === member.cadet_id);
      return user ? {
        id: user.id,
        lastName: user.last_name,
        firstName: user.first_name,
        role: user.role,
        grade: user.grade
      } : null;
    }).filter(member => member !== null).sort((a, b) => a!.lastName.localeCompare(b!.lastName));
    return members;
  };
  const members = getTeamMembers();
  if (!team) return null;
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Team Members: {team.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {members.length > 0 ? members.map(member => <div key={member!.id} className="flex justify-between items-center p-3 bg-muted rounded-lg py-[4px]">
                <div>
                  <div className="font-medium">
                    {member!.lastName}, {member!.firstName}
                  </div>
                  
                </div>
                {member!.grade && <Badge className={`text-xs ${getGradeColor(member!.grade)}`}>
                    {member!.grade}
                  </Badge>}
              </div>) : <div className="text-center py-8 text-muted-foreground">
              No team members assigned
            </div>}
        </div>
      </DialogContent>
    </Dialog>;
};