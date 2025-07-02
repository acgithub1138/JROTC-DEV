import { useCallback } from 'react';
import { useReactFlow, getNodesBounds, getViewportForBounds } from '@xyflow/react';
import { toPng } from 'html-to-image';

export const useImageDownload = () => {
  const { getNodes } = useReactFlow();

  const downloadImage = useCallback(() => {
    const nodesBounds = getNodesBounds(getNodes());
    const imageWidth = 1920;
    const imageHeight = 1080;
    const viewport = getViewportForBounds(nodesBounds, imageWidth, imageHeight, 0.5, 2, 0.5);

    const reactFlowElement = document.querySelector('.react-flow') as HTMLElement;
    
    if (reactFlowElement) {
      toPng(reactFlowElement, {
        backgroundColor: '#ffffff',
        width: imageWidth,
        height: imageHeight,
        style: {
          width: imageWidth.toString(),
          height: imageHeight.toString(),
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        },
        filter: (node) => {
          // Hide handles and controls in the exported image
          if (
            node?.classList?.contains('react-flow__handle') ||
            node?.classList?.contains('react-flow__controls') ||
            node?.classList?.contains('react-flow__panel')
          ) {
            return false;
          }
          return true;
        },
      })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = 'job-board-chart.png';
          link.href = dataUrl;
          link.click();
        })
        .catch((error) => {
          console.error('Error downloading image:', error);
        });
    }
  }, [getNodes]);

  return { downloadImage };
};