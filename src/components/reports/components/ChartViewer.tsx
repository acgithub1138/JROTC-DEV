import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportBarChart } from './ReportBarChart';
import { ReportLineChart } from './ReportLineChart';
import { ReportPieChart } from './ReportPieChart';
import { Badge } from '@/components/ui/badge';
import { aggregateData } from '../utils/aggregation';

interface ChartViewerProps {
  data: any[];
  chartType: string;
  xField: string;
  yField: string;
  aggregationType: string;
  selectedTable: string;
}

export const ChartViewer: React.FC<ChartViewerProps> = ({
  data,
  chartType,
  xField,
  yField,
  aggregationType,
  selectedTable
}) => {
  if (!chartType || !xField || !yField || !aggregationType) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chart View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Configure chart settings to view visualization
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    // Process data with aggregation
    const aggregatedData = aggregateData(data, xField, yField, aggregationType);
    
    switch (chartType) {
      case 'bar':
        return <ReportBarChart data={aggregatedData} xField={xField} yField={yField} aggregationType={aggregationType} />;
      case 'line':
        return <ReportLineChart data={aggregatedData} xField={xField} yField={yField} aggregationType={aggregationType} />;
      case 'pie':
        return <ReportPieChart data={aggregatedData} nameField={xField} valueField={yField} aggregationType={aggregationType} />;
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            Select a chart type to view visualization
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Chart Visualization</CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">{selectedTable}</Badge>
            <Badge variant="outline">{chartType} chart</Badge>
            <Badge variant="outline">{aggregationType}</Badge>
            <span className="text-sm text-muted-foreground">
              {data.length} records
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
};