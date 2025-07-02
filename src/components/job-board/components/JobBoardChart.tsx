
import React, { useMemo, useCallback, useEffect } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, NodeChange } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { RefreshCcw, RotateCcw, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JobBoardWithCadet } from '../types';
import { JobRoleNode } from './JobRoleNode';
import { buildJobHierarchy } from '../utils/hierarchyBuilder';
import { calculateNodePositions, DEFAULT_POSITION_CONFIG } from '../utils/nodePositioning';
import { createFlowNodes, createFlowEdges } from '../utils/flowElementFactory';
import { useJobBoardLayout } from '../hooks/useJobBoardLayout';
import { useConnectionEditor } from '../hooks/useConnectionEditor';
import { ConnectionEditingOverlay } from './ConnectionEditingOverlay';

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
  
  const { editState, startConnectionDrag, completeConnectionDrop, updateDragPosition, cancelConnectionEdit, isValidDropTarget } = useConnectionEditor(
    jobs,
    onUpdateJob || (() => {})
  );

  const initialNodesAndEdges = useMemo(() => {
    if (jobs.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Build the hierarchy
    const hierarchyResult = buildJobHierarchy(jobs);
    
    // Get saved positions and merge with automatic layout
    const savedPositions = getSavedPositions();
    const positions = calculateNodePositions(jobs, hierarchyResult.nodes, DEFAULT_POSITION_CONFIG, savedPositions);
    
    // Create React Flow elements
    const flowNodes = createFlowNodes(jobs, positions, startConnectionDrag, completeConnectionDrop, isValidDropTarget, editState);
    const flowEdges = createFlowEdges(hierarchyResult, jobs);

    console.log('Final nodes:', flowNodes.length);
    console.log('Final edges:', flowEdges.length);

    return {
      nodes: flowNodes,
      edges: flowEdges,
    };
  }, [jobs, getSavedPositions, startConnectionDrag, completeConnectionDrop, isValidDropTarget, editState]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodesAndEdges.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialNodesAndEdges.edges);

  // Handle node changes with position persistence
  const handleNodeChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
    handleNodesChange(changes, nodes);
  }, [onNodesChange, handleNodesChange, nodes]);

  // Update nodes when initialNodesAndEdges changes (for saved positions)
  useEffect(() => {
    setNodes(initialNodesAndEdges.nodes);
    setEdges(initialNodesAndEdges.edges);
  }, [initialNodesAndEdges, setNodes, setEdges]);

  const handlePrint = useCallback(() => {
    const printStyles = `
      <style>
        @page { 
          size: landscape; 
          margin: 0.5in; 
        }
        @media print {
          .react-flow { 
            width: 100% !important; 
            height: 100% !important; 
          }
          .react-flow__controls,
          .react-flow__background {
            display: none !important;
          }
        }
      </style>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const chartElement = document.querySelector('.react-flow');
      if (chartElement) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Job Board Organizational Chart</title>
              ${printStyles}
              <link rel="stylesheet" href="${window.location.origin}/node_modules/@xyflow/react/dist/style.css">
              <style>
                body { margin: 0; font-family: system-ui, sans-serif; }
                .chart-container { width: 100vw; height: 100vh; }
              </style>
            </head>
            <body>
              <div class="chart-container">
                ${chartElement.outerHTML}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    }
  }, []);

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
      
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="bg-white/90 backdrop-blur-sm"
          >
            <RefreshCcw className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={resetLayout}
          disabled={isResetting}
          className="bg-white/90 backdrop-blur-sm"
          title="Reset layout to default"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="bg-white/90 backdrop-blur-sm"
          title="Print organizational chart"
        >
          <Printer className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Drag Preview Line */}
      {editState.isDragging && editState.dragPreview?.mousePosition && (
        <svg className="absolute inset-0 pointer-events-none z-20">
          <line
            x1={editState.dragPreview.mousePosition.x}
            y1={editState.dragPreview.mousePosition.y}
            x2={editState.dragPreview.mousePosition.x + 50}
            y2={editState.dragPreview.mousePosition.y}
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        </svg>
      )}
      
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
