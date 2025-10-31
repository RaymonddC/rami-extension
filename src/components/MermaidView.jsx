// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

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
  const [zoom, setZoom] = useState(0.3); // Start zoomed out to fit larger diagrams
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Initialize Mermaid with optimized configuration for maximum spacing and readability
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      themeVariables: {
        // Compact font size for smaller nodes
        fontSize: '13px',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        // Primary colors (main concept)
        primaryColor: '#fef3c7',
        primaryTextColor: '#78350f',
        primaryBorderColor: '#f59e0b',
        // Secondary colors (secondary concepts)
        secondaryColor: '#dbeafe',
        secondaryTextColor: '#1e40af',
        secondaryBorderColor: '#3b82f6',
        // Tertiary colors (tertiary concepts)
        tertiaryColor: '#e0e7ff',
        tertiaryTextColor: '#4338ca',
        tertiaryBorderColor: '#6366f1',
        // Line colors
        lineColor: '#94a3b8',
      },
      mindmap: {
        padding: 50,         // Increased padding to prevent overlap
        useMaxWidth: false,   // Allow diagram to expand beyond container
        maxTextSize: 300000,  // Increase text limit for large diagrams
      },
      // Allow dynamic node sizing
      wrap: true,
      htmlLabels: true,
      // Increased spacing to prevent node overlap
      flowchart: {
        nodeSpacing: 300,     // Increased horizontal spacing
        rankSpacing: 250,     // Increased vertical spacing
        curve: 'basis',
        padding: 20,
        diagramPadding: 20,
      },
    });
  }, []);

  useEffect(() => {
    if (!typedConcepts || typedConcepts.length === 0) return;

    // Generate Mermaid mindmap syntax
    const code = generateMermaidCode(typedConcepts, title);
    setMermaidCode(code);

    // Track event listeners for cleanup
    const eventListeners = [];

    // Render Mermaid diagram using modern API
    if (mermaidRef.current) {
      const container = mermaidRef.current;
      // Clear previous content
      container.innerHTML = '';

      // Wait for DOM to be ready before rendering (prevents getComputedTextLength errors)
      // Use legacy render API which pre-renders off-screen to avoid timing issues
      // NOTE: We don't need to create a div and append it - mermaid.render() works off-screen
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(async () => {
            // Verify container is visible and has dimensions
            const rect = container.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
              console.warn('⚠️ Container not visible yet, skipping render');
              return;
            }

            try {
              // Use legacy mermaid.render() API for better control and stability
              // This pre-renders the diagram OFF-SCREEN and gives us the SVG string
              // Avoids getComputedTextLength errors by not measuring in-place
              const uniqueId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const { svg: svgString } = await mermaid.render(uniqueId, code);

              if (DEBUG) console.log('✅ Mermaid rendered successfully (legacy API)');

              // Clear the container and insert the pre-rendered SVG
              container.innerHTML = svgString;

              // Now get the inserted SVG element
              const svgElement = container.querySelector('svg');
              if (!svgElement) {
                console.warn('⚠️ Mermaid rendered but no SVG found');
                return;
              }

              // Add click handlers to mermaid nodes after rendering
              if (onNodeClick) {
                // Find all clickable node elements (sections, nodes with class names)
                const nodeGroups = svgElement.querySelectorAll('g.section, g[class*="node"], g.mindmap-node');
                const handledElements = new Set();

                // Also get all text-containing groups as fallback (includes root node)
                const allGroups = svgElement.querySelectorAll('g');

                // Store main concept for root node matching
                const mainConcept = typedConcepts.find(c => c.type === 'main') || typedConcepts[0];

                const processNode = (nodeGroup) => {
                  // Skip if already handled
                  if (handledElements.has(nodeGroup)) return;

                  // Find text element (could be tspan with wrapped text)
                  const textElement = nodeGroup.querySelector('text');
                  if (!textElement) return;

                  // Get all text content including wrapped lines
                  let label = '';
                  const tspans = textElement.querySelectorAll('tspan');
                  if (tspans.length > 0) {
                    // Wrapped text with <br/> - join tspan content with spaces
                    label = Array.from(tspans).map(t => t.textContent.trim()).join(' ');
                  } else {
                    label = textElement.textContent.trim();
                  }

                  // Remove duplicate text (Mermaid sometimes renders text twice)
                  // Check if text is duplicated by comparing halves
                  const words = label.split(' ');
                  const halfLength = Math.floor(words.length / 2);

                  if (halfLength > 0) {
                    const firstHalf = words.slice(0, halfLength).join(' ');
                    const secondHalf = words.slice(halfLength).join(' ');

                    // If the label is duplicated exactly, take only the first half
                    if (firstHalf === secondHalf && firstHalf.length > 0) {
                      label = firstHalf;
                      if (DEBUG) console.log('🔄 Removed duplicate label (exact match):', label);
                    }
                  }

                  // Also check for pattern like "text text" (space-separated duplicate)
                  const labelParts = label.split(/\s{2,}/); // Split on 2+ spaces
                  if (labelParts.length === 2 && labelParts[0] === labelParts[1]) {
                    label = labelParts[0];
                    if (DEBUG) console.log('🔄 Removed duplicate label (space-separated):', label);
                  }

                  // Check for simple repetition pattern
                  const trimmed = label.trim();
                  const half = Math.floor(trimmed.length / 2);
                  if (half > 0) {
                    const firstHalfStr = trimmed.substring(0, half);
                    const secondHalfStr = trimmed.substring(half);
                    if (firstHalfStr === secondHalfStr) {
                      label = firstHalfStr;
                      if (DEBUG) console.log('🔄 Removed duplicate label (string repetition):', label);
                    }
                  }

                  if (!label) return;

                  // Use normalized matching to find concept
                  // Remove trailing "..." if text was truncated
                  const cleanLabel = label.replace(/\.\.\.$/,'').trim();
                  const normalizedLabel = normalizeText(cleanLabel);

                  // Try exact match first, then partial match (for truncated labels)
                  let concept = typedConcepts.find(c => normalizeText(c.label) === normalizedLabel);

                  if (!concept) {
                    // If no exact match, try to find by partial match (label starts with the displayed text)
                    concept = typedConcepts.find(c => normalizeText(c.label).startsWith(normalizedLabel));
                  }

                  // Special case: if still no match and this looks like the root node, use main concept
                  if (!concept && mainConcept) {
                    const mainNormalized = normalizeText(mainConcept.label);
                    // Check if this could be the main/root node
                    if (mainNormalized === normalizedLabel || mainNormalized.startsWith(normalizedLabel)) {
                      concept = mainConcept;
                      if (DEBUG) console.log('✅ Matched as root/main concept:', mainConcept.label);
                    }
                  }

                  if (DEBUG && !concept) {
                    console.log(`⚠️ No match for label: "${label}"`);
                    console.log(`   Normalized: "${normalizedLabel}"`);
                    console.log(`   Available concepts:`, typedConcepts.map(c => c.label));
                  }

                  if (concept) {
                    handledElements.add(nodeGroup);

                    // Make entire node group clickable
                    nodeGroup.style.cursor = 'pointer';
                    nodeGroup.style.userSelect = 'none';

                    // Find the shape element (rect, circle, polygon, etc.) for better click area
                    const shapeElement = nodeGroup.querySelector('rect, circle, ellipse, polygon, path[d*="M"]');
                    if (shapeElement) {
                      shapeElement.style.cursor = 'pointer';
                      shapeElement.style.pointerEvents = 'all';
                    }

                    // Create handler functions
                    const handleMouseEnter = () => {
                      if (textElement) textElement.style.fontWeight = 'bold';
                      if (shapeElement) {
                        // Don't change opacity - keep solid
                        shapeElement.style.filter = 'brightness(1.15)';
                      }
                    };
                    const handleMouseLeave = () => {
                      if (textElement) textElement.style.fontWeight = 'normal';
                      if (shapeElement) {
                        shapeElement.style.filter = 'none';
                      }
                    };
                    const handleClick = (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (onNodeClick) {
                        onNodeClick(concept);
                      }
                    };

                    // Add visual feedback on hover
                    nodeGroup.addEventListener('mouseenter', handleMouseEnter);
                    nodeGroup.addEventListener('mouseleave', handleMouseLeave);
                    nodeGroup.addEventListener('click', handleClick);

                    // Track for cleanup
                    eventListeners.push({
                      element: nodeGroup,
                      type: 'mouseenter',
                      handler: handleMouseEnter
                    });
                    eventListeners.push({
                      element: nodeGroup,
                      type: 'mouseleave',
                      handler: handleMouseLeave
                    });
                    eventListeners.push({
                      element: nodeGroup,
                      type: 'click',
                      handler: handleClick
                    });
                  }
                };

                // Process specific node groups first
                nodeGroups.forEach(processNode);

                // Process all other groups as fallback
                allGroups.forEach(processNode);

                if (DEBUG) console.log(`✅ Set up ${handledElements.size} click handlers`);
              }
            } catch (error) {
                console.error('❌ Mermaid rendering error:', error);
                console.error('   Error type:', typeof error);
                console.error('   Error message:', error?.message);
                console.error('   Error stack:', error?.stack);
                console.error('   Container dimensions:', container?.getBoundingClientRect());
                console.error('   Mermaid code length:', code?.length);

                // Show fallback error message in container
                if (container) {
                  container.innerHTML = `
                    <div style="padding: 40px; text-align: center; color: #ef4444;">
                      <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 10px;">
                        Failed to render mindmap
                      </h3>
                      <p style="font-size: 14px; color: #6b7280;">
                        There was an issue rendering the diagram. Try refreshing the page or regenerating the mindmap.
                      </p>
                      <details style="margin-top: 20px; font-size: 12px; text-align: left; max-width: 500px; margin-left: auto; margin-right: auto;">
                        <summary style="cursor: pointer; color: #6b7280;">Error details</summary>
                        <pre style="margin-top: 10px; padding: 10px; background: #f3f4f6; border-radius: 6px; overflow: auto;">${error?.message || error}</pre>
                      </details>
                    </div>
                  `;
                }
              }
          }, 150); // Increased delay to ensure DOM is fully ready
        });
      });
    }

    // Cleanup function - remove all event listeners
    return () => {
      eventListeners.forEach(({ element, type, handler }) => {
        if (element && element.removeEventListener) {
          element.removeEventListener(type, handler);
        }
      });
      if (DEBUG && eventListeners.length > 0) {
        console.log(`🧹 Cleaned up ${eventListeners.length} Mermaid event listeners`);
      }
    };
  }, [typedConcepts, title, onNodeClick]);

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

  // Zoom controls - matching ReactFlow behavior
  const handleZoomIn = () => {
    setZoom(prev => Math.min(2.5, prev + 0.1));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(0.3, prev - 0.1));
  };

  const handleResetView = () => {
    setZoom(0.4); // Reset to default zoom that fits the diagram
    setPan({ x: 0, y: 0 });
  };

  // Mouse wheel zoom - matching ReactFlow
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setZoom(prev => {
        const newZoom = Math.max(0.3, Math.min(2.5, prev + delta));
        return newZoom;
      });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Zoom in: + or =
      if ((e.key === '+' || e.key === '=') && !e.ctrlKey) {
        e.preventDefault();
        handleZoomIn();
      }
      // Zoom out: -
      else if (e.key === '-' && !e.ctrlKey) {
        e.preventDefault();
        handleZoomOut();
      }
      // Reset: 0 or r
      else if (e.key === '0' || e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleResetView();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [zoom]);

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-neutral-900 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
            Mermaid Mindmap
          </h3>
          <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="font-medium">Zoom: {Math.round(zoom * 100)}%</span>
         </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Zoom Out (- key or Ctrl + Scroll)"
              disabled={zoom <= 0.3}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetView}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border-x border-neutral-200 dark:border-neutral-700"
              title="Reset View (0 or R key)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Zoom In (+ key or Ctrl + Scroll)"
              disabled={zoom >= 2.5}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={downloadSVG}
            className="btn-secondary flex items-center gap-2 px-4 py-2"
            title="Download as SVG"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Download</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-auto flex items-center justify-center"
        onWheel={handleWheel}
      >
        <div className="w-full h-full flex items-center justify-center p-8">
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 200ms ease-out',
            }}
          >
            <div
              ref={mermaidRef}
              className="flex items-center justify-center"
              style={{
                fontSize: '13px',
                lineHeight: '1.6',
                minWidth: '1400px',
                minHeight: '1400px',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Sanitize text for Mermaid mindmap syntax
 * Removes/escapes characters that break Mermaid rendering
 */
function sanitizeForMermaid(text) {
  if (!text) return '';

  return text
    // Remove special Mermaid characters that break syntax
    .replace(/[\(\)\[\]\{\}\<\>\|]/g, '')
    // Replace quotes with single quotes
    .replace(/[""]/g, "'")
    // Remove backticks
    .replace(/`/g, '')
    // Remove newlines and excessive whitespace
    .replace(/[\n\r\t]/g, ' ')
    .replace(/\s+/g, ' ')
    // Remove emojis and special unicode that can break rendering
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .trim();
}

/**
 * Shorten text for Mermaid mindmap labels
 * Mermaid mindmap doesn't support <br/>, so we truncate instead
 */
function wrapText(text, maxLength = 20) {
  if (!text) return '';

  // First sanitize the text
  const sanitized = sanitizeForMermaid(text);

  if (sanitized.length <= maxLength) return sanitized;

  // Truncate at word boundary
  const truncated = sanitized.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.6) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Shorten label if too long
 * Keeps important keywords visible
 */
function shortenLabel(label, maxLength = 40) {
  if (!label || label.length <= maxLength) return label;

  // Try to intelligently truncate at word boundary
  const truncated = label.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Generate Mermaid mindmap syntax from concepts
 * Uses hierarchical structure: main -> secondary -> tertiary
 * Includes text wrapping for better readability
 */
function generateMermaidCode(concepts, title) {
  if (!concepts || concepts.length === 0) {
    return `mindmap
  root((${title}))
    No concepts yet`;
  }

  // Find the main concept
  const mainConcept = concepts.find(c => c.type === 'main') || concepts[0];

  // Get ONLY secondary concepts that are connected to the main concept
  const secondaryConcepts = concepts.filter(c => {
    if (c.type !== 'secondary') return false;
    // Check if main concept's connections include this secondary
    return mainConcept.connections && mainConcept.connections.includes(c.id);
  });

  // Get tertiary concepts (children of secondary)
  const tertiaryConcepts = concepts.filter(c => c.type === 'tertiary');

  // Shorten labels for compact display
  const mainLabel = wrapText(mainConcept.label, 25);

  let code = `mindmap
  root((${mainLabel}))
`;

  // Add secondary concepts with shortened text and better spacing
  secondaryConcepts.forEach((secondary, index) => {
    // Add more spacing between every secondary concept to prevent overlap
    if (index > 0) {
      code += `\n\n`;  // Double spacing between each secondary
    }

    // Compact secondary label
    const secondaryLabel = wrapText(secondary.label, 22);
    code += `    ${secondaryLabel}\n`;

    // Find tertiary concepts that are children of this secondary
    const children = tertiaryConcepts.filter(tertiary => {
      return secondary.connections && secondary.connections.includes(tertiary.id);
    });

    // Add tertiary children with compact text
    children.forEach((tertiary, childIndex) => {
      const tertiaryLabel = wrapText(tertiary.label, 20);
      code += `      ${tertiaryLabel}\n`;

      // Add spacing between tertiary groups for readability
      if (children.length > 3 && childIndex === Math.floor(children.length / 2) - 1) {
        code += `\n`;
      }
    });

    // Add extra spacing after secondary if it has children
    if (children.length > 0) {
      code += `\n`;
    }
  });

  // Removed orphaned tertiary handling - only show connected concepts
  // This ensures the mindmap only displays concepts with actual connections

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
