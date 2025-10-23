import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout, Code2 } from 'lucide-react';
import MindmapView from './MindmapView';
import MermaidView from './MermaidView';

/**
 * Hybrid View Component
 * Combines React Flow and Mermaid views side-by-side
 */
export default function HybridView({ concepts = [], title = 'Mindmap', onNodeClick }) {
  const [activeView, setActiveView] = useState('split'); // 'split', 'reactflow', 'mermaid'

  return (
    <div className="w-full h-full flex flex-col bg-neutral-50 dark:bg-neutral-900 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
          Hybrid View
        </h3>

        <div className="flex items-center gap-2">
          <ViewToggleButton
            active={activeView === 'split'}
            onClick={() => setActiveView('split')}
            icon={<Layout className="w-4 h-4" />}
            label="Split"
          />
          <ViewToggleButton
            active={activeView === 'reactflow'}
            onClick={() => setActiveView('reactflow')}
            icon={<span className="text-sm">🧠</span>}
            label="Interactive"
          />
          <ViewToggleButton
            active={activeView === 'mermaid'}
            onClick={() => setActiveView('mermaid')}
            icon={<Code2 className="w-4 h-4" />}
            label="Code"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'split' && (
          <SplitView
            concepts={concepts}
            title={title}
            onNodeClick={onNodeClick}
          />
        )}

        {activeView === 'reactflow' && (
          <div className="w-full h-full p-4">
            <MindmapView
              concepts={concepts}
              onNodeClick={onNodeClick}
            />
          </div>
        )}

        {activeView === 'mermaid' && (
          <div className="w-full h-full p-4">
            <MermaidView
              concepts={concepts}
              title={title}
              onNodeClick={onNodeClick}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Split View Layout
 */
function SplitView({ concepts, title, onNodeClick }) {
  return (
    <div className="w-full h-full grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
      {/* React Flow Side */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="h-full"
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center gap-2 mb-2 px-2">
            <span className="text-2xl">🧠</span>
            <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
              Interactive Graph
            </h4>
          </div>
          <div className="flex-1">
            <MindmapView
              concepts={concepts}
              onNodeClick={onNodeClick}
              editable={true}
            />
          </div>
        </div>
      </motion.div>

      {/* Mermaid Side */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="h-full"
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center gap-2 mb-2 px-2">
            <Code2 className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
              Mermaid Diagram
            </h4>
          </div>
          <div className="flex-1">
            <MermaidView
              concepts={concepts}
              title={title}
              onNodeClick={onNodeClick}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * View Toggle Button
 */
function ViewToggleButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
        transition-all duration-200
        ${active
          ? 'bg-primary-500 text-white shadow-md'
          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
        }
      `}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

/**
 * Empty State for Hybrid View
 */
export function HybridEmptyState({ onGenerate }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 rounded-xl">
      <div className="text-center max-w-md p-8">
        <div className="flex items-center justify-center gap-4 text-5xl mb-4">
          <span>🧠</span>
          <span className="text-neutral-400">+</span>
          <span>📊</span>
        </div>
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          Hybrid Visualization
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Experience both interactive nodes and exportable code-based diagrams side-by-side.
        </p>
        {onGenerate && (
          <button onClick={onGenerate} className="btn-primary">
            Generate Hybrid View
          </button>
        )}
      </div>
    </div>
  );
}
