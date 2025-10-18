import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  ArrowRight,
} from 'lucide-react';

/**
 * Storyboard View Component
 * Converts mindmaps into linear, narrative sequences
 */
export default function StoryboardView({ concepts = [], onUpdate }) {
  const [storyboards, setStoryboards] = useState(
    concepts.length > 0 ? generateStoryboards(concepts) : []
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleAddFrame = () => {
    const newFrame = {
      id: `frame-${Date.now()}`,
      title: 'New Frame',
      content: '',
      visual: null,
    };
    const newStoryboards = [...storyboards, newFrame];
    setStoryboards(newStoryboards);
    onUpdate?.(newStoryboards);
  };

  const handleUpdateFrame = (id, updates) => {
    const newStoryboards = storyboards.map(s =>
      s.id === id ? { ...s, ...updates } : s
    );
    setStoryboards(newStoryboards);
    onUpdate?.(newStoryboards);
  };

  const handleRemoveFrame = (id) => {
    const newStoryboards = storyboards.filter(s => s.id !== id);
    setStoryboards(newStoryboards);
    setCurrentIndex(Math.min(currentIndex, newStoryboards.length - 1));
    onUpdate?.(newStoryboards);
  };

  const goToNext = () => {
    if (currentIndex < storyboards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (storyboards.length === 0) {
    return <EmptyStoryboardState onAdd={handleAddFrame} />;
  }

  const currentFrame = storyboards[currentIndex];

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-neutral-900 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
            Storyboard View
          </h3>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {currentIndex + 1} / {storyboards.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleAddFrame} className="btn-secondary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Frame
          </button>
        </div>
      </div>

      {/* Main Storyboard Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Current Frame */}
        <div className="flex-1 flex items-center justify-center p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFrame.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="w-full max-w-4xl"
            >
              <StoryboardFrame
                frame={currentFrame}
                onUpdate={(updates) => handleUpdateFrame(currentFrame.id, updates)}
                onRemove={() => handleRemoveFrame(currentFrame.id)}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Controls */}
        <div className="flex flex-col items-center justify-center gap-4 p-4 border-l border-neutral-200 dark:border-neutral-700">
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="btn-secondary p-3 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-col gap-2">
            {storyboards.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`
                  w-2 h-2 rounded-full transition-all duration-200
                  ${index === currentIndex
                    ? 'bg-primary-500 scale-150'
                    : 'bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-400 dark:hover:bg-neutral-500'
                  }
                `}
              />
            ))}
          </div>

          <button
            onClick={goToNext}
            disabled={currentIndex === storyboards.length - 1}
            className="btn-secondary p-3 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Timeline Footer */}
      <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
        <StoryboardTimeline
          storyboards={storyboards}
          currentIndex={currentIndex}
          onSelect={setCurrentIndex}
        />
      </div>
    </div>
  );
}

/**
 * Individual Storyboard Frame
 */
function StoryboardFrame({ frame, onUpdate, onRemove }) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        {isEditing ? (
          <input
            type="text"
            value={frame.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            onBlur={() => setIsEditing(false)}
            className="input font-semibold text-xl"
            autoFocus
          />
        ) : (
          <h2
            onClick={() => setIsEditing(true)}
            className="font-semibold text-xl text-neutral-900 dark:text-neutral-100 cursor-pointer hover:text-primary-500"
          >
            {frame.title}
          </h2>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-ghost p-2"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRemove}
            className="btn-ghost p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Visual Area */}
      <div className="mb-4 bg-neutral-50 dark:bg-neutral-850 rounded-lg p-8 min-h-[200px] flex items-center justify-center border-2 border-dashed border-neutral-200 dark:border-neutral-700">
        {frame.visual ? (
          <div>{frame.visual}</div>
        ) : (
          <div className="text-center text-neutral-400 dark:text-neutral-600">
            <div className="text-4xl mb-2">🎨</div>
            <p className="text-sm">Visual placeholder</p>
          </div>
        )}
      </div>

      {/* Content Area */}
      <textarea
        value={frame.content}
        onChange={(e) => onUpdate({ content: e.target.value })}
        className="textarea min-h-[120px]"
        placeholder="Describe this step in your storyboard..."
      />
    </div>
  );
}

/**
 * Timeline View
 */
function StoryboardTimeline({ storyboards, currentIndex, onSelect }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {storyboards.map((frame, index) => (
        <React.Fragment key={frame.id}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(index)}
            className={`
              flex-shrink-0 w-32 p-3 rounded-lg border-2 transition-all duration-200
              ${index === currentIndex
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
              }
            `}
          >
            <div className="text-xs font-medium text-neutral-900 dark:text-neutral-100 mb-1 truncate">
              {frame.title}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Frame {index + 1}
            </div>
          </motion.button>

          {index < storyboards.length - 1 && (
            <ArrowRight className="flex-shrink-0 w-4 h-4 text-neutral-400" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * Empty State
 */
function EmptyStoryboardState({ onAdd }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-white dark:bg-neutral-900 rounded-xl">
      <div className="text-center max-w-md p-8">
        <div className="text-6xl mb-4">🎬</div>
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          Create Your Storyboard
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Transform your mindmap into a linear narrative. Perfect for learning sequences,
          presentations, or planning workflows.
        </p>
        <button onClick={onAdd} className="btn-primary">
          Create First Frame
        </button>
      </div>
    </div>
  );
}

/**
 * Generate storyboards from concepts
 */
function generateStoryboards(concepts) {
  if (!concepts || concepts.length === 0) return [];

  return concepts.map((concept, index) => ({
    id: concept.id,
    title: concept.label,
    content: `Exploring: ${concept.label}`,
    visual: null,
  }));
}
