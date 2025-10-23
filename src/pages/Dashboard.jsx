import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, List, Brain, FileText, LayoutGrid, Trash2 } from 'lucide-react';
import { useSavedReadings, usePreferences } from '../hooks/useChromeStorage';
import MindmapView, { MindmapEmptyState } from '../components/MindmapView';
import MermaidView from '../components/MermaidView';
import HybridView from '../components/HybridView';
import StoryboardView from '../components/StoryboardView';
import PromptChainEditor from '../components/PromptChainEditor';
import HighlightNotes from '../components/HighlightNotes';
import PersonaSelector from '../components/PersonaSelector';
import NodeDetailPopover from '../components/NodeDetailPopover';
import { extractConcepts } from '../utils/summarize';

export default function Dashboard() {
  const { readings, removeReading } = useSavedReadings();
  const { preferences, setPreferences } = usePreferences();
  const [activeTab, setActiveTab] = useState('readings');
  const [selectedReading, setSelectedReading] = useState(null);
  const [concepts, setConcepts] = useState([]);
  const [viewMode, setViewMode] = useState(preferences?.mindmapMode || 'reactflow');
  const [selectedNode, setSelectedNode] = useState(null);

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
    console.log('🖱️ Node clicked:', concept);
    setSelectedNode(concept);
  };

  // Close node detail popover
  const handleCloseNodeDetail = () => {
    setSelectedNode(null);
  };

  const tabs = [
    { id: 'readings', label: 'Readings', icon: <List className="w-4 h-4" /> },
    { id: 'mindmap', label: 'Mindmap', icon: <Brain className="w-4 h-4" /> },
    { id: 'storyboard', label: 'Storyboard', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'prompts', label: 'Prompts', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-850 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              AI Reading Studio
            </h1>
            <PersonaSelector
              selectedPersona={preferences?.persona || 'strategist'}
              onSelect={(persona) => setPreferences({ ...preferences, persona })}
              compact
            />
          </div>

          <nav className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
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
            <motion.div
              key="readings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ReadingsList
                readings={readings}
                onSelect={setSelectedReading}
                selected={selectedReading}
                onDelete={handleDeleteReading}
              />
            </motion.div>
          )}

          {activeTab === 'mindmap' && (
            <motion.div
              key="mindmap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Mindmap Mode Selector - Only show when concepts exist */}
              {concepts.length > 0 && (
                <div className="flex items-center justify-between bg-white dark:bg-neutral-850 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-3">
                    <Map className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      Visualization Mode:
                    </span>
                    {selectedReading && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        selectedReading.usedAI === false || selectedReading.generationMethod === 'fallback'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {selectedReading.usedAI === false || selectedReading.generationMethod === 'fallback'
                          ? '⚡ Fallback Mode'
                          : '🤖 AI Generated'}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setViewMode('reactflow');
                        setPreferences({ ...preferences, mindmapMode: 'reactflow' });
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        viewMode === 'reactflow'
                          ? 'bg-primary-500 text-white shadow-md'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
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
                        viewMode === 'mermaid'
                          ? 'bg-primary-500 text-white shadow-md'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      Mermaid
                    </button>
                    <button
                      onClick={() => {
                        setViewMode('hybrid');
                        setPreferences({ ...preferences, mindmapMode: 'hybrid' });
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        viewMode === 'hybrid'
                          ? 'bg-primary-500 text-white shadow-md'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      Hybrid
                    </button>
                  </div>
                </div>
              )}

              {/* Mindmap Display */}
              <div className="h-[calc(100vh-280px)] overflow-auto">
                {concepts.length === 0 ? (
                  <MindmapEmptyState
                    onGenerate={readings.length > 0 ? handleGenerateMindmap : null}
                    hasReadings={readings.length > 0}
                  />
                ) : viewMode === 'reactflow' ? (
                  <MindmapView concepts={concepts} onNodeClick={handleNodeClick} />
                ) : viewMode === 'mermaid' ? (
                  <MermaidView concepts={concepts} onNodeClick={handleNodeClick} />
                ) : (
                  <HybridView concepts={concepts} onNodeClick={handleNodeClick} />
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'storyboard' && (
            <motion.div
              key="storyboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[calc(100vh-200px)]"
            >
              <StoryboardView concepts={concepts} />
            </motion.div>
          )}

          {activeTab === 'prompts' && (
            <motion.div
              key="prompts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[calc(100vh-200px)]"
            >
              <PromptChainEditor />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Node Detail Popover */}
      {selectedNode && (
        <NodeDetailPopover
          concept={selectedNode}
          originalText={selectedReading?.content || selectedReading?.text || ''}
          onClose={handleCloseNodeDetail}
        />
      )}
    </div>
  );
}

function ReadingsList({ readings, onSelect, selected, onDelete }) {
  if (readings.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📚</div>
        <h2 className="text-2xl font-semibold mb-2">No readings yet</h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Save pages from the web to start building your reading library
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {readings.map((reading) => (
        <motion.div
          key={reading.id}
          whileHover={{ y: -4 }}
          className={`card text-left relative group cursor-pointer ${
            selected?.id === reading.id ? 'ring-2 ring-primary-500' : ''
          }`}
          onClick={() => onSelect(reading)}
        >
          {/* Delete Button */}
          <button
            onClick={(e) => onDelete(reading.id, e)}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
            title="Delete reading"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <h3 className="font-semibold mb-2 line-clamp-2">{reading.title}</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3 mb-3">
            {reading.excerpt || reading.content?.substring(0, 150)}
          </p>
          <div className="flex items-center justify-between">
            <div className="text-xs text-neutral-500">
              {new Date(reading.timestamp).toLocaleDateString()}
            </div>
            {reading.usedAI !== undefined && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                reading.usedAI
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
              }`}>
                {reading.usedAI ? '🤖' : '⚡'}
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
