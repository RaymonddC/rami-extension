import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Sparkles,
  Settings,
  LayoutDashboard,
  Highlighter,
} from 'lucide-react';
import { usePreferences, useSavedReadings } from '../hooks/useChromeStorage';
import { PERSONAS } from '../utils/summarize';

/**
 * Popup Component
 * Quick actions and overview
 */
export default function Popup() {
  const { preferences, setPreferences } = usePreferences();
  const { readings } = useSavedReadings();
  const [currentTab, setCurrentTab] = useState(null);

  useEffect(() => {
    // Get current tab info
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        setCurrentTab(tabs[0]);
      }
    });
  }, []);

  const saveCurrentPage = async () => {
    if (!currentTab) return;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'save-reading',
        data: {
          title: currentTab.title,
          url: currentTab.url,
        },
      });

      if (response.success) {
        alert('Page saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save page:', error);
      alert('Failed to save page');
    }
  };

  const openDashboard = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('dashboard.html'),
    });
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  const currentPersona = PERSONAS[preferences?.persona || 'strategist'];

  return (
    <div className="w-[400px] h-[600px] bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">AI Reading Studio</h1>
          <button
            onClick={openOptions}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
          <span className="text-3xl">{currentPersona.icon}</span>
          <div className="flex-1">
            <div className="text-sm opacity-90">Current Persona</div>
            <div className="font-semibold">{currentPersona.name}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 space-y-3">
        <QuickAction
          icon={<BookOpen className="w-5 h-5" />}
          label="Save Current Page"
          description="Save this page for later reading"
          onClick={saveCurrentPage}
        />

        <QuickAction
          icon={<LayoutDashboard className="w-5 h-5" />}
          label="Open Dashboard"
          description="View all your saved readings"
          onClick={openDashboard}
        />

        <QuickAction
          icon={<Sparkles className="w-5 h-5" />}
          label="Summarize Page"
          description="Get AI summary of current page"
          onClick={() => {
            chrome.tabs.sendMessage(currentTab.id, { action: 'summarize-page' });
          }}
        />

        <QuickAction
          icon={<Highlighter className="w-5 h-5" />}
          label="View Highlights"
          description="See your highlighted text"
          onClick={openDashboard}
        />
      </div>

      {/* Recent Readings */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
          Recent Readings
        </h3>

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
              <button
                onClick={openDashboard}
                className="w-full text-sm text-primary-500 hover:text-primary-600 py-2"
              >
                View all {readings.length} readings →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="space-y-1">
          <div>💡 <kbd>Alt+R</kbd> - Toggle Reader Mode</div>
          <div>✏️ <kbd>Alt+H</kbd> - Highlight Selection</div>
          <div>📝 <kbd>Alt+S</kbd> - Summarize Selection</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Quick Action Button
 */
function QuickAction({ icon, label, description, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-start gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all text-left"
    >
      <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-neutral-900 dark:text-neutral-100">
          {label}
        </div>
        <div className="text-xs text-neutral-600 dark:text-neutral-400">
          {description}
        </div>
      </div>
    </motion.button>
  );
}

/**
 * Recent Reading Item
 */
function RecentReadingItem({ reading, onClick }) {
  return (
    <motion.button
      whileHover={{ x: 4 }}
      onClick={onClick}
      className="w-full text-left p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
    >
      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
        {reading.title}
      </div>
      <div className="text-xs text-neutral-500 dark:text-neutral-400">
        {new Date(reading.timestamp).toLocaleDateString()}
      </div>
    </motion.button>
  );
}
