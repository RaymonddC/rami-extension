import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
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
    const mainConcept = mainConcepts[0];

    // ONLY show secondary concepts that are connected to the main concept
    const secondaryConcepts = concepts.filter(c => {
      if (c.type !== 'secondary') return false;
      // Check if main concept's connections include this secondary
      return mainConcept && mainConcept.connections && mainConcept.connections.includes(c.id);
    });

    const tertiaryConcepts = concepts.filter(c => c.type === 'tertiary');

    const CENTER_X = 600;
    const CENTER_Y = 400;
    const INNER_RADIUS = 400;  // Distance from center to secondary nodes (increased for better spacing)
    const OUTER_RADIUS = 450;  // Distance from secondary to tertiary nodes (increased for better spacing)

    const newNodes = [];

    // Position main concept(s) at the center
    mainConcepts.forEach((concept, index) => {
      newNodes.push({
        id: concept.id,
        type: 'custom',
        position: {
          x: CENTER_X - (mainConcepts.length > 1 ? (index - 0.5) * 150 : 0), // Increased spacing between multiple main concepts
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
      const x = CENTER_X + INNER_RADIUS * Math.cos(angle);
      const y = CENTER_Y + INNER_RADIUS * Math.sin(angle);

      console.log(`Secondary node ${concept.id} (${index}/${secondaryConcepts.length}):`, {
        angle: (angle * 180 / Math.PI).toFixed(1) + '°',
        position: { x: x.toFixed(1), y: y.toFixed(1) },
        label: concept.label
      });

      newNodes.push({
        id: concept.id,
        type: 'custom',
        position: { x, y },
        data: {
          label: concept.label,
          type: concept.type,
          concept: concept,
          angle: angle, // Store angle for positioning children
        },
      });
    });

    // Position tertiary concepts around their parent secondary concepts
    // ONLY show tertiary concepts that have a parent connection
    tertiaryConcepts.forEach((concept) => {
      // Find parent secondary concept
      const parent = secondaryConcepts.find(sec =>
        sec.connections && sec.connections.includes(concept.id)
      );

      // Only add this tertiary node if it has a parent (is connected)
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
          // Spread children in an arc around the parent with wider spacing
          const arcSpan = Math.PI / 1.5; // 120 degree arc for children (increased for better spacing)
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
      }
      // Removed orphan handling - don't show disconnected nodes
    });

    // Create edges from connections - STRICT ONE-TO-MANY TREE (each node has exactly one parent)
    // Only create edges flowing DOWN the hierarchy: main -> secondary -> tertiary
    const nodeIds = new Set(newNodes.map(n => n.id));
    const newEdges = [];
    const createdEdges = new Set(); // Track edges to avoid duplicates
    const nodesWithParents = new Set(); // Track nodes that already have a parent

    // Only iterate through main and secondary concepts (parents)
    // Tertiary concepts should never be sources (leaf nodes)
    concepts.forEach((concept) => {
      // Only create edges if this is a parent node (main or secondary)
      if (concept.type !== 'tertiary' && concept.connections && concept.connections.length > 0) {
        concept.connections.forEach((targetId) => {
          const edgeId = `${concept.id}-${targetId}`;

          // Skip if edge already created or if both nodes don't exist
          if (createdEdges.has(edgeId) || !nodeIds.has(concept.id) || !nodeIds.has(targetId)) {
            return;
          }

          // CRITICAL: Skip if target already has a parent (enforce tree structure)
          if (nodesWithParents.has(targetId)) {
            return;
          }

          // Find source and target nodes
          const sourceNode = newNodes.find(n => n.id === concept.id);
          const targetNode = newNodes.find(n => n.id === targetId);

          if (!sourceNode || !targetNode) return;

          // Enforce one-to-many: only create edge if flowing down the hierarchy
          const validConnection =
            (concept.type === 'main' && targetNode.data.type === 'secondary') ||
            (concept.type === 'secondary' && targetNode.data.type === 'tertiary');

          if (!validConnection) return;

          // Mark this target as having a parent
          nodesWithParents.add(targetId);

          // Calculate smart handle positions based on relative position
          const dx = targetNode.position.x - sourceNode.position.x;
          const dy = targetNode.position.y - sourceNode.position.y;

          let sourceHandle = 'bottom';
          let targetHandle = 'top';

          // Determine best handles based on relative position
          if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal connection
            sourceHandle = dx > 0 ? 'right' : 'left';
            targetHandle = dx > 0 ? 'left-target' : 'right-target';
          } else {
            // Vertical connection
            if (dy > 0) {
              // Target is below source
              sourceHandle = 'bottom';
              targetHandle = 'top';
            } else {
              // Target is above source - use special source handle
              sourceHandle = 'top-source';
              targetHandle = 'bottom-target';
            }
          }

          newEdges.push({
            id: edgeId,
            source: concept.id,
            target: targetId,
            type: 'smoothstep',
            animated: true,
            style: {
              stroke: '#ff6b35',
              strokeWidth: 2.5,
              strokeOpacity: 0.9,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 15,
              height: 15,
              color: '#ff6b35',
            },
            sourceHandle,
            targetHandle,
            zIndex: 1, // Ensure edges render above background but below nodes
          });

          createdEdges.add(edgeId);
        });
      }
    });

    // Remove orphaned nodes (nodes with no edges at all)
    // Keep only nodes that are either the main node OR have at least one edge
    const nodesInEdges = new Set();
    newEdges.forEach(edge => {
      nodesInEdges.add(edge.source);
      nodesInEdges.add(edge.target);
    });

    const filteredNodes = newNodes.filter(node =>
      node.data.type === 'main' || nodesInEdges.has(node.id)
    );

    console.log('ReactFlow - Creating nodes:', filteredNodes.length, '(filtered from', newNodes.length, ')');
    console.log('ReactFlow - Creating edges:', newEdges.length, newEdges);

    // Debug: Check for nodes without edges
    const nodesWithoutEdges = filteredNodes.filter(node => {
      const hasEdge = newEdges.some(edge => edge.source === node.id || edge.target === node.id);
      return !hasEdge && node.data.type !== 'main';
    });
    if (nodesWithoutEdges.length > 0) {
      console.warn('⚠️ Found nodes without any edges:', nodesWithoutEdges.map(n => ({id: n.id, label: n.data.label, type: n.data.type})));
    }

    // Debug: Check edges to nodes above main (sec-5, sec-6)
    const upwardEdges = newEdges.filter(edge => {
      const sourceNode = filteredNodes.find(n => n.id === edge.source);
      const targetNode = filteredNodes.find(n => n.id === edge.target);
      if (sourceNode && targetNode) {
        return targetNode.position.y < sourceNode.position.y; // Target is above source
      }
      return false;
    });
    console.log('⬆️ Upward edges (target above source):', upwardEdges.length, upwardEdges.map(e => ({
      id: e.id,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle
    })));

    setNodes(filteredNodes);
    setEdges(newEdges);
  }, [concepts, setNodes, setEdges]);

  // Disable manual connections - users cannot add new edges
  const onConnect = useCallback(() => {
    // Do nothing - connections are read-only
  }, []);

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
        onNodeDoubleClick={() => {
          // Double-click to recenter view
          window.requestAnimationFrame(() => {
            const fitViewButton = document.querySelector('.react-flow__controls-fitview');
            if (fitViewButton) fitViewButton.click();
          });
        }}
        nodeTypes={nodeTypes}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true}
        panOnScroll={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        minZoom={0.3}
        maxZoom={2.5}
        defaultZoom={1}
        fitView
        fitViewOptions={{
          padding: 0.3, // Increased padding to accommodate larger spacing between nodes
          includeHiddenNodes: false,
          duration: 400,
        }}
        attributionPosition="bottom-left"
      >
        <Background
          color="#94a3b8"
          gap={20}
          size={1.5}
          variant="dots"
        />
        <Controls
          showZoom={true}
          showFitView={true}
          showInteractive={false}
          position="bottom-right"
        />
        <MiniMap
          nodeColor={(node) => {
            if (node.data.type === 'main') return '#f97316';
            if (node.data.type === 'secondary') return '#3b82f6';
            if (node.data.type === 'tertiary') return '#8b5cf6';
            return '#64748b';
          }}
          nodeStrokeWidth={3}
          maskColor="rgba(0, 0, 0, 0.05)"
          className="!bg-white/90 dark:!bg-neutral-800/90 !border !border-neutral-200 dark:!border-neutral-700 !rounded-lg"
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

  const typeStyles = {
    main: {
      bg: 'bg-gradient-to-br from-primary-500 to-primary-600',
      text: 'text-white',
      border: 'border-primary-600',
      shadow: 'shadow-primary-500/30',
      ring: 'ring-primary-400',
    },
    secondary: {
      bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      text: 'text-white',
      border: 'border-blue-600',
      shadow: 'shadow-blue-500/30',
      ring: 'ring-blue-400',
    },
    tertiary: {
      bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
      text: 'text-white',
      border: 'border-purple-600',
      shadow: 'shadow-purple-500/30',
      ring: 'ring-purple-400',
    },
    default: {
      bg: 'bg-gradient-to-br from-neutral-600 to-neutral-700',
      text: 'text-white',
      border: 'border-neutral-700',
      shadow: 'shadow-neutral-500/30',
      ring: 'ring-neutral-400',
    },
  };

  const styles = typeStyles[data.type] || typeStyles.default;

  return (
    <motion.div
      whileHover={{ scale: 1.08, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`
        px-6 py-3 rounded-xl border-2 cursor-pointer
        transition-all duration-300 ease-out
        ${styles.bg} ${styles.text} ${styles.border}
        ${isHovered ? `shadow-2xl ${styles.shadow} ring-2 ${styles.ring}` : 'shadow-lg'}
      `}
    >
      {/* Invisible handles for edge attachment - bidirectional for flexibility */}
      {/* Top handles - both source and target for upward/downward connections */}
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        style={{
          width: '10px',
          height: '10px',
          background: 'transparent',
          border: 'none',
          opacity: 0,
          pointerEvents: 'none'
        }}
      />
      <Handle
        id="top-source"
        type="source"
        position={Position.Top}
        style={{
          width: '10px',
          height: '10px',
          background: 'transparent',
          border: 'none',
          opacity: 0,
          pointerEvents: 'none'
        }}
      />
      {/* Bottom handles - both source and target */}
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        style={{
          width: '10px',
          height: '10px',
          background: 'transparent',
          border: 'none',
          opacity: 0,
          pointerEvents: 'none'
        }}
      />
      <Handle
        id="bottom-target"
        type="target"
        position={Position.Bottom}
        style={{
          width: '10px',
          height: '10px',
          background: 'transparent',
          border: 'none',
          opacity: 0,
          pointerEvents: 'none'
        }}
      />
      {/* Left handles - both source and target */}
      <Handle
        id="left"
        type="source"
        position={Position.Left}
        style={{
          width: '10px',
          height: '10px',
          background: 'transparent',
          border: 'none',
          opacity: 0,
          pointerEvents: 'none'
        }}
      />
      <Handle
        id="left-target"
        type="target"
        position={Position.Left}
        style={{
          width: '10px',
          height: '10px',
          background: 'transparent',
          border: 'none',
          opacity: 0,
          pointerEvents: 'none'
        }}
      />
      {/* Right handles - both source and target */}
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        style={{
          width: '10px',
          height: '10px',
          background: 'transparent',
          border: 'none',
          opacity: 0,
          pointerEvents: 'none'
        }}
      />
      <Handle
        id="right-target"
        type="target"
        position={Position.Right}
        style={{
          width: '10px',
          height: '10px',
          background: 'transparent',
          border: 'none',
          opacity: 0,
          pointerEvents: 'none'
        }}
      />

      <div className="flex flex-col items-center gap-1">
        <div className="font-semibold text-sm text-center">
          {data.label}
        </div>
        {data.type && (
          <div className="text-[10px] uppercase tracking-wider opacity-75 font-medium">
            {data.type === 'main' ? '●●●' : data.type === 'secondary' ? '●●' : '●'}
          </div>
        )}
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
            {/*{onGenerate && (*/}
            {/*  <button onClick={onGenerate} className="btn-primary">*/}
            {/*    Generate Mindmap*/}
            {/*  </button>*/}
            {/*)}*/}
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
