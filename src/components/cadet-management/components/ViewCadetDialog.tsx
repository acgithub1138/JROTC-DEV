import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Profile } from '../types';
import { getGradeColor } from '@/utils/gradeColors';
import { ProfileHistoryTab } from './ProfileHistoryTab';
import { ProfileEquipmentTab } from './ProfileEquipmentTab';
import { ProfileCompetitionsTab } from './ProfileCompetitionsTab';
import { useJobRole } from '../hooks/useJobRole';
import { formatRankWithAbbreviation } from '@/utils/rankDisplay';
import { useAuth } from '@/contexts/AuthContext';
import { JROTCProgram } from '@/utils/jrotcRanks';

interface ViewCadetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
}

export const ViewCadetDialog = ({ open, onOpenChange, profile }: ViewCadetDialogProps) => {
  const { jobRole } = useJobRole(profile?.id);
  const { userProfile } = useAuth();

  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
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
                  <p className="text-sm capitalize">{profile.role.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Grade</p>
                  {profile.grade ? (
                    <Badge className={`text-xs ${getGradeColor(profile.grade)}`}>
                      {profile.grade}
                    </Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground">-</p>
                  )}
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

          {/* Tabs Section */}
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="history" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="equipment">Equipment</TabsTrigger>
                <TabsTrigger value="competitions">Competitions</TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-hidden">
                <TabsContent value="history" className="h-full overflow-auto mt-0 p-0">
                  <div className="h-full overflow-y-auto">
                    <ProfileHistoryTab profileId={profile.id} />
                  </div>
                </TabsContent>
                
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
              </div>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};