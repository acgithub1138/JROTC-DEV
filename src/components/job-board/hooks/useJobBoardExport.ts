import { useCallback, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { toPng, toJpeg, toSvg } from 'html-to-image';
import { toast } from '@/hooks/use-toast';

export interface ExportOptions {
  format: 'png' | 'jpeg' | 'svg';
  quality: 1 | 2 | 3;
  area: 'full' | 'visible';
  includeBackground: boolean;
}

export const useJobBoardExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { fitView, getViewport, setViewport, getNodes } = useReactFlow();

  const exportChart = useCallback(async (options: ExportOptions) => {
    setIsExporting(true);
    
    try {
      const chartElement = document.querySelector('.react-flow') as HTMLElement;
      if (!chartElement) {
        throw new Error('Chart element not found');
      }

      // Store current viewport
      const currentViewport = getViewport();
      
      // If exporting full chart, fit view temporarily
      if (options.area === 'full') {
        const nodes = getNodes();
        if (nodes.length > 0) {
          fitView({ padding: 0.1, duration: 0 });
          // Wait for view to update
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const exportOptions = {
        quality: options.quality,
        pixelRatio: options.quality,
        backgroundColor: options.includeBackground ? '#ffffff' : 'transparent',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
      };

      let dataUrl: string;
      let fileExtension: string;
      
      switch (options.format) {
        case 'png':
          dataUrl = await toPng(chartElement, exportOptions);
          fileExtension = 'png';
          break;
        case 'jpeg':
          dataUrl = await toJpeg(chartElement, { ...exportOptions, backgroundColor: '#ffffff' });
          fileExtension = 'jpg';
          break;
        case 'svg':
          dataUrl = await toSvg(chartElement, exportOptions);
          fileExtension = 'svg';
          break;
        default:
          throw new Error('Unsupported format');
      }

      // Create download link
      const link = document.createElement('a');
      link.download = `job-board-chart-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      link.href = dataUrl;
      link.click();

      // Restore original viewport if it was changed
      if (options.area === 'full') {
        setViewport(currentViewport);
      }

      toast({
        title: 'Export Successful',
        description: `Job board chart exported as ${options.format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'There was an error exporting the chart. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [fitView, getViewport, setViewport, getNodes]);

  return {
    exportChart,
    isExporting,
  };
};