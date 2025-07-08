
import React, { useCallback, useState, useEffect } from 'react';
import { ReactFlow, ReactFlowProvider, Background, Controls, useReactFlow, ConnectionMode, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { JobBoardWithCadet } from '../types';
import { JobRoleNode } from './JobRoleNode';
import { useJobBoardLayout } from '../hooks/useJobBoardLayout';
import { useJobBoardNodes } from '../hooks/useJobBoardNodes';
import { JobBoardToolbar } from './JobBoardToolbar';
import { ConnectionEditModal } from './ConnectionEditModal';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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
  const { getSavedPositions, handleNodesChange, resetLayout, isResetting } = useJobBoardLayout();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isReactFlowInitialized, setIsReactFlowInitialized] = useState(false);
  const [connectionEditModal, setConnectionEditModal] = useState<{
    isOpen: boolean;
    sourceJob: JobBoardWithCadet | null;
    targetJob: JobBoardWithCadet | null;
    connectionType: 'reports_to' | 'assistant' | null;
    currentSourceHandle: string;
    currentTargetHandle: string;
  }>({
    isOpen: false,
    sourceJob: null,
    targetJob: null,
    connectionType: null,
    currentSourceHandle: '',
    currentTargetHandle: '',
  });
  const { fitView } = useReactFlow();
  
  console.log('JobBoardChartInner render - jobs count:', jobs.length, 'isFullscreen:', isFullscreen, 'isVisible:', isVisible, 'isReactFlowInitialized:', isReactFlowInitialized);

  const { nodes, edges, handleNodeChange, onEdgesChange } = useJobBoardNodes({
    jobs,
    getSavedPositions,
    handleNodesChange
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

  const handleEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    if (readOnly) return; // Don't allow editing in read-only mode
    
    console.log('Edge double-clicked:', edge);
    event.stopPropagation();
    
    // Find the source and target jobs
    const sourceJob = jobs.find(job => job.id === edge.source);
    const targetJob = jobs.find(job => job.id === edge.target);
    
    console.log('Source job:', sourceJob, 'Target job:', targetJob);
    
    if (!sourceJob || !targetJob) {
      console.log('Missing source or target job');
      return;
    }

    // Determine connection type based on the edge
    let connectionType: 'reports_to' | 'assistant' | null = null;
    if (targetJob.reports_to === sourceJob.role) {
      connectionType = 'reports_to';
    } else if (targetJob.assistant === sourceJob.role) {
      connectionType = 'assistant';
    }

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
      currentSourceHandle: edge.sourceHandle || 'bottom-source',
      currentTargetHandle: edge.targetHandle || 'top-target',
    });
  }, [jobs, readOnly]);

  const handleConnectionSave = useCallback((sourceHandle: string, targetHandle: string) => {
    if (!connectionEditModal.sourceJob || !connectionEditModal.targetJob || !connectionEditModal.connectionType || !onUpdateJob) {
      return;
    }

    const updates: Partial<JobBoardWithCadet> = {};
    
    if (connectionEditModal.connectionType === 'reports_to') {
      updates.reports_to_source_handle = sourceHandle;
      updates.reports_to_target_handle = targetHandle;
    } else {
      updates.assistant_source_handle = sourceHandle;
      updates.assistant_target_handle = targetHandle;
    }

    onUpdateJob(connectionEditModal.sourceJob.id, updates);
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
        isResetting={isResetting}
        isFullscreen={isFullscreen}
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
          console.log('ReactFlow onInit called - setting isReactFlowInitialized to true');
          setIsReactFlowInitialized(true);
        }}
        key={`reactflow-${jobs.length}`}
      >
        <Background />
        <Controls />
      </ReactFlow>
      
      {connectionEditModal.sourceJob && connectionEditModal.targetJob && (
        <ConnectionEditModal
          isOpen={connectionEditModal.isOpen}
          onClose={() => setConnectionEditModal(prev => ({ ...prev, isOpen: false }))}
          sourceJob={connectionEditModal.sourceJob}
          targetJob={connectionEditModal.targetJob}
          connectionType={connectionEditModal.connectionType!}
          currentSourceHandle={connectionEditModal.currentSourceHandle}
          currentTargetHandle={connectionEditModal.currentTargetHandle}
          onSave={handleConnectionSave}
        />
      )}
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

export const JobBoardChart = ({ jobs, onRefresh, onUpdateJob, readOnly = false }: JobBoardChartProps) => {
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
        readOnly={readOnly}
      />
    </ReactFlowProvider>
  );
};
