import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, Settings, LayoutDashboard, X, Loader2, Copy, CheckCircle, Network } from 'lucide-react';
import { usePreferences, useSavedReadings } from '../hooks/useChromeStorage';
import { PERSONAS, summarizeText, extractConcepts } from '../utils/summarize';

/**
 * Check if a method is an AI-based method
 */
function isAIMethod(method) {
  return ['summarizer-api', 'chrome-ai', 'language-model-api', 'gemini-nano'].includes(method);
}

/**
 * Popup Component
 * Quick actions and overview
 */
export default function Popup() {
  const { preferences, setPreferences } = usePreferences();
  const { readings } = useSavedReadings();
  const [currentTab, setCurrentTab] = useState(null);
  const [loadingMindmap, setLoadingMindmap] = useState(false);

  useEffect(() => {
    // Get current tab info
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        setCurrentTab(tabs[0]);
      }
    });
  }, []);

  const openDashboard = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('dashboard.html'),
    });
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  const generateMindmap = async () => {
    console.log('🧠 =========================');
    console.log('🧠 Generate Mindmap button clicked');
    console.log('🧠 =========================');

    if (!currentTab) {
      console.error('❌ No current tab available');
      alert('Cannot access current page. Please try again.');
      return;
    }

    console.log('📍 Current tab:', currentTab.url);
    setLoadingMindmap(true);

    try {
      // Get page content
      console.log('📄 Extracting page content...');
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: () => {
          const article = document.querySelector('article') || document.body;
          return {
            text: article.innerText.substring(0, 50000),
            title: document.title,
          };
        },
      });

      const pageContent = result.result;
      console.log('✅ Page content extracted:', {
        title: pageContent.title,
        textLength: pageContent.text.length,
      });

      // Extract concepts
      console.log('🔍 Extracting concepts...');
      const conceptResult = await extractConcepts(pageContent.text, {
        persona: preferences?.persona || 'architect',
        maxConcepts: 20,
      });

      console.log('📊 Concept extraction result:', {
        success: conceptResult.success,
        conceptCount: conceptResult.concepts?.length || 0,
        method: conceptResult.method,
      });

      if (conceptResult.success && conceptResult.concepts && conceptResult.concepts.length > 0) {
        // Show indicator if using fallback
        if (conceptResult.method === 'fallback') {
          console.warn('⚠️ Using fallback concept extraction (AI not available or timed out)');
        } else {
          console.log('✅ Using AI-generated concepts');
        }

        // Save reading with concepts and method info
        const reading = {
          title: pageContent.title,
          url: currentTab.url,
          content: pageContent.text,
          summary: conceptResult.processedText, // AI-processed summary used for mindmap
          timestamp: new Date().toISOString(),
          concepts: conceptResult.concepts,
          generationMethod: conceptResult.method, // Track how it was generated
          usedAI: conceptResult.method !== 'fallback',
          persona: preferences?.persona || 'architect', // Track which persona was used
        };

        console.log('💾 Saving reading with', reading.concepts.length, 'concepts...');
        console.log('🏷️ Generation method:', conceptResult.method);
        const saveResponse = await chrome.runtime.sendMessage({
          action: 'save-reading',
          data: reading,
        });

        console.log('✅ Reading saved:', saveResponse);

        // Show notification based on method
        if (conceptResult.method === 'fallback') {
          console.log('📢 Showing fallback notification to user');
        }

        // Open dashboard with mindmap tab
        console.log('🚀 Opening dashboard on mindmap tab...');
        chrome.tabs.create({
          url: chrome.runtime.getURL('dashboard.html') + '#mindmap',
        });
      } else {
        console.error('❌ No concepts generated:', conceptResult);
        alert('Failed to generate mindmap. No concepts could be extracted from the page.');
      }
    } catch (error) {
      console.error('💥 Mindmap generation error:', error);
      alert('Failed to generate mindmap: ' + error.message);
    } finally {
      setLoadingMindmap(false);
      console.log('🏁 Mindmap generation flow complete');
    }
  };

  const currentPersona = PERSONAS[preferences?.persona || 'strategist'];
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false);

  const handlePersonaChange = (personaId) => {
    setPreferences({ ...preferences, persona: personaId });
    setShowPersonaDropdown(false);
  };

  return (
    <div className="w-[400px] h-[600px] bg-white dark:bg-neutral-900 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold">Rami</h1>
              <p className="text-sm text-white/80 -mt-1">Untangle Your Mind</p>
            </div>
          </div>
          <button onClick={openOptions} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Persona Selector */}
        <div className="relative">
          <button onClick={() => setShowPersonaDropdown(!showPersonaDropdown)} className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-lg p-3 transition-colors">
            <span className="text-3xl">{currentPersona.icon}</span>
            <div className="flex-1 text-left">
              <div className="text-sm opacity-90">Current Persona</div>
              <div className="font-semibold">{currentPersona.name}</div>
            </div>
            <motion.div animate={{ rotate: showPersonaDropdown ? 180 : 0 }} transition={{ duration: 0.2 }}>
              ▼
            </motion.div>
          </button>

          {/* Persona Dropdown */}
          <AnimatePresence>
            {showPersonaDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden z-50"
              >
                {Object.values(PERSONAS).map((persona) => (
                  <button
                    key={persona.id}
                    onClick={() => handlePersonaChange(persona.id)}
                    className={`w-full flex items-center gap-3 p-3 transition-all text-left border-b border-neutral-100 dark:border-neutral-700 last:border-b-0 ${
                      preferences?.persona === persona.id ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-neutral-50 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <span className="text-2xl">{persona.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-sm ${preferences?.persona === persona.id ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-900 dark:text-neutral-100'}`}>{persona.name}</div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">{persona.beverage}</div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-0.5">{persona.description}</div>
                    </div>
                    {preferences?.persona === persona.id && <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-3">
          <QuickAction icon={<LayoutDashboard className="w-5 h-5" />} label="Open Dashboard" description="View all your saved readings" onClick={openDashboard} />

          <QuickAction
            icon={loadingMindmap ? <Loader2 className="w-5 h-5 animate-spin" /> : <Network className="w-5 h-5" />}
            label="Summarize and Generate Mindmap"
            description={loadingMindmap ? 'Using AI to generate mindmap (up to 2 min)...' : 'Create mindmap from current page'}
            onClick={() => {
              if (!loadingMindmap) {
                console.log('🔘 Button clicked!');
                generateMindmap();
              }
            }}
            disabled={loadingMindmap}
          />
        </div>

        {/* Recent Readings */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Recent Readings</h3>

          {readings.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
              <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No saved readings yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {readings.slice(0, 3).map((reading) => (
                <RecentReadingItem
                  key={reading.id}
                  reading={reading}
                  onClick={() => {
                    chrome.tabs.create({ url: reading.url });
                  }}
                />
              ))}

              {readings.length > 3 && (
                <button onClick={openDashboard} className="w-full text-sm text-primary-500 hover:text-primary-600 py-2">
                  View all {readings.length} readings →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="space-y-1">
            <div>
              📝 <kbd>Alt+S</kbd> - Summarize Selection
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Quick Action Button
 */
function QuickAction({ icon, label, description, onClick, disabled = false }) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-start gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-all text-left ${
        disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10'
      }`}
    >
      <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-neutral-900 dark:text-neutral-100">{label}</div>
        <div className="text-xs text-neutral-600 dark:text-neutral-400">{description}</div>
      </div>
    </motion.button>
  );
}

/**
 * Recent Reading Item
 */
function RecentReadingItem({ reading, onClick }) {
  return (
    <motion.button whileHover={{ x: 4 }} onClick={onClick} className="w-full text-left p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{reading.title}</div>
      <div className="text-xs text-neutral-500 dark:text-neutral-400">{new Date(reading.timestamp).toLocaleDateString()}</div>
    </motion.button>
  );
}

/**
 * Summary Panel Component
 */
function SummaryPanel({ summary, loadingSummary, onClose, onCopy, copied, persona }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 bg-neutral-50 dark:bg-neutral-850 border-t border-neutral-200 dark:border-neutral-700 flex flex-col overflow-hidden"
    >
      {/* Summary Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-500" />
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Page Summary</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Summary Content */}
      <div className="flex-1 overflow-auto p-4">
        {loadingSummary ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {persona.icon} {persona.name} is analyzing...
            </p>
          </div>
        ) : summary ? (
          <div className="space-y-3">
            {/* Persona Badge */}
            <div className="flex items-center gap-2 text-xs">
              <span className="badge badge-primary">
                {persona.icon} {persona.name}
              </span>
              <span className="text-neutral-500 dark:text-neutral-400">{isAIMethod(summary.method) ? '🤖 AI' : '📝 Fallback'}</span>
            </div>

            {/* Summary Text */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-sm text-neutral-900 dark:text-neutral-100 leading-relaxed">{summary.summary}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-700">
              <button onClick={onCopy} className="btn-secondary text-sm flex items-center gap-2">
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>

              {summary.method === 'fallback' && <div className="flex-1 text-xs text-neutral-500 dark:text-neutral-400">💡 Enable Chrome AI for better summaries</div>}
            </div>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
