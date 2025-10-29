/**
 * FIXED Quiz Generation Utility
 * Generates appropriate quiz questions - no more broken True/False questions!
 */

import { queryLanguageModel } from './summarize.js';

/**
 * Robust wrapper for AI queries with error handling
 */
async function queryAI(prompt, options = {}) {
    try {
        const result = await queryLanguageModel(prompt, options);

        console.log('🤖 Raw AI result:', result);

        // Handle different response formats
        if (!result) {
            return { success: false, error: 'No response from AI' };
        }

        // Check for success flag
        if (result.success === false) {
            return { success: false, error: result.error || 'AI query failed' };
        }

        // Extract text from different possible formats
        let text = null;
        if (typeof result === 'string') {
            text = result;
        } else if (result.text && typeof result.text === 'string') {
            text = result.text;
        } else if (result.response && typeof result.response === 'string') {
            text = result.response;
        } else if (result.message && typeof result.message === 'string') {
            text = result.message;
        }

        if (!text) {
            console.error('❌ Could not extract text from result:', result);
            return { success: false, error: 'No text in AI response' };
        }

        return { success: true, text };

    } catch (error) {
        console.error('❌ Error in queryAI:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Generate quiz from reading with enhanced AI
 * Uses the AI summary to create better, more focused questions
 * @param {Object} reading - Reading object with title, content, and optional aiSummary
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Generated quiz
 */
export async function generateQuizFromReading(reading, options = {}) {
    const {
        persona = 'mentor',
        difficulty = 'medium',
        questionCount = 5,
    } = options;

    console.log('🎯 Starting enhanced quiz generation...');
    console.log('📖 Reading:', reading.title);
    console.log('📊 Question count:', questionCount);

    // Validate input
    if (!reading || !reading.content) {
        throw new Error('Invalid reading: content is required');
    }

    const contentText = reading.text || reading.content;
    if (contentText.length < 100) {
        throw new Error('Content too short (minimum 100 characters required)');
    }

    try {
        // Step 1: Get or use existing AI summary
        let summary = reading.aiSummary || reading.summary;

        if (!summary) {
            console.log('📝 No existing summary found, generating one...');
            // If no summary exists, create a brief one for context
            summary = await generateBriefSummary(contentText, persona);
        }

        console.log('✅ Using summary for quiz generation');
        console.log('📋 Summary preview:', summary.substring(0, 200) + '...');

        // Step 2: Generate questions based on summary AND original content
        const questions = await generateQuestionsFromSummaryAndContent(
            contentText,
            summary,
            questionCount,
            difficulty,
            persona
        );

        console.log('✅ Generated', questions.length, 'questions');

        return {
            title: `Quiz: ${reading.title}`,
            readingId: reading.id,
            questions,
            difficulty,
            createdAt: new Date().toISOString(),
        };

    } catch (error) {
        console.error('❌ Quiz generation failed:', error);

        // Fallback: Try basic question generation
        console.log('⚠️ Attempting fallback quiz generation...');
        try {
            const fallbackQuestions = await generateFallbackQuiz(contentText, questionCount);
            return {
                title: `Quiz: ${reading.title}`,
                readingId: reading.id,
                questions: fallbackQuestions,
                difficulty,
                createdAt: new Date().toISOString(),
            };
        } catch (fallbackError) {
            console.error('❌ Fallback also failed:', fallbackError);
            throw new Error('Failed to generate quiz. Please try again with different content.');
        }
    }
}

/**
 * Generate a brief summary if one doesn't exist
 */
async function generateBriefSummary(text, persona) {
    const prompt = `Summarize this text in 3-5 key points for creating quiz questions:

${text.substring(0, 3000)}

Provide a clear, structured summary that highlights:
- Main concepts and ideas
- Important facts and figures
- Key relationships and processes
- Notable conclusions or implications`;

    const result = await queryAI(prompt, {
        persona,
        temperature: 0.3,
        maxTokens: 500,
    });

    return result.success ? result.text : text.substring(0, 1000);
}

/**
 * FIXED: Generate questions using both summary and content
 * This creates appropriate question types - no more nonsensical True/False!
 */
async function generateQuestionsFromSummaryAndContent(
    content,
    summary,
    questionCount,
    difficulty,
    persona
) {
    // Difficulty settings
    const difficultySettings = {
        easy: {
            description: 'straightforward recall questions',
            focusOn: 'basic facts and main ideas',
        },
        medium: {
            description: 'questions requiring understanding and application',
            focusOn: 'concepts, relationships, and implications',
        },
        hard: {
            description: 'analytical and synthesis questions',
            focusOn: 'analysis, evaluation, and connections between ideas',
        },
    };

    const settings = difficultySettings[difficulty] || difficultySettings.medium;

    // Request extra questions to account for filtering (request 50% more than needed)
    const requestedCount = Math.ceil(questionCount * 1.5);

    // Better code detection
    const hasCode = /```[\s\S]*?```|`[^`]+`|function\s+\w+|const\s+\w+\s*=|class\s+\w+|def\s+\w+|public\s+\w+/i.test(content);

    // FIXED: Better question distribution
    // Prioritize multiple-choice, use True/False sparingly and only for factual statements
    const mcRatio = 0.7; // 70% multiple choice
    const tfRatio = 0.3; // 30% true/false (only for clear factual statements)

    const prompt = `You are an expert educator creating a quiz to help students learn and retain information.

CONTENT SUMMARY:
${summary}

FULL CONTENT (for reference):
${content.substring(0, 2500)}

Create EXACTLY ${requestedCount} high-quality quiz questions that are ${settings.description}.
Focus on ${settings.focusOn}.

CRITICAL RULES FOR QUESTION TYPES:
1. MULTIPLE-CHOICE (Preferred - ~70%):
   - Use for "What is X?", "How does Y work?", "Which of the following..."
   - Perfect for definitions, concepts, processes, comparisons
   - Provide 4 distinct, plausible options
   
2. TRUE/FALSE (Use sparingly - ~30%, ONLY for clear factual statements):
   - ONLY use when the content makes a clear, binary factual claim
   - Examples of GOOD True/False:
     * "Python is a programming language" (factual statement)
     * "The process requires three steps" (countable fact)
     * "This technique was invented in 1995" (verifiable fact)
   - Examples of BAD True/False (DO NOT CREATE THESE):
     * "What is artificial intelligence?" (This is a DEFINITION question - use multiple-choice!)
     * "How does machine learning work?" (This is a PROCESS question - use multiple-choice!)
     * "Why is X important?" (This is an EXPLANATION question - use multiple-choice!)
   - If a question starts with "What", "How", "Why", "Which" - IT CANNOT BE TRUE/FALSE!

QUESTION TYPE DISTRIBUTION:
- ${Math.ceil(requestedCount * mcRatio)} multiple-choice questions (for definitions, concepts, processes)
- ${Math.floor(requestedCount * tfRatio)} true-false questions (ONLY for clear factual statements that can be true or false)

FORMAT YOUR RESPONSE AS VALID JSON:
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "What is the primary purpose of...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Detailed explanation of why this is correct..."
    },
    {
      "id": "q2",
      "type": "true-false",
      "question": "Machine learning algorithms require labeled training data",
      "correctAnswer": false,
      "explanation": "This is false because unsupervised learning algorithms don't require labeled data..."
    }
  ]
}

QUALITY REQUIREMENTS:
- All questions must be clear and unambiguous
- Multiple-choice options must be distinct and plausible
- True/False questions must be statements that can clearly be evaluated as true or false
- Explanations should teach, not just state the answer
- Questions should test understanding, not just memorization
- Focus on the most important concepts from the content

Generate ${requestedCount} questions now:`;

    console.log('📤 Sending quiz generation prompt...');

    const result = await queryAI(prompt, {
        persona,
        temperature: 0.7,
        maxTokens: 3000,
    });

    if (!result.success) {
        throw new Error(`Failed to generate questions: ${result.error}`);
    }

    console.log('📥 Received AI response');

    // Parse the response
    let questions = parseQuizResponse(result.text);

    // VALIDATION: Filter out bad questions
    questions = questions.filter(q => {
        // Remove True/False questions that are actually definition questions
        if (q.type === 'true-false') {
            const questionLower = q.question.toLowerCase();
            // Bad patterns for True/False
            if (questionLower.startsWith('what is') ||
                questionLower.startsWith('what are') ||
                questionLower.startsWith('how does') ||
                questionLower.startsWith('how do') ||
                questionLower.startsWith('why is') ||
                questionLower.startsWith('why are') ||
                questionLower.startsWith('which of') ||
                questionLower.includes('define ') ||
                questionLower.includes('explain ')) {
                console.log('⚠️ Filtered out bad True/False question:', q.question);
                return false;
            }
        }

        // Validate multiple-choice has enough options
        if (q.type === 'multiple-choice' && (!q.options || q.options.length < 3)) {
            console.log('⚠️ Filtered out multiple-choice with too few options');
            return false;
        }

        return true;
    });

    // If we filtered out too many, regenerate or use fallback
    if (questions.length < questionCount * 0.6) {
        console.warn('⚠️ Too many questions filtered, using fallback generation');
        throw new Error('Generated questions did not meet quality standards');
    }

    console.log(`✅ Validated ${questions.length} high-quality questions`);

    // Return only the requested number
    return questions.slice(0, questionCount);
}

/**
 * Parse quiz response from AI
 * Handles various response formats
 */
function parseQuizResponse(text) {
    try {
        // Try to find JSON in the response
        const jsonMatch = text.match(/\{[\s\S]*"questions"[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.questions && Array.isArray(parsed.questions)) {
                return parsed.questions;
            }
        }

        // Try parsing the entire text as JSON
        const parsed = JSON.parse(text);
        if (parsed.questions && Array.isArray(parsed.questions)) {
            return parsed.questions;
        }

        throw new Error('No questions array found in response');

    } catch (error) {
        console.error('❌ Failed to parse JSON response:', error);
        console.log('Raw response:', text.substring(0, 500));

        // Fallback: Try to parse questions from text format
        return parseTextFormatQuestions(text);
    }
}

/**
 * Parse questions from text format (fallback)
 */
function parseTextFormatQuestions(text) {
    const questions = [];
    const lines = text.split('\n').filter(line => line.trim());

    let currentQuestion = null;
    let optionIndex = 0;

    for (const line of lines) {
        const trimmed = line.trim();

        // Question pattern
        if (/^Q\d+:|^\d+\.|^Question \d+:/i.test(trimmed)) {
            if (currentQuestion) {
                questions.push(currentQuestion);
            }

            // Determine if it's multiple choice or true/false
            const isTrueFalse = /\(true\/false\)|true or false/i.test(trimmed);

            currentQuestion = {
                id: `q${questions.length + 1}`,
                type: isTrueFalse ? 'true-false' : 'multiple-choice',
                question: trimmed.replace(/^Q\d+:|^\d+\.|^Question \d+:/i, '').trim(),
                options: [],
                correctAnswer: null,
                explanation: ''
            };
            optionIndex = 0;
        }
        // Options for multiple choice
        else if (currentQuestion && currentQuestion.type === 'multiple-choice' && /^[A-D][\):]|^[a-d][\):]/.test(trimmed)) {
            const optionText = trimmed.replace(/^[A-Da-d][\):]/, '').trim();
            currentQuestion.options.push(optionText);
        }
        // Correct answer
        else if (/^Answer:|^Correct:/i.test(trimmed)) {
            const answer = trimmed.replace(/^Answer:|^Correct:/i, '').trim();
            if (currentQuestion) {
                if (currentQuestion.type === 'true-false') {
                    currentQuestion.correctAnswer = /true/i.test(answer);
                } else {
                    currentQuestion.correctAnswer = answer;
                }
            }
        }
        // Explanation
        else if (/^Explanation:|^Why:/i.test(trimmed)) {
            if (currentQuestion) {
                currentQuestion.explanation = trimmed.replace(/^Explanation:|^Why:/i, '').trim();
            }
        }
    }

    if (currentQuestion) {
        questions.push(currentQuestion);
    }

    return questions;
}

/**
 * IMPROVED Fallback quiz generation
 * Focuses on creating proper multiple-choice questions
 */
async function generateFallbackQuiz(text, questionCount = 5) {
    console.log('🔄 Using improved fallback quiz generation...');

    // Clean and prepare text
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 20);

    if (sentences.length < 3) {
        throw new Error('Not enough content to generate fallback quiz (need at least 3 complete sentences)');
    }

    const questions = [];

    // Strategy 1: Create multiple-choice questions from key concepts
    const keyPhrases = extractKeyPhrases(text, 15);

    for (let i = 0; i < Math.min(questionCount, keyPhrases.length); i++) {
        const keyPhrase = keyPhrases[i];
        const relevantSentence = sentences.find(s =>
            s.toLowerCase().includes(keyPhrase.toLowerCase())
        );

        if (relevantSentence) {
            // Create distractor options from other key phrases
            const distractors = keyPhrases
                .filter(p => p !== keyPhrase)
                .slice(0, 3)
                .map(p => p.charAt(0).toUpperCase() + p.slice(1));

            const correctAnswer = keyPhrase.charAt(0).toUpperCase() + keyPhrase.slice(1);

            questions.push({
                id: `q${questions.length + 1}`,
                type: 'multiple-choice',
                question: `Based on the content, which of the following best relates to: "${relevantSentence.substring(0, 80)}..."?`,
                options: [correctAnswer, ...distractors].sort(() => Math.random() - 0.5),
                correctAnswer: correctAnswer,
                explanation: `The text specifically discusses "${keyPhrase}" in this context.`,
            });
        }
    }

    // Strategy 2: Only add True/False if we have clear factual statements
    // AND if we still need more questions
    if (questions.length < questionCount) {
        const factualStatements = sentences.filter(s => {
            const lower = s.toLowerCase();
            // Look for sentences that make clear factual claims
            return (
                (lower.includes(' is a ') || lower.includes(' are ') ||
                    lower.includes(' was ') || lower.includes(' were ')) &&
                !lower.startsWith('what') &&
                !lower.startsWith('how') &&
                !lower.startsWith('why') &&
                s.split(' ').length >= 6 &&
                s.split(' ').length <= 20
            );
        });

        const neededQuestions = questionCount - questions.length;
        const tfToAdd = Math.min(neededQuestions, Math.floor(factualStatements.length / 2));

        for (let i = 0; i < tfToAdd; i++) {
            const statement = factualStatements[i];

            questions.push({
                id: `q${questions.length + 1}`,
                type: 'true-false',
                question: statement.trim(),
                correctAnswer: true,
                explanation: `This statement is true according to the source material.`,
            });
        }
    }

    // Final fallback: if still not enough, create basic comprehension questions
    while (questions.length < Math.max(2, questionCount)) {
        questions.push({
            id: `q${questions.length + 1}`,
            type: 'multiple-choice',
            question: 'Which of the following represents a key concept from the reading?',
            options: [
                'The main topic discussed in the content',
                'An unrelated concept',
                'A different subject matter',
                'An irrelevant topic'
            ],
            correctAnswer: 'The main topic discussed in the content',
            explanation: 'The content focuses on its main subject and related concepts.',
        });
    }

    console.log(`✅ Generated ${questions.length} improved fallback questions`);
    return questions.slice(0, questionCount);
}

/**
 * Extract key phrases from text (simple implementation)
 */
function extractKeyPhrases(text, maxPhrases = 20) {
    // Split into words and find potential key phrases
    const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3);

    // Get word frequency
    const frequency = {};
    words.forEach(word => {
        // Skip common words
        const commonWords = ['that', 'this', 'with', 'from', 'have', 'been', 'were',
            'they', 'them', 'what', 'when', 'where', 'which', 'there',
            'their', 'would', 'could', 'should', 'about', 'other'];
        if (!commonWords.includes(word)) {
            frequency[word] = (frequency[word] || 0) + 1;
        }
    });

    // Get top frequent words
    const topWords = Object.entries(frequency)
        .filter(([word, count]) => count >= 2) // Must appear at least twice
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxPhrases)
        .map(([word]) => word);

    // Also look for capitalized words (proper nouns)
    const sentences = text.split(/[.!?]+/);
    const capitalizedWords = [];

    sentences.forEach(sentence => {
        if (sentence && typeof sentence === 'string' && sentence.trim().length > 0) {
            const matches = sentence.match(/\b[A-Z][a-z]+\b/g);
            if (matches) {
                capitalizedWords.push(...matches);
            }
        }
    });

    // Combine and deduplicate
    const phrases = [...new Set([...topWords, ...capitalizedWords.map(w => w.toLowerCase())])];

    return phrases.slice(0, maxPhrases);
}

/**
 * Helper function to validate quiz structure
 */
export function validateQuiz(quiz) {
    if (!quiz || typeof quiz !== 'object') {
        return { valid: false, error: 'Quiz must be an object' };
    }

    if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
        return { valid: false, error: 'Quiz must have questions array' };
    }

    for (let i = 0; i < quiz.questions.length; i++) {
        const q = quiz.questions[i];

        if (!q.id || !q.question || q.correctAnswer === undefined) {
            return {
                valid: false,
                error: `Question ${i + 1} missing required fields (id, question, correctAnswer)`
            };
        }

        if (q.type === 'multiple-choice') {
            if (!Array.isArray(q.options) || q.options.length < 2) {
                return {
                    valid: false,
                    error: `Question ${i + 1} has invalid options`
                };
            }

            // Check that correctAnswer is in options
            if (!q.options.includes(q.correctAnswer)) {
                return {
                    valid: false,
                    error: `Question ${i + 1} correct answer not in options`
                };
            }
        }

        if (q.type === 'true-false') {
            // Validate it's not a "What/How/Why" question
            const questionLower = q.question.toLowerCase();
            if (questionLower.startsWith('what ') ||
                questionLower.startsWith('how ') ||
                questionLower.startsWith('why ')) {
                return {
                    valid: false,
                    error: `Question ${i + 1} is an invalid True/False question (starts with What/How/Why)`
                };
            }

            if (typeof q.correctAnswer !== 'boolean') {
                return {
                    valid: false,
                    error: `Question ${i + 1} True/False must have boolean correctAnswer`
                };
            }
        }
    }

    return { valid: true };
}