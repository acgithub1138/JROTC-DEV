import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin, Users, Trophy, DollarSign, Eye, X } from 'lucide-react';
import { format } from 'date-fns';
import { useOpenCompsOpenPermissions } from '@/hooks/useModuleSpecificPermissions';

interface Competition {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
  max_participants?: number;
  registration_deadline?: string;
  fee?: number;
  program?: string;
  hosting_school?: string;
}

interface OpenCompetitionCardsProps {
  competitions: Competition[];
  registrations: any[];
  onViewDetails: (competitionId: string) => void;
  onRegisterInterest: (competitionId: string) => void;
  onCancelRegistration: (competitionId: string) => void;
  permissions?: {
    canRead: boolean;
    canViewDetails: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
}

export const OpenCompetitionCards: React.FC<OpenCompetitionCardsProps> = ({
  competitions,
  registrations,
  onViewDetails,
  onRegisterInterest,
  onCancelRegistration,
  permissions,
}) => {
  const defaultPermissions = useOpenCompsOpenPermissions();
  const { canRead, canViewDetails, canCreate, canUpdate, canDelete } = permissions || defaultPermissions;
  
  const isRegistered = (competitionId: string) => {
    return registrations?.some(reg => reg.competition_id === competitionId) ?? false;
  };

  // Check if user can read records
  if (!canRead) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-gray-600">
          You don't have permission to view competitions.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {competitions.map((competition) => (
        <Card key={competition.id} className="hover:shadow-lg transition-shadow relative">
          {isRegistered(competition.id) && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
              <Badge variant="default" className="bg-green-500 text-white">
                Registered
              </Badge>
            </div>
          )}
          <CardHeader className={isRegistered(competition.id) ? "pt-12" : ""}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg line-clamp-2">
                  {canViewDetails ? (
                    <button
                      onClick={() => {
                        // Navigate to score sheet page for this competition
                        window.location.href = `/app/competitions/score-sheets/${competition.id}`;
                      }}
                      className="text-left hover:text-primary hover:underline transition-colors cursor-pointer w-full"
                    >
                      {competition.name}
                    </button>
                  ) : (
                    competition.name
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  {competition.description || 'No description available'}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="ml-2">
                <Trophy className="w-3 h-3 mr-1" />
                {competition.program?.replace('_', ' ').toUpperCase() || 'N/A'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              {competition.fee && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-medium text-green-600">
                    ${competition.fee.toFixed(2)} entry fee
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                <span>
                  {format(new Date(competition.start_date), 'MMM d, yyyy')}
                  {competition.end_date && 
                    format(new Date(competition.end_date), 'MMM d, yyyy') !== format(new Date(competition.start_date), 'MMM d, yyyy') && 
                    ` - ${format(new Date(competition.end_date), 'MMM d, yyyy')}`
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>
                  <div>
                    <a 
                      href={`https://www.google.com/maps/place/${[competition.address, competition.city, competition.state, competition.zip].filter(Boolean).join(', ').replace(/ /g, '+')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline cursor-pointer"
                    >
                      {competition.address}
                    </a>
                  </div>
                  <div>
                    <a 
                      href={`https://www.google.com/maps/place/${[competition.address, competition.city, competition.state, competition.zip].filter(Boolean).join(', ').replace(/ /g, '+')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-primary hover:underline cursor-pointer"
                    >
                      {[competition.city, competition.state].filter(Boolean).join(', ')}{competition.zip ? ` ${competition.zip}` : ''}
                    </a>
                  </div>
                </span>
              </div>
              {competition.max_participants && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Max {competition.max_participants} participants</span>
                </div>
              )}
              {competition.registration_deadline && (
                <div className="text-sm">
                  <strong>Registration Deadline:</strong> {format(new Date(competition.registration_deadline), 'MMM d, yyyy')}
                </div>
              )}
              <div className="text-sm">
                <strong>Hosting School:</strong> {competition.hosting_school || 'Not specified'}
              </div>
            </div>
            
            <div className="flex gap-1">
              {canViewDetails && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1" 
                  onClick={() => onViewDetails(competition.id)}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>
              )}
              {isRegistered(competition.id) ? (
                <>
                  {canUpdate && (
                    <Button 
                      size="sm"
                      className="flex-1" 
                      onClick={() => onRegisterInterest(competition.id)}
                    >
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button 
                      variant="destructive"
                      size="sm"
                      className="flex-1" 
                      onClick={() => onCancelRegistration(competition.id)}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {canCreate && (
                    <Button 
                      size="sm"
                      className="flex-1" 
                      onClick={() => onRegisterInterest(competition.id)}
                    >
                      Register
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};