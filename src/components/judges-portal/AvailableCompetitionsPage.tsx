import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, MapPin, Building2, Filter } from 'lucide-react';
import { useAvailableCompetitions } from '@/hooks/judges-portal/useAvailableCompetitions';
import { useJudgeApplications } from '@/hooks/judges-portal/useJudgeApplications';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const AvailableCompetitionsPage = () => {
  const navigate = useNavigate();
  const { competitions, isLoading } = useAvailableCompetitions();
  const [judgeId, setJudgeId] = useState<string | undefined>();
  const { applications } = useJudgeApplications(judgeId);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState<string>('all');
  
  // Get judge ID
  useState(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from('cp_judges')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle()
          .then(({ data: judge }) => {
            if (judge) setJudgeId(judge.id);
          });
      }
    });
  });

  // Get application status for a competition
  const getApplicationStatus = (competitionId: string) => {
    return applications?.find(app => app.competition_id === competitionId)?.status;
  };

  // Filter competitions
  const filteredCompetitions = competitions.filter(comp => {
    const matchesSearch = comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comp.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comp.hosting_school?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProgram = programFilter === 'all' || comp.program === programFilter;
    
    return matchesSearch && matchesProgram;
  });

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', label: 'Application Pending' },
      approved: { variant: 'default', label: 'Approved' },
      declined: { variant: 'destructive', label: 'Declined' },
      withdrawn: { variant: 'outline', label: 'Withdrawn' }
    };
    
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Available Competitions</h1>
        <p className="text-muted-foreground">
          Browse and apply to judge at upcoming competitions
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search competitions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={programFilter} onValueChange={setProgramFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              <SelectItem value="army">Army JROTC</SelectItem>
              <SelectItem value="navy">Navy JROTC</SelectItem>
              <SelectItem value="air_force">Air Force JROTC</SelectItem>
              <SelectItem value="marine_corps">Marine Corps JROTC</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Competition List */}
      {filteredCompetitions.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No competitions found matching your criteria.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCompetitions.map((competition) => {
            const applicationStatus = getApplicationStatus(competition.id);
            
            return (
              <Card key={competition.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-xl font-semibold">{competition.name}</h3>
                      {getStatusBadge(applicationStatus)}
                    </div>
                    
                    {competition.description && (
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {competition.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(competition.start_date), 'MMM d, yyyy')} - {' '}
                          {format(new Date(competition.end_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{competition.location}</span>
                      </div>
                      
                      {competition.hosting_school && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          <span>{competition.hosting_school}</span>
                        </div>
                      )}
                    </div>
                    
                    {competition.program && (
                      <div className="mt-2">
                        <Badge variant="outline">
                          {competition.program.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => navigate(`/judges-portal/competitions/${competition.id}`)}
                      variant="outline"
                    >
                      View Details
                    </Button>
                    
                    {!applicationStatus && (
                      <Button
                        onClick={() => navigate(`/judges-portal/competitions/${competition.id}/apply`)}
                      >
                        Apply to Judge
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
