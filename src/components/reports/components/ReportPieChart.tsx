import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ReportPieChartProps {
  data: any[];
  nameField: string;
  valueField: string;
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

export const ReportPieChart: React.FC<ReportPieChartProps> = ({ data, nameField, valueField }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data available for chart
      </div>
    );
  }

  // Process data for pie chart - group by nameField and count or sum valueField
  const processedData = data.reduce((acc: any[], item) => {
    const name = item[nameField] || 'Unknown';
    const value = typeof item[valueField] === 'number' ? item[valueField] : 1;
    
    const existing = acc.find(d => d.name === name);
    if (existing) {
      existing.value += value;
    } else {
      acc.push({ name, value });
    }
    return acc;
  }, []);

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
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};