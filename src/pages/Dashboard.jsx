import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, List, Brain, FileText, LayoutGrid, Trash2, MessageCircleIcon } from 'lucide-react';
import { useSavedReadings, usePreferences } from '../hooks/useChromeStorage';
import ReactFlowView, { ReactFlowEmptyState } from '../components/ReactFlowView';
import MermaidView from '../components/MermaidView';
import PersonaSelector from '../components/PersonaSelector';
import NodeDetailPopover from '../components/NodeDetailPopover';
import { extractConcepts, PERSONAS } from '../utils/summarize';
import { FEATURES } from '../config/features';
import { convertMarkdownToHTML } from '../utils/markdown';

// Conditionally import work-in-progress features
import StoryboardView from '../components/StoryboardView';
import PromptChainEditor from '../components/PromptChainEditor';
import Quiz from '../components/Quiz';

export default function Dashboard() {
  const { readings, removeReading } = useSavedReadings();
  const { preferences, setPreferences } = usePreferences();
  const [activeTab, setActiveTab] = useState('readings');
  const [selectedReading, setSelectedReading] = useState(null);
  const [concepts, setConcepts] = useState([]);
  const [viewMode, setViewMode] = useState(preferences?.mindmapMode || 'reactflow');
  const [selectedNode, setSelectedNode] = useState(null);
  const [showingSummary, setShowingSummary] = useState(null); // For summary modal

  const handleDeleteReading = async (readingId, event) => {
    event.stopPropagation(); // Prevent selecting the reading when clicking delete

    if (!confirm('Are you sure you want to delete this reading?')) {
      return;
    }

    try {
      console.log('🗑️ Deleting reading:', readingId);

      // Use the removeReading function from the hook
      await removeReading(readingId);

      // If deleted reading was selected, clear selection
      if (selectedReading?.id === readingId) {
        setSelectedReading(null);
        setConcepts([]);
      }

      console.log('✅ Reading deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete reading:', error);
      alert('Failed to delete reading. Please try again.');
    }
  };

  const handleViewMindmap = (reading) => {
    console.log('🧠 Opening mindmap for reading:', reading.title);

    // Set the reading and its concepts
    setSelectedReading(reading);
    if (reading.concepts && reading.concepts.length > 0) {
      setConcepts(reading.concepts);
    }

    // Switch to mindmap tab
    setActiveTab('mindmap');

    // Update URL hash
    window.location.hash = 'mindmap';
  };

  // Check URL hash on mount and load concepts from latest reading
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['readings', 'mindmap', 'storyboard', 'prompts'].includes(hash)) {
      setActiveTab(hash);
    }

    // If we're opening to mindmap tab and have readings, load the latest one
    if (hash === 'mindmap' && readings.length > 0) {
      const latestReading = readings[0];
      console.log('📖 Loading latest reading for mindmap:', latestReading.title);

      if (latestReading.concepts && latestReading.concepts.length > 0) {
        console.log('✅ Found concepts in reading:', latestReading.concepts);
        console.log('🏷️ Generation method:', latestReading.generationMethod || 'unknown');
        console.log('🤖 Used AI:', latestReading.usedAI !== false ? 'Yes' : 'No');
        setConcepts(latestReading.concepts);
        setSelectedReading(latestReading);
      } else {
        console.log('⚠️ No concepts found, will need to generate');
        setSelectedReading(latestReading);
      }
    }
  }, [readings]);

  const handleGenerateMindmap = async () => {
    // Use selected reading or fall back to first available reading
    const readingToUse = selectedReading || readings[0];

    if (!readingToUse) {
      console.log('❌ No readings available for mindmap generation');
      return;
    }

    console.log('🧠 Generating mindmap for:', readingToUse.title);
    console.log('📝 Content length:', (readingToUse.content || readingToUse.text || '').length);

    const result = await extractConcepts(readingToUse.content || readingToUse.text, {
      persona: preferences?.persona,
    });

    console.log('🔍 Extract concepts result:', result);

    if (result.success) {
      console.log('✅ Concepts extracted:', result.concepts);
      setConcepts(result.concepts);
    } else {
      console.error('❌ Failed to extract concepts:', result);
    }
  };

  // Handle node click to show details
  const handleNodeClick = (concept) => {
    setSelectedNode(concept);
  };

  // Close node detail popover
  const handleCloseNodeDetail = () => {
    setSelectedNode(null);
  };

  // Build tabs array based on feature flags
  const allTabs = [
    { id: 'readings', label: 'Readings', icon: <List className="w-4 h-4" />, enabled: FEATURES.readings },
    { id: 'mindmap', label: 'Mindmap', icon: <Brain className="w-4 h-4" />, enabled: FEATURES.mindmap },
    { id: 'storyboard', label: 'Storyboard', icon: <LayoutGrid className="w-4 h-4" />, enabled: FEATURES.storyboard },
    { id: 'prompts', label: 'Prompts', icon: <FileText className="w-4 h-4" />, enabled: FEATURES.prompts },
    { id: 'quiz', label: 'Quiz', icon: <MessageCircleIcon className="w-4 h-4" />, enabled: FEATURES.quiz },
  ];

  const tabs = allTabs.filter((tab) => tab.enabled);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-850 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="w-12 h-12 flex items-center justify-center">
                <img src="/icons/icon128.png" alt="Rami Logo" className="w-12 h-12 rounded-lg object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Rami</h1>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 -mt-1">Your Study Sidekick — Untangle, Understand, Unstoppable</p>
              </div>
            </div>
          </div>

          <nav className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id ? 'bg-primary-500 text-white shadow-md' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'readings' && (
            <motion.div key="readings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ReadingsList readings={readings} onSelect={setSelectedReading} selected={selectedReading} onDelete={handleDeleteReading} onViewSummary={setShowingSummary} onViewMindmap={handleViewMindmap} />
            </motion.div>
          )}

          {activeTab === 'mindmap' && (
            <motion.div key="mindmap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Mindmap Mode Selector - Only show when concepts exist */}
              {concepts.length > 0 && (
                <div className="flex items-center justify-between bg-white dark:bg-neutral-850 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-3">
                    <Map className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">Visualization Mode:</span>
                    {selectedReading && (
                      selectedReading.usedAI === false || selectedReading.generationMethod === 'fallback' ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                          ⚡ Fallback Mode
                        </span>
                      ) : selectedReading.persona && PERSONAS[selectedReading.persona] ? (
                        <div className="relative group inline-block">
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 cursor-help">
                            {PERSONAS[selectedReading.persona].icon} {PERSONAS[selectedReading.persona].name}
                          </span>
                          {/* Tooltip */}
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                            <div className="font-semibold">{PERSONAS[selectedReading.persona].name}</div>
                            <div className="text-neutral-300 dark:text-neutral-700">{PERSONAS[selectedReading.persona].description}</div>
                            {/* Tooltip arrow */}
                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-neutral-900 dark:border-t-neutral-100"></div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          🤖 AI Generated
                        </span>
                      )
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setViewMode('reactflow');
                        setPreferences({ ...preferences, mindmapMode: 'reactflow' });
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        viewMode === 'reactflow' ? 'bg-primary-500 text-white shadow-md' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      React Flow
                    </button>
                    <button
                      onClick={() => {
                        setViewMode('mermaid');
                        setPreferences({ ...preferences, mindmapMode: 'mermaid' });
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        viewMode === 'mermaid' ? 'bg-primary-500 text-white shadow-md' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      Mermaid
                    </button>
                  </div>
                </div>
              )}

              {/* Mindmap Display */}
              <div className="h-[calc(100vh-280px)] overflow-auto">
                {concepts.length === 0 ? (
                  <ReactFlowEmptyState onGenerate={readings.length > 0 ? handleGenerateMindmap : null} hasReadings={readings.length > 0} />
                ) : viewMode === 'reactflow' ? (
                  <ReactFlowView concepts={concepts} onNodeClick={handleNodeClick} />
                ) : (
                  <MermaidView concepts={concepts} onNodeClick={handleNodeClick} />
                )}
              </div>
            </motion.div>
          )}

          {FEATURES.storyboard && activeTab === 'storyboard' && (
            <motion.div key="storyboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[calc(100vh-200px)]">
              <StoryboardView concepts={concepts} onNodeClick={handleNodeClick} />
            </motion.div>
          )}

          {FEATURES.prompts && activeTab === 'prompts' && (
            <motion.div key="prompts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[calc(100vh-200px)]">
              <PromptChainEditor preferences={preferences} readings={readings} />
            </motion.div>
          )}

          {FEATURES.quiz && activeTab === 'quiz' && (
            <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[calc(100vh-200px)]">
              <Quiz readings={readings} preferences={preferences} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Node Detail Popover */}
      {selectedNode && <NodeDetailPopover concept={selectedNode} originalText={selectedReading?.content || selectedReading?.text || ''} onClose={handleCloseNodeDetail} allConcepts={concepts} />}

      {/* Summary Modal */}
      {showingSummary && <SummaryModal reading={showingSummary} onClose={() => setShowingSummary(null)} />}
    </div>
  );
}

/**
 * Summary Modal Component
 */
function SummaryModal({ reading, onClose }) {
  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              {reading.persona && PERSONAS[reading.persona] ? (
                <div className="relative group">
                  <span className="text-2xl">{PERSONAS[reading.persona].icon}</span>
                </div>
              ) : (
                <span className="text-2xl">🤖</span>
              )}
              <div>
                <h3 className="text-lg font-semibold">
                  {reading.persona && PERSONAS[reading.persona] ? `${PERSONAS[reading.persona].name} Summary` : 'AI-Generated Summary'}
                </h3>
                <p className="text-sm opacity-90">Comprehensive summary created during mindmap generation</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
            <div className="mb-4">
              <h4 className="font-semibold text-lg mb-2 text-neutral-900 dark:text-neutral-100">{reading.title}</h4>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                <span>Summary: ~{Math.floor(reading.summary.length / 5)} words</span>
                {reading.content && <span className="ml-2 opacity-75">• Original: ~{Math.floor(reading.content.length / 5)} words</span>}
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none">
              <div className="text-neutral-800 dark:text-neutral-200 leading-relaxed summary-content" dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(reading.summary) }} />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
            <div className="text-xs text-neutral-600 dark:text-neutral-400">
              {reading.generationMethod === 'fallback' ? (
                '📝 Fallback mode'
              ) : reading.persona && PERSONAS[reading.persona] ? (
                <div className="relative group inline-block">
                  <span>
                    {PERSONAS[reading.persona].icon} Generated by {PERSONAS[reading.persona].name}
                  </span>
                </div>
              ) : (
                '🤖 AI-powered'
              )}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(reading.summary);
                alert('Summary copied to clipboard!');
              }}
              className="btn-secondary text-sm"
            >
              Copy Summary
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ReadingsList({ readings, onSelect, selected, onDelete, onViewSummary, onViewMindmap }) {
  if (readings.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📚</div>
        <h2 className="text-2xl font-semibold mb-2">No readings yet</h2>
        <p className="text-neutral-600 dark:text-neutral-400">Save pages from the web to start building your reading library</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {readings.map((reading) => (
        <motion.div
          key={reading.id}
          whileHover={{ y: -4, zIndex: 50 }}
          className={`card text-left relative group cursor-pointer ${selected?.id === reading.id ? 'ring-2 ring-primary-500' : ''}`}
          style={{ zIndex: 1 }}
          onClick={() => onSelect(reading)}
        >
          {/* Delete Button - Only shows on hover */}
          <button onClick={(e) => onDelete(reading.id, e)} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10" title="Delete reading">
            <Trash2 className="w-4 h-4" />
          </button>

          <h3 className="font-semibold mb-2 line-clamp-2">{reading.title}</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3 mb-3">{reading.excerpt || reading.content?.substring(0, 150)}</p>

          {/* Action buttons */}
          <div className="space-y-2 mb-3">
            {/* View Mindmap button if concepts exist */}
            {reading.concepts && reading.concepts.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewMindmap(reading);
                }}
                className="w-full text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-3 py-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors flex items-center justify-center gap-1"
              >
                <span>🧠</span>
                <span>View Mindmap ({reading.concepts.length} concepts)</span>
              </button>
            )}

            {/* View Summary button if exists */}
            {reading.summary && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewSummary(reading);
                }}
                className="w-full text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-1"
              >
                <span>📄</span>
                <span>View AI Summary ({Math.floor(reading.summary.length / 5)} words)</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-neutral-500">{new Date(reading.timestamp).toLocaleDateString()}</div>
            {reading.usedAI !== undefined && (
              reading.usedAI && reading.persona && PERSONAS[reading.persona] ? (
                <div className="relative group/persona inline-block">
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 cursor-help">
                    {PERSONAS[reading.persona].icon}
                  </span>
                  {/* Tooltip - only shows when hovering over the persona icon */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 text-xs rounded-lg shadow-lg opacity-0 invisible group-hover/persona:opacity-100 group-hover/persona:visible transition-all duration-200 whitespace-nowrap pointer-events-none" style={{ zIndex: 9999 }}>
                    <div className="font-semibold">{PERSONAS[reading.persona].name}</div>
                    <div className="text-neutral-300 dark:text-neutral-700">{PERSONAS[reading.persona].description}</div>
                    {/* Tooltip arrow */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-neutral-900 dark:border-t-neutral-100"></div>
                  </div>
                </div>
              ) : (
                <span className={`text-xs px-2 py-1 rounded-full ${reading.usedAI ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                  {reading.usedAI ? '🤖' : '⚡'}
                </span>
              )
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
