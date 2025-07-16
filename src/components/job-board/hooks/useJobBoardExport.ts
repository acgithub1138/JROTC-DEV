import { useCallback, useState } from 'react';
import { useReactFlow, getNodesBounds, getViewportForBounds } from '@xyflow/react';
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
  const { fitView, getViewport, setViewport, getNodes, getEdges } = useReactFlow();

  const exportChart = useCallback(async (options: ExportOptions) => {
    setIsExporting(true);
    
    try {
      // Find the main React Flow container (contains both nodes and edges)
      const reactFlowElement = document.querySelector('.react-flow') as HTMLElement;
      if (!reactFlowElement) {
        throw new Error('React Flow container not found');
      }

      // Store current viewport
      const currentViewport = getViewport();
      
      // If exporting full chart, calculate bounds and fit view
      if (options.area === 'full') {
        const nodes = getNodes();
        const edges = getEdges();
        
        if (nodes.length > 0) {
          // Calculate bounds that include all nodes
          const nodesBounds = getNodesBounds(nodes);
          
          // Add padding to the bounds
          const padding = 50;
          const viewport = getViewportForBounds(
            {
              x: nodesBounds.x - padding,
              y: nodesBounds.y - padding,
              width: nodesBounds.width + padding * 2,
              height: nodesBounds.height + padding * 2,
            },
            reactFlowElement.clientWidth,
            reactFlowElement.clientHeight,
            0.1, // min zoom
            2,   // max zoom
            0.1  // default zoom
          );
          
          // Apply the calculated viewport
          setViewport(viewport);
          
          // Wait for viewport to update and elements to render
          await new Promise(resolve => setTimeout(resolve, 500));
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
        // Include specific styles for React Flow elements
        filter: (node: Element) => {
          // Include all React Flow related elements
          if (node.classList) {
            return !node.classList.contains('react-flow__controls') && 
                   !node.classList.contains('react-flow__minimap');
          }
          return true;
        },
      };

      let dataUrl: string;
      let fileExtension: string;
      
      switch (options.format) {
        case 'png':
          dataUrl = await toPng(reactFlowElement, exportOptions);
          fileExtension = 'png';
          break;
        case 'jpeg':
          dataUrl = await toJpeg(reactFlowElement, { ...exportOptions, backgroundColor: '#ffffff' });
          fileExtension = 'jpg';
          break;
        case 'svg':
          dataUrl = await toSvg(reactFlowElement, exportOptions);
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
        description: `Job board chart exported as ${options.format.toUpperCase()} with connections`,
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
  }, [fitView, getViewport, setViewport, getNodes, getEdges]);

  return {
    exportChart,
    isExporting,
  };
};