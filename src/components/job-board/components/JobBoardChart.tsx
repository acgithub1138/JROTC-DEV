
import React, { useCallback } from 'react';
import { ReactFlow, ReactFlowProvider, Background, Controls, useReactFlow, getNodesBounds, getViewportForBounds } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import { JobBoardWithCadet } from '../types';
import { JobRoleNode } from './JobRoleNode';
import { useJobBoardLayout } from '../hooks/useJobBoardLayout';
import { useConnectionEditor } from '../hooks/useConnectionEditor';
import { useJobBoardNodes } from '../hooks/useJobBoardNodes';
import { ConnectionEditingOverlay } from './ConnectionEditingOverlay';
import { JobBoardToolbar } from './JobBoardToolbar';
import { JobBoardDragPreview } from './JobBoardDragPreview';

interface JobBoardChartProps {
  jobs: JobBoardWithCadet[];
  onRefresh?: () => void;
  onUpdateJob?: (jobId: string, updates: Partial<JobBoardWithCadet>) => void;
}

const nodeTypes = {
  jobRole: JobRoleNode,
};

const JobBoardChartInner = ({ jobs, onRefresh, onUpdateJob }: JobBoardChartProps) => {
  const { getSavedPositions, handleNodesChange, resetLayout, isResetting } = useJobBoardLayout();
  const { getNodes } = useReactFlow();

  const handleDownloadImage = useCallback(() => {
    const nodes = getNodes();
    if (nodes.length === 0) return;

    const nodesBounds = getNodesBounds(nodes);
    const imageWidth = 1920;
    const imageHeight = 1080;
    
    // Calculate padding similar to fitView (20% of smaller dimension)
    const paddingPercent = 0.2;
    const padding = Math.min(imageWidth, imageHeight) * paddingPercent;
    
    // Calculate the content dimensions with padding
    const contentWidth = nodesBounds.width + padding * 2;
    const contentHeight = nodesBounds.height + padding * 2;
    
    // Calculate scale to fit content in image while maintaining aspect ratio
    const scaleX = imageWidth / contentWidth;
    const scaleY = imageHeight / contentHeight;
    const scale = Math.min(scaleX, scaleY, 2); // Cap at 2x zoom for readability
    
    // Calculate position to center the content in the image
    const scaledContentWidth = contentWidth * scale;
    const scaledContentHeight = contentHeight * scale;
    
    // Center the scaled content in the image
    const centerX = (imageWidth - scaledContentWidth) / 2;
    const centerY = (imageHeight - scaledContentHeight) / 2;
    
    // Calculate the offset to position the content bounds at the center
    const offsetX = centerX - (nodesBounds.x - padding) * scale;
    const offsetY = centerY - (nodesBounds.y - padding) * scale;

    const reactFlowElement = document.querySelector('.react-flow') as HTMLElement;
    
    if (reactFlowElement) {
      toPng(reactFlowElement, {
        backgroundColor: '#ffffff',
        width: imageWidth,
        height: imageHeight,
        style: {
          width: imageWidth.toString(),
          height: imageHeight.toString(),
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
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
  
  const { editState, startConnectionDrag, completeConnectionDrop, updateDragPosition, cancelConnectionEdit, isValidDropTarget } = useConnectionEditor(
    jobs,
    onUpdateJob || (() => {})
  );

  const { nodes, edges, handleNodeChange, onEdgesChange } = useJobBoardNodes({
    jobs,
    getSavedPositions,
    handleNodesChange,
    startConnectionDrag,
    completeConnectionDrop,
    isValidDropTarget,
    editState
  });

  return (
    <div 
      className="relative h-96 w-full border rounded-lg"
      onMouseMove={updateDragPosition}
      onMouseUp={cancelConnectionEdit}
    >
      <ConnectionEditingOverlay 
        isVisible={editState.isDragging}
        onCancel={cancelConnectionEdit}
      />
      
      <JobBoardToolbar
        onRefresh={onRefresh}
        onResetLayout={resetLayout}
        onDownloadImage={handleDownloadImage}
        isResetting={isResetting}
      />
      
      <JobBoardDragPreview
        isVisible={editState.isDragging}
        mousePosition={editState.dragPreview?.mousePosition}
      />
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodeChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export const JobBoardChart = ({ jobs, onRefresh, onUpdateJob }: JobBoardChartProps) => {
  if (jobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        <p>No job assignments to display in the organizational chart.</p>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <JobBoardChartInner 
        jobs={jobs}
        onRefresh={onRefresh}
        onUpdateJob={onUpdateJob}
      />
    </ReactFlowProvider>
  );
};
