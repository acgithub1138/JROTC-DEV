import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ReportLineChartProps {
  data: any[];
  xField: string;
  yField: string;
  aggregationType: string;
}

export const ReportLineChart: React.FC<ReportLineChartProps> = ({ data, xField, yField, aggregationType }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data available for chart
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey={xField} 
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value) => [value, `${aggregationType.charAt(0).toUpperCase() + aggregationType.slice(1)} of ${yField}`]} />
        <Legend />
        <Line 
          type="monotone" 
          dataKey={yField} 
          stroke="hsl(var(--primary))" 
          strokeWidth={2}
          dot={{ fill: "hsl(var(--primary))" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};