
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
  const { fitView } = useReactFlow();
  
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

  // Trigger fitView when component becomes visible or exits fullscreen
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.2, duration: 200 });
    }, 100);
    return () => clearTimeout(timer);
  }, [fitView, isFullscreen]);

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const chartContent = (
    <div 
      className={`relative ${isFullscreen ? 'h-screen w-screen' : 'h-96 w-full'} border rounded-lg`}
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
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        key={`reactflow-${isFullscreen ? 'fullscreen' : 'normal'}`}
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
