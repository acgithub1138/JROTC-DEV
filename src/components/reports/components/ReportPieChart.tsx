import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ReportPieChartProps {
  data: any[];
  nameField: string;
  valueField: string;
  aggregationType: string;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(210, 40%, 80%)',
  'hsl(210, 40%, 60%)',
  'hsl(210, 40%, 40%)',
  'hsl(210, 40%, 20%)',
];

export const ReportPieChart: React.FC<ReportPieChartProps> = ({ data, nameField, valueField, aggregationType }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data available for chart
      </div>
    );
  }

  // Data is already aggregated, so just use it directly
  const processedData = data.map(item => ({
    name: item[nameField] || 'Unknown',
    value: item[valueField] || 0
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={processedData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
        >
          {processedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [value, `${aggregationType.charAt(0).toUpperCase() + aggregationType.slice(1)}`]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};