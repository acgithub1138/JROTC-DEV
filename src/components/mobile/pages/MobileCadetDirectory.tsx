import React, { useState } from 'react';
import { Search, Phone, Mail, User, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { useCadets } from '@/hooks/useCadets';
import { useCadetPermissions } from '@/hooks/useModuleSpecificPermissions';
import { getGradeColor } from '@/utils/gradeColors';
export const MobileCadetDirectory: React.FC = () => {
  const navigate = useNavigate();
  const {
    cadets,
    loading,
    getCadetStats
  } = useCadets();
  const {
    canView,
    canUpdate
  } = useCadetPermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const filteredCadets = cadets.filter(cadet => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return cadet.first_name.toLowerCase().includes(searchLower) || cadet.last_name.toLowerCase().includes(searchLower) || `${cadet.first_name} ${cadet.last_name}`.toLowerCase().includes(searchLower) || cadet.rank && cadet.rank.toLowerCase().includes(searchLower) || cadet.flight && cadet.flight.toLowerCase().includes(searchLower) || cadet.grade && cadet.grade.toLowerCase().includes(searchLower);
  });
  const stats = getCadetStats();
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };
  const isLeader = (cadet: any) => {
    return cadet.rank && (cadet.rank.toLowerCase().includes('captain') || cadet.rank.toLowerCase().includes('lieutenant') || cadet.rank.toLowerCase().includes('sergeant') || cadet.rank.toLowerCase().includes('major') || cadet.rank.toLowerCase().includes('colonel'));
  };
  const handleCall = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${phone}`;
  };
  const handleEmail = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `mailto:${email}`;
  };
  const handleCadetClick = (cadet: any) => {
    if (canView) {
      navigate(`/mobile/cadets/${cadet.id}`, {
        state: {
          canEdit: canUpdate
        }
      });
    }
  };
  if (loading) {
    return <div className="flex flex-col h-full">
        {/* Loading Search Bar */}
        <div className="p-4 border-b border-border bg-card">
          <div className="relative">
            <div className="h-10 bg-muted rounded animate-pulse" />
          </div>
        </div>

        {/* Loading Stats */}
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex justify-around text-center">
            {[1, 2, 3].map(i => <div key={i}>
                <div className="h-6 w-8 bg-muted rounded animate-pulse mx-auto mb-1" />
                <div className="h-3 w-12 bg-muted rounded animate-pulse mx-auto" />
              </div>)}
          </div>
        </div>

        {/* Loading Cadet List */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {[...Array(5)].map((_, index) => <Card key={index} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-muted rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>)}
        </div>
      </div>;
  }
  return <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 border-b border-border bg-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search cadets, ranks, flights..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex justify-around text-center">
          <div>
            <p className="text-lg font-bold text-green-600">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-600">{stats.leaders}</p>
            <p className="text-xs text-muted-foreground">Cmd Staff</p>
          </div>
        </div>
      </div>

      {/* Cadet List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {filteredCadets.map(cadet => <Card key={cadet.id} className={`bg-card border-border transition-colors ${canView ? 'cursor-pointer hover:bg-muted/50' : ''}`} onClick={() => handleCadetClick(cadet)}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(cadet.first_name, cadet.last_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-foreground text-sm truncate">
                      {cadet.last_name}, {cadet.first_name}
                      {isLeader(cadet) && <Star className="inline ml-1 h-3 w-3 text-yellow-500" />}
                    </h3>
                    {cadet.grade && <Badge className={`text-xs ${getGradeColor(cadet.grade)}`}>
                        {cadet.grade}
                      </Badge>}
                  </div>
                  
                  {cadet.rank && <p className="text-xs text-muted-foreground mb-1">{cadet.rank}</p>}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Button variant="ghost" size="sm" className="p-1 h-8 w-8" onClick={e => handleEmail(cadet.email, e)}>
                        <Mail className="h-4 w-4 text-blue-600" />
                      </Button>
                    </div>
                    
                    {cadet.flight && <Badge variant="secondary" className="text-xs">
                        {cadet.flight}
                      </Badge>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>)}
      </div>
      
      {filteredCadets.length === 0 && searchTerm && <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No cadets found matching "{searchTerm}"</p>
          </div>
        </div>}

      {!canView && <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">You don't have permission to view cadet details</p>
          </div>
        </div>}
    </div>;
};