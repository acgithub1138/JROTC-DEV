
import React, { useCallback, useState, useEffect } from 'react';
import { ReactFlow, ReactFlowProvider, Background, Controls, useReactFlow, ConnectionMode } from '@xyflow/react';
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
  const [isVisible, setIsVisible] = useState(false);
  const [isReactFlowInitialized, setIsReactFlowInitialized] = useState(false);
  const { fitView } = useReactFlow();
  
  console.log('JobBoardChartInner render - jobs count:', jobs.length, 'isFullscreen:', isFullscreen, 'isVisible:', isVisible, 'isReactFlowInitialized:', isReactFlowInitialized);
  
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

  // Consolidated fitView function that handles all scenarios
  const triggerFitView = useCallback(() => {
    if (isReactFlowInitialized && isVisible && nodes.length > 0) {
      console.log('Triggering fitView - conditions met:', { isReactFlowInitialized, isVisible, nodesCount: nodes.length });
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 300 });
      }, 100);
    } else if (isReactFlowInitialized && !isFullscreen && nodes.length > 0) {
      // Handle fullscreen exit case
      console.log('Triggering fitView after fullscreen exit');
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 300 });
      }, 200);
    }
  }, [isReactFlowInitialized, isVisible, isFullscreen, nodes.length, fitView]);

  // Use intersection observer to detect when component becomes visible
  useEffect(() => {
    const element = document.querySelector('[data-testid="job-board-chart"]');
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        console.log('Intersection observer - isIntersecting:', entry.isIntersecting);
        if (entry.isIntersecting) {
          console.log('Setting isVisible to true');
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []); // Remove isVisible dependency to prevent re-runs

  // Trigger fitView when both conditions are met
  useEffect(() => {
    triggerFitView();
  }, [triggerFitView]);

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
        connectionMode={ConnectionMode.Loose}
        connectOnClick={false}
        onConnect={() => {}}
        onInit={() => {
          console.log('ReactFlow onInit called - setting isReactFlowInitialized to true');
          setIsReactFlowInitialized(true);
        }}
        key={`reactflow-${jobs.length}`}
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
