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
    if (!concepts || concepts.length === 0) {
      return;
    }

    // Radial tree layout - center main concept, children radiate outward
    const mainConcepts = concepts.filter(c => c.type === 'main');
    const secondaryConcepts = concepts.filter(c => c.type === 'secondary');
    const tertiaryConcepts = concepts.filter(c => c.type === 'tertiary');

    const CENTER_X = 600;
    const CENTER_Y = 400;
    const INNER_RADIUS = 250;  // Distance from center to secondary nodes
    const OUTER_RADIUS = 200;  // Distance from secondary to tertiary nodes

    const newNodes = [];

    // Position main concept(s) at the center
    mainConcepts.forEach((concept, index) => {
      newNodes.push({
        id: concept.id,
        type: 'custom',
        position: {
          x: CENTER_X - (mainConcepts.length > 1 ? (index - 0.5) * 100 : 0),
          y: CENTER_Y,
        },
        data: {
          label: concept.label,
          type: concept.type,
          concept: concept,
        },
      });
    });

    // Position secondary concepts in a circle around the center
    secondaryConcepts.forEach((concept, index) => {
      const angle = (index / secondaryConcepts.length) * 2 * Math.PI;

      newNodes.push({
        id: concept.id,
        type: 'custom',
        position: {
          x: CENTER_X + INNER_RADIUS * Math.cos(angle),
          y: CENTER_Y + INNER_RADIUS * Math.sin(angle),
        },
        data: {
          label: concept.label,
          type: concept.type,
          concept: concept,
          angle: angle, // Store angle for positioning children
        },
      });
    });

    // Position tertiary concepts around their parent secondary concepts
    tertiaryConcepts.forEach((concept) => {
      // Find parent secondary concept
      const parent = secondaryConcepts.find(sec =>
        sec.connections && sec.connections.includes(concept.id)
      );

      if (parent) {
        const parentNode = newNodes.find(n => n.id === parent.id);
        if (parentNode) {
          // Get children of this parent to arrange them in an arc
          const siblings = tertiaryConcepts.filter(t =>
            parent.connections && parent.connections.includes(t.id)
          );
          const siblingIndex = siblings.findIndex(s => s.id === concept.id);
          const totalSiblings = siblings.length;

          // Calculate angle offset for this child
          // Spread children in an arc around the parent
          const arcSpan = Math.PI / 3; // 60 degree arc for children
          const childAngle = parentNode.data.angle +
            (siblingIndex - (totalSiblings - 1) / 2) * (arcSpan / Math.max(totalSiblings - 1, 1));

          newNodes.push({
            id: concept.id,
            type: 'custom',
            position: {
              x: parentNode.position.x + OUTER_RADIUS * Math.cos(childAngle),
              y: parentNode.position.y + OUTER_RADIUS * Math.sin(childAngle),
            },
            data: {
              label: concept.label,
              type: concept.type,
              concept: concept,
            },
          });
        }
      } else {
        // Orphan tertiary - position in outer ring at available angle
        const orphanIndex = newNodes.filter(n => n.data.type === 'tertiary').length;
        const angle = (orphanIndex / Math.max(tertiaryConcepts.length, 1)) * 2 * Math.PI;

        newNodes.push({
          id: concept.id,
          type: 'custom',
          position: {
            x: CENTER_X + (INNER_RADIUS + OUTER_RADIUS) * Math.cos(angle),
            y: CENTER_Y + (INNER_RADIUS + OUTER_RADIUS) * Math.sin(angle),
          },
          data: {
            label: concept.label,
            type: concept.type,
            concept: concept,
          },
        });
      }
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

    setNodes(newNodes);
    setEdges(newEdges);
  }, [concepts, setNodes, setEdges]);

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
    const concept = node.data.concept;
    if (concept && onNodeClick) {
      onNodeClick(concept);
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
