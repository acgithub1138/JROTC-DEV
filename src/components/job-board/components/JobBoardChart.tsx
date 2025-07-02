
import React from 'react';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { JobBoardWithCadet } from '../types';
import { JobRoleNode } from './JobRoleNode';
import { useJobBoardLayout } from '../hooks/useJobBoardLayout';
import { useConnectionEditor } from '../hooks/useConnectionEditor';
import { useImageDownload } from '../hooks/useImageDownload';
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

export const JobBoardChart = ({ jobs, onRefresh, onUpdateJob }: JobBoardChartProps) => {
  const { getSavedPositions, handleNodesChange, resetLayout, isResetting } = useJobBoardLayout();
  const { downloadImage } = useImageDownload();
  
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

  if (jobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        <p>No job assignments to display in the organizational chart.</p>
      </div>
    );
  }

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
        onDownloadImage={downloadImage}
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
