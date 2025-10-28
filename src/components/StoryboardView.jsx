import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Maximize2,
  Book,
  GitBranch,
  FileText,
} from 'lucide-react';

/**
 * Storyboard View Component
 * Displays concepts in a linear narrative flow
 * KISS Principle: Simple horizontal card layout showing concept hierarchy
 */
export default function StoryboardView({ concepts = [], onNodeClick }) {
  const [selectedType, setSelectedType] = useState('all');

  // Arrange concepts in narrative order: main → secondary branches → tertiary details
  const narrativeFlow = useMemo(() => {
    if (!concepts || concepts.length === 0) return [];

    const flow = [];
    const main = concepts.find(c => c.type === 'main');
    const secondary = concepts.filter(c => c.type === 'secondary');
    const tertiary = concepts.filter(c => c.type === 'tertiary');

    // Start with main concept
    if (main) {
      flow.push({ ...main, section: 'Introduction' });
    }

    // Add each secondary with its tertiary children
    secondary.forEach((sec, index) => {
      flow.push({
        ...sec,
        section: `Branch ${index + 1}`,
        isNewBranch: true
      });

      // Add tertiary concepts connected to this secondary
      const children = tertiary.filter(ter =>
        sec.connections && sec.connections.includes(ter.id)
      );

      children.forEach(child => {
        flow.push({ ...child, section: `Branch ${index + 1}` });
      });
    });

    return flow;
  }, [concepts]);

  // Filter by type if needed
  const filteredFlow = selectedType === 'all'
    ? narrativeFlow
    : narrativeFlow.filter(c => c.type === selectedType || c.type === 'main');

  if (concepts.length === 0) {
    return <EmptyStoryboardState />;
  }

  return (
    <div className="w-full h-full flex flex-col bg-neutral-50 dark:bg-neutral-900">
      {/* Header with filters */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-850 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-3">
          <Book className="w-5 h-5 text-primary-500" />
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
            Narrative Flow
          </h3>
          <span className="text-sm text-neutral-500">
            {filteredFlow.length} concepts
          </span>
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
              selectedType === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedType('secondary')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
              selectedType === 'secondary'
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            Main Concepts
          </button>
          <button
            onClick={() => setSelectedType('tertiary')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
              selectedType === 'tertiary'
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            Details
          </button>
        </div>
      </div>

      {/* Horizontal scrolling narrative flow */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-8">
        <div className="flex items-start gap-4 min-w-min">
          {filteredFlow.map((concept, index) => (
            <React.Fragment key={concept.id}>
              {/* Section divider for new branches */}
              {concept.isNewBranch && index > 0 && (
                <div className="flex flex-col items-center justify-center px-4 flex-shrink-0">
                  <GitBranch className="w-6 h-6 text-neutral-400 mb-2" />
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                    {concept.section}
                  </div>
                </div>
              )}

              {/* Concept card */}
              <ConceptCard
                concept={concept}
                onClick={() => onNodeClick?.(concept)}
              />

              {/* Connection arrow (except for last item) */}
              {index < filteredFlow.length - 1 && !filteredFlow[index + 1]?.isNewBranch && (
                <div className="flex items-center justify-center flex-shrink-0 pt-20">
                  <ArrowRight className="w-6 h-6 text-neutral-300 dark:text-neutral-600" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Footer hint */}
      <div className="p-4 bg-white dark:bg-neutral-850 border-t border-neutral-200 dark:border-neutral-700">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
          💡 Click any card to see detailed explanation • Scroll horizontally to explore the full story
        </p>
      </div>
    </div>
  );
}

/**
 * Individual Concept Card in Narrative
 */
function ConceptCard({ concept, onClick }) {
  const getCardStyle = (type) => {
    switch (type) {
      case 'main':
        return {
          border: 'border-primary-500',
          bg: 'bg-primary-50 dark:bg-primary-900/20',
          icon: '🎯',
          iconBg: 'bg-primary-500',
        };
      case 'secondary':
        return {
          border: 'border-blue-500',
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          icon: '📌',
          iconBg: 'bg-blue-500',
        };
      case 'tertiary':
        return {
          border: 'border-purple-500',
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          icon: '📝',
          iconBg: 'bg-purple-500',
        };
      default:
        return {
          border: 'border-neutral-300',
          bg: 'bg-neutral-50 dark:bg-neutral-800',
          icon: '📄',
          iconBg: 'bg-neutral-500',
        };
    }
  };

  const style = getCardStyle(concept.type);

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        flex-shrink-0 w-72 cursor-pointer
        bg-white dark:bg-neutral-850
        border-2 ${style.border}
        rounded-xl shadow-sm hover:shadow-md
        transition-all duration-200
        overflow-hidden
      `}
    >
      {/* Card header with icon */}
      <div className={`${style.bg} px-4 py-3 border-b ${style.border}`}>
        <div className="flex items-center gap-3">
          <div className={`${style.iconBg} w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0`}>
            {style.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
              {concept.type}
            </div>
          </div>
          <Maximize2 className="w-4 h-4 text-neutral-400 flex-shrink-0" />
        </div>
      </div>

      {/* Card content */}
      <div className="p-4">
        <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2 line-clamp-2">
          {concept.label}
        </h4>

        {/* Connection count */}
        {concept.connections && concept.connections.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <GitBranch className="w-3 h-3" />
            <span>{concept.connections.length} connection(s)</span>
          </div>
        )}

        {/* Section indicator */}
        {concept.section && (
          <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <FileText className="w-3 h-3" />
              <span>{concept.section}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Empty State
 */
function EmptyStoryboardState() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
      <div className="text-center max-w-md p-8">
        <div className="text-6xl mb-4">📖</div>
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          No Mindmap Yet
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Generate a mindmap first to see the narrative flow. The storyboard will arrange
          your concepts in a linear, easy-to-follow sequence.
        </p>
        <button
          onClick={() => window.location.hash = '#mindmap'}
          className="btn-primary"
        >
          Go to Mindmap
        </button>
      </div>
    </div>
  );
}
