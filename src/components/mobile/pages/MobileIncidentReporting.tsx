import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Camera, 
  Clock,
  User,
  MapPin,
  Phone,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface MobileIncident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved';
  reportedBy: string;
  reportedAt: string;
  location: string;
  category: string;
}

const mockIncidents: MobileIncident[] = [
  {
    id: '1',
    title: 'Equipment Malfunction',
    description: 'Drill rifle mechanism jammed during practice',
    severity: 'medium',
    status: 'investigating',
    reportedBy: 'Johnson, Sarah',
    reportedAt: '2025-01-12T14:30:00Z',
    location: 'Drill Hall A',
    category: 'Equipment'
  },
  {
    id: '2',
    title: 'Uniform Damage',
    description: 'Cadet uniform torn during formation',
    severity: 'low',
    status: 'open',
    reportedBy: 'Smith, Michael',
    reportedAt: '2025-01-12T10:15:00Z',
    location: 'Parade Ground',
    category: 'Uniform'
  },
  {
    id: '3',
    title: 'Safety Violation',
    description: 'Improper handling of ceremonial sword observed',
    severity: 'high',
    status: 'resolved',
    reportedBy: 'Williams, Ashley',
    reportedAt: '2025-01-11T16:45:00Z',
    location: 'Honor Guard Room',
    category: 'Safety'
  },
];

const severityColors = {
  low: 'bg-green-600 text-white',
  medium: 'bg-orange-500 text-white',
  high: 'bg-destructive text-destructive-foreground',
  critical: 'bg-red-800 text-white'
};

const statusColors = {
  open: 'bg-muted text-muted-foreground',
  investigating: 'bg-blue-600 text-white',
  resolved: 'bg-green-600 text-white'
};

export const MobileIncidentReporting: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'open' | 'mine'>('all');

  const getSeverityBadge = (severity: string) => (
    <Badge className={severityColors[severity as keyof typeof severityColors]}>
      {severity.toUpperCase()}
    </Badge>
  );

  const getStatusBadge = (status: string) => (
    <Badge variant="outline" className={statusColors[status as keyof typeof statusColors]}>
      {status.toUpperCase()}
    </Badge>
  );

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Quick Report Button */}
      <div className="p-4 border-b border-border bg-card">
        <Button 
          className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          onClick={() => navigate('/mobile/incidents/report')}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Report New Incident
        </Button>
      </div>

      {/* Emergency Actions */}
      <div className="p-4 border-b border-border bg-muted/30">
        <h3 className="text-sm font-medium text-foreground mb-3">Emergency Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = 'tel:911'}
            className="justify-start"
          >
            <Phone className="mr-2 h-4 w-4 text-destructive" />
            Call 911
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/mobile/incidents/camera')}
            className="justify-start"
          >
            <Camera className="mr-2 h-4 w-4" />
            Take Photo
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex gap-2">
          {['all', 'open', 'mine'].map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? 'default' : 'outline'}
              size="sm"
              className="flex-1 capitalize"
              onClick={() => setFilter(filterType as any)}
            >
              {filterType === 'all' ? 'All Incidents' : filterType}
            </Button>
          ))}
        </div>
      </div>

      {/* Incident List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {mockIncidents.map((incident) => (
          <Card 
            key={incident.id} 
            className="bg-card border-border cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate(`/mobile/incidents/${incident.id}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-foreground text-sm line-clamp-2 flex-1 mr-2">
                  {incident.title}
                </h3>
                {getSeverityBadge(incident.severity)}
              </div>
              
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {incident.description}
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  {getStatusBadge(incident.status)}
                  <Badge variant="outline" className="text-xs">
                    {incident.category}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <User className="mr-1 h-3 w-3" />
                    Reported by {incident.reportedBy}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <MapPin className="mr-1 h-3 w-3" />
                      {incident.location}
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatTimeAgo(incident.reportedAt)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg bg-destructive hover:bg-destructive/90"
        onClick={() => navigate('/mobile/incidents/report')}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};