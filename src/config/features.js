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
  storyboard: false,  // Visual timeline view of concepts - needs completion
  prompts: false,     // Custom prompt chain editor - needs completion
};

/**
 * Feature descriptions for documentation
 */
export const FEATURE_INFO = {
  storyboard: {
    name: 'Storyboard',
    description: 'Visual timeline that arranges concepts in a narrative flow, showing how ideas connect sequentially',
    status: 'Work in Progress',
    reason: 'Layout and interaction logic needs to be completed',
  },

  prompts: {
    name: 'Prompt Chain Editor',
    description: 'Create and manage custom AI prompt chains for advanced content analysis workflows',
    status: 'Work in Progress',
    reason: 'Prompt execution pipeline and storage need implementation',
  },
};
