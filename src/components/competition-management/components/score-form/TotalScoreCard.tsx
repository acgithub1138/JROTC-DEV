import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface TotalScoreCardProps {
  totalPoints: number;
}

export const TotalScoreCard: React.FC<TotalScoreCardProps> = ({ totalPoints }) => {
  return (
    <Card>
      <CardContent className="py-[4px]">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-left">Total Score</span>
          <div className={`text-2xl font-bold ${totalPoints >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {totalPoints} points
          </div>
        </div>
      </CardContent>
    </Card>
  );
};