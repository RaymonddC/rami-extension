import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {Map, List, Brain, FileText, LayoutGrid, Trash2} from 'lucide-react';
import { useSavedReadings, usePreferences } from '../hooks/useChromeStorage';
import MindmapView, { MindmapEmptyState } from '../components/MindmapView';
import MermaidView from '../components/MermaidView';
import HybridView from '../components/HybridView';
import StoryboardView from '../components/StoryboardView';
import PromptChainEditor from '../components/PromptChainEditor';
import HighlightNotes from '../components/HighlightNotes';
import PersonaSelector from '../components/PersonaSelector';
import { extractConcepts } from '../utils/summarize';

export default function Dashboard() {
  const { readings } = useSavedReadings();
  const { preferences, setPreferences } = usePreferences();
  const [activeTab, setActiveTab] = useState('readings');
  const [selectedReading, setSelectedReading] = useState(null);
  const [concepts, setConcepts] = useState([]);
  const [viewMode, setViewMode] = useState(preferences?.mindmapMode || 'reactflow');

  const handleGenerateMindmap = async () => {
    if (!selectedReading) return;

    const result = await extractConcepts(selectedReading.content || selectedReading.text, {
      persona: preferences?.persona,
    });

    if (result.success) {
      setConcepts(result.concepts);
    }
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
              />
            </motion.div>
          )}

          {activeTab === 'mindmap' && (
            <motion.div
              key="mindmap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[calc(100vh-200px)]"
            >
              {concepts.length === 0 ? (
                <MindmapEmptyState onGenerate={handleGenerateMindmap} />
              ) : viewMode === 'reactflow' ? (
                <MindmapView concepts={concepts} />
              ) : viewMode === 'mermaid' ? (
                <MermaidView concepts={concepts} />
              ) : (
                <HybridView concepts={concepts} />
              )}
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
    </div>
  );
}

function ReadingsList({ readings, onSelect, selected }) {
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
        <motion.button
          key={reading.id}
          whileHover={{ y: -4 }}
          onClick={() => onSelect(reading)}
          className={`card text-left ${
            selected?.id === reading.id ? 'ring-2 ring-primary-500' : ''
          }`}
        >
          <h3 className="font-semibold mb-2 line-clamp-2">{reading.title}</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3 mb-3">
            {reading.excerpt || reading.content?.substring(0, 150)}
          </p>
            <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>{new Date(reading.timestamp).toLocaleDateString()}</span>

                <button className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition">
                    <Trash2 size={16} />
                </button>
            </div>
        </motion.button>
      ))}
    </div>
  );
}
