import React from 'react';
import { motion } from 'framer-motion';
import { PERSONAS } from '../utils/summarize';
import classNames from 'classnames';

/**
 * Persona Selector Component
 * Allows users to choose their AI interaction style
 */
export default function PersonaSelector({ selectedPersona, onSelect, compact = false }) {
  const personas = Object.values(PERSONAS);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">AI Persona:</span>
        <select
          value={selectedPersona}
          onChange={(e) => onSelect(e.target.value)}
          className="input py-1.5 text-sm"
        >
          {personas.map((persona) => (
            <option key={persona.id} value={persona.id}>
              {persona.icon} {persona.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Choose Your AI Persona
        </h3>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          How should AI guide you?
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {personas.map((persona) => (
          <PersonaCard
            key={persona.id}
            persona={persona}
            selected={selectedPersona === persona.id}
            onSelect={() => onSelect(persona.id)}
          />
        ))}
      </div>

      {selectedPersona && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800"
        >
          <div className="flex items-start gap-3">
            <span className="text-3xl">{PERSONAS[selectedPersona].icon}</span>
            <div className="flex-1">
              <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                {PERSONAS[selectedPersona].name}
              </h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 italic mb-2">
                "{PERSONAS[selectedPersona].promptStyle}"
              </p>
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-500">
                <span className="badge badge-primary">{PERSONAS[selectedPersona].beverage}</span>
                <span>•</span>
                <span>{PERSONAS[selectedPersona].description}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function PersonaCard({ persona, selected, onSelect }) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={classNames(
        'card-hover text-left relative overflow-hidden',
        selected && 'ring-2 ring-primary-500 shadow-lg'
      )}
    >
      {selected && (
        <div className="absolute top-3 right-3">
          <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{persona.icon}</span>
          <div className="flex-1">
            <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
              {persona.name}
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {persona.beverage}
            </p>
          </div>
        </div>

        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {persona.description}
        </p>

        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
          <p className="text-xs text-neutral-500 dark:text-neutral-500 italic">
            {persona.promptStyle}
          </p>
        </div>
      </div>
    </motion.button>
  );
}
