import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit } from 'lucide-react';
import { Profile } from '../types';
import { getGradeColor } from '@/utils/gradeColors';
import { ProfileHistoryTab } from './ProfileHistoryTab';
import { ProfileEquipmentTab } from './ProfileEquipmentTab';
import { ProfileCompetitionsTab } from './ProfileCompetitionsTab';
import { ProfilePTTestsTab } from './ProfilePTTestsTab';
import { useJobRole } from '../hooks/useJobRole';
import { formatRankWithAbbreviation } from '@/utils/rankDisplay';
import { useAuth } from '@/contexts/AuthContext';
import { JROTCProgram } from '@/utils/jrotcRanks';
import { useCadetPermissions } from '@/hooks/useModuleSpecificPermissions';
interface ViewCadetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
  onEditProfile?: (profile: Profile) => void;
}
export const ViewCadetDialog = ({
  open,
  onOpenChange,
  profile,
  onEditProfile
}: ViewCadetDialogProps) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const {
    jobRole
  } = useJobRole(profile?.id);
  const {
    userProfile
  } = useAuth();
  const {
    canUpdate
  } = useCadetPermissions();

  // Reset edit mode when modal closes
  useEffect(() => {
    if (!open) {
      setIsEditMode(false);
    }
  }, [open]);
  const handleEdit = () => {
    if (onEditProfile && profile) {
      onEditProfile(profile);
    }
    setIsEditMode(true);
    onOpenChange(false);
  };
  const handleUpdate = () => {
    if (onEditProfile && profile) {
      onEditProfile(profile);
    }
    setIsEditMode(false);
    onOpenChange(false);
  };
  const handleClose = () => {
    setIsEditMode(false);
    onOpenChange(false);
  };
  if (!profile) return null;
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <DialogTitle>Cadet Profile</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Profile Header */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">
                {profile.last_name}, {profile.first_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{profile.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Role</p>
                  <p className="text-sm capitalize">{profile.role_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Grade</p>
                  {profile.grade ? <Badge className={`text-xs ${getGradeColor(profile.grade)}`}>
                      {profile.grade}
                    </Badge> : <p className="text-sm text-muted-foreground">-</p>}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rank</p>
                  <p className="text-sm">
                    {formatRankWithAbbreviation(profile.rank, userProfile?.schools?.jrotc_program as JROTCProgram)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Flight</p>
                  <p className="text-sm">{profile.flight || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cadet Year</p>
                  {profile.cadet_year ? <Badge variant="outline" className="text-xs">
                      {profile.cadet_year}
                    </Badge> : <p className="text-sm text-muted-foreground">-</p>}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Job Title</p>
                  <p className="text-sm">{jobRole || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={profile.active ? "default" : "secondary"}>
                    {profile.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="equipment" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="equipment">Equipment</TabsTrigger>
                <TabsTrigger value="competitions">Competitions</TabsTrigger>
                <TabsTrigger value="pt-tests">PT Tests</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-hidden">
                <TabsContent value="equipment" className="h-full overflow-auto mt-0 p-0">
                  <div className="h-full overflow-y-auto">
                    <ProfileEquipmentTab profileId={profile.id} />
                  </div>
                </TabsContent>
                
                <TabsContent value="competitions" className="h-full overflow-auto mt-0 p-0">
                  <div className="h-full overflow-y-auto">
                    <ProfileCompetitionsTab profileId={profile.id} />
                  </div>
                </TabsContent>
                
                <TabsContent value="pt-tests" className="h-full overflow-auto mt-0 p-0">
                  <div className="h-full overflow-y-auto">
                    <ProfilePTTestsTab profileId={profile.id} />
                  </div>
                </TabsContent>

                <TabsContent value="history" className="h-full overflow-auto mt-0 p-0">
                  <div className="h-full overflow-y-auto">
                    <ProfileHistoryTab profileId={profile.id} />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          {canUpdate && <Button onClick={isEditMode ? handleUpdate : handleEdit}>
              {isEditMode ? 'Update' : 'Edit'}
            </Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>;
};