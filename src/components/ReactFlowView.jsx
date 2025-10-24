import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';

/**
 * React Flow Mindmap View
 * Interactive node-based visualization
 */
export default function ReactFlowView({ concepts = [], onNodeClick, editable = true }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Convert concepts to React Flow nodes and edges
  useEffect(() => {
    console.log('🎯 ReactFlowView received concepts:', concepts);
    console.log('🎯 ReactFlowView received onNodeClick:', onNodeClick);
    if (!concepts || concepts.length === 0) {
      console.log('⚠️ No concepts to display in mindmap');
      return;
    }

    // Circular layout - place nodes in a circle
    const newNodes = concepts.map((concept, index) => {
      const angle = (index / concepts.length) * 2 * Math.PI;
      const radius = concepts.length > 1 ? 300 : 0;

      return {
        id: concept.id,
        type: 'custom',
        position: {
          x: 400 + radius * Math.cos(angle),
          y: 300 + radius * Math.sin(angle),
        },
        data: {
          label: concept.label,
          type: concept.type || 'secondary',
          concept: concept, // Pass full concept data for click handling
        },
      };
    });

    // Create edges from connections
    const newEdges = [];
    concepts.forEach((concept) => {
      if (concept.connections && concept.connections.length > 0) {
        concept.connections.forEach((targetId) => {
          newEdges.push({
            id: `${concept.id}-${targetId}`,
            source: concept.id,
            target: targetId,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#f97316', strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: '#f97316',
            },
          });
        });
      }
    });

    console.log('🔗 Created edges:', newEdges);
    console.log('📊 Total nodes:', newNodes.length, 'Total edges:', newEdges.length);

    setNodes(newNodes);
    setEdges(newEdges);
  }, [concepts, setNodes, setEdges, onNodeClick]);

  const onConnect = useCallback(
    (params) => {
      if (editable) {
        setEdges((eds) => addEdge(params, eds));
      }
    },
    [editable, setEdges]
  );

  const nodeTypes = {
    custom: CustomNode,
  };

  // Handle node clicks via React Flow's event system
  const handleNodeClick = useCallback((event, node) => {
    console.log('🖱️ ReactFlow node clicked:', node);

    // Get concept data from node.data (we passed it there)
    const concept = node.data.concept;
    console.log('✅ Concept from node data:', concept);

    if (concept && onNodeClick) {
      console.log('📞 Calling onNodeClick with concept:', concept);
      onNodeClick(concept);
    } else {
      console.warn('⚠️ Cannot call onNodeClick:', { concept, onNodeClick });
    }
  }, [onNodeClick]);

  return (
    <div className="w-full h-full bg-neutral-50 dark:bg-neutral-900 rounded-xl overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={editable ? onNodesChange : undefined}
        onEdgesChange={editable ? onEdgesChange : undefined}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        panOnDrag={true}
        panOnScroll={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        minZoom={0.5}
        maxZoom={2}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#94a3b8" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.data.type === 'main') return '#f97316';
            return '#64748b';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}

/**
 * Custom Node Component
 */
function CustomNode({ data }) {
  const [isHovered, setIsHovered] = useState(false);

  const typeColors = {
    main: 'bg-primary-500 text-white border-primary-600',
    secondary: 'bg-blue-500 text-white border-blue-600',
    tertiary: 'bg-purple-500 text-white border-purple-600',
    default: 'bg-neutral-600 text-white border-neutral-700',
  };

  const colorClass = typeColors[data.type] || typeColors.default;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`
        px-6 py-3 rounded-lg border-2 shadow-lg cursor-pointer
        transition-all duration-200
        ${colorClass}
        ${isHovered ? 'shadow-xl' : ''}
      `}
    >
      {/* Connection handles - these appear when hovering to create connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-white border-2 border-primary-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-white border-2 border-primary-500"
      />
      <Handle
        type="source"
        position={Position.Left}
        className="w-3 h-3 !bg-white border-2 border-primary-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-white border-2 border-primary-500"
      />

      <div className="font-medium text-sm whitespace-nowrap">
        {data.label}
      </div>
    </motion.div>
  );
}

/**
 * Empty State Component
 */
export function ReactFlowEmptyState({ onGenerate, hasReadings = true }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 rounded-xl">
      <div className="text-center max-w-md p-8">
        <div className="text-6xl mb-4">🧠</div>
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          No Mindmap Yet
        </h3>
        {hasReadings ? (
          <>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Generate a mindmap from your reading to visualize key concepts and their connections.
            </p>
            {onGenerate && (
              <button onClick={onGenerate} className="btn-primary">
                Generate Mindmap
              </button>
            )}
          </>
        ) : (
          <>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Save some pages from the web first, then come back to generate a mindmap.
            </p>
            <button 
              onClick={() => window.location.href = '#readings'} 
              className="btn-primary"
            >
              Go to Readings
            </button>
          </>
        )}
      </div>
    </div>
  );
}
