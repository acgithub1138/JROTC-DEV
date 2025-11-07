
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, CheckCircle, Mail, Phone, Eye } from 'lucide-react';
import { Profile } from '../types';
import { getGradeColor } from '@/utils/gradeColors';
import { formatRankWithAbbreviation } from '@/utils/rankDisplay';
import { useAuth } from '@/contexts/AuthContext';
import { JROTCProgram } from '@/utils/jrotcRanks';

interface CadetCardsProps {
  profiles: Profile[];
  activeTab: string;
  onEditProfile: (profile: Profile) => void;
  onViewProfile: (profile: Profile) => void;
  onToggleStatus: (profile: Profile) => void;
  selectedCadets: string[];
  onSelectCadet: (cadetId: string, checked: boolean) => void;
}

export const CadetCards = ({ 
  profiles, 
  activeTab, 
  onEditProfile, 
  onViewProfile,
  onToggleStatus,
  selectedCadets,
  onSelectCadet
}) => {
  const { userProfile } = useAuth();
  if (profiles.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No cadets found
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {profiles.map((profile) => (
        <Card key={profile.id} className={`
          ${activeTab === 'inactive' ? "opacity-60" : ""}
          ${selectedCadets.includes(profile.id) ? "ring-2 ring-blue-500" : ""}
        `}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={selectedCadets.includes(profile.id)}
                  onCheckedChange={(checked) => onSelectCadet(profile.id, checked as boolean)}
                />
                <div>
                  <CardTitle className="text-lg">
                    {profile.last_name}, {profile.first_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground capitalize">
                    {profile.role || 'No Role'}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Rank:</span>
                  <p className="font-medium">
                    {formatRankWithAbbreviation(profile.rank, userProfile?.schools?.jrotc_program as JROTCProgram)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Flight:</span>
                  <p className="font-medium">{profile.flight || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Year:</span>
                  <p className="font-medium">{profile.cadet_year || '-'}</p>
                </div>
              </div>
            </div>
            
            {profile.grade && (
              <div className="flex items-center pb-3">
                <Badge className={`text-xs ${getGradeColor(profile.grade)}`}>
                  {profile.grade}
                </Badge>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-2 pt-3 border-t">
              {activeTab === 'active' ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewProfile(profile)}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">View</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditProfile(profile)}
                    className="w-full"
                  >
                    <Edit className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleStatus(profile)}
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewProfile(profile)}
                    className="w-full col-span-1"
                  >
                    <Eye className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">View</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleStatus(profile)}
                    className="w-full col-span-2"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Activate
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};