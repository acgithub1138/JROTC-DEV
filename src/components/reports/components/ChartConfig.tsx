import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, PieChart } from 'lucide-react';

interface ChartConfigProps {
  selectedFields: string[];
  chartType: string;
  xField: string;
  yField: string;
  onChartTypeChange: (type: string) => void;
  onXFieldChange: (field: string) => void;
  onYFieldChange: (field: string) => void;
}

export const ChartConfig: React.FC<ChartConfigProps> = ({
  selectedFields,
  chartType,
  xField,
  yField,
  onChartTypeChange,
  onXFieldChange,
  onYFieldChange
}) => {
  const chartTypes = [
    { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { value: 'line', label: 'Line Chart', icon: TrendingUp },
    { value: 'pie', label: 'Pie Chart', icon: PieChart },
  ];

  if (selectedFields.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chart Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            Select fields first to configure charts
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chart Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart Type */}
        <div className="space-y-2">
          <Label>Chart Type</Label>
          <Select value={chartType} onValueChange={onChartTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select chart type..." />
            </SelectTrigger>
            <SelectContent>
              {chartTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* X-Axis Field */}
        <div className="space-y-2">
          <Label>{chartType === 'pie' ? 'Category Field' : 'X-Axis Field'}</Label>
          <Select value={xField} onValueChange={onXFieldChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select field..." />
            </SelectTrigger>
            <SelectContent>
              {selectedFields.map((field) => (
                <SelectItem key={field} value={field}>
                  {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Y-Axis Field */}
        <div className="space-y-2">
          <Label>{chartType === 'pie' ? 'Value Field' : 'Y-Axis Field'}</Label>
          <Select value={yField} onValueChange={onYFieldChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select field..." />
            </SelectTrigger>
            <SelectContent>
              {selectedFields.map((field) => (
                <SelectItem key={field} value={field}>
                  {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};