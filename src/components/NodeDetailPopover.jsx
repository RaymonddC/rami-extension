import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, FileText, Loader2 } from 'lucide-react';
import { explainConcept } from '../utils/summarize';

/**
 * Popover that shows detailed information about a mindmap node
 */
export default function NodeDetailPopover({
  concept,
  originalText = '',
  onClose,
  position = { x: 0, y: 0 }
}) {
  const [explanation, setExplanation] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!concept) return;

    async function loadDetails() {
      setLoading(true);
      setError(null);

      try {
        // Generate AI explanation for this concept
        const result = await explainConcept(concept.label, originalText, {
          persona: 'mentor' // Use mentor for clear, accessible explanations
        });

        if (result.success) {
          setExplanation(result.explanation);
        } else {
          setExplanation('No detailed explanation available.');
        }

        // Extract relevant excerpt from original text
        const extractedExcerpt = extractRelevantExcerpt(originalText, concept.label);
        setExcerpt(extractedExcerpt);

      } catch (err) {
        console.error('Failed to load node details:', err);
        setError('Failed to load details');
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, [concept, originalText]);

  if (!concept) return null;

  // Calculate position (centered, but avoid edges)
  const popoverStyle = {
    maxWidth: '400px',
    position: 'fixed',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1000,
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[999]"
      />

      {/* Popover */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', duration: 0.3 }}
        style={popoverStyle}
        className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-orange-500 px-6 py-4 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">{concept.label}</h3>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {concept.type}
                </span>
                {concept.connections && concept.connections.length > 0 && (
                  <span className="text-xs">
                    {concept.connections.length} connection{concept.connections.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              <span className="ml-3 text-neutral-600 dark:text-neutral-400">
                Generating explanation...
              </span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>{error}</p>
            </div>
          ) : (
            <>
              {/* AI Explanation */}
              {explanation && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary-500" />
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      AI Explanation
                    </h4>
                  </div>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {explanation}
                  </p>
                </div>
              )}

              {/* Related Content Excerpt */}
              {excerpt && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      From Original Text
                    </h4>
                  </div>
                  <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border-l-4 border-blue-500">
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed italic">
                      "{excerpt}"
                    </p>
                  </div>
                </div>
              )}

              {/* Connected Concepts */}
              {concept.connections && concept.connections.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    Connected to:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {concept.connections.map((connId) => (
                      <span
                        key={connId}
                        className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium"
                      >
                        {connId}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
            Click anywhere outside to close
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Extract relevant excerpt from text that mentions the concept
 */
function extractRelevantExcerpt(text, conceptLabel, maxLength = 200) {
  if (!text || !conceptLabel) return '';

  // Convert to lowercase for searching
  const lowerText = text.toLowerCase();
  const lowerConcept = conceptLabel.toLowerCase();

  // Find the position of the concept in text
  const index = lowerText.indexOf(lowerConcept);

  if (index === -1) {
    // Concept not found, try finding related words
    const words = conceptLabel.split(/\s+/);
    for (const word of words) {
      const wordIndex = lowerText.indexOf(word.toLowerCase());
      if (wordIndex !== -1) {
        return extractSentenceAround(text, wordIndex, maxLength);
      }
    }
    // Still not found, return beginning of text
    return text.substring(0, maxLength).trim() + '...';
  }

  return extractSentenceAround(text, index, maxLength);
}

/**
 * Extract a sentence or paragraph around a specific position
 */
function extractSentenceAround(text, position, maxLength = 200) {
  // Find sentence boundaries
  const before = text.substring(Math.max(0, position - 100), position);
  const after = text.substring(position, Math.min(text.length, position + 150));

  // Find last sentence start before position
  const sentenceStartMatch = before.match(/[.!?]\s*([^.!?]*)$/);
  const start = sentenceStartMatch
    ? position - sentenceStartMatch[1].length
    : Math.max(0, position - 100);

  // Find next sentence end after position
  const sentenceEndMatch = after.match(/[.!?]/);
  const end = sentenceEndMatch
    ? position + sentenceEndMatch.index + 1
    : Math.min(text.length, position + 150);

  let excerpt = text.substring(start, end).trim();

  // Truncate if too long
  if (excerpt.length > maxLength) {
    excerpt = excerpt.substring(0, maxLength).trim() + '...';
  }

  return excerpt;
}
