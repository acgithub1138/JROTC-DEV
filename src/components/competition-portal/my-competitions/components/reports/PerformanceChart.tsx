import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface PerformanceData {
  date: string;
  [key: string]: any;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  visibleCriteria: string[];
  criteriaColors?: Record<string, string>;
  isLoading?: boolean;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  visibleCriteria,
  criteriaColors = {},
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted/50 rounded-lg">
        <p className="text-muted-foreground">Loading chart data...</p>
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted/50 rounded-lg">
        <p className="text-muted-foreground">No data available for the selected criteria.</p>
      </div>
    );
  }

  const formatTooltip = (value: any, name: string) => {
    if (typeof value === 'number') {
      return [value.toFixed(2), name];
    }
    return [value, name];
  };

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            formatter={formatTooltip}
            labelStyle={{ fontWeight: 'bold' }}
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
          />
          <Legend />
          {visibleCriteria.map((criteria) => (
            <Line
              key={criteria}
              type="monotone"
              dataKey={criteria}
              stroke={criteriaColors[criteria] || '#8884d8'}
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};