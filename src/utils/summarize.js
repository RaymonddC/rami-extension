/**
 * Chrome AI API Utilities
 * Handles summarization and language model interactions using Gemini Nano
 */

// Persona configurations that modify AI behavior
export const PERSONAS = {
  strategist: {
    id: 'strategist',
    name: 'The Strategist',
    icon: '☕',
    beverage: 'Matcha Latte',
    description: 'Focused, layered, intentional thinker',
    promptStyle: 'Guide me like a strategist—balanced, energizing, thoughtfully blended.',
    systemPrompt: 'You are a strategic thinker who provides balanced, well-structured insights. Focus on connections, patterns, and actionable frameworks.',
    tone: 'balanced',
    complexity: 'medium'
  },
  analyst: {
    id: 'analyst',
    name: 'The Analyst',
    icon: '🧊',
    beverage: 'Iced Americano',
    description: 'Crisp, direct, no-nonsense problem solver',
    promptStyle: 'Break it down like an analyst—clear, strong, efficient.',
    systemPrompt: 'You are a sharp analyst who provides clear, data-driven insights. Be direct, efficient, and focus on key findings.',
    tone: 'direct',
    complexity: 'low'
  },
  architect: {
    id: 'architect',
    name: 'The Architect',
    icon: '🧱',
    beverage: 'Bubble Tea',
    description: 'Structured, modular, precise creator',
    promptStyle: 'Explain it like an architect—with layers, textures, and a solid base.',
    systemPrompt: 'You are a systematic architect who builds structured, layered understanding. Focus on organization, hierarchy, and clear foundations.',
    tone: 'structured',
    complexity: 'high'
  },
  researcher: {
    id: 'researcher',
    name: 'The Researcher',
    icon: '⚡',
    beverage: 'Electrolyte Drink',
    description: 'Restorative, data-driven endurance thinker',
    promptStyle: 'Investigate like a researcher—replenishing, precise, built for endurance.',
    systemPrompt: 'You are a thorough researcher who digs deep into topics. Provide comprehensive, well-sourced insights with attention to detail.',
    tone: 'thorough',
    complexity: 'high'
  },
  mentor: {
    id: 'mentor',
    name: 'The Mentor',
    icon: '🌿',
    beverage: 'Warm Milk',
    description: 'Gentle, comforting, sustaining guide',
    promptStyle: 'Teach me like a mentor—soothing, steady, full of quiet wisdom.',
    systemPrompt: 'You are a patient mentor who guides with care and wisdom. Explain concepts gently, build understanding gradually, and encourage growth.',
    tone: 'nurturing',
    complexity: 'low'
  }
};

/**
 * Check if Chrome AI APIs are available
 */
export async function checkAIAvailability() {
  try {
    // Check if chrome.ai exists
    if (!self.ai) {
      console.warn('⚠️ Chrome AI not available. Please enable it in chrome://flags/');
      console.warn('Enable: Prompt API for Gemini Nano, Summarization API');
      return {
        available: false,
        reason: 'Chrome AI APIs not found. Enable flags at chrome://flags/',
        instructions: 'See ENABLE_CHROME_AI.md for setup instructions'
      };
    }

    // Check language model
    let languageModelStatus = { available: 'no' };
    try {
      languageModelStatus = await self.ai.languageModel.capabilities();
      console.log('🤖 Language Model status:', languageModelStatus);
    } catch (e) {
      console.warn('Language model check failed:', e.message);
    }

    // Check summarizer
    let summarizerStatus = { available: 'no' };
    try {
      if (self.ai.summarizer) {
        summarizerStatus = await self.ai.summarizer.capabilities();
        console.log('📝 Summarizer status:', summarizerStatus);
      }
    } catch (e) {
      console.warn('Summarizer check failed:', e.message);
    }

    const isAvailable =
      languageModelStatus.available === 'readily' ||
      summarizerStatus.available === 'readily';

    if (!isAvailable) {
      console.warn('⏳ AI models not ready. Status:', {
        languageModel: languageModelStatus.available,
        summarizer: summarizerStatus.available
      });

      if (languageModelStatus.available === 'after-download' ||
          summarizerStatus.available === 'after-download') {
        console.log('📥 Gemini Nano needs to download. This may take a few minutes.');
        console.log('💡 Trigger download: await ai.languageModel.create()');
      }
    }

    return {
      available: isAvailable,
      languageModel: languageModelStatus.available,
      summarizer: summarizerStatus.available,
      message: isAvailable
        ? '✅ AI is ready!'
        : '⚠️ AI not ready. Using fallback mode. See console for details.'
    };
  } catch (error) {
    console.error('❌ AI availability check failed:', error);
    return {
      available: false,
      reason: error.message,
      message: 'AI check failed. Using fallback mode.'
    };
  }
}

/**
 * Summarize text using Chrome Summarizer API
 */
export async function summarizeText(text, options = {}) {
  try {
    const { type = 'key-points', length = 'medium', persona = 'strategist' } = options;

    // Check if summarizer is available
    if (!self.ai || !self.ai.summarizer) {
      console.log('📝 Summarizer not available, using fallback');
      return await fallbackSummarize(text, options);
    }

    // Check capabilities
    const capabilities = await self.ai.summarizer.capabilities();
    if (capabilities.available !== 'readily') {
      console.warn(`⏳ Summarizer status: ${capabilities.available}`);
      return await fallbackSummarize(text, options);
    }

    console.log('🤖 Using Chrome AI Summarizer');
    const summarizer = await self.ai.summarizer.create({
      type,
      length,
    });

    const summary = await summarizer.summarize(text);

    // Apply persona styling to summary
    const personaConfig = PERSONAS[persona];
    const styledSummary = await applyPersonaTone(summary, personaConfig);

    return {
      success: true,
      summary: styledSummary,
      method: 'chrome-ai',
      persona: personaConfig.name
    };
  } catch (error) {
    console.error('❌ Summarization failed:', error);
    console.log('↩️ Falling back to simple extraction');
    return await fallbackSummarize(text, options);
  }
}

/**
 * Use Language Model for more complex reasoning
 */
export async function queryLanguageModel(prompt, options = {}) {
  try {
    const { persona = 'strategist', temperature = 0.7, maxTokens = 1000 } = options;

    if (!self.ai?.languageModel) {
      console.log('🤖 Language Model not available, using mock');
      return await mockLanguageModelResponse(prompt, options);
    }

    // Check capabilities
    const capabilities = await self.ai.languageModel.capabilities();
    if (capabilities.available !== 'readily') {
      console.warn(`⏳ Language Model status: ${capabilities.available}`);
      return await mockLanguageModelResponse(prompt, options);
    }

    console.log('🤖 Using Gemini Nano Language Model');
    const personaConfig = PERSONAS[persona];
    const fullPrompt = `${personaConfig.systemPrompt}\n\n${personaConfig.promptStyle}\n\n${prompt}`;

    const session = await self.ai.languageModel.create({
      temperature,
      topK: 3,
    });

    const response = await session.prompt(fullPrompt);

    return {
      success: true,
      response,
      persona: personaConfig.name,
      method: 'gemini-nano'
    };
  } catch (error) {
    console.error('❌ Language model query failed:', error);
    console.log('↩️ Using mock response');
    return await mockLanguageModelResponse(prompt, options);
  }
}

/**
 * Extract key concepts and relationships from text for mindmap generation
 */
export async function extractConcepts(text, options = {}) {
  const { persona = 'architect', maxConcepts = 10 } = options;

  const prompt = `Analyze the following text and extract key concepts and their relationships.

Format your response as a JSON array of nodes with this structure:
[
  {
    "id": "concept-1",
    "label": "Main Concept",
    "type": "main",
    "connections": ["concept-2", "concept-3"]
  }
]

Text to analyze:
${text.substring(0, 3000)}`;

  const result = await queryLanguageModel(prompt, { persona, maxTokens: 2000 });

  try {
    // Parse JSON response
    const jsonMatch = result.response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const concepts = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        concepts: concepts.slice(0, maxConcepts),
        method: result.method
      };
    }
  } catch (error) {
    console.error('Failed to parse concepts:', error);
  }

  // Fallback to mock data
  return await mockExtractConcepts(text, options);
}

/**
 * Generate prompt chain for reasoning flows
 */
export async function generatePromptChain(topic, steps = []) {
  const defaultSteps = [
    { type: 'summarize', label: 'Summarize' },
    { type: 'extract', label: 'Extract Insights' },
    { type: 'visualize', label: 'Visualize Structure' },
    { type: 'reflect', label: 'Reflect & Connect' }
  ];

  const chain = steps.length > 0 ? steps : defaultSteps;

  return {
    success: true,
    chain: chain.map((step, index) => ({
      id: `step-${index}`,
      ...step,
      order: index
    })),
    topic
  };
}

/**
 * Apply persona tone to text
 */
async function applyPersonaTone(text, personaConfig) {
  // For now, just return the text as-is
  // In production, you could use language model to restyle
  return text;
}

/**
 * Fallback summarization using simple extraction
 */
async function fallbackSummarize(text, options = {}) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const summary = sentences.slice(0, 3).join(' ').trim();

  return {
    success: true,
    summary: summary || text.substring(0, 500),
    method: 'fallback'
  };
}

/**
 * Mock language model response for development/testing
 */
async function mockLanguageModelResponse(prompt, options = {}) {
  const { persona = 'strategist' } = options;
  const personaConfig = PERSONAS[persona];

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const mockResponses = {
    strategist: `From a strategic perspective, this requires a balanced approach. Consider the interconnected factors and build a framework that addresses both immediate needs and long-term goals.`,
    analyst: `Key findings: The data shows clear patterns. Focus on the metrics that matter. Action items are straightforward once you strip away the noise.`,
    architect: `Let's build this systematically. Foundation first: establish core principles. Then layer in complexity. Structure matters—each piece must support the whole.`,
    researcher: `Based on thorough investigation, multiple factors emerge. The evidence suggests nuanced relationships. Further exploration of edge cases would be valuable.`,
    mentor: `Let's take this step by step. Understanding comes gradually. Think of it like building a habit—small, consistent progress creates lasting change.`
  };

  return {
    success: true,
    response: mockResponses[persona] || mockResponses.strategist,
    persona: personaConfig.name,
    method: 'mock'
  };
}

/**
 * Mock concept extraction for development/testing
 */
async function mockExtractConcepts(text, options = {}) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Extract first words as mock concepts
  const words = text.split(/\s+/).filter(w => w.length > 4);
  const uniqueWords = [...new Set(words)].slice(0, options.maxConcepts || 10);

  const concepts = uniqueWords.map((word, index) => ({
    id: `concept-${index}`,
    label: word,
    type: index === 0 ? 'main' : 'secondary',
    connections: index < uniqueWords.length - 1 ? [`concept-${index + 1}`] : []
  }));

  return {
    success: true,
    concepts,
    method: 'mock'
  };
}

/**
 * Storage helpers for persisting data
 */
export async function saveToStorage(key, data) {
  try {
    await chrome.storage.local.set({ [key]: data });
    return { success: true };
  } catch (error) {
    console.error('Storage save failed:', error);
    return { success: false, error: error.message };
  }
}

export async function getFromStorage(key, defaultValue = null) {
  try {
    const result = await chrome.storage.local.get(key);
    return result[key] !== undefined ? result[key] : defaultValue;
  } catch (error) {
    console.error('Storage get failed:', error);
    return defaultValue;
  }
}

export async function removeFromStorage(key) {
  try {
    await chrome.storage.local.remove(key);
    return { success: true };
  } catch (error) {
    console.error('Storage remove failed:', error);
    return { success: false, error: error.message };
  }
}
