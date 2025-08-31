import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, GraduationCap, Star, Calendar, Plane } from 'lucide-react';
import { Profile } from '../types';
interface CadetOverviewCardsProps {
  cadet: Profile;
}
export const CadetOverviewCards: React.FC<CadetOverviewCardsProps> = ({
  cadet
}) => {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Grade</CardTitle>
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{cadet.grade || 'N/A'}</div>
          <p className="text-xs text-muted-foreground">
            {cadet.cadet_year || 'No cadet year'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rank</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{cadet.rank || 'N/A'}</div>
          <p className="text-xs text-muted-foreground">
            Current rank
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Flight</CardTitle>
          <Plane className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{cadet.flight || 'N/A'}</div>
          <p className="text-xs text-muted-foreground">
            Assigned flight
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cadet Year</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{cadet.cadet_year || 'N/A'}</div>
          <p className="text-xs text-muted-foreground">
            Current year level
          </p>
        </CardContent>
      </Card>

      
    </div>;
};