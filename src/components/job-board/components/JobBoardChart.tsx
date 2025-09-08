
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { ReactFlow, ReactFlowProvider, Background, Controls, useReactFlow, ConnectionMode, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { JobBoardWithCadet } from '../types';
import { JobRoleNode } from './JobRoleNode';
import { useJobBoardLayout } from '../hooks/useJobBoardLayout';
import { useJobBoardNodes } from '../hooks/useJobBoardNodes';
import { useJobBoardPermissions } from '@/hooks/useModuleSpecificPermissions';
import { JobBoardToolbar } from './JobBoardToolbar';
import { ConnectionEditModal } from './ConnectionEditModal';
import { ExportModal } from './ExportModal';
import { useJobBoardExport } from '../hooks/useJobBoardExport';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface JobBoardChartProps {
  jobs: JobBoardWithCadet[];
  onRefresh?: () => void;
  onUpdateJob?: (jobId: string, updates: Partial<JobBoardWithCadet>, suppressToast?: boolean) => void;
  readOnly?: boolean;
  permissions?: {
    canAssign: boolean;
    canUpdate: boolean;
  };
}

const nodeTypes = {
  jobRole: JobRoleNode,
};

const JobBoardChartInner = React.memo(({ jobs, onRefresh, onUpdateJob, readOnly = false, permissions }: JobBoardChartProps) => {
  // Use passed permissions or fallback to hook
  const hookPermissions = useJobBoardPermissions();
  const { canAssign, canUpdate } = permissions || hookPermissions;
  const { savedPositionsMap, handleNodesChange, resetLayout, isResetting } = useJobBoardLayout(canAssign);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Chart is interactive if user can update jobs or assign roles
  const isChartReadOnly = readOnly || (!canUpdate && !canAssign);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
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

  const handleResetLayoutClick = () => {
    setShowResetConfirmation(true);
  };

  const handleResetConfirm = () => {
    resetLayout();
    setShowResetConfirmation(false);
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    console.log('Edge double click - readonly:', isChartReadOnly, 'canUpdate:', (permissions || hookPermissions).canUpdate);
    
    if (isChartReadOnly) {
      console.log('Read-only mode, cancelling edge edit');
      return;
    }
    event.stopPropagation();
    
    // Find the source and target jobs
    const sourceJob = jobs.find(job => job.id === edge.source);
    const targetJob = jobs.find(job => job.id === edge.target);
    
    if (!sourceJob || !targetJob) {
      console.log('Missing source or target job');
      return;
    }

    // Get connection type directly from edge data
    const connectionType = edge.data?.connectionType as 'reports_to' | 'assistant' | null;

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
  }, [jobs, isChartReadOnly, permissions, hookPermissions]);

  const handleConnectionSave = useCallback((sourceHandle: string, targetHandle: string) => {
    if (!connectionEditModal.sourceJob || !connectionEditModal.targetJob || !connectionEditModal.connectionType || !onUpdateJob) {
      return;
    }
    
    // Batch all updates to avoid multiple toast notifications
    const updates: Array<{ jobId: string; updates: Partial<JobBoardWithCadet> }> = [];
    
    // Check if this is a hierarchy-based connection (ID contains the pattern: jobId-assistant-jobId or jobId-jobId)
    const isHierarchyConnection = connectionEditModal.connectionId?.includes('-assistant-') || 
      (connectionEditModal.connectionId && !connectionEditModal.sourceJob.connections?.some(conn => conn.id === connectionEditModal.connectionId));
    
    if (connectionEditModal.connectionId && !isHierarchyConnection) {
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

      updates.push({ jobId: sourceJob.id, updates: { connections: updatedConnections } });
    } else {
      // Handle hierarchy-based connections - batch all updates
      
      if (connectionEditModal.connectionType === 'reports_to') {
        // Update the target job's reports_to field
        updates.push({ 
          jobId: connectionEditModal.targetJob.id, 
          updates: { reports_to: connectionEditModal.sourceJob.role }
        });
        
        // Also update/create the connection in the source job's connections array
        const sourceJob = connectionEditModal.sourceJob;
        const connectionId = `${sourceJob.id}-${connectionEditModal.targetJob.id}`;
        const updatedConnections = [...(sourceJob.connections || [])];
        
        // Find existing connection or create new one
        const existingIndex = updatedConnections.findIndex(conn => conn.id === connectionId);
        const connectionEntry = {
          id: connectionId,
          type: 'reports_to' as const,
          target_role: connectionEditModal.targetJob.role,
          source_handle: sourceHandle,
          target_handle: targetHandle
        };
        
        if (existingIndex >= 0) {
          updatedConnections[existingIndex] = connectionEntry;
        } else {
          updatedConnections.push(connectionEntry);
        }
        
        updates.push({ jobId: sourceJob.id, updates: { connections: updatedConnections } });
        
      } else if (connectionEditModal.connectionType === 'assistant') {
        // Update the target job's assistant field  
        updates.push({
          jobId: connectionEditModal.targetJob.id,
          updates: { assistant: connectionEditModal.sourceJob.role }
        });
        
        // Update/create the connection in the source job's connections array
        const sourceJob = connectionEditModal.sourceJob;
        const sourceConnectionId = `${sourceJob.id}-assistant-${connectionEditModal.targetJob.id}`;
        const updatedSourceConnections = [...(sourceJob.connections || [])];
        
        // Find existing connection or create new one for source
        const existingSourceIndex = updatedSourceConnections.findIndex(conn => conn.id === sourceConnectionId);
        const sourceConnectionEntry = {
          id: sourceConnectionId,
          type: 'assistant' as const,
          target_role: connectionEditModal.targetJob.role,
          source_handle: sourceHandle,
          target_handle: targetHandle
        };
        
        if (existingSourceIndex >= 0) {
          updatedSourceConnections[existingSourceIndex] = sourceConnectionEntry;
        } else {
          updatedSourceConnections.push(sourceConnectionEntry);
        }
        
        updates.push({ jobId: sourceJob.id, updates: { connections: updatedSourceConnections } });
        
        // Also update/create the reverse connection in the target job's connections array
        const targetJob = connectionEditModal.targetJob;
        const targetConnectionId = `${targetJob.id}-assistant-reverse-${sourceJob.id}`;
        const updatedTargetConnections = [...(targetJob.connections || [])];
        
        // Find existing reverse connection or create new one for target
        const existingTargetIndex = updatedTargetConnections.findIndex(conn => 
          conn.id === targetConnectionId || 
          (conn.type === 'assistant' && conn.target_role === sourceJob.role)
        );
        const targetConnectionEntry = {
          id: targetConnectionId,
          type: 'assistant' as const,
          target_role: sourceJob.role,
          source_handle: targetHandle, // Reverse the handles
          target_handle: sourceHandle
        };
        
        if (existingTargetIndex >= 0) {
          updatedTargetConnections[existingTargetIndex] = targetConnectionEntry;
        } else {
          updatedTargetConnections.push(targetConnectionEntry);
        }
        
        updates.push({ jobId: targetJob.id, updates: { connections: updatedTargetConnections } });
      }
    }
    
    // Execute all updates with toast suppression for all but the last one
    updates.forEach(({ jobId, updates: jobUpdates }, index) => {
      const isLastUpdate = index === updates.length - 1;
      onUpdateJob(jobId, jobUpdates, !isLastUpdate); // Suppress toast for all but last update
    });
    
    // Close the modal
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
        onResetLayout={handleResetLayoutClick}
        onToggleFullscreen={handleToggleFullscreen}
        onExport={handleExport}
        isResetting={isResetting}
        isFullscreen={isFullscreen}
        snapToGrid={snapToGrid}
        onToggleSnapToGrid={() => setSnapToGrid(!snapToGrid)}
        readOnly={isChartReadOnly}
      />
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={isChartReadOnly ? undefined : handleNodeChange}
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
        nodesDraggable={!isChartReadOnly}
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

        <AlertDialog open={showResetConfirmation} onOpenChange={setShowResetConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Layout</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to reset the layout? This will move all job cards back to their default positions and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetConfirm}>
                Reset Layout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
});

export const JobBoardChart = ({ jobs, onRefresh, onUpdateJob, readOnly = false }: JobBoardChartProps) => {
  // Get permissions at parent level to avoid multiple calls
  const permissions = useJobBoardPermissions();
  
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
        permissions={permissions}
      />
    </ReactFlowProvider>
  );
};
