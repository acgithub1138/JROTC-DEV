import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { format, parseISO } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type CompetitionEventType = Database['public']['Enums']['comp_event_type'];

interface PerformanceData {
  date: string;
  [event: string]: number | string;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  visibleCriteria: string[];
  isLoading: boolean;
}

const EVENT_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#d084d0',
  '#8dd1e1', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98'
];

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  visibleCriteria,
  isLoading
}) => {
  const [isCurved, setIsCurved] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<{ criteria: string; value: number; date: string } | null>(null);
  
  const formatTooltipDate = (value: string) => {
    try {
      return format(parseISO(value), 'MMM dd, yyyy');
    } catch {
      return value;
    }
  };

  const CustomActiveDot = (props: any) => {
    const { cx, cy, payload, dataKey } = props;
    const criteria = dataKey;
    const value = payload[criteria];
    const date = payload.date;
    
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill={props.fill}
          stroke="white"
          strokeWidth={2}
          onMouseEnter={() => setActiveTooltip({ criteria, value, date })}
          onMouseLeave={() => setActiveTooltip(null)}
        />
      </g>
    );
  };

  const formatXAxisDate = (value: string) => {
    try {
      return format(parseISO(value), 'M/d');
    } catch {
      return value;
    }
  };

  if (isLoading) {
    return (
      <Card className="h-[500px] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Performance Trends</CardTitle>
            <div className="flex items-center space-x-2">
              <Label htmlFor="curved-toggle" className="text-sm">Curved</Label>
              <Switch
                id="curved-toggle"
                checked={isCurved}
                onCheckedChange={setIsCurved}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0 || visibleCriteria.length === 0) {
    return (
      <Card className="h-[500px] flex flex-col">
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center flex-1">
          <div className="text-center">
            <p className="text-muted-foreground">
              {visibleCriteria.length === 0 
                ? 'Select scoring criteria to view performance trends'
                : 'No data available for the selected criteria'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
      <Card className="h-[500px] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Performance Trends</CardTitle>
            <div className="flex items-center space-x-2">
              <Label htmlFor="curved-toggle" className="text-sm">Curved</Label>
              <Switch
                id="curved-toggle"
                checked={isCurved}
                onCheckedChange={setIsCurved}
              />
            </div>
          </div>
        </CardHeader>
      <CardContent className="flex-1 relative">
        {activeTooltip && (
          <div 
            className="absolute z-10 bg-background border border-border rounded-lg p-2 shadow-lg pointer-events-none"
            style={{ top: 10, right: 10 }}
          >
            <p className="text-sm font-medium">{formatTooltipDate(activeTooltip.date)}</p>
            <p className="text-sm text-primary">
              {activeTooltip.criteria.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: {activeTooltip.value.toFixed(2)} (avg)
            </p>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxisDate}
            />
            <YAxis 
              label={{ value: 'Average Score', angle: -90, position: 'insideLeft' }}
            />
            {visibleCriteria.map((criteria, index) => (
              <Line
                key={criteria}
                type={isCurved ? "monotone" : "linear"}
                dataKey={criteria}
                stroke={EVENT_COLORS[index % EVENT_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={(props) => (
                  <CustomActiveDot 
                    {...props} 
                    fill={EVENT_COLORS[index % EVENT_COLORS.length]}
                    dataKey={criteria}
                  />
                )}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};