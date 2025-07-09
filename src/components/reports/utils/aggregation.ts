export const aggregateData = (
  data: any[],
  xField: string,
  yField: string,
  aggregationType: string
): any[] => {
  if (!data || data.length === 0) return [];

  // Group data by xField
  const grouped = data.reduce((acc: any, item) => {
    const xValue = item[xField] || 'Unknown';
    const yValue = item[yField];
    
    if (!acc[xValue]) {
      acc[xValue] = {
        [xField]: xValue,
        values: [],
        count: 0
      };
    }
    
    acc[xValue].count += 1;
    
    // Only add numeric values for sum and average calculations
    if (typeof yValue === 'number') {
      acc[xValue].values.push(yValue);
    }
    
    return acc;
  }, {});

  // Calculate aggregation for each group
  return Object.values(grouped).map((group: any) => {
    let aggregatedValue: number;
    
    switch (aggregationType) {
      case 'count':
        aggregatedValue = group.count;
        break;
      case 'sum':
        aggregatedValue = group.values.reduce((sum: number, val: number) => sum + val, 0);
        break;
      case 'average':
        aggregatedValue = group.values.length > 0 
          ? group.values.reduce((sum: number, val: number) => sum + val, 0) / group.values.length 
          : 0;
        break;
      default:
        aggregatedValue = group.count;
    }
    
    return {
      [xField]: group[xField],
      [yField]: aggregatedValue,
      aggregatedValue // Keep this for consistent access
    };
  });
};