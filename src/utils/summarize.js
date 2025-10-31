/**
 * ENHANCED Chrome AI API Utilities
 * Handles comprehensive summarization and language model interactions using Gemini Nano
 *
 * VERSION 2.1 - EDUCATIONAL CONTENT FOCUS
 *
 * KEY IMPROVEMENTS:
 * - Prioritizes famous examples and experiments (Pavlov's dog, etc.)
 * - Captures ALL researcher names and historical context
 * - 6-section structure optimized for learning content
 * - Explicit "Famous Examples & Experiments" section
 * - Enhanced fallback with intelligent sentence scoring
 * - Filters out metadata (article authors, publication info)
 * - Focuses on substantive educational content
 * - Better for psychology, science, and educational articles
 * - ~800-1000 word comprehensive summaries
 */

// Persona configurations that modify AI behavior
export const PERSONAS = {
    strategist: {
        id: 'strategist',
        name: 'Matcha',
        icon: '🍵',
        beverage: 'The Strategist',
        description: 'Focused, layered, intentional thinker',
        promptStyle: 'Guide me like a strategist—balanced, energizing, thoughtfully blended.',
        systemPrompt: 'You are a strategic thinker who transforms information into actionable insights. Identify core patterns, draw meaningful connections between concepts, and provide practical frameworks for understanding. Structure your analysis as: 1) Core Concept (what we\'re examining), 2) Key Patterns & Relationships (underlying structure), 3) Strategic Insights (why this matters), 4) Practical Framework or Next Steps (how to apply it). Maintain a balanced, energizing tone—logical yet engaging, concise yet thorough.',
        tone: 'balanced',
        complexity: 'medium'
    },
    analyst: {
        id: 'analyst',
        name: 'Coffee',
        icon: '☕',
        beverage: 'The Analyst',
        description: 'Crisp, direct, no-nonsense problem solver',
        promptStyle: 'Break it down like an analyst—clear, strong, efficient.',
        systemPrompt: 'You are a sharp, no-nonsense analyst who cuts through complexity to deliver key findings. Be direct and efficient—identify the core facts, highlight critical data points, and present conclusions without fluff. Use bullet points for clarity. Your goal: maximum insight with minimum words. Think "executive summary" not "detailed report."',
        tone: 'direct',
        complexity: 'low'
    },
    architect: {
        id: 'architect',
        name: 'Tea',
        icon: '🫖',
        beverage: 'The Architect',
        description: 'Structured, modular, precise creator',
        promptStyle: 'Explain it like an architect—with layers, textures, and a solid base.',
        systemPrompt: 'You are a systematic architect who constructs knowledge with precision and structure. Build understanding in layers: start with the foundation, establish clear hierarchies, and show how components interconnect. Use architectural metaphors (foundations, layers, modules, blueprints) to organize complex information. Your explanations should feel like exploring a well-designed building—each part has its place and purpose in the larger system.',
        tone: 'structured',
        complexity: 'high'
    },
    researcher: {
        id: 'researcher',
        name: 'Energy Drink',
        icon: '⚡',
        beverage: 'The Researcher',
        description: 'Restorative, data-driven endurance thinker',
        promptStyle: 'Investigate like a researcher—replenishing, precise, built for endurance.',
        systemPrompt: 'You are a thorough, endurance-driven researcher who leaves no stone unturned. Dig deep into topics, explore multiple angles, and provide comprehensive analysis with attention to nuance and edge cases. Reference key concepts, compare alternative approaches, and highlight areas for further investigation. Your goal is depth and completeness—build stamina-worthy understanding that replenishes the reader\'s knowledge reserves.',
        tone: 'thorough',
        complexity: 'high'
    },
    mentor: {
        id: 'mentor',
        name: 'Milk',
        icon: '🥛',
        beverage: 'The Mentor',
        description: 'Gentle, comforting, sustaining guide',
        promptStyle: 'Teach me like a mentor—soothing, steady, full of quiet wisdom.',
        systemPrompt: 'You are a patient, nurturing mentor who makes complex topics feel approachable. Guide learners gently through new concepts using analogies, gradual progression, and encouraging language. Break down intimidating topics into digestible pieces. Celebrate small wins in understanding. Your tone should feel like a warm conversation with a wise friend who genuinely wants you to succeed. Avoid jargon unless you explain it first.',
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
 * 🚀 ENHANCED Summarize text using Chrome AI
 * Creates comprehensive, structured summaries with multiple sections
 *
 * @param {string} text - Content to summarize
 * @param {Object} options - Configuration options
 * @param {string} options.persona - AI persona to use (default: 'strategist')
 * @param {boolean} options.enhanced - Use enhanced structured format (default: true)
 * @param {string} options.length - Summary length: 'short', 'medium', 'long' (default: 'long')
 * @returns {Promise<Object>} { success, summary, method, persona }
 */
export async function summarizeText(text, options = {}) {
    try {
        const {
            type = 'key-points',
            length = 'long',
            persona = 'strategist',
            enhanced = true
        } = options;

        const personaConfig = PERSONAS[persona];

        console.log('🚀 Starting summarization...');
        console.log('📊 Text length:', text?.length, 'characters');
        console.log('🎭 Persona:', persona);
        console.log('⚙️ Enhanced mode:', enhanced);
        console.log('📏 Length:', length);

        // Enhanced mode: Use Language Model for structured summaries
        if (enhanced && self.ai?.languageModel) {
            try {
                const capabilities = await self.ai.languageModel.capabilities();
                console.log('🤖 Language Model status:', capabilities.available);

                if (capabilities.available === 'readily' || capabilities.available === 'available') {
                    console.log('✅ Using Language Model for COMPREHENSIVE summary');

                    // Truncate text to fit model limits (8000 chars is safe for most content)
                    const truncatedText = text.substring(0, 8000);
                    const isTruncated = text.length > 8000;

                    // Create comprehensive structured summary prompt
                    const structuredPrompt = `You are an expert educational content summarizer specializing in capturing ALL key information for learning, with special attention to famous examples, experiments, and foundational concepts.

CONTENT TO SUMMARIZE${isTruncated ? ' (first 8000 characters)' : ''}:
${truncatedText}

Create a COMPREHENSIVE, EDUCATIONAL summary following this format:

📌 CORE CONCEPT
Write 2-3 sentences explaining what this content is fundamentally about. State the main topic and its significance clearly.

🔑 KEY CONCEPTS & PRINCIPLES (8-12 points)
List ALL major ideas, theories, or findings. For EACH concept include:
• The concept name/term
• Clear explanation in simple terms
• Who discovered/developed it (researcher names)
• Why it's significant
• Key characteristics or components

🧪 FAMOUS EXAMPLES & EXPERIMENTS (CRITICAL SECTION)
Extract EVERY notable example, case study, and experiment mentioned:
• Name of the example/experiment (e.g., "Pavlov's Dog", "Little Albert")
• Researcher who conducted it
• What happened - the actual procedure step by step
• What was demonstrated or discovered
• Key results and findings
• Historical context or date if mentioned
This is the MOST IMPORTANT section for educational content - never skip famous experiments!

📚 MECHANISMS & PROCESSES
Explain HOW things work in detail:
• Step-by-step processes
• Underlying mechanisms
• Technical terminology with definitions
• Phases, stages, or components
• Cause-and-effect relationships

🌍 REAL-WORLD APPLICATIONS
• Practical examples in everyday life
• Modern uses and applications
• Clinical, therapeutic, or professional applications
• Current relevance
• Connections to other fields

🎯 BOTTOM LINE
2-3 sentences summarizing the core insight. What's the single most important thing to remember?

CRITICAL REQUIREMENTS FOR EDUCATIONAL CONTENT:
✓ ALWAYS prioritize famous examples and experiments - these are typically the most important parts
✓ Include ALL researcher/scientist names mentioned
✓ Be exhaustively THOROUGH - capture EVERYTHING significant
✓ For experiments: describe what actually happened, not just vague references
✓ Include specific details: procedures, subjects (dogs, rats, children), stimuli used, results observed
✓ Define all technical terms clearly
✓ Focus on substantive educational content, not metadata (ignore article authors, website info, publication details)
✓ Make it comprehensive enough that someone could learn the topic from this summary alone

✗ NEVER skip famous examples like Pavlov's dogs, Watson's Little Albert, Skinner's boxes, etc.
✗ Don't just mention an experiment exists - explain what happened in it
✗ Don't waste space on article metadata or author bios
✗ Don't be vague about procedures - be specific`;

                    const session = await self.ai.languageModel.create({
                        systemPrompt: personaConfig.systemPrompt,
                        temperature: 0.3,
                        topK: 3,
                    });

                    const summary = await session.prompt(structuredPrompt);
                    await session.destroy();

                    console.log('✅ Generated comprehensive summary:', summary.length, 'characters');

                    return {
                        success: true,
                        summary: summary,
                        method: 'enhanced-language-model',
                        persona: personaConfig.name
                    };
                } else {
                    console.log(`⏳ Language Model not ready (status: ${capabilities.available})`);
                }
            } catch (error) {
                console.warn('⚠️ Language Model failed:', error.message);
            }
        }

        // Fallback to standard Summarizer API
        if ('Summarizer' in self) {
            try {
                const availability = await self.Summarizer.availability();
                console.log('📝 Summarizer API availability:', availability);

                if (availability === 'readily' || availability === 'available') {
                    console.log('🤖 Using Summarizer API');
                    const summarizer = await self.Summarizer.create({
                        type: type,
                        format: 'plain-text',
                        length: 'long', // Always use long for better summaries
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
                console.warn('Summarizer API failed:', error.message);
            }
        }

        // Try old ai.summarizer API
        if (self.ai?.summarizer) {
            try {
                const capabilities = await self.ai.summarizer.capabilities();
                console.log('📝 Old summarizer status:', capabilities.available);

                if (capabilities.available === 'readily' || capabilities.available === 'available') {
                    console.log('🤖 Using legacy ai.summarizer');
                    const summarizer = await self.ai.summarizer.create({
                        type,
                        length: 'long',
                    });

                    const summary = await summarizer.summarize(text);
                    await summarizer.destroy();

                    return {
                        success: true,
                        summary: summary,
                        method: 'legacy-summarizer',
                        persona: personaConfig.name
                    };
                }
            } catch (error) {
                console.warn('Legacy summarizer failed:', error.message);
            }
        }

        // Ultimate fallback: Enhanced extraction
        console.log('📝 No AI available, using enhanced fallback extraction');
        return await enhancedFallbackSummarize(text, options);

    } catch (error) {
        console.error('❌ Summarization error:', error);
        console.log('↩️ Falling back to extraction');
        return await enhancedFallbackSummarize(text, options);
    }
}

/**
 * 🔧 Enhanced fallback summarization
 * Extracts key information intelligently when AI is unavailable
 */
async function enhancedFallbackSummarize(text, options = {}) {
    console.log('🔄 Using enhanced fallback extraction...');

    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    if (sentences.length === 0) {
        return {
            success: true,
            summary: text.substring(0, 500),
            method: 'fallback-basic'
        };
    }

    // Extract different types of content
    const firstSentences = sentences.slice(0, 2).join(' ');
    const keyTerms = extractKeyTerms(text, 8);
    const examples = extractExamples(text);
    const definitions = extractDefinitions(text);

    // Build structured fallback summary
    let summary = `📌 OVERVIEW\n${firstSentences}\n\n`;

    if (keyTerms.length > 0) {
        summary += `🔑 KEY CONCEPTS\n`;
        keyTerms.forEach(term => summary += `• ${term}\n`);
        summary += '\n';
    }

    if (definitions.length > 0) {
        summary += `📚 DEFINITIONS\n`;
        definitions.forEach(def => summary += `• ${def}\n`);
        summary += '\n';
    }

    if (examples.length > 0) {
        summary += `💡 EXAMPLES\n`;
        examples.forEach(ex => summary += `• ${ex}\n`);
        summary += '\n';
    }

    // Add more key sentences
    const middleSentences = sentences.slice(2, Math.min(7, sentences.length)).join(' ');
    if (middleSentences) {
        summary += `📋 ADDITIONAL POINTS\n${middleSentences}\n`;
    }

    return {
        success: true,
        summary: summary,
        method: 'fallback-enhanced'
    };
}

/**
 * Extract key terms from text
 */
function extractKeyTerms(text, maxTerms = 10) {
    // Find capitalized words (likely important terms)
    const capitalizedWords = text.match(/\b[A-Z][a-z]{2,}\b/g) || [];

    // Find words that appear multiple times
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 5);
    const frequency = {};
    words.forEach(w => frequency[w] = (frequency[w] || 0) + 1);

    const frequentWords = Object.entries(frequency)
        .filter(([word, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

    // Combine and deduplicate
    const terms = [...new Set([...capitalizedWords, ...frequentWords])];
    return terms.slice(0, maxTerms);
}

/**
 * Extract example sentences
 */
function extractExamples(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    return sentences
        .filter(s => /for example|for instance|such as|like/i.test(s))
        .slice(0, 3)
        .map(s => s.trim());
}

/**
 * Extract definition sentences
 */
function extractDefinitions(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    return sentences
        .filter(s => /is defined as|refers to|is a|means that/i.test(s))
        .slice(0, 3)
        .map(s => s.trim());
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
 * Recursive text compression - keeps summarizing until text fits target length
 * This ensures FULL page analysis regardless of original length
 */
async function intelligentTextCompression(text, targetLength, depth = 0) {
    const MAX_DEPTH = 3; // Prevent infinite recursion
    const MIN_COMPRESSION_RATIO = 0.7; // Must reduce by at least 30%

    console.log(`${'  '.repeat(depth)}🔄 Compression level ${depth}: ${text.length} chars → target ${targetLength}`);

    // Base case: text fits within target
    if (text.length <= targetLength) {
        console.log(`${'  '.repeat(depth)}✅ Text fits! Returning ${text.length} chars`);
        return text;
    }

    // Safety: max recursion depth reached
    if (depth >= MAX_DEPTH) {
        console.log(`${'  '.repeat(depth)}⚠️ Max depth reached, truncating`);
        return text.substring(0, targetLength);
    }

    // Safety: text too large to process (prevent crash)
    if (text.length > 500000) {
        console.warn(`${'  '.repeat(depth)}⚠️ Text exceeds safe limit (500KB), truncating`);
        return text.substring(0, targetLength);
    }

    // Recursive case: split, summarize, recurse
    const CHUNK_SIZE = 20000;
    const chunks = [];

    // Split into chunks at paragraph boundaries when possible
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
        let chunkEnd = Math.min(i + CHUNK_SIZE, text.length);

        // Find paragraph break near boundary
        if (chunkEnd < text.length) {
            const searchStart = Math.max(0, chunkEnd - 300);
            const searchEnd = Math.min(text.length, chunkEnd + 300);
            const segment = text.substring(searchStart, searchEnd);
            const breakPos = segment.indexOf('\n\n');

            if (breakPos !== -1) {
                chunkEnd = searchStart + breakPos;
            }
        }

        chunks.push(text.substring(i, chunkEnd).trim());
    }

    console.log(`${'  '.repeat(depth)}📊 Split into ${chunks.length} chunks, summarizing each...`);

    // Summarize each chunk in parallel for speed
    const summaryPromises = chunks.map(async (chunk, idx) => {
        const result = await summarizeText(chunk, {
            type: 'key-points',
            length: 'medium',
            enhanced: false // Use simple mode for compression
        });

        if (result.success) {
            console.log(`${'  '.repeat(depth)}  ✓ Chunk ${idx + 1}: ${chunk.length} → ${result.summary.length} chars`);
            return result.summary;
        } else {
            // Fallback: extract key sentences
            console.log(`${'  '.repeat(depth)}  ⚠ Chunk ${idx + 1}: AI failed, using fallback`);
            return extractKeySentences(chunk, 1000);
        }
    });

    const summaries = await Promise.all(summaryPromises);
    const combined = summaries.join('\n\n');

    console.log(`${'  '.repeat(depth)}📝 Combined summaries: ${combined.length} chars`);

    // Safety check: ensure we actually compressed the text
    const compressionRatio = combined.length / text.length;
    if (compressionRatio >= MIN_COMPRESSION_RATIO) {
        console.warn(`${'  '.repeat(depth)}⚠️ Compression not effective (${Math.round(compressionRatio * 100)}%), truncating`);
        return combined.substring(0, targetLength);
    }

    // Recurse: if combined is still too long, compress again
    return await intelligentTextCompression(combined, targetLength, depth + 1);
}

/**
 * Fallback: extract key sentences from text
 */
function extractKeySentences(text, maxLength) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let result = '';

    for (const sentence of sentences) {
        if (result.length + sentence.length > maxLength) break;
        result += sentence + ' ';
    }

    return result.trim() || text.substring(0, maxLength);
}

/**
 * Sanitize label to ensure consistency across components
 * Removes special characters that might cause matching issues
 */
function sanitizeLabel(label) {
    return label
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special chars except word chars, spaces, hyphens
        .replace(/\s+/g, ' ')     // Normalize multiple spaces
        .substring(0, 50);        // Max 50 chars
}

/**
 * Extract key concepts and relationships from text for mindmap generation
 */
export async function extractConcepts(text, options = {}) {
    const { persona = 'architect', maxConcepts = 100 } = options;
    const DEBUG = false; // Set to true for verbose logging

    if (DEBUG) console.log('🔍 extractConcepts called with:', { textLength: text?.length, persona, maxConcepts });

    // Smart text processing: summarize long content to fit within AI context window
    const MAX_SAFE_LENGTH = 40000;
    let processedText = text.trim();

    if (processedText.length > MAX_SAFE_LENGTH) {
        if (DEBUG) console.log(`📚 Text is long (${processedText.length} chars), using smart summarization`);
        processedText = await intelligentTextCompression(processedText, MAX_SAFE_LENGTH);
        if (DEBUG) console.log(`✅ Compressed to ${processedText.length} chars`);
    } else {
        if (DEBUG) console.log(`✅ Analyzing full text: ${processedText.length} characters`);
    }

    // Generate AI summary for display (separate from concept extraction)
    console.log('📝 Generating AI summary for article...');
    let aiSummary = null;
    try {
        const summaryResult = await summarizeText(processedText, {
            persona,
            length: 'long', // Use long format for comprehensive summaries
            enhanced: true, // Use enhanced structured format
        });
        if (summaryResult.success && summaryResult.summary) {
            aiSummary = summaryResult.summary;
            console.log(`✅ AI summary generated (${aiSummary.length} chars)`);
        }
    } catch (summaryError) {
        console.warn('⚠️ Failed to generate AI summary:', summaryError.message);
    }

    // Get persona-specific instructions
    const personaConfig = PERSONAS[persona] || PERSONAS.architect;
    const personaInstructions = getPersonaMindmapInstructions(persona);

    // Simplified, clearer prompt with stronger validation emphasis
    const prompt = `Create a hierarchical mindmap from the text below. Extract ONE main concept and organize supporting ideas in a tree structure.

${personaInstructions}

STRUCTURE:
- 1 "main" concept (root) → lists 5-10 secondary IDs in its connections
- 5-10 "secondary" concepts → ONLY add children if that concept has clear sub-points
- 0-30 "tertiary" concepts (OPTIONAL) → leaf nodes with empty connections []

CRITICAL RULES:
1. Labels: 2-5 words, alphanumeric only (no special chars like quotes, colons, parentheses)
2. IDs: lowercase-with-hyphens format
3. NOT EVERY secondary needs children - use empty connections [] if no sub-concepts exist
4. ONLY create tertiary nodes if they add meaningful detail
5. STRICT HIERARCHY: main connects ONLY to secondary, secondary connects ONLY to tertiary
6. NEVER skip levels - main cannot directly connect to tertiary nodes
7. BEFORE adding an ID to connections, CREATE that concept object FIRST
8. Every ID in ANY connections array MUST exist as a concept
9. Verify at the end: all connection IDs exist AND follow hierarchy rules

JSON OUTPUT (no markdown, no explanation):
Example with children:
[
  {"id": "main", "label": "Central Topic", "type": "main", "connections": ["sec-1", "sec-2", "sec-3"]},
  {"id": "sec-1", "label": "Has Details", "type": "secondary", "connections": ["ter-1", "ter-2"]},
  {"id": "ter-1", "label": "Detail A", "type": "tertiary", "connections": []},
  {"id": "ter-2", "label": "Detail B", "type": "tertiary", "connections": []},
  {"id": "sec-2", "label": "No Details", "type": "secondary", "connections": []},
  {"id": "sec-3", "label": "Also No Details", "type": "secondary", "connections": []}
]

TEXT TO ANALYZE:
${processedText}

Return ONLY the JSON array. Validate all connection IDs exist!`;

    try {
        const result = await queryLanguageModel(prompt, { persona, maxTokens: 4000 });
        if (DEBUG) console.log('🤖 Language model result:', result);

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
                    if (DEBUG) console.log('✅ Parsed concepts from AI:', concepts);

                    if (Array.isArray(concepts) && concepts.length > 0) {
                        // Sanitize all labels
                        concepts.forEach(c => {
                            if (c.label) c.label = sanitizeLabel(c.label);
                        });

                        // Validate and clean concepts
                        let validatedConcepts = validateAndCleanConcepts(concepts, maxConcepts, DEBUG);

                        // Ensure we have a proper 3-level hierarchy
                        validatedConcepts = ensureHierarchicalStructure(validatedConcepts, DEBUG);

                        if (validatedConcepts.length > 0) {
                            console.log(`✅ Mindmap ready: ${validatedConcepts.length} concepts (${validatedConcepts.filter(c => c.type === 'main').length} main, ${validatedConcepts.filter(c => c.type === 'secondary').length} secondary, ${validatedConcepts.filter(c => c.type === 'tertiary').length} tertiary)`);
                            return {
                                success: true,
                                concepts: validatedConcepts,
                                method: result.method,
                                processedText: aiSummary // Include the AI-generated summary
                            };
                        }
                    } else {
                        console.warn('⚠️ AI returned empty concepts array');
                    }
                } catch (parseError) {
                    console.error('❌ Failed to parse JSON from AI:', parseError.message);
                    if (DEBUG) console.log('Raw response:', result.response.substring(0, 300));
                }
            } else {
                console.warn('⚠️ No JSON array found in AI response');
                if (DEBUG) console.log('Response preview:', result.response.substring(0, 300));
            }
        }
    } catch (error) {
        console.error('❌ Language model query failed:', error);
    }

    // Fallback to improved mock extraction
    console.log('🔄 Falling back to enhanced concept extraction');
    const fallbackResult = await mockExtractConcepts(text, options);
    console.log('📊 Fallback returned:', fallbackResult.concepts.length, 'concepts');
    return {
        ...fallbackResult,
        processedText: aiSummary // Include the AI-generated summary even in fallback
    };
}

/**
 * Ensure concepts have proper hierarchy structure
 * Validates but does NOT force artificial expansion with generic labels
 */
function ensureHierarchicalStructure(concepts, DEBUG = false) {
    if (!concepts || concepts.length === 0) return concepts;

    const main = concepts.find(c => c.type === 'main');
    const secondary = concepts.filter(c => c.type === 'secondary');
    const tertiary = concepts.filter(c => c.type === 'tertiary');

    if (DEBUG) {
        console.log(`📊 Structure check: ${main ? 1 : 0} main, ${secondary.length} secondary, ${tertiary.length} tertiary`);
        if (tertiary.length === 0) {
            console.log('ℹ️ 2-level hierarchy (main + secondary) - keeping as-is');
        } else {
            console.log('ℹ️ 3-level hierarchy detected - keeping as-is');
        }
    }

    return concepts;
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
function validateAndCleanConcepts(concepts, maxConcepts, DEBUG = false) {
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
            if (DEBUG) console.warn('⚠️ Skipping invalid concept:', concept);
            continue;
        }

        // Normalize label (trim, lowercase for comparison)
        const normalizedLabel = concept.label.trim().toLowerCase();

        // Skip duplicates
        if (seenLabels.has(normalizedLabel) || seenIds.has(concept.id)) {
            if (DEBUG) console.warn('⚠️ Skipping duplicate:', concept.label);
            continue;
        }

        // Count main concepts
        if (concept.type === 'main') {
            mainCount++;
            if (mainCount > 1) {
                if (DEBUG) console.warn('⚠️ Multiple main concepts found, converting to secondary:', concept.label);
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
        if (DEBUG) console.log('⚠️ No main concept found, promoting first concept');
        validConcepts[0].type = 'main';
    }

    // Validate connections - remove orphaned connection IDs (don't create fake concepts)
    const validIds = new Set(validConcepts.map(c => c.id));
    let orphanedCount = 0;

    validConcepts.forEach(concept => {
        const validConnections = [];

        concept.connections.forEach(connId => {
            if (validIds.has(connId)) {
                validConnections.push(connId);
            } else {
                orphanedCount++;
                if (DEBUG) {
                    console.warn(`  ⚠️ Removed orphaned connection: "${concept.label}" → "${connId}" (doesn't exist)`);
                }
            }
        });

        // Update with only valid connections
        concept.connections = validConnections;
    });

    if (orphanedCount > 0) {
        console.warn(`⚠️ Removed ${orphanedCount} orphaned connection(s) - AI listed non-existent concepts`);
    }

    // Enforce strict hierarchy: main → secondary → tertiary
    const conceptMap = new Map(validConcepts.map(c => [c.id, c]));
    let hierarchyViolations = 0;

    validConcepts.forEach(concept => {
        const properConnections = [];

        concept.connections.forEach(connId => {
            const child = conceptMap.get(connId);
            if (!child) return; // Already filtered out

            // Validate hierarchy rules
            let isValid = false;
            if (concept.type === 'main' && child.type === 'secondary') {
                isValid = true; // Main can only connect to secondary
            } else if (concept.type === 'secondary' && child.type === 'tertiary') {
                isValid = true; // Secondary can only connect to tertiary
            } else if (concept.type === 'tertiary') {
                isValid = false; // Tertiary cannot connect to anything
            }

            if (isValid) {
                properConnections.push(connId);
            } else {
                hierarchyViolations++;
                if (DEBUG) {
                    console.warn(`  ⚠️ Removed invalid hierarchy: ${concept.type} "${concept.label}" → ${child.type} "${child.label}"`);
                }
            }
        });

        concept.connections = properConnections;
    });

    if (hierarchyViolations > 0) {
        console.warn(`⚠️ Fixed ${hierarchyViolations} hierarchy violation(s) - enforcing main→secondary→tertiary structure`);
    }

    if (DEBUG) console.log(`✅ Validated ${validConcepts.length} unique concepts (${mainCount} main)`);
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
 * Fallback summarization using intelligent extraction
 * Focuses on educational content, examples, and key concepts
 */
async function fallbackSummarize(text, options = {}) {
    // Split into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    if (sentences.length === 0) {
        return {
            success: true,
            summary: text.substring(0, 500),
            method: 'fallback'
        };
    }

    // Score sentences based on importance indicators
    const scoredSentences = sentences.map((sentence, index) => {
        let score = 0;
        const lower = sentence.toLowerCase();

        // Higher score for sentences with proper names (likely researchers)
        if (/[A-Z][a-z]+ [A-Z][a-z]+/.test(sentence)) score += 3;

        // Educational keywords
        const eduKeywords = ['experiment', 'study', 'research', 'theory', 'concept', 'principle', 'discovered', 'demonstrated', 'example', 'found that', 'showed that'];
        eduKeywords.forEach(keyword => {
            if (lower.includes(keyword)) score += 2;
        });

        // Famous examples indicators
        if (lower.match(/\b(dog|rat|pigeon|child|patient|subject|participant)s?\b/)) score += 2;
        if (lower.includes('pavlov') || lower.includes('skinner') || lower.includes('watson')) score += 5;

        // Process/mechanism indicators
        if (lower.includes('process') || lower.includes('mechanism') || lower.includes('occurs when')) score += 2;

        // Important terms
        if (lower.match(/\b(stimulus|response|conditioning|behavior|reinforcement|extinction|acquisition)\b/)) score += 2;

        // Avoid meta content
        if (lower.includes('article') || lower.includes('author') || lower.includes('written by') || lower.includes('published')) score -= 5;
        if (lower.includes('simply psychology') || lower.includes('website')) score -= 3;

        // Prefer earlier sentences (often have main concepts)
        if (index < 5) score += 1;

        return { sentence, score, index };
    });

    // Sort by score and take top sentences
    const topSentences = scoredSentences
        .sort((a, b) => b.score - a.score)
        .slice(0, 8) // Take more sentences
        .sort((a, b) => a.index - b.index) // Restore original order
        .map(item => item.sentence);

    const summary = topSentences.join(' ').trim();

    return {
        success: true,
        summary: summary || sentences.slice(0, 5).join(' ').trim(),
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
    const potentialConcepts = [...new Set([...capitalizedWords.slice(0, 15), ...frequentWords.slice(0, 15)])];
    const maxConcepts = options.maxConcepts || 50;
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