import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { CalendarDays, Users, GitCompareArrows, X } from 'lucide-react';
import { format } from 'date-fns';

interface Competition {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  location: string;
  max_participants?: number;
  registration_deadline?: string;
  status: string;
  is_public: boolean;
  school_id: string;
  created_at: string;
  created_by?: string;
}

interface CompetitionCardsProps {
  competitions: Competition[];
  registrationCounts: Record<string, number>;
  userProfile: any;
  getStatusBadgeVariant: (status: string) => "default" | "secondary" | "destructive" | "outline";
  handleViewCompetition: (competition: Competition) => void;
  handleEditCompetition: (competition: Competition) => void;
  handleCancelCompetitionClick: (competition: Competition) => void;
  handleStatusChange: (competitionId: string, newStatus: string) => void;
  updatingStatus: string | null;
  getSchoolName: (schoolId: string) => string;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'registration_closed', label: 'Registration Closed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

export const CompetitionCards: React.FC<CompetitionCardsProps> = ({
  competitions,
  registrationCounts,
  userProfile,
  getStatusBadgeVariant,
  handleViewCompetition,
  handleEditCompetition,
  handleCancelCompetitionClick,
  handleStatusChange,
  updatingStatus,
  getSchoolName
}) => {
  return (
    <TooltipProvider>
      <div className="grid gap-4">
        {competitions.map((competition) => (
          <Card key={competition.id} className="w-full">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  <button 
                    onClick={() => handleViewCompetition(competition)}
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                  >
                    {competition.name}
                  </button>
                </CardTitle>
                <div className="flex gap-1">
                  {(competition.school_id === userProfile?.school_id || userProfile?.role === 'admin') && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8" 
                            onClick={() => handleEditCompetition(competition)}
                          >
                            <GitCompareArrows className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Manage Competition</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      {['draft', 'open', 'registration_closed', 'in_progress'].includes(competition.status) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:border-red-300" 
                              onClick={() => handleCancelCompetitionClick(competition)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Cancel Competition</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Description */}
              {competition.description && (
                <p className="text-sm text-muted-foreground">{competition.description}</p>
              )}
              
              {/* Date */}
              <div className="flex items-center text-sm">
                <CalendarDays className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>
                  {format(new Date(competition.start_date), 'MMM d, yyyy')}
                  {competition.start_date !== competition.end_date && (
                    <span className="text-muted-foreground">
                      {' '} to {format(new Date(competition.end_date), 'MMM d, yyyy')}
                    </span>
                  )}
                </span>
              </div>

              {/* School */}
              <div className="text-sm">
                <span className="font-medium">Hosted by:</span> {getSchoolName(competition.school_id)}
              </div>

              {/* Status and Registration Count */}
              <div className="flex justify-between items-center">
                <div>
                  {(competition.school_id === userProfile?.school_id || userProfile?.role === 'admin') ? (
                    <Select
                      value={competition.status}
                      onValueChange={(value) => handleStatusChange(competition.id, value)}
                      disabled={updatingStatus === competition.id}
                    >
                      <SelectTrigger className="w-auto h-8 border-none p-0 bg-transparent hover:bg-muted">
                        <Badge variant={getStatusBadgeVariant(competition.status)} className="cursor-pointer">
                          {competition.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-md z-50">
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={getStatusBadgeVariant(competition.status)}>
                      {competition.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="w-4 h-4 mr-1" />
                  {registrationCounts[competition.id] || 0}
                  {competition.max_participants && ` / ${competition.max_participants}`}
                  <span className="ml-1">schools</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
};