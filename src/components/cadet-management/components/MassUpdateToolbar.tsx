
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, GraduationCap, Award, Plane, UserX, Shield } from 'lucide-react';

interface MassUpdateToolbarProps {
  selectedCount: number;
  onUpdateGrade: () => void;
  onUpdateRank: () => void;
  onUpdateFlight: () => void;
  onUpdateRole: () => void;
  onDeactivate: () => void;
  loading: boolean;
}

export const MassUpdateToolbar = ({
  selectedCount,
  onUpdateGrade,
  onUpdateRank,
  onUpdateFlight,
  onUpdateRole,
  onDeactivate,
  loading
}: MassUpdateToolbarProps) => {
  if (selectedCount === 0) return null;

  return (
    <Card className="mb-4">
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{selectedCount} cadet{selectedCount !== 1 ? 's' : ''} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onUpdateGrade}
              disabled={loading}
            >
              <GraduationCap className="w-4 h-4 mr-1" />
              Update Grade
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onUpdateRank}
              disabled={loading}
            >
              <Award className="w-4 h-4 mr-1" />
              Update Rank
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onUpdateFlight}
              disabled={loading}
            >
              <Plane className="w-4 h-4 mr-1" />
              Update Flight
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onUpdateRole}
              disabled={loading}
            >
              <Shield className="w-4 h-4 mr-1" />
              Update Role
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDeactivate}
              disabled={loading}
            >
              <UserX className="w-4 h-4 mr-1" />
              Deactivate
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
