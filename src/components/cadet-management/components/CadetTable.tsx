
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, CheckCircle } from 'lucide-react';
import { Profile } from '../types';

interface CadetTableProps {
  profiles: Profile[];
  activeTab: string;
  onEditProfile: (profile: Profile) => void;
  onToggleStatus: (profile: Profile) => void;
}

export const CadetTable = ({ profiles, activeTab, onEditProfile, onToggleStatus }: CadetTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Grade</TableHead>
          <TableHead>Rank</TableHead>
          <TableHead>Flight</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {profiles.map((profile) => (
          <TableRow key={profile.id} className={activeTab === 'inactive' ? "opacity-60" : ""}>
            <TableCell className="font-medium">
              {profile.first_name} {profile.last_name}
            </TableCell>
            <TableCell>{profile.email}</TableCell>
            <TableCell className="capitalize">{profile.role.replace('_', ' ')}</TableCell>
            <TableCell>{profile.grade || '-'}</TableCell>
            <TableCell>{profile.rank || '-'}</TableCell>
            <TableCell>{profile.flight || '-'}</TableCell>
            <TableCell className="text-right">
              {activeTab === 'active' ? (
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditProfile(profile)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleStatus(profile)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleStatus(profile)}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Activate
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
