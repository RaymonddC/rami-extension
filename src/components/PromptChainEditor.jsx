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
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowDown,
} from 'lucide-react';
import { queryLanguageModel } from '../utils/summarize';

/**
 * Prompt Chain Editor
 * Visual tool for building multi-step reasoning flows
 */
export default function PromptChainEditor({ chain = [], onChange, onExecute, preferences = {}, readings = [] }) {
  const [steps, setSteps] = useState(chain);
  const [executionState, setExecutionState] = useState('idle'); // idle, running, completed, error
  const [currentStepIndex, setCurrentStepIndex] = useState(null);
  const [executionResults, setExecutionResults] = useState([]);
  const [selectedReadingId, setSelectedReadingId] = useState(null);

  // Auto-select latest reading when available
  React.useEffect(() => {
    if (readings.length > 0 && !selectedReadingId) {
      setSelectedReadingId(readings[0].id);
    }
  }, [readings, selectedReadingId]);

  const handleAddStep = (type) => {
    const newStep = {
      id: `step-${Date.now()}`,
      type,
      label: getStepLabel(type),
      prompt: getDefaultPrompt(type),
      output: null,
      status: 'waiting', // waiting, running, completed, error
      startTime: null,
      endTime: null,
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

  const executeChain = async () => {
    // Check if we have a reading selected
    const selectedReading = readings.find(r => r.id === selectedReadingId);
    if (!selectedReading && readings.length > 0) {
      alert('Please select a reading to analyze first!');
      return;
    }

    setExecutionState('running');
    setExecutionResults([]);

    // Reset all step statuses
    const resetSteps = steps.map(s => ({
      ...s,
      status: 'waiting',
      output: null,
      startTime: null,
      endTime: null,
    }));
    setSteps(resetSteps);

    try {
      // Start with the reading content as initial context
      let previousOutput = selectedReading
        ? `Source content from "${selectedReading.title}":\n\n${selectedReading.content || selectedReading.text}`
        : null;

      // Execute each step sequentially
      for (let i = 0; i < resetSteps.length; i++) {
        setCurrentStepIndex(i);
        const step = resetSteps[i];

        // Update step status to running
        handleUpdateStep(step.id, {
          status: 'running',
          startTime: Date.now(),
        });

        try {
          // Build prompt with previous output
          const fullPrompt = previousOutput
            ? `${step.prompt}\n\nContext from previous step:\n${previousOutput}`
            : step.prompt;

          // Execute step (call AI here)
          const output = await executeStep(fullPrompt, step.type);

          previousOutput = output;

          // Update step with output
          handleUpdateStep(step.id, {
            status: 'completed',
            output: output,
            endTime: Date.now(),
          });

          setExecutionResults(prev => [...prev, {
            stepId: step.id,
            stepLabel: step.label,
            output: output,
            timestamp: Date.now(),
          }]);

        } catch (error) {
          handleUpdateStep(step.id, {
            status: 'error',
            output: `Error: ${error.message}`,
            endTime: Date.now(),
          });
          throw error;
        }
      }

      setExecutionState('completed');
      setCurrentStepIndex(null);

    } catch (error) {
      console.error('Chain execution failed:', error);
      setExecutionState('error');
      setCurrentStepIndex(null);
    }
  };

  // Execute step with real AI
  const executeStep = async (prompt, type) => {
    console.log(`🤖 Executing ${type} step with Gemini Nano`);
    console.log(`📝 Prompt preview: ${prompt.substring(0, 100)}...`);

    try {
      // Use the selected persona from preferences
      const persona = preferences?.persona || 'strategist';

      // Call real AI with appropriate parameters for each step type
      const aiOptions = {
        persona,
        maxTokens: 2000,
        temperature: type === 'extract' || type === 'visualize' ? 0.5 : 0.7
      };

      const result = await queryLanguageModel(prompt, aiOptions);

      if (result && result.success && result.response) {
        console.log(`✅ AI response received (${result.method}): ${result.response.length} chars`);
        return result.response;
      } else {
        throw new Error('AI returned empty response');
      }
    } catch (error) {
      console.error(`❌ AI execution failed for ${type} step:`, error);
      throw new Error(`Failed to execute step: ${error.message}`);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-neutral-900 rounded-xl">
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
              Prompt Chain Editor
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Build multi-step reasoning flows
            </p>
          </div>

          {/* Reading Selector */}
          {readings.length > 0 && (
            <div className="flex items-center gap-2 mr-4">
              <label className="text-sm text-neutral-600 dark:text-neutral-400">
                Source:
              </label>
              <select
                value={selectedReadingId || ''}
                onChange={(e) => setSelectedReadingId(e.target.value || null)}
                className="input text-sm px-3 py-1.5 max-w-xs"
              >
                <option value="">Select a reading...</option>
                {readings.map((reading) => (
                  <option key={reading.id} value={reading.id}>
                    {reading.title.substring(0, 50)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <StepTypeMenu onAddStep={handleAddStep} />
            {steps.length > 0 && (
              <button
                onClick={executeChain}
                disabled={executionState === 'running' || (readings.length > 0 && !selectedReadingId)}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {executionState === 'running' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Execute Chain
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Execution Progress Bar */}
        {executionState === 'running' && currentStepIndex !== null && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 mb-2">
              <span>Executing step {currentStepIndex + 1} of {steps.length}</span>
              <span>{Math.round(((currentStepIndex + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary-500"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Execution Complete */}
        {executionState === 'completed' && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Chain executed successfully!</span>
            </div>
          </div>
        )}

        {/* Execution Error */}
        {executionState === 'error' && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span>Chain execution failed. Check step outputs for details.</span>
            </div>
          </div>
        )}
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

  // Calculate execution time
  const executionTime = step.startTime && step.endTime
    ? ((step.endTime - step.startTime) / 1000).toFixed(2)
    : null;

  return (
    <>
      <motion.div
        layout
        className={`card border-l-4 relative ${
          step.status === 'running' ? 'ring-2 ring-primary-500 ring-opacity-50' : ''
        }`}
        style={{ borderLeftColor: color }}
      >
        {/* Status Badge */}
        <StatusBadge status={step.status} executionTime={executionTime} />

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
                  <div className={`p-3 rounded-lg border-2 ${
                    step.status === 'error'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                        Output:
                      </div>
                      {executionTime && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {executionTime}s
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap">
                      {step.output}
                    </div>
                  </div>
                )}

                {step.status === 'running' && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Executing step...</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Flow Arrow - shows data passing to next step */}
      {step.status === 'completed' && (
        <div className="flex justify-center my-2">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-neutral-400"
          >
            <ArrowDown className="w-5 h-5" />
            <span className="text-xs">Data passed to next step</span>
          </motion.div>
        </div>
      )}
    </>
  );
}

/**
 * Status Badge Component
 */
function StatusBadge({ status, executionTime }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'waiting':
        return {
          icon: <Clock className="w-3 h-3" />,
          label: 'Waiting',
          className: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
        };
      case 'running':
        return {
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
          label: 'Running',
          className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className="w-3 h-3" />,
          label: executionTime ? `${executionTime}s` : 'Completed',
          className: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-3 h-3" />,
          label: 'Error',
          className: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  return (
    <div className="absolute top-2 right-2">
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.icon}
        <span>{config.label}</span>
      </div>
    </div>
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
      <div className="text-center max-w-2xl p-8">
        <div className="text-6xl mb-4">🔗</div>
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          Build Your AI Reasoning Chain
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          Create multi-step AI workflows where each step builds on the previous one.
          Perfect for deep analysis, insight extraction, and structured thinking.
        </p>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-left">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">How it works:</h4>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
            <li>Add steps using the buttons below</li>
            <li>Arrange them in your desired order</li>
            <li>Customize each step's prompt</li>
            <li>Select a reading as source material</li>
            <li>Hit "Execute Chain" and watch the AI work step-by-step</li>
            <li>Each step passes its output to the next, building complex insights</li>
          </ol>
        </div>
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
