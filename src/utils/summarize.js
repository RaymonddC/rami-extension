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
      languageModelStatus.available === 'available' ||
      summarizerStatus.available === 'readily' ||
      summarizerStatus.available === 'available';

    if (!isAvailable) {
      console.warn('⏳ AI models not ready. Status:', {
        languageModel: languageModelStatus.available,
        summarizer: summarizerStatus.available
      });

      if (languageModelStatus.available === 'after-download' ||
          summarizerStatus.available === 'after-download') {
        console.log('📥 Gemini Nano needs to download. This may take a few minutes.');
        console.log('💡 Trigger download: await ai.languageModel.create()');
      } else if (languageModelStatus.available === 'unavailable' ||
                 summarizerStatus.available === 'unavailable') {
        console.log('❌ AI models are unavailable. Check Chrome flags and system requirements.');
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
    const personaConfig = PERSONAS[persona];

    // Try new Summarizer API (window.Summarizer)
    if ('Summarizer' in self) {
      try {
        const availability = await self.Summarizer.availability();
        console.log('📝 New Summarizer API availability:', availability);

        if (availability === 'readily' || availability === 'available') {
          console.log('🤖 Using new Summarizer API');
          const summarizer = await self.Summarizer.create({
            type: type,
            format: 'plain-text',
            length: length,
            sharedContext: personaConfig.systemPrompt
          });

          const summary = await summarizer.summarize(text);
          await summarizer.destroy();

          return {
            success: true,
            summary: summary,
            method: 'summarizer-api',
            persona: personaConfig.name
          };
        }
      } catch (error) {
        console.warn('New Summarizer API failed:', error.message);
      }
    }

    // Try old ai.summarizer API
    if (self.ai?.summarizer) {
      try {
        const capabilities = await self.ai.summarizer.capabilities();
        console.log('📝 Old summarizer API status:', capabilities);

        if (capabilities.available === 'readily' || capabilities.available === 'available') {
          console.log('🤖 Using ai.summarizer API');
          const summarizer = await self.ai.summarizer.create({
            type,
            length,
          });

          const summary = await summarizer.summarize(text);
          await summarizer.destroy();

          return {
            success: true,
            summary: summary,
            method: 'chrome-ai',
            persona: personaConfig.name
          };
        } else {
          console.warn(`⏳ Summarizer status: ${capabilities.available}`);
          if (capabilities.available === 'unavailable') {
            console.warn('❌ Summarizer is unavailable. Check Chrome flags.');
          }
        }
      } catch (error) {
        console.warn('Old summarizer API failed:', error.message);
      }
    }

    // Fallback
    console.log('📝 No summarizer available, using fallback');
    return await fallbackSummarize(text, options);

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
    const personaConfig = PERSONAS[persona];

    // Try new LanguageModel API
    if ('LanguageModel' in self) {
      try {
        const availability = await self.LanguageModel.availability();
        console.log('🤖 LanguageModel API availability:', availability);

        if (availability === 'readily' || availability === 'available') {
          console.log('🤖 Using new LanguageModel API');
          console.log('⏳ Creating language model session...');
          const session = await self.LanguageModel.create({
            temperature,
            topK: 3,
            systemPrompt: personaConfig.systemPrompt,
            outputLanguage: 'en'
          });

          const fullPrompt = `${personaConfig.promptStyle}\n\n${prompt}`;
          console.log('⏳ Sending prompt to AI (max 2 minutes)...');
          console.log('📝 Prompt length:', fullPrompt.length, 'characters');

          const response = await Promise.race([
            session.prompt(fullPrompt),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('AI response timeout after 120 seconds')), 120000)
            )
          ]);

          console.log('✅ AI response received, length:', response?.length);
          await session.destroy();

          return {
            success: true,
            response,
            persona: personaConfig.name,
            method: 'language-model-api'
          };
        }
      } catch (error) {
        console.warn('New LanguageModel API failed:', error.message);
      }
    }

    // Try old ai.languageModel API
    if (self.ai?.languageModel) {
      try {
        const capabilities = await self.ai.languageModel.capabilities();
        console.log('🤖 Old Language Model status:', capabilities);

        if (capabilities.available === 'readily' || capabilities.available === 'available') {
          console.log('🤖 Using ai.languageModel API');
          const fullPrompt = `${personaConfig.systemPrompt}\n\n${personaConfig.promptStyle}\n\n${prompt}`;

          const session = await self.ai.languageModel.create({
            temperature,
            topK: 3,
          });

          const response = await session.prompt(fullPrompt);
          await session.destroy();

          return {
            success: true,
            response,
            persona: personaConfig.name,
            method: 'gemini-nano'
          };
        } else {
          console.warn(`⏳ Language Model status: ${capabilities.available}`);
          if (capabilities.available === 'unavailable') {
            console.warn('❌ Language Model is unavailable. Check Chrome flags.');
          }
        }
      } catch (error) {
        console.warn('Old language model API failed:', error.message);
      }
    }

    // Fallback to mock
    console.log('🤖 Language Model not available, using mock');
    return await mockLanguageModelResponse(prompt, options);
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
  
  console.log('🔍 extractConcepts called with:', { textLength: text?.length, persona, maxConcepts });

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

  try {
    const result = await queryLanguageModel(prompt, { persona, maxTokens: 2000 });
    console.log('🤖 Language model result:', result);

    if (result && result.response) {
      // Try to parse JSON response
      const jsonMatch = result.response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const concepts = JSON.parse(jsonMatch[0]);
          console.log('✅ Parsed concepts from AI:', concepts);

          if (Array.isArray(concepts) && concepts.length > 0) {
            return {
              success: true,
              concepts: concepts.slice(0, maxConcepts),
              method: result.method
            };
          } else {
            console.warn('⚠️ AI returned empty concepts array');
          }
        } catch (parseError) {
          console.error('❌ Failed to parse JSON from AI:', parseError.message);
        }
      } else {
        console.warn('⚠️ No JSON array found in AI response');
        console.log('Response preview:', result.response.substring(0, 200));
      }
    }
  } catch (error) {
    console.error('❌ Language model query failed:', error);
  }

  // Fallback to mock data
  console.log('🔄 Falling back to mock concept extraction');
  const fallbackResult = await mockExtractConcepts(text, options);
  console.log('📊 Fallback returned:', fallbackResult.concepts.length, 'concepts');
  return fallbackResult;
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
  console.log('🎭 Creating mock concepts from text length:', text?.length);

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Extract meaningful phrases and words
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const words = text.split(/\s+/).filter(w => w.length > 5);

  // Get capitalized words (likely important nouns/concepts)
  const capitalizedWords = words.filter(w => /^[A-Z]/.test(w) && w !== w.toUpperCase());

  // Get frequent words (appearing more than once)
  const wordFreq = {};
  words.forEach(w => {
    const lower = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (lower.length > 5) wordFreq[lower] = (wordFreq[lower] || 0) + 1;
  });
  const frequentWords = Object.entries(wordFreq)
    .filter(([word, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);

  // Combine capitalized and frequent words, deduplicate
  const potentialConcepts = [...new Set([...capitalizedWords.slice(0, 5), ...frequentWords.slice(0, 5)])];
  const maxConcepts = options.maxConcepts || 8;
  const selectedConcepts = potentialConcepts.slice(0, maxConcepts);

  console.log('📝 Extracted concept candidates:', selectedConcepts);

  // Create mindmap nodes with meaningful connections
  const concepts = selectedConcepts.map((word, index) => {
    // Main concept is the first one, secondary/tertiary for variety
    let type = 'secondary';
    if (index === 0) type = 'main';
    else if (index % 3 === 0) type = 'tertiary';

    // Create better connections:
    // - First node (main) connects to multiple concepts
    // - Other nodes connect to neighbors
    const connections = [];
    if (index === 0) {
      // Main concept connects to first 3 secondary concepts
      for (let i = 1; i < Math.min(4, selectedConcepts.length); i++) {
        connections.push(`concept-${i}`);
      }
    } else {
      // Connect to next concept
      if (index < selectedConcepts.length - 1) {
        connections.push(`concept-${index + 1}`);
      }
      // Some concepts also connect back to main
      if (index > 0 && index % 2 === 0) {
        connections.push('concept-0');
      }
    }

    return {
      id: `concept-${index}`,
      label: word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
      type,
      connections
    };
  });

  console.log('🎯 Generated mock concepts:', concepts);

  return {
    success: true,
    concepts,
    method: 'fallback'
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
