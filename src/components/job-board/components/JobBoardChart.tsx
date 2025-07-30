
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { ReactFlow, ReactFlowProvider, Background, Controls, useReactFlow, ConnectionMode, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { JobBoardWithCadet } from '../types';
import { JobRoleNode } from './JobRoleNode';
import { useJobBoardLayout } from '../hooks/useJobBoardLayout';
import { useJobBoardNodes } from '../hooks/useJobBoardNodes';
import { JobBoardToolbar } from './JobBoardToolbar';
import { ConnectionEditModal } from './ConnectionEditModal';
import { ExportModal } from './ExportModal';
import { useJobBoardExport } from '../hooks/useJobBoardExport';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface JobBoardChartProps {
  jobs: JobBoardWithCadet[];
  onRefresh?: () => void;
  onUpdateJob?: (jobId: string, updates: Partial<JobBoardWithCadet>) => void;
  readOnly?: boolean;
}

const nodeTypes = {
  jobRole: JobRoleNode,
};

const JobBoardChartInner = ({ jobs, onRefresh, onUpdateJob, readOnly = false }: JobBoardChartProps) => {
  const { savedPositionsMap, handleNodesChange, resetLayout, isResetting } = useJobBoardLayout();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isReactFlowInitialized, setIsReactFlowInitialized] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const { exportChart, isExporting } = useJobBoardExport();
  const [connectionEditModal, setConnectionEditModal] = useState<{
    isOpen: boolean;
    sourceJob: JobBoardWithCadet | null;
    targetJob: JobBoardWithCadet | null;
    connectionType: 'reports_to' | 'assistant' | null;
    connectionId: string | null;
    currentSourceHandle: string | null;
    currentTargetHandle: string | null;
  }>({
    isOpen: false,
    sourceJob: null,
    targetJob: null,
    connectionType: null,
    connectionId: null,
    currentSourceHandle: null,
    currentTargetHandle: null,
  });
  const { fitView } = useReactFlow();

  const { nodes, edges, handleNodeChange, onEdgesChange } = useJobBoardNodes({
    jobs,
    savedPositionsMap,
    handleNodesChange,
  });

  // Stabilized fitView function 
  const triggerFitView = useCallback(() => {
    if (isReactFlowInitialized && nodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 300 });
      }, 100);
    }
  }, [isReactFlowInitialized, nodes.length, fitView]);

  // Trigger fitView only when ReactFlow is first initialized and when jobs change
  const hasTriggeredInitialFitView = useRef(false);
  useEffect(() => {
    if (isReactFlowInitialized && nodes.length > 0 && !hasTriggeredInitialFitView.current) {
      triggerFitView();
      hasTriggeredInitialFitView.current = true;
    }
  }, [isReactFlowInitialized, nodes.length, triggerFitView]);

  // Trigger fitView when exiting fullscreen (but not when entering)
  const previousFullscreenState = useRef(isFullscreen);
  useEffect(() => {
    if (previousFullscreenState.current && !isFullscreen && isReactFlowInitialized && nodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 300 });
      }, 200);
    }
    previousFullscreenState.current = isFullscreen;
  }, [isFullscreen, isReactFlowInitialized, nodes.length, fitView]);

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    console.log('🔥 EDGE DOUBLE CLICK FIRED!', { readOnly, edgeId: edge.id, edge });
    
    if (readOnly) {
      console.log('❌ Read-only mode, cancelling edge edit');
      return;
    }
    event.stopPropagation();
    
    // Find the source and target jobs
    const sourceJob = jobs.find(job => job.id === edge.source);
    const targetJob = jobs.find(job => job.id === edge.target);
    
    console.log('Source job:', sourceJob, 'Target job:', targetJob);
    
    if (!sourceJob || !targetJob) {
      console.log('Missing source or target job');
      return;
    }

    // Get connection type directly from edge data
    const connectionType = edge.data?.connectionType as 'reports_to' | 'assistant' | null;

    console.log('Connection type determined:', connectionType);

    if (!connectionType) {
      console.log('No connection type found');
      return;
    }

    console.log('Opening connection edit modal');
    setConnectionEditModal({
      isOpen: true,
      sourceJob,
      targetJob,
      connectionType,
      connectionId: (edge.data?.connectionId as string) || null,
      currentSourceHandle: edge.sourceHandle || 'bottom-source',
      currentTargetHandle: edge.targetHandle || 'top-target',
    });
  }, [jobs, readOnly]);

  const handleConnectionSave = useCallback((sourceHandle: string, targetHandle: string) => {
    if (!connectionEditModal.sourceJob || !connectionEditModal.targetJob || !connectionEditModal.connectionType || !onUpdateJob) {
      return;
    }

    console.log('=== CONNECTION SAVE DEBUG ===');
    console.log('Source Job:', connectionEditModal.sourceJob.role);
    console.log('Target Job:', connectionEditModal.targetJob.role);
    console.log('Connection Type:', connectionEditModal.connectionType);
    console.log('Connection ID:', connectionEditModal.connectionId);
    console.log('Source Handle:', sourceHandle);
    console.log('Target Handle:', targetHandle);
    
    // If we have a connectionId, update the specific connection in the connections array
    if (connectionEditModal.connectionId) {
      const sourceJob = connectionEditModal.sourceJob;
      const updatedConnections = (sourceJob.connections || []).map(conn => 
        conn.id === connectionEditModal.connectionId 
          ? { 
              ...conn, 
              source_handle: sourceHandle, 
              target_handle: targetHandle 
            }
          : conn
      );

      console.log('🔄 Updating connections array:', { updatedConnections });
      onUpdateJob(sourceJob.id, { connections: updatedConnections });
    } else {
      // Fallback to legacy method for backward compatibility
      const sourceUpdates: Partial<JobBoardWithCadet> = {};
      
      if (connectionEditModal.connectionType === 'reports_to') {
        sourceUpdates.reports_to_source_handle = sourceHandle;
        console.log('Updating reports_to_source_handle to:', sourceHandle);
      } else {
        sourceUpdates.assistant_source_handle = sourceHandle;
        console.log('Updating assistant_source_handle to:', sourceHandle);
      }

      console.log('Legacy source updates:', sourceUpdates);
      onUpdateJob(connectionEditModal.sourceJob.id, sourceUpdates);
    }
    
    setConnectionEditModal({ 
      isOpen: false, 
      sourceJob: null, 
      targetJob: null, 
      connectionType: null,
      connectionId: null,
      currentSourceHandle: null,
      currentTargetHandle: null
    });
  }, [connectionEditModal, onUpdateJob]);

  const chartContent = (
    <div 
      className={`relative ${isFullscreen ? 'h-screen w-screen' : 'h-96 w-full'} border rounded-lg`}
      data-testid="job-board-chart"
    >
      <JobBoardToolbar
        onRefresh={onRefresh}
        onResetLayout={resetLayout}
        onToggleFullscreen={handleToggleFullscreen}
        onExport={handleExport}
        isResetting={isResetting}
        isFullscreen={isFullscreen}
        snapToGrid={snapToGrid}
        onToggleSnapToGrid={() => setSnapToGrid(!snapToGrid)}
      />
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodeChange}
        onEdgesChange={onEdgesChange}
        onEdgeDoubleClick={handleEdgeDoubleClick}
        nodeTypes={nodeTypes}
        fitView={false}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        connectionMode={ConnectionMode.Strict}
        connectOnClick={false}
        onConnect={() => {}}
        onInit={() => {
          setIsReactFlowInitialized(true);
        }}
        edgesReconnectable={false}
        edgesFocusable={true}
        snapToGrid={snapToGrid}
        snapGrid={[20, 20]}
        multiSelectionKeyCode={['Control', 'Meta']}
        selectionOnDrag={true}
        panOnDrag={[1, 2]}
        selectNodesOnDrag={false}
      >
        <Background />
        <Controls />
      </ReactFlow>
      
      {connectionEditModal.sourceJob && connectionEditModal.targetJob && (
        <ConnectionEditModal
          key={`${connectionEditModal.sourceJob.id}-${connectionEditModal.targetJob.id}-${connectionEditModal.connectionType}`}
          isOpen={connectionEditModal.isOpen}
          onClose={() => setConnectionEditModal({
            isOpen: false,
            sourceJob: null,
            targetJob: null,
            connectionType: null,
            connectionId: null,
            currentSourceHandle: null,
            currentTargetHandle: null,
          })}
          sourceJob={connectionEditModal.sourceJob}
          targetJob={connectionEditModal.targetJob}
          connectionType={connectionEditModal.connectionType!}
          connectionId={connectionEditModal.connectionId}
          currentSourceHandle={connectionEditModal.currentSourceHandle}
          currentTargetHandle={connectionEditModal.currentTargetHandle}
          onSave={handleConnectionSave}
        />
      )}
      
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={exportChart}
        isExporting={isExporting}
      />
    </div>
  );

  return (
    <>
      {!isFullscreen && chartContent}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-none h-screen w-screen p-0 m-0">
          <VisuallyHidden>
            <DialogTitle>Job Board Chart - Fullscreen View</DialogTitle>
          </VisuallyHidden>
          {chartContent}
        </DialogContent>
      </Dialog>
    </>
  );
};

export const JobBoardChart = ({ jobs, onRefresh, onUpdateJob, readOnly = false }: JobBoardChartProps) => {
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
        readOnly={readOnly}
      />
    </ReactFlowProvider>
  );
};
