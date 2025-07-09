import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportBarChart } from './ReportBarChart';
import { ReportLineChart } from './ReportLineChart';
import { ReportPieChart } from './ReportPieChart';
import { Badge } from '@/components/ui/badge';

interface ChartViewerProps {
  data: any[];
  chartType: string;
  xField: string;
  yField: string;
  selectedTable: string;
}

export const ChartViewer: React.FC<ChartViewerProps> = ({
  data,
  chartType,
  xField,
  yField,
  selectedTable
}) => {
  if (!chartType || !xField || !yField) {
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
    switch (chartType) {
      case 'bar':
        return <ReportBarChart data={data} xField={xField} yField={yField} />;
      case 'line':
        return <ReportLineChart data={data} xField={xField} yField={yField} />;
      case 'pie':
        return <ReportPieChart data={data} nameField={xField} valueField={yField} />;
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