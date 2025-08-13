import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Medal, Users, Eye, FileText } from 'lucide-react';

export const MobileHostResults: React.FC = () => {
  const navigate = useNavigate();
  
  // Placeholder data - in real implementation, this would come from the competition results
  const results = [
    {
      id: '1',
      eventName: 'Armed Regulation',
      schoolCount: 8,
      completedScores: 6,
      totalScores: 8,
      topSchool: 'Lincoln High School',
      topScore: 98.5,
    },
    {
      id: '2', 
      eventName: 'Unarmed Exhibition',
      schoolCount: 12,
      completedScores: 12,
      totalScores: 12,
      topSchool: 'Roosevelt Academy',
      topScore: 96.2,
    },
    {
      id: '3',
      eventName: 'Color Guard',
      schoolCount: 6,
      completedScores: 4,
      totalScores: 6,
      topSchool: 'Washington Prep',
      topScore: 94.8,
    },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/mobile/competition-portal/host')}
            className="mr-3 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Results</h1>
            <p className="text-sm text-muted-foreground">Competition scores and results</p>
          </div>
        </div>
        <Button size="sm" className="bg-primary text-primary-foreground">
          <FileText size={16} className="mr-1" />
          Export
        </Button>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {results.length > 0 ? (
          results.map((result) => (
            <Card key={result.id} className="bg-card border-border hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm line-clamp-2">
                        {result.eventName}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center">
                        <Trophy size={12} className="mr-1" />
                        Leading: {result.topSchool}
                      </p>
                    </div>
                    <Badge 
                      variant={result.completedScores === result.totalScores ? "default" : "secondary"} 
                      className="text-xs"
                    >
                      {result.completedScores === result.totalScores ? 'Complete' : 'In Progress'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Users size={12} className="mr-1" />
                      {result.schoolCount} schools
                    </div>
                    <div className="flex items-center">
                      <Medal size={12} className="mr-1" />
                      Top: {result.topScore}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Scores: {result.completedScores}/{result.totalScores} submitted
                    </div>
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      <Eye size={12} className="mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">No Results Available</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Results will appear here once competitions begin and scores are submitted.
              </p>
              <Button className="bg-primary text-primary-foreground">
                <FileText size={16} className="mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};