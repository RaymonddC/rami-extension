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
  const { persona = 'architect', maxConcepts = 12 } = options;

  console.log('🔍 extractConcepts called with:', { textLength: text?.length, persona, maxConcepts });

  // Preprocess text - extract more context (up to 5000 chars)
  const processedText = text.substring(0, 5000).trim();

  // Get persona-specific instructions
  const personaConfig = PERSONAS[persona] || PERSONAS.architect;
  const personaInstructions = getPersonaMindmapInstructions(persona);

  // Build comprehensive prompt
  const prompt = `You are creating a hierarchical mindmap from text. Your goal is to identify ONE central concept and organize related ideas in a clear tree structure.

${personaInstructions}

CRITICAL RULES:
1. Create EXACTLY ONE "main" concept (the central topic)
2. Create 3-5 "secondary" concepts (major branches from main topic)
3. For complex topics: Create 2-3 "tertiary" concepts under MOST secondary branches to add depth
4. For simpler topics: You may use just 2 levels (main + secondary) if that's more natural
5. NEVER repeat the same concept twice - each concept must be unique
6. Keep labels concise (2-5 words maximum)
7. Connections should form a PARENT-TO-CHILD tree structure
8. Each concept only lists its CHILDREN in connections (not its parent)

STRUCTURE & CONNECTIONS:
- Main concept (type: "main")
  → Lists its secondary children in connections
  → Example: "connections": ["branch-1", "branch-2", "branch-3"]

- Secondary concepts (type: "secondary")
  → Lists its tertiary children in connections (NOT main)
  → Example: "connections": ["detail-1-1", "detail-1-2"]

- Tertiary concepts (type: "tertiary")
  → Has empty connections array (leaf nodes)
  → Example: "connections": []

OUTPUT FORMAT - Return ONLY valid JSON array, no markdown, no explanation:

EXAMPLE (showing proper 3-level hierarchy):
[
  {
    "id": "main",
    "label": "Built-in AI Capabilities",
    "type": "main",
    "connections": ["benefits", "deployment", "performance"]
  },
  {
    "id": "benefits",
    "label": "Benefits of Built-in AI",
    "type": "secondary",
    "connections": ["privacy", "offline-access", "cost-savings"]
  },
  {
    "id": "privacy",
    "label": "Privacy Protection",
    "type": "tertiary",
    "connections": []
  },
  {
    "id": "offline-access",
    "label": "Offline Functionality",
    "type": "tertiary",
    "connections": []
  },
  {
    "id": "cost-savings",
    "label": "Reduced API Costs",
    "type": "tertiary",
    "connections": []
  },
  {
    "id": "deployment",
    "label": "Ease of Deployment",
    "type": "secondary",
    "connections": ["simple-integration", "no-setup"]
  },
  {
    "id": "simple-integration",
    "label": "Simple Integration",
    "type": "tertiary",
    "connections": []
  },
  {
    "id": "no-setup",
    "label": "No Infrastructure",
    "type": "tertiary",
    "connections": []
  },
  {
    "id": "performance",
    "label": "Hardware Acceleration",
    "type": "secondary",
    "connections": ["gpu-support", "fast-response"]
  },
  {
    "id": "gpu-support",
    "label": "GPU Optimization",
    "type": "tertiary",
    "connections": []
  },
  {
    "id": "fast-response",
    "label": "Low Latency",
    "type": "tertiary",
    "connections": []
  }
]

IMPORTANT: Your output must follow this exact pattern with 3 levels!

TEXT TO ANALYZE:
${processedText}

Remember: Return ONLY the JSON array. Connections are PARENT → CHILD only (not bidirectional). No markdown code blocks, no extra text.`;

  try {
    const result = await queryLanguageModel(prompt, { persona, maxTokens: 2500 });
    console.log('🤖 Language model result:', result);

    if (result && result.response) {
      // Extract JSON from response (handle markdown code blocks)
      let jsonText = result.response.trim();

      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');

      // Try to find JSON array
      const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const concepts = JSON.parse(jsonMatch[0]);
          console.log('✅ Parsed concepts from AI:', concepts);

          if (Array.isArray(concepts) && concepts.length > 0) {
            // Validate and clean concepts
            let validatedConcepts = validateAndCleanConcepts(concepts, maxConcepts);

            // Ensure we have a proper 3-level hierarchy
            validatedConcepts = ensureHierarchicalStructure(validatedConcepts);

            if (validatedConcepts.length > 0) {
              console.log('✅ Validated concepts:', validatedConcepts.length);
              return {
                success: true,
                concepts: validatedConcepts,
                method: result.method
              };
            }
          } else {
            console.warn('⚠️ AI returned empty concepts array');
          }
        } catch (parseError) {
          console.error('❌ Failed to parse JSON from AI:', parseError.message);
          console.log('Raw response:', result.response.substring(0, 300));
        }
      } else {
        console.warn('⚠️ No JSON array found in AI response');
        console.log('Response preview:', result.response.substring(0, 300));
      }
    }
  } catch (error) {
    console.error('❌ Language model query failed:', error);
  }

  // Fallback to improved mock extraction
  console.log('🔄 Falling back to enhanced concept extraction');
  const fallbackResult = await mockExtractConcepts(text, options);
  console.log('📊 Fallback returned:', fallbackResult.concepts.length, 'concepts');
  return fallbackResult;
}

/**
 * Ensure concepts have proper 3-level hierarchy
 * Only expand if we have SOME tertiary but not all secondary have children
 */
function ensureHierarchicalStructure(concepts) {
  if (!concepts || concepts.length === 0) return concepts;

  const main = concepts.find(c => c.type === 'main');
  const secondary = concepts.filter(c => c.type === 'secondary');
  const tertiary = concepts.filter(c => c.type === 'tertiary');

  console.log(`📊 Structure check: ${main ? 1 : 0} main, ${secondary.length} secondary, ${tertiary.length} tertiary`);

  // If AI generated NO tertiary at all, don't force it - maybe the content is simple
  if (tertiary.length === 0) {
    console.log('ℹ️ No tertiary concepts generated by AI - keeping structure as-is');
    return concepts;
  }

  // If we have SOME tertiary but not all secondary have children, only expand those without
  const expandedConcepts = [...concepts];
  let addedCount = 0;

  secondary.forEach((sec) => {
    // Check if this secondary has any children
    const hasChildren = tertiary.some(t =>
      sec.connections && sec.connections.includes(t.id)
    );

    // Only expand if AI clearly intended hierarchy but missed this branch
    if (!hasChildren && tertiary.length > 0 && addedCount < 3) {
      // Create 2 tertiary children for this secondary
      const child1Id = `detail-${sec.id}-1`;
      const child2Id = `detail-${sec.id}-2`;

      // Add children to secondary's connections
      if (!sec.connections) sec.connections = [];
      sec.connections.push(child1Id, child2Id);

      // Create child concepts with more specific labels
      const aspects = getSecondaryAspects(sec.label);

      expandedConcepts.push({
        id: child1Id,
        label: aspects[0],
        type: 'tertiary',
        connections: []
      });

      expandedConcepts.push({
        id: child2Id,
        label: aspects[1],
        type: 'tertiary',
        connections: []
      });

      addedCount++;
      console.log(`  ➕ Added 2 tertiary children for "${sec.label}"`);
    }
  });

  if (addedCount > 0) {
    console.log(`✅ Balanced structure: expanded ${addedCount} secondary branches`);
  }

  return expandedConcepts;
}

/**
 * Generate aspect labels for a secondary concept
 */
function getSecondaryAspects(label) {
  // Generate two logical aspects/sub-topics for a concept
  const aspects = {
    'Benefits': ['Key Advantages', 'Impact'],
    'Deployment': ['Implementation', 'Setup'],
    'Performance': ['Speed', 'Efficiency'],
    'User Experience': ['Usability', 'Accessibility'],
    'Features': ['Core Features', 'Advanced Features'],
    'Integration': ['API Integration', 'Tool Support'],
    'Security': ['Protection', 'Compliance'],
    'Architecture': ['Structure', 'Design'],
    'Development': ['Process', 'Tools'],
    'Testing': ['Methods', 'Coverage'],
  };

  // Try to match keywords
  for (const [key, values] of Object.entries(aspects)) {
    if (label.toLowerCase().includes(key.toLowerCase())) {
      return values;
    }
  }

  // Default aspects
  return ['Key Points', 'Details'];
}

/**
 * Get persona-specific mindmap creation instructions
 */
function getPersonaMindmapInstructions(persona) {
  const instructions = {
    architect: `As an architect, build the mindmap with clear structural hierarchy. Think of the main concept as the foundation, secondary concepts as supporting pillars, and tertiary concepts as detailed architectural elements. Ensure clean, logical organization.`,

    strategist: `As a strategist, identify the core strategic goal as the main concept. Secondary concepts should be key strategic pillars. Show how different elements connect to achieve the overall strategy. Focus on relationships and dependencies.`,

    analyst: `As an analyst, identify the central data point or key finding as the main concept. Break it down into analytical categories (secondary), then specific metrics or insights (tertiary). Be precise and data-focused.`,

    researcher: `As a researcher, identify the main research question or topic. Secondary concepts should be major areas of investigation. Tertiary concepts should be specific findings or sub-questions. Show thorough coverage.`,

    mentor: `As a mentor, identify the core learning concept. Secondary concepts should be foundational learning pillars that build understanding. Tertiary concepts should be practical examples or stepping stones. Make it easy to follow.`
  };

  return instructions[persona] || instructions.architect;
}

/**
 * Validate concepts structure and remove duplicates
 */
function validateAndCleanConcepts(concepts, maxConcepts) {
  if (!Array.isArray(concepts)) return [];

  // Track seen labels to avoid duplicates
  const seenLabels = new Set();
  const seenIds = new Set();
  const validConcepts = [];

  // Ensure we have exactly one main concept
  let mainCount = 0;

  for (const concept of concepts) {
    // Validate required fields
    if (!concept.id || !concept.label || !concept.type) {
      console.warn('⚠️ Skipping invalid concept:', concept);
      continue;
    }

    // Normalize label (trim, lowercase for comparison)
    const normalizedLabel = concept.label.trim().toLowerCase();

    // Skip duplicates
    if (seenLabels.has(normalizedLabel) || seenIds.has(concept.id)) {
      console.warn('⚠️ Skipping duplicate:', concept.label);
      continue;
    }

    // Count main concepts
    if (concept.type === 'main') {
      mainCount++;
      if (mainCount > 1) {
        console.warn('⚠️ Multiple main concepts found, converting to secondary:', concept.label);
        concept.type = 'secondary';
      }
    }

    // Ensure connections is an array
    if (!Array.isArray(concept.connections)) {
      concept.connections = [];
    }

    // Add to valid list
    seenLabels.add(normalizedLabel);
    seenIds.add(concept.id);
    validConcepts.push({
      id: concept.id,
      label: concept.label.trim(),
      type: concept.type,
      connections: concept.connections
    });

    // Stop if we reach max
    if (validConcepts.length >= maxConcepts) break;
  }

  // If no main concept, promote the first one
  if (mainCount === 0 && validConcepts.length > 0) {
    console.log('⚠️ No main concept found, promoting first concept');
    validConcepts[0].type = 'main';
  }

  console.log(`✅ Validated ${validConcepts.length} unique concepts (${mainCount} main)`);
  return validConcepts;
}

/**
 * Explain a specific concept in detail using AI
 * Used for node detail popovers in mindmaps
 */
export async function explainConcept(conceptLabel, contextText = '', options = {}) {
  const { persona = 'mentor', maxLength = 300 } = options;

  console.log('📖 explainConcept called for:', conceptLabel);

  // Build a focused prompt for explaining this specific concept
  const prompt = `Explain the concept "${conceptLabel}" in a clear, concise way.

Use the following context to make your explanation relevant and specific:

${contextText.substring(0, 2000)}

INSTRUCTIONS:
- Keep explanation to 2-3 sentences (${maxLength} chars max)
- Be clear and accessible
- Focus on why this concept matters
- Connect it to the broader context if possible
- Avoid jargon unless necessary

Explain "${conceptLabel}":`;

  try {
    const result = await queryLanguageModel(prompt, {
      persona,
      maxTokens: 500,
      temperature: 0.7
    });

    if (result && result.response) {
      let explanation = result.response.trim();

      // Remove any prompt echoing
      explanation = explanation.replace(new RegExp(`^Explain[^:]*:\\s*`, 'i'), '');
      explanation = explanation.replace(new RegExp(`^"${conceptLabel}"[^:]*:\\s*`, 'i'), '');

      // Truncate if too long
      if (explanation.length > maxLength) {
        explanation = explanation.substring(0, maxLength).trim() + '...';
      }

      return {
        success: true,
        explanation,
        method: result.method
      };
    }
  } catch (error) {
    console.error('❌ Failed to explain concept:', error);
  }

  // Fallback explanation
  return {
    success: true,
    explanation: `"${conceptLabel}" is a key concept in this content. It relates to the main themes and ideas discussed in the text.`,
    method: 'fallback'
  };
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

  // Create mindmap nodes with PARENT → CHILD connections only
  // Structure: 1 main → 2-3 secondary → 2-3 tertiary each
  const concepts = [];

  // Determine node types based on index
  const mainIndex = 0;
  const secondaryCount = Math.min(3, Math.floor((selectedConcepts.length - 1) / 2));
  const secondaryIndices = Array.from({ length: secondaryCount }, (_, i) => i + 1);

  selectedConcepts.forEach((word, index) => {
    let type = 'tertiary';
    let connections = [];

    if (index === mainIndex) {
      // Main concept - connects to all secondary
      type = 'main';
      connections = secondaryIndices.map(i => `concept-${i}`);
    } else if (index <= secondaryCount) {
      // Secondary concept - connects to its tertiary children
      type = 'secondary';
      // Find tertiary children (concepts after all secondary)
      const tertiaryStartIndex = secondaryCount + 1;
      const childrenPerSecondary = Math.floor((selectedConcepts.length - tertiaryStartIndex) / secondaryCount);
      const childStartIndex = tertiaryStartIndex + (index - 1) * childrenPerSecondary;
      const childEndIndex = Math.min(childStartIndex + childrenPerSecondary, selectedConcepts.length);

      for (let i = childStartIndex; i < childEndIndex; i++) {
        connections.push(`concept-${i}`);
      }
    } else {
      // Tertiary concept - leaf node, no children
      type = 'tertiary';
      connections = [];
    }

    concepts.push({
      id: `concept-${index}`,
      label: word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
      type,
      connections
    });
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
