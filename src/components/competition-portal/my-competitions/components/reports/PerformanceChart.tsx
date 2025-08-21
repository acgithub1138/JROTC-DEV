import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

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
      <div className="flex items-center justify-center h-[500px] bg-muted/50 rounded-lg">
        <p className="text-muted-foreground">Loading chart data...</p>
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-muted/50 rounded-lg">
        <p className="text-muted-foreground">No data available for the selected criteria.</p>
      </div>
    );
  }


  return (
    <div className="w-full h-[500px]">
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