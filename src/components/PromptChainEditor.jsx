import React, { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import {
  Plus,
  Trash2,
  Play,
  GripVertical,
  FileText,
  Lightbulb,
  Network,
  MessageCircle,
} from 'lucide-react';

/**
 * Prompt Chain Editor
 * Visual tool for building multi-step reasoning flows
 */
export default function PromptChainEditor({ chain = [], onChange, onExecute }) {
  const [steps, setSteps] = useState(chain);

  const handleAddStep = (type) => {
    const newStep = {
      id: `step-${Date.now()}`,
      type,
      label: getStepLabel(type),
      prompt: getDefaultPrompt(type),
      output: null,
    };
    const newSteps = [...steps, newStep];
    setSteps(newSteps);
    onChange?.(newSteps);
  };

  const handleRemoveStep = (id) => {
    const newSteps = steps.filter(s => s.id !== id);
    setSteps(newSteps);
    onChange?.(newSteps);
  };

  const handleUpdateStep = (id, updates) => {
    const newSteps = steps.map(s =>
      s.id === id ? { ...s, ...updates } : s
    );
    setSteps(newSteps);
    onChange?.(newSteps);
  };

  const handleReorder = (newSteps) => {
    setSteps(newSteps);
    onChange?.(newSteps);
  };

  const executeChain = () => {
    onExecute?.(steps);
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-neutral-900 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div>
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
            Prompt Chain Editor
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Build multi-step reasoning flows
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StepTypeMenu onAddStep={handleAddStep} />
          {steps.length > 0 && (
            <button onClick={executeChain} className="btn-primary flex items-center gap-2">
              <Play className="w-4 h-4" />
              Execute Chain
            </button>
          )}
        </div>
      </div>

      {/* Chain Steps */}
      <div className="flex-1 overflow-auto p-4">
        {steps.length === 0 ? (
          <EmptyChainState onAddStep={handleAddStep} />
        ) : (
          <Reorder.Group
            axis="y"
            values={steps}
            onReorder={handleReorder}
            className="space-y-3"
          >
            {steps.map((step, index) => (
              <Reorder.Item key={step.id} value={step}>
                <ChainStep
                  step={step}
                  index={index}
                  onUpdate={(updates) => handleUpdateStep(step.id, updates)}
                  onRemove={() => handleRemoveStep(step.id)}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>
    </div>
  );
}

/**
 * Individual Chain Step
 */
function ChainStep({ step, index, onUpdate, onRemove }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const icon = getStepIcon(step.type);
  const color = getStepColor(step.type);

  return (
    <motion.div
      layout
      className="card border-l-4"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <button className="mt-1 cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Step Number & Icon */}
        <div className="flex flex-col items-center gap-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
            style={{ backgroundColor: color }}
          >
            {index + 1}
          </div>
          <div className="text-2xl">{icon}</div>
        </div>

        {/* Step Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <input
              type="text"
              value={step.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="input py-1 font-medium"
              placeholder="Step name"
            />
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="btn-ghost p-1 text-xs"
              >
                {isExpanded ? 'Collapse' : 'Expand'}
              </button>
              <button
                onClick={onRemove}
                className="btn-ghost p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <textarea
                value={step.prompt}
                onChange={(e) => onUpdate({ prompt: e.target.value })}
                className="textarea text-sm"
                rows={3}
                placeholder="Enter prompt instructions..."
              />

              {step.output && (
                <div className="p-3 bg-neutral-50 dark:bg-neutral-850 rounded-lg">
                  <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    Output:
                  </div>
                  <div className="text-sm text-neutral-900 dark:text-neutral-100">
                    {step.output}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Step Type Menu
 */
function StepTypeMenu({ onAddStep }) {
  const [isOpen, setIsOpen] = useState(false);

  const stepTypes = [
    { type: 'summarize', label: 'Summarize', icon: <FileText className="w-4 h-4" /> },
    { type: 'extract', label: 'Extract Insights', icon: <Lightbulb className="w-4 h-4" /> },
    { type: 'visualize', label: 'Visualize', icon: <Network className="w-4 h-4" /> },
    { type: 'reflect', label: 'Reflect', icon: <MessageCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Step
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-0 mt-2 w-48 card p-2 z-20"
          >
            {stepTypes.map((step) => (
              <button
                key={step.type}
                onClick={() => {
                  onAddStep(step.type);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left"
              >
                {step.icon}
                <span className="text-sm">{step.label}</span>
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}

/**
 * Empty State
 */
function EmptyChainState({ onAddStep }) {
  const defaultSteps = ['summarize', 'extract', 'visualize', 'reflect'];

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🔗</div>
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          Build Your Reasoning Chain
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Create multi-step AI workflows to analyze, extract, and visualize insights.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {defaultSteps.map((type) => (
            <button
              key={type}
              onClick={() => onAddStep(type)}
              className="btn-secondary text-sm"
            >
              + {getStepLabel(type)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Helper Functions
 */
function getStepLabel(type) {
  const labels = {
    summarize: 'Summarize',
    extract: 'Extract Insights',
    visualize: 'Visualize Structure',
    reflect: 'Reflect & Connect',
  };
  return labels[type] || type;
}

function getDefaultPrompt(type) {
  const prompts = {
    summarize: 'Summarize the main points from the previous step.',
    extract: 'Extract key insights and important concepts.',
    visualize: 'Identify relationships and structure in the content.',
    reflect: 'Reflect on the findings and suggest next steps.',
  };
  return prompts[type] || '';
}

function getStepIcon(type) {
  const icons = {
    summarize: '📄',
    extract: '💡',
    visualize: '🔗',
    reflect: '💭',
  };
  return icons[type] || '⚡';
}

function getStepColor(type) {
  const colors = {
    summarize: '#3b82f6',
    extract: '#f59e0b',
    visualize: '#8b5cf6',
    reflect: '#10b981',
  };
  return colors[type] || '#6b7280';
}
