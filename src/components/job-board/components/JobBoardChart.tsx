
import React, { useCallback, useState, useEffect } from 'react';
import { ReactFlow, ReactFlowProvider, Background, Controls, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { JobBoardWithCadet } from '../types';
import { JobRoleNode } from './JobRoleNode';
import { useJobBoardLayout } from '../hooks/useJobBoardLayout';
import { useConnectionEditor } from '../hooks/useConnectionEditor';
import { useJobBoardNodes } from '../hooks/useJobBoardNodes';
import { ConnectionEditingOverlay } from './ConnectionEditingOverlay';
import { JobBoardToolbar } from './JobBoardToolbar';
import { JobBoardDragPreview } from './JobBoardDragPreview';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const { fitView } = useReactFlow();
  
  console.log('JobBoardChartInner render - jobs count:', jobs.length, 'isFullscreen:', isFullscreen);
  
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

  console.log('Nodes and edges:', { nodesCount: nodes.length, edgesCount: edges.length });

  // Use intersection observer to detect when component becomes visible
  useEffect(() => {
    const element = document.querySelector('[data-testid="job-board-chart"]');
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        console.log('Intersection observer - isIntersecting:', entry.isIntersecting);
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          // Delay fitView to ensure the component is properly rendered
          setTimeout(() => {
            console.log('Calling fitView from intersection observer');
            fitView({ padding: 0.2, duration: 300 });
          }, 150);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [fitView, isVisible]);

  // Handle fullscreen changes
  useEffect(() => {
    if (!isFullscreen) {
      // When exiting fullscreen, wait a bit then trigger fitView
      const timer = setTimeout(() => {
        console.log('Calling fitView after fullscreen exit');
        fitView({ padding: 0.2, duration: 300 });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen, fitView]);

  const handleToggleFullscreen = () => {
    console.log('Toggling fullscreen:', !isFullscreen);
    setIsFullscreen(!isFullscreen);
  };

  const chartContent = (
    <div 
      className={`relative ${isFullscreen ? 'h-screen w-screen' : 'h-96 w-full'} border rounded-lg`}
      onMouseMove={updateDragPosition}
      onMouseUp={cancelConnectionEdit}
      data-testid="job-board-chart"
    >
      <ConnectionEditingOverlay 
        isVisible={editState.isDragging}
        onCancel={cancelConnectionEdit}
      />
      
      <JobBoardToolbar
        onRefresh={onRefresh}
        onResetLayout={resetLayout}
        onToggleFullscreen={handleToggleFullscreen}
        isResetting={isResetting}
        isFullscreen={isFullscreen}
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
        fitView={false}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        onInit={() => {
          console.log('ReactFlow onInit called');
          setTimeout(() => {
            console.log('Calling fitView from onInit');
            fitView({ padding: 0.2, duration: 300 });
          }, 100);
        }}
        key={`reactflow-${isFullscreen ? 'fullscreen' : 'normal'}-${jobs.length}`}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );

  return (
    <>
      {!isFullscreen && chartContent}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-none h-screen w-screen p-0 m-0">
          {chartContent}
        </DialogContent>
      </Dialog>
    </>
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
    <ReactFlowProvider key={`chart-${jobs.length}`}>
      <JobBoardChartInner 
        jobs={jobs}
        onRefresh={onRefresh}
        onUpdateJob={onUpdateJob}
      />
    </ReactFlowProvider>
  );
};
