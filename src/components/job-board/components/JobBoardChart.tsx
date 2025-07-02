
import React, { useMemo } from 'react';
import { ReactFlow, Node, Edge, Background, Controls, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JobBoardWithCadet } from '../types';
import { JobRoleNode } from './JobRoleNode';

interface JobBoardChartProps {
  jobs: JobBoardWithCadet[];
  onRefresh?: () => void;
}

const nodeTypes = {
  jobRole: JobRoleNode,
};

export const JobBoardChart = ({ jobs, onRefresh }: JobBoardChartProps) => {
  const { nodes, edges } = useMemo(() => {
    console.log('Building hierarchy with jobs:', jobs);
    
    const nodeMap = new Map<string, Node>();
    const edgeList: Edge[] = [];
    
    // Create nodes for each job
    jobs.forEach((job, index) => {
      const nodeId = job.id;
      
      nodeMap.set(nodeId, {
        id: nodeId,
        type: 'jobRole',
        position: { x: 0, y: 0 }, // Will be calculated later
        data: {
          job,
          role: job.role,
          cadetName: `${job.cadet.last_name}, ${job.cadet.first_name}`,
          rank: job.cadet.rank || '',
          grade: job.cadet.grade || '',
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });
    });

    // Create hierarchy and edges
    const rootNodes: string[] = [];
    const levelMap = new Map<string, number>();
    
    // Find root nodes (no reports_to)
    jobs.forEach((job) => {
      console.log(`Job ${job.role} reports to: ${job.reports_to || 'none'}`);
      if (!job.reports_to) {
        rootNodes.push(job.id);
        levelMap.set(job.id, 0);
      }
    });

    console.log('Root nodes:', rootNodes);

    // Build hierarchy levels
    const buildHierarchy = (nodeId: string, level: number) => {
      const currentJob = jobs.find(j => j.id === nodeId);
      if (!currentJob) return;
      
      console.log(`Building hierarchy for ${currentJob.role} at level ${level}`);
      
      // Find subordinates - those who report to this person's role
      const subordinates = jobs.filter(job => {
        const reportsToMatch = job.reports_to === currentJob.role;
        if (reportsToMatch) {
          console.log(`Found subordinate: ${job.role} reports to ${currentJob.role}`);
        }
        return reportsToMatch;
      });
      
      console.log(`${currentJob.role} has ${subordinates.length} subordinates:`, subordinates.map(s => s.role));
      
      subordinates.forEach((subordinate) => {
        levelMap.set(subordinate.id, level + 1);
        
        // Create edge from supervisor to subordinate
        edgeList.push({
          id: `${nodeId}-${subordinate.id}`,
          source: nodeId,
          target: subordinate.id,
          type: 'smoothstep',
          animated: false,
        });
        
        console.log(`Created edge: ${currentJob.role} -> ${subordinate.role}`);
        
        buildHierarchy(subordinate.id, level + 1);
      });
    };

    // Build hierarchy for each root node
    rootNodes.forEach(rootId => {
      console.log(`Starting hierarchy build from root: ${jobs.find(j => j.id === rootId)?.role}`);
      buildHierarchy(rootId, 0);
    });

    console.log('Level map:', Array.from(levelMap.entries()));
    console.log('Edges:', edgeList);

    // Position nodes
    const levelGroups = new Map<number, string[]>();
    
    // Group nodes by level
    levelMap.forEach((level, nodeId) => {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(nodeId);
    });

    console.log('Level groups:', Array.from(levelGroups.entries()));

    // Position nodes within their levels
    const nodeWidth = 300;
    const nodeHeight = 120;
    const levelHeight = 200;
    const nodeSpacing = 50;

    levelGroups.forEach((nodeIds, level) => {
      const levelWidth = nodeIds.length * (nodeWidth + nodeSpacing) - nodeSpacing;
      const startX = -levelWidth / 2;
      
      nodeIds.forEach((nodeId, index) => {
        const node = nodeMap.get(nodeId);
        if (node) {
          // Handle assistants - place them next to their supervisor
          const job = jobs.find(j => j.id === nodeId);
          const isAssistant = job?.assistant;
          
          let xPosition = startX + index * (nodeWidth + nodeSpacing);
          
          // If this is an assistant role position, adjust x position
          if (isAssistant) {
            const supervisorJob = jobs.find(j => j.role === job.reports_to);
            if (supervisorJob) {
              const supervisorNode = nodeMap.get(supervisorJob.id);
              if (supervisorNode) {
                xPosition = supervisorNode.position.x + nodeWidth + 20;
              }
            }
          }
          
          node.position = {
            x: xPosition,
            y: level * levelHeight,
          };
          
          console.log(`Positioned ${job?.role} at (${xPosition}, ${level * levelHeight})`);
        }
      });
    });

    const finalNodes = Array.from(nodeMap.values());
    console.log('Final nodes:', finalNodes.length);
    console.log('Final edges:', edgeList.length);

    return {
      nodes: finalNodes,
      edges: edgeList,
    };
  }, [jobs]);

  if (jobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        <p>No job assignments to display in the organizational chart.</p>
      </div>
    );
  }

  return (
    <div className="relative h-96 w-full border rounded-lg">
      {onRefresh && (
        <div className="absolute top-2 right-2 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="bg-white/90 backdrop-blur-sm"
          >
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
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
