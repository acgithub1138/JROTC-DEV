import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye, Mail, Users } from 'lucide-react';
import { TeamWithMembers } from '../types';

interface TeamCardsProps {
  teams: TeamWithMembers[];
  isLoading: boolean;
  onEdit: (team: TeamWithMembers) => void;
  onDelete: (id: string) => void;
  onViewMembers: (team: TeamWithMembers) => void;
  onSendEmail: (team: TeamWithMembers) => void;
}

export const TeamCards: React.FC<TeamCardsProps> = ({
  teams,
  isLoading,
  onEdit,
  onDelete,
  onViewMembers,
  onSendEmail,
}) => {
  const getTypeColor = (type?: string) => {
    if (!type) return 'bg-gray-100 text-gray-800';
    
    switch (type.toLowerCase()) {
      case 'flight': return 'bg-blue-100 text-blue-800';
      case 'squad': return 'bg-green-100 text-green-800';
      case 'group': return 'bg-purple-100 text-purple-800';
      case 'wing': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No teams found
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {teams.map((team) => (
        <Card key={team.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{team.name}</CardTitle>
                <Badge className={getTypeColor('team')}>
                  Team
                </Badge>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>{team.member_count || 0}</span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {team.description && (
                <div className="text-sm text-gray-600">
                  <p className="line-clamp-2">{team.description}</p>
                </div>
              )}
              
              <div className="text-xs text-gray-500">
                Created: {new Date(team.created_at).toLocaleDateString()}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewMembers(team)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSendEmail(team)}
              >
                <Mail className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(team)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(team.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};