import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Highlighter,
  StickyNote,
  Trash2,
  Edit2,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { useHighlights } from '../hooks/useChromeStorage';

/**
 * Highlight and Notes Management Component
 */
export default function HighlightNotes({ readingId }) {
  const { highlights, addHighlight, removeHighlight, updateHighlight } = useHighlights();
  const [filter, setFilter] = useState('all'); // 'all', 'highlights', 'notes'

  const readingHighlights = highlights.filter(h => h.readingId === readingId);

  const filteredHighlights = readingHighlights.filter(h => {
    if (filter === 'highlights') return !h.note;
    if (filter === 'notes') return h.note;
    return true;
  });

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-neutral-900 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
          Highlights & Notes
        </h3>

        <div className="flex items-center gap-2">
          <FilterButton
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            label="All"
            count={readingHighlights.length}
          />
          <FilterButton
            active={filter === 'highlights'}
            onClick={() => setFilter('highlights')}
            label="Highlights"
            icon={<Highlighter className="w-3 h-3" />}
          />
          <FilterButton
            active={filter === 'notes'}
            onClick={() => setFilter('notes')}
            label="Notes"
            icon={<StickyNote className="w-3 h-3" />}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {filteredHighlights.length === 0 ? (
          <EmptyHighlightsState filter={filter} />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredHighlights.map((highlight) => (
                <HighlightCard
                  key={highlight.id}
                  highlight={highlight}
                  onUpdate={(updates) => updateHighlight(highlight.id, updates)}
                  onRemove={() => removeHighlight(highlight.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Individual Highlight Card
 */
function HighlightCard({ highlight, onUpdate, onRemove }) {
  const [isEditing, setIsEditing] = useState(false);
  const [noteText, setNoteText] = useState(highlight.note || '');

  const saveNote = () => {
    onUpdate({ note: noteText });
    setIsEditing(false);
  };

  const colors = {
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
    green: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
    blue: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
    purple: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700',
  };

  const colorClass = colors[highlight.color] || colors.yellow;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`card border-l-4 ${colorClass}`}
    >
      <div className="space-y-3">
        {/* Highlighted Text */}
        <div className="flex items-start gap-3">
          <Highlighter className="w-4 h-4 text-neutral-500 dark:text-neutral-400 flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-neutral-900 dark:text-neutral-100 italic">
              "{highlight.text}"
            </p>
          </div>
        </div>

        {/* Note Section */}
        {(isEditing || highlight.note) && (
          <div className="flex items-start gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
            <StickyNote className="w-4 h-4 text-neutral-500 dark:text-neutral-400 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="textarea text-sm"
                    rows={3}
                    placeholder="Add your note..."
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button onClick={saveNote} className="btn-primary text-sm py-1">
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setNoteText(highlight.note || '');
                        setIsEditing(false);
                      }}
                      className="btn-ghost text-sm py-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  {highlight.note}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(highlight.timestamp).toLocaleDateString()}
            </span>
            {highlight.url && (
              <a
                href={highlight.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary-500"
              >
                <ExternalLink className="w-3 h-3" />
                Source
              </a>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={onRemove}
              className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-600"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Filter Button
 */
function FilterButton({ active, onClick, label, icon, count }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
        transition-all duration-200
        ${active
          ? 'bg-primary-500 text-white shadow-sm'
          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
        }
      `}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && (
        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-xs">
          {count}
        </span>
      )}
    </button>
  );
}

/**
 * Empty State
 */
function EmptyHighlightsState({ filter }) {
  const messages = {
    all: 'No highlights or notes yet',
    highlights: 'No highlights yet',
    notes: 'No notes yet',
  };

  const descriptions = {
    all: 'Select text on any page and add highlights or notes to remember important information.',
    highlights: 'Highlight important text while reading to mark key concepts.',
    notes: 'Add notes to your highlights to capture your thoughts and insights.',
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">
          {filter === 'notes' ? '📝' : '✨'}
        </div>
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          {messages[filter]}
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400">
          {descriptions[filter]}
        </p>
      </div>
    </div>
  );
}

/**
 * Export function to create highlight from selection
 */
export function createHighlightFromSelection(selection, readingId, color = 'yellow') {
  return {
    readingId,
    text: selection.toString(),
    color,
    note: '',
    url: window.location.href,
    position: {
      start: selection.anchorOffset,
      end: selection.focusOffset,
    },
  };
}
