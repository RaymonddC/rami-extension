// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { motion } from 'framer-motion';
import { Copy, Download } from 'lucide-react';

const DEBUG = false; // Set to true for verbose logging

/**
 * Normalize text for matching (removes special chars, normalizes spaces)
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Mermaid Mindmap View
 * Markdown-syntax based visualization
 * @param {Array<{id: string, label: string, type: string, connections: string[]}>} concepts
 * @param {string} title
 * @param {function} onNodeClick
 */
export default function MermaidView({ concepts = [], title = 'Mindmap', onNodeClick }) {
  // Ensure concepts is an array and has the expected structure
  const typedConcepts = Array.isArray(concepts) ? concepts : [];
  const mermaidRef = useRef(null);
  const [mermaidCode, setMermaidCode] = useState('');
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    // Initialize Mermaid with custom configuration
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      themeVariables: {
        // Increase font sizes to force more spacing
        fontSize: '18px',
        fontFamily: 'Inter, sans-serif',
      },
      mindmap: {
        padding: 80,        // Much more padding
        useMaxWidth: false, // Allow diagram to expand
      },
      // Global flowchart settings that might affect mindmap
      flowchart: {
        nodeSpacing: 100,
        rankSpacing: 120,
        curve: 'basis',
      },
    });
  }, []);

  useEffect(() => {
    if (!typedConcepts || typedConcepts.length === 0) return;

    // Generate Mermaid mindmap syntax
    const code = generateMermaidCode(typedConcepts, title);
    setMermaidCode(code);

    // Render Mermaid diagram using modern API
    if (mermaidRef.current) {
      const container = mermaidRef.current;
      // Clear previous content
      container.innerHTML = '';

      // Create a fresh div for mermaid to render into
      const div = document.createElement('div');
      div.className = 'mermaid';
      div.textContent = code;
      container.appendChild(div);

      // Use modern mermaid.run() API
      mermaid.run({ nodes: [div] })
        .then(() => {
          if (DEBUG) console.log('✅ Mermaid rendered successfully');

          // Add click handlers to mermaid nodes after rendering
          if (onNodeClick && mermaidRef.current) {
            const container = mermaidRef.current;
            const svg = container.querySelector('svg');
            if (svg) {
              const nodeGroups = svg.querySelectorAll('g');
              const handledElements = new Set();

              nodeGroups.forEach((nodeGroup) => {
                const textElement = nodeGroup.querySelector('text');
                if (!textElement) return;

                const label = textElement.textContent.trim();
                if (!label) return;

                // Use normalized matching to find concept
                const normalizedLabel = normalizeText(label);
                const concept = typedConcepts.find(c => normalizeText(c.label) === normalizedLabel);

                if (concept && !handledElements.has(nodeGroup)) {
                  handledElements.add(nodeGroup);
                  nodeGroup.style.cursor = 'pointer';
                  nodeGroup.style.userSelect = 'none';

                  // Add visual feedback on hover
                  nodeGroup.addEventListener('mouseenter', () => {
                    if (textElement) textElement.style.fontWeight = 'bold';
                  });
                  nodeGroup.addEventListener('mouseleave', () => {
                    if (textElement) textElement.style.fontWeight = 'normal';
                  });

                  // Add click handler with closure
                  nodeGroup.addEventListener('click', ((clickedConcept) => {
                    return (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onNodeClick(clickedConcept);
                    };
                  })(concept));
                } else if (!concept && DEBUG) {
                  console.log(`⚠️ No match for "${label}"`);
                }
              });

              if (DEBUG) console.log(`✅ Set up ${handledElements.size} click handlers`);
            }
          }
        })
        .catch((error) => {
          console.error('❌ Mermaid rendering error:', error);
        });
    }
  }, [typedConcepts, title, onNodeClick]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const downloadSVG = () => {
    if (!mermaidRef.current) return;
    const container = mermaidRef.current;
    const svg = container.querySelector('svg');
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

        <div className="p-12 flex items-center justify-center min-h-[500px] mermaid-container">
          <div
            ref={mermaidRef}
            className="w-full min-h-[400px]"
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

  // Add secondary concepts with extra spacing
  secondaryConcepts.forEach((secondary, index) => {
    // Add extra newline before first child to create spacing
    if (index === 0) {
      code += `\n`;
    }
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
