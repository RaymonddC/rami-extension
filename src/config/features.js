/**
 * Feature Toggle Configuration
 * Control which features are enabled in production
 */

export const FEATURES = {
  // Core features (always enabled)
  readings: true,
  mindmap: true,

  // New features (enabled)
  quiz: true,

  // Work in progress (disabled in production)
  storyboard: false, // Visual timeline view of concepts - needs completion
  prompts: false, // Custom prompt chain editor with execution visualization
};

/**
 * Feature descriptions for documentation
 */
export const FEATURE_INFO = {
  storyboard: {
    name: 'Storyboard View',
    description: 'Displays concepts in a horizontal narrative flow, showing the story of your content from start to finish. Features clickable cards, visual hierarchy, and section dividers.',
    status: '✅ Completed',
    features: [
      'Sequential layout: main → branches → details',
      'Visual cards with type-based coloring',
      'Click any card for AI explanation',
      'Filter by concept type (all/main/details)',
      'Horizontal scroll through narrative',
      'Section dividers for clarity',
    ],
  },

  prompts: {
    name: 'Prompt Chain Editor',
    description: 'Create and manage custom AI prompt chains for advanced content analysis workflows with real-time execution visualization',
    status: '✅ Completed',
    features: [
      'Drag-and-drop step builder',
      'Real-time execution progress bar',
      'Status badges (waiting, running, completed, error)',
      'Live output streaming display',
      'Execution time tracking',
      'Visual flow indicators showing data passing',
      'Step types: Summarize, Extract, Visualize, Reflect',
      'Sequential execution with context passing',
    ],
  },
};
