import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';

/**
 * React Flow Mindmap View
 * Interactive node-based visualization
 */
export default function MindmapView({ concepts = [], onNodeClick, editable = true }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Convert concepts to React Flow nodes and edges
  useEffect(() => {
    console.log('🎯 MindmapView received concepts:', concepts);
    console.log('🎯 MindmapView received onNodeClick:', onNodeClick);
    if (!concepts || concepts.length === 0) {
      console.log('⚠️ No concepts to display in mindmap');
      return;
    }

    // Hierarchical layout configuration
    const LAYOUT_CONFIG = {
      rootX: 500,
      rootY: 50,
      levelYSpacing: 200,  // Vertical spacing between levels (ADJUSTABLE!)
      nodeXSpacing: 250,   // Horizontal spacing between siblings (ADJUSTABLE!)
    };

    const newNodes = [];
    const mainConcept = concepts.find(c => c.type === 'main') || concepts[0];
    const secondaryConcepts = concepts.filter(c => c.type === 'secondary');
    const tertiaryConcepts = concepts.filter(c => c.type === 'tertiary');

    // Add root node
    newNodes.push({
      id: mainConcept.id,
      type: 'custom',
      position: { x: LAYOUT_CONFIG.rootX, y: LAYOUT_CONFIG.rootY },
      data: {
        label: mainConcept.label,
        type: 'main',
      },
    });

    // Add secondary nodes (level 1) with proper spacing
    const secondaryY = LAYOUT_CONFIG.rootY + LAYOUT_CONFIG.levelYSpacing;
    const secondaryStartX = LAYOUT_CONFIG.rootX - ((secondaryConcepts.length - 1) * LAYOUT_CONFIG.nodeXSpacing / 2);

    secondaryConcepts.forEach((concept, index) => {
      newNodes.push({
        id: concept.id,
        type: 'custom',
        position: {
          x: secondaryStartX + (index * LAYOUT_CONFIG.nodeXSpacing),
          y: secondaryY,
        },
        data: {
          label: concept.label,
          type: 'secondary',
        },
      });
    });

    // Add tertiary nodes (level 2) with spacing
    const tertiaryY = secondaryY + LAYOUT_CONFIG.levelYSpacing;
    secondaryConcepts.forEach((secondary) => {
      const children = tertiaryConcepts.filter(t =>
        secondary.connections && secondary.connections.includes(t.id)
      );

      const secondaryNode = newNodes.find(n => n.id === secondary.id);
      const childStartX = secondaryNode.position.x - ((children.length - 1) * (LAYOUT_CONFIG.nodeXSpacing / 2) / 2);

      children.forEach((child, idx) => {
        newNodes.push({
          id: child.id,
          type: 'custom',
          position: {
            x: childStartX + (idx * (LAYOUT_CONFIG.nodeXSpacing / 2)),
            y: tertiaryY,
          },
          data: {
            label: child.label,
            type: 'tertiary',
          },
        });
      });
    });

    // Create edges for hierarchical structure
    const newEdges = [];

    // Main → Secondary connections
    secondaryConcepts.forEach((secondary) => {
      newEdges.push({
        id: `${mainConcept.id}-${secondary.id}`,
        source: mainConcept.id,
        target: secondary.id,
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

    // Secondary → Tertiary connections
    secondaryConcepts.forEach((secondary) => {
      if (secondary.connections && secondary.connections.length > 0) {
        secondary.connections.forEach((targetId) => {
          newEdges.push({
            id: `${secondary.id}-${targetId}`,
            source: secondary.id,
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
    console.log('🖱️🖱️🖱️ REACT FLOW onNodeClick FIRED! 🖱️🖱️🖱️');
    console.log('Event:', event);
    console.log('Node:', node);
    console.log('🔍 onNodeClick prop:', onNodeClick);
    console.log('📊 Available concepts:', concepts);

    // Find the full concept data
    const concept = concepts.find(c => c.id === node.id);
    console.log('✅ Found concept:', concept);

    if (concept && onNodeClick) {
      console.log('📞 Calling onNodeClick with concept:', concept);
      onNodeClick(concept);
    } else {
      console.warn('⚠️ Cannot call onNodeClick:', { concept, onNodeClick });
    }
  }, [concepts, onNodeClick]);

  return (
    <div className="w-full h-full bg-neutral-50 dark:bg-neutral-900 rounded-xl overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={editable ? onNodesChange : undefined}
        onEdgesChange={editable ? onEdgesChange : undefined}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={(event, node) => {
          console.log('🖱️🖱️ DOUBLE CLICK detected!');
          handleNodeClick(event, node);
        }}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
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

  // Test click handler
  const handleClick = (e) => {
    console.log('🎯 Direct node click detected!', data);
    e.stopPropagation();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
      onPointerDown={(e) => console.log('👆 Pointer down on node')}
      className={`
        px-6 py-3 rounded-lg border-2 shadow-lg cursor-pointer
        transition-all duration-200
        ${colorClass}
        ${isHovered ? 'shadow-xl' : ''}
      `}
    >
      <div className="font-medium text-sm whitespace-nowrap">
        {data.label}
      </div>
    </motion.div>
  );
}

/**
 * Empty State Component
 */
export function MindmapEmptyState({ onGenerate, hasReadings = true }) {
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
