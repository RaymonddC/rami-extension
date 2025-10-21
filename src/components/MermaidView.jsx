import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { motion } from 'framer-motion';
import { Copy, Download } from 'lucide-react';

/**
 * Mermaid Mindmap View
 * Markdown-syntax based visualization
 */
export default function MermaidView({ concepts = [], title = 'Mindmap' }) {
  const mermaidRef = useRef(null);
  const [mermaidCode, setMermaidCode] = useState('');
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    // Initialize Mermaid
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      mindmap: {
        padding: 20,
        useMaxWidth: true,
      },
    });
  }, []);

  useEffect(() => {
    if (!concepts || concepts.length === 0) return;

    // Generate Mermaid mindmap syntax
    const code = generateMermaidCode(concepts, title);
    setMermaidCode(code);

    // Render Mermaid diagram
    if (mermaidRef.current) {
      mermaidRef.current.innerHTML = code;
      mermaid.contentLoaded();
    }
  }, [concepts, title]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const downloadSVG = () => {
    const svg = mermaidRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'mindmap.svg';
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-neutral-900 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
          Mermaid Mindmap
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCode(!showCode)}
            className="btn-ghost text-sm"
          >
            {showCode ? 'Hide' : 'Show'} Code
          </button>
          <button
            onClick={copyCode}
            className="btn-secondary p-2"
            title="Copy Mermaid code"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={downloadSVG}
            className="btn-secondary p-2"
            title="Download SVG"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {showCode && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            className="border-b border-neutral-200 dark:border-neutral-700"
          >
            <pre className="p-4 text-xs bg-neutral-50 dark:bg-neutral-850 text-neutral-900 dark:text-neutral-100 overflow-x-auto">
              <code>{mermaidCode}</code>
            </pre>
          </motion.div>
        )}

        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <div
            ref={mermaidRef}
            className="mermaid w-full"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Generate Mermaid mindmap syntax from concepts
 * Uses hierarchical structure: main -> secondary -> tertiary
 */
function generateMermaidCode(concepts, title) {
  if (!concepts || concepts.length === 0) {
    return `mindmap
  root((${title}))
    No concepts yet`;
  }

  // Find the main concept
  const mainConcept = concepts.find(c => c.type === 'main') || concepts[0];

  // Get secondary concepts (direct children of main)
  const secondaryConcepts = concepts.filter(c => c.type === 'secondary');

  // Get tertiary concepts (children of secondary)
  const tertiaryConcepts = concepts.filter(c => c.type === 'tertiary');

  let code = `mindmap
  root((${mainConcept.label}))
`;

  // Add secondary concepts
  secondaryConcepts.forEach((secondary) => {
    code += `    ${secondary.label}\n`;

    // Find tertiary concepts that are children of this secondary
    // A tertiary is a child if the secondary's connections include the tertiary's ID
    const children = tertiaryConcepts.filter(tertiary => {
      return secondary.connections && secondary.connections.includes(tertiary.id);
    });

    // Add tertiary children
    children.forEach((tertiary) => {
      code += `      ${tertiary.label}\n`;
    });
  });

  // Add any orphaned tertiary concepts (not connected to any secondary)
  const orphanedTertiary = tertiaryConcepts.filter(tertiary => {
    return !secondaryConcepts.some(secondary =>
      secondary.connections && secondary.connections.includes(tertiary.id)
    );
  });

  orphanedTertiary.forEach((tertiary) => {
    code += `    ${tertiary.label}\n`;
  });

  return code;
}

/**
 * Alternative: Generate hierarchical mindmap
 */
function generateHierarchicalMermaidCode(concepts, title) {
  if (!concepts || concepts.length === 0) {
    return `mindmap
  root((${title}))`;
  }

  const mainConcept = concepts.find(c => c.type === 'main') || concepts[0];
  const visited = new Set();

  function buildNode(concept, level = 0) {
    if (visited.has(concept.id)) return '';
    visited.add(concept.id);

    const indent = '  '.repeat(level + 1);
    let code = `${indent}${concept.label}\n`;

    if (concept.connections && concept.connections.length > 0) {
      concept.connections.forEach((connId) => {
        const connectedConcept = concepts.find(c => c.id === connId);
        if (connectedConcept) {
          code += buildNode(connectedConcept, level + 1);
        }
      });
    }

    return code;
  }

  let code = `mindmap
  root((${mainConcept.label}))
`;

  const otherConcepts = concepts.filter(c => c.id !== mainConcept.id && c.type !== 'main');
  otherConcepts.forEach((concept) => {
    if (!visited.has(concept.id)) {
      code += buildNode(concept, 0);
    }
  });

  return code;
}

/**
 * Empty State Component
 */
export function MermaidEmptyState({ onGenerate }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-white dark:bg-neutral-900 rounded-xl">
      <div className="text-center max-w-md p-8">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          No Mermaid Diagram Yet
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Generate a Mermaid mindmap to create exportable, code-based visualizations.
        </p>
        {onGenerate && (
          <button onClick={onGenerate} className="btn-primary">
            Generate Diagram
          </button>
        )}
      </div>
    </div>
  );
}
