/**
 * Enhanced Quiz Generation Utility
 * Generates high-quality quiz questions based on AI summaries and reading content
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
 * Generate questions using both summary and content
 * This creates more focused, educational questions
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
            questionTypes: ['multiple-choice', 'true-false'],
            focusOn: 'basic facts and main ideas',
        },
        medium: {
            description: 'questions requiring understanding and application',
            questionTypes: ['multiple-choice', 'true-false', 'code-test'],
            focusOn: 'concepts, relationships, and implications',
        },
        hard: {
            description: 'analytical and synthesis questions',
            questionTypes: ['multiple-choice', 'true-false', 'code-test'],
            focusOn: 'analysis, evaluation, and connections between ideas',
        },
    };

    const settings = difficultySettings[difficulty] || difficultySettings.medium;

    // Request extra questions to account for filtering (request 50% more than needed)
    const requestedCount = Math.ceil(questionCount * 1.5);

    // Better code detection
    const hasCode = /```[\s\S]*?```|`[^`]+`|function\s+\w+|const\s+\w+\s*=|class\s+\w+|def\s+\w+|public\s+\w+/i.test(content);

    // Adjust question distribution based on content
    const mcRatio = hasCode ? 0.4 : 0.6;
    const tfRatio = hasCode ? 0.3 : 0.4;
    const codeRatio = hasCode ? 0.3 : 0;

    const prompt = `You are an expert educator creating a quiz to help students learn and retain information.

CONTENT SUMMARY:
${summary}

FULL CONTENT (for reference):
${content.substring(0, 2500)}

Create EXACTLY ${requestedCount} high-quality quiz questions that are ${settings.description}.
Focus on ${settings.focusOn}.

QUESTION TYPE DISTRIBUTION:
- ${Math.ceil(requestedCount * mcRatio)} multiple-choice questions
- ${Math.floor(requestedCount * tfRatio)} true-false questions${hasCode ? `
- ${Math.floor(requestedCount * codeRatio)} code-test questions` : ''}

CRITICAL REQUIREMENTS - FOLLOW EXACTLY:

MULTIPLE CHOICE RULES:
1. MUST have EXACTLY 4 options (A, B, C, D)
2. Options MUST be complete phrases or sentences (NOT single words like "javascript", "node", "server")
3. All 4 options must be DIFFERENT and plausible
4. Only ONE option is correct
5. Wrong options should be reasonable but clearly incorrect
6. Question must be a complete, clear sentence

TRUE/FALSE RULES:
1. Create CLEAR statements that are definitively true or false
2. Balance true and false answers (don't make all true or all false)
3. Avoid ambiguous statements
4. Base on specific facts from the content
${hasCode ? `
CODE COMPREHENSION RULES (type: "multiple-choice"):
1. Include actual code snippet in the question text (use backticks)
2. Ask about: output, return value, bugs, or purpose
3. MUST have EXACTLY 4 options (like regular multiple-choice)
4. Test understanding of code logic, not syntax memorization
5. Format: "What does this code output? \`code here\`"
6. Options should be specific answers (numbers, strings, error messages)` : ''}

EXPLANATION RULES:
1. MUST be at least 2-3 sentences long
2. Explain WHY the correct answer is right
3. For multiple choice: explain why other options are wrong
4. For code questions: explain what the code actually does
5. Be educational and help students learn

QUESTION QUALITY:
✓ Complete grammatical sentences
✓ Specific to the content provided
✓ Test understanding, not just memory
✓ Make sense when read aloud
✗ Avoid fragments like "According to text: ___?"
✗ Avoid single-word options
✗ Avoid vague questions

GOOD EXAMPLES:

Multiple Choice:
Q: "What is the primary purpose of Node.js according to the article?"
Options:
- "It allows JavaScript to run on the server side"
- "It replaces the need for databases in web applications"
- "It automatically optimizes website loading speed"
- "It is exclusively used for front-end development"
Correct: "It allows JavaScript to run on the server side"

True/False:
Q: "Node.js is built on Chrome's V8 JavaScript engine."
Correct: true

Q: "Node.js can only be used for server-side applications."
Correct: false
${hasCode ? `
Code Comprehension (type: "multiple-choice"):
Q: "What will this code output? \`const arr = [1, 2, 3]; console.log(arr.map(x => x * 2));\`"
Options:
- "[2, 4, 6]"
- "[1, 2, 3]"
- "6"
- "undefined"
Correct: "[2, 4, 6]"

Q: "In this code: \`if (x = 5) { console.log('yes'); }\` what is the bug?"
Options:
- "Should use == or === instead of ="
- "Missing semicolon"
- "console.log syntax is wrong"
- "No bug present"
Correct: "Should use == or === instead of ="` : ''}

BAD EXAMPLES (DO NOT DO THIS):
❌ Q: "According to the text: Differences between Node?"
❌ Options: ["javascript", "server", "node", "with"]
❌ Q: "What is mentioned?"
❌ Explanation: "It's correct." (too short)

Return ONLY valid JSON (no markdown, no extra text):
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "What is the primary advantage of using Node.js for server-side development?",
      "options": [
        "It allows JavaScript to run on the server",
        "It makes websites load faster automatically",
        "It eliminates the need for databases",
        "It only works with specific browsers"
      ],
      "correctAnswer": "It allows JavaScript to run on the server",
      "explanation": "Node.js's primary advantage is that it enables JavaScript to run on the server, allowing developers to use the same language for both front-end and back-end development. The other options are either incorrect or not the main purpose of Node.js."
    },
    {
      "id": "q2",
      "type": "true-false",
      "question": "Node.js is built on Chrome's V8 JavaScript engine.",
      "correctAnswer": true,
      "explanation": "This is TRUE. Node.js uses Chrome's V8 engine to execute JavaScript code outside of a browser environment, which is a key architectural decision that enables its performance."
    }${hasCode ? `,
    {
      "id": "q3",
      "type": "code-test",
      "question": "What will this code output?",
      "code": "const arr = [1, 2, 3];\\nconst result = arr.map(x => x * 2);\\nconsole.log(result);",
      "codeLanguage": "javascript",
      "options": [
        "[2, 4, 6]",
        "[1, 2, 3]",
        "6",
        "undefined"
      ],
      "correctAnswer": "[2, 4, 6]",
      "explanation": "The map() function creates a new array by applying the callback function to each element. In this case, it multiplies each number by 2, resulting in [2, 4, 6]. The other options are incorrect because map() returns a new array, not the original array, a sum, or undefined."
    }` : ''}
  ]
}
      "options": [
        "It allows JavaScript to run on the server",
        "It makes websites load faster automatically",
        "It eliminates the need for databases",
        "It only works with specific browsers"
      ],
      "correctAnswer": "It allows JavaScript to run on the server",
      "explanation": "Node.js's primary advantage is that it enables JavaScript to run on the server, allowing developers to use the same language for both front-end and back-end development. The other options are either incorrect or not the main purpose of Node.js."
    },
    {
      "id": "q2",
      "type": "true-false",
      "question": "Node.js is built on Chrome's V8 JavaScript engine.",
      "correctAnswer": true,
      "explanation": "This is TRUE. Node.js uses Chrome's V8 engine to execute JavaScript code outside of a browser environment, which is a key architectural decision that enables its performance."
    },
    {
      "id": "q3",
      "type": "true-false", 
      "question": "Node.js can only be used for front-end web development.",
      "correctAnswer": false,
      "explanation": "This is FALSE. Node.js is specifically designed for server-side (back-end) development, not front-end development. It enables JavaScript to run on servers, complementing front-end JavaScript frameworks."
    }
  ]
}

IMPORTANT: 
- Make explanations educational and detailed (2-3 sentences minimum)
- Ensure EVERY question is a complete, sensible sentence
- For multiple choice, all options should be complete phrases, not single words
- Test understanding of key concepts from the summary
- Ensure all questions can be definitively answered from the content
- Double-check that questions make sense when read aloud`;

    try {
        const result = await queryAI(prompt, {
            persona,
            temperature: 0.5,
            maxTokens: 2000,
        });

        console.log('📊 AI Response:', result);

        if (!result || !result.success) {
            const errorMsg = result?.error || 'Failed to query language model';
            console.error('❌ AI query failed:', errorMsg);
            throw new Error(errorMsg);
        }

        // result.text is guaranteed to exist and be a string by queryAI wrapper
        const text = result.text;

        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('❌ No JSON found in response:', text.substring(0, 500));
            throw new Error('No valid JSON found in response');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        if (!parsed.questions || !Array.isArray(parsed.questions)) {
            throw new Error('Invalid question format');
        }

        // Validate and clean questions
        const validQuestions = parsed.questions
            .filter(q => {
                // Must have required fields
                if (!q.question || !q.correctAnswer || !q.explanation || !q.type) {
                    console.warn('⚠️ Skipping invalid question (missing fields):', q);
                    return false;
                }

                // Only accept multiple-choice, true-false, and code-test
                if (q.type !== 'multiple-choice' && q.type !== 'true-false' && q.type !== 'code-test') {
                    console.warn('⚠️ Skipping unsupported question type:', q.type);
                    return false;
                }

                // Question must be a complete sentence (minimum length and ends with punctuation)
                if (q.question.length < 15) {
                    console.warn('⚠️ Skipping question that is too short:', q.question);
                    return false;
                }

                // Question should make sense (not just fragments)
                const questionLower = q.question.toLowerCase();
                if (questionLower.includes('___') ||
                    questionLower.match(/^according to the text:[\s\w]{0,30}\?$/i)) {
                    console.warn('⚠️ Skipping nonsensical question:', q.question);
                    return false;
                }

                // Multiple choice must have EXACTLY 4 valid options
                if (q.type === 'multiple-choice' || q.type === 'code-test') {
                    if (!Array.isArray(q.options) || q.options.length !== 4) {
                        console.warn('⚠️ Skipping question (must have exactly 4 options):', q);
                        return false;
                    }

                    // Options should not be single words (unless they're acronyms or proper nouns)
                    const hasBadOptions = q.options.some(opt => {
                        const words = opt.trim().split(/\s+/);
                        return words.length === 1 && words[0].length < 10 && words[0].toLowerCase() === words[0];
                    });

                    if (hasBadOptions) {
                        console.warn('⚠️ Skipping question with single-word options:', q);
                        return false;
                    }

                    if (!q.options.includes(q.correctAnswer)) {
                        console.warn('⚠️ Skipping question where correct answer not in options:', q);
                        return false;
                    }

                    // Check for duplicate options
                    const uniqueOptions = new Set(q.options);
                    if (uniqueOptions.size !== 4) {
                        console.warn('⚠️ Skipping question with duplicate options:', q);
                        return false;
                    }

                    // Code-test specific validation
                    if (q.type === 'code-test') {
                        if (!q.code || q.code.length < 10) {
                            console.warn('⚠️ Skipping code-test without valid code:', q);
                            return false;
                        }
                        if (!q.codeLanguage) {
                            console.warn('⚠️ Skipping code-test without language specified:', q);
                            return false;
                        }
                    }
                }

                // True-false must have boolean answer
                if (q.type === 'true-false') {
                    if (typeof q.correctAnswer !== 'boolean') {
                        console.warn('⚠️ Skipping true-false with non-boolean answer:', q);
                        return false;
                    }
                }

                // Explanation should be substantial
                if (q.explanation.length < 20) {
                    console.warn('⚠️ Skipping question with too short explanation:', q);
                    return false;
                }

                return true;
            })
            .map((q, index) => ({
                ...q,
                id: q.id || `q${index + 1}`,
            }))
            .slice(0, questionCount); // Take only the requested count

        // If we got less than requested questions, the quality is too poor
        if (validQuestions.length < questionCount) {
            throw new Error(`Only ${validQuestions.length} valid questions generated out of ${questionCount} requested - quality too low`);
        }

        console.log(`✅ Generated ${validQuestions.length} valid questions (filtered from ${parsed.questions.length} total)`);
        return validQuestions;

    } catch (error) {
        console.error('❌ Error generating questions:', error);
        throw error;
    }
}

/**
 * Fallback quiz generation for when AI fails
 * Creates basic but sensible questions from content
 */
async function generateFallbackQuiz(text, questionCount = 5) {
    console.log('🔄 Using fallback quiz generation');

    // Extract sentences
    const sentences = text
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 30 && s.length < 300 && !s.includes('http'));

    if (sentences.length < 3) {
        throw new Error('Not enough content to generate fallback quiz (need at least 3 complete sentences)');
    }

    const questions = [];

    // Strategy 1: Create comprehension questions from clear statements
    const statements = sentences.filter(s => {
        const lower = s.toLowerCase();
        return (lower.includes('is') || lower.includes('are') || lower.includes('was') ||
                lower.includes('means') || lower.includes('refers to')) &&
            !lower.includes('?') &&
            s.split(' ').length >= 5;
    });

    // Strategy 1: Create true/false from clear factual statements
    let questionsMade = 0;
    if (questionsMade < questionCount && statements.length > questionsMade) {
        for (let i = questionsMade; i < Math.min(questionCount, statements.length); i++) {
            const statement = statements[i];

            // Randomly make some statements false by modifying them
            const isTrue = Math.random() > 0.5;
            let questionStatement = statement;
            let explanation = '';

            if (isTrue) {
                explanation = `This statement is TRUE. It appears in the original content: "${statement}". This represents a key point from the material.`;
            } else {
                // Make it false by adding a negation or changing a word
                if (statement.toLowerCase().includes(' is ')) {
                    questionStatement = statement.replace(/ is /i, ' is not ');
                    explanation = `This statement is FALSE. The original text states: "${statement}", without the negation. Pay attention to key words like "is" vs "is not".`;
                } else if (statement.toLowerCase().includes(' are ')) {
                    questionStatement = statement.replace(/ are /i, ' are not ');
                    explanation = `This statement is FALSE. The original text states: "${statement}", without the negation.`;
                } else if (statement.toLowerCase().includes(' can ')) {
                    questionStatement = statement.replace(/ can /i, ' cannot ');
                    explanation = `This statement is FALSE. The original text says "${statement}", which means the opposite.`;
                } else {
                    // If we can't easily make it false, make it true
                    isTrue = true;
                    explanation = `This statement is TRUE. It appears in the original content: "${statement}".`;
                }
            }

            questions.push({
                id: `q${questions.length + 1}`,
                type: 'true-false',
                question: questionStatement,
                correctAnswer: isTrue,
                explanation: explanation,
            });
            questionsMade++;
        }
    }

    // Strategy 2: If still need more questions, create multiple choice
    if (questionsMade < questionCount) {
        // Find important nouns/terms
        const words = text.toLowerCase().match(/\b[a-z]{4,15}\b/g) || [];
        const frequency = {};
        words.forEach(word => {
            // Skip common words
            if (!['that', 'this', 'with', 'from', 'have', 'been', 'were', 'they', 'them', 'what', 'when', 'where'].includes(word)) {
                frequency[word] = (frequency[word] || 0) + 1;
            }
        });

        const importantTerms = Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word]) => word);

        // Find sentences that mention these terms
        for (let i = 0; i < Math.min(3, importantTerms.length) && questionsMade < questionCount; i++) {
            const term = importantTerms[i];
            const relevantSentence = sentences.find(s =>
                s.toLowerCase().includes(term) && s.length > 40
            );

            if (relevantSentence) {
                // Create multiple choice question
                const otherTerms = importantTerms
                    .filter(t => t !== term)
                    .slice(0, 3)
                    .map(t => t.charAt(0).toUpperCase() + t.slice(1));

                questions.push({
                    id: `q${questions.length + 1}`,
                    type: 'multiple-choice',
                    question: `According to the text, which concept is discussed in relation to: "${relevantSentence.substring(0, 80)}..."?`,
                    options: [
                        term.charAt(0).toUpperCase() + term.slice(1),
                        ...otherTerms
                    ].sort(() => Math.random() - 0.5),
                    correctAnswer: term.charAt(0).toUpperCase() + term.slice(1),
                    explanation: `The text specifically mentions "${term}" in this context: "${relevantSentence}". This is a key concept from the material.`,
                });
                questionsMade++;
            }
        }
    }

    // Final fallback: if still not enough, create summary questions
    if (questions.length < 2) {
        // Create at least 2 basic questions
        questions.push({
            id: 'q1',
            type: 'true-false',
            question: `The text discusses topics related to its main subject matter.`,
            correctAnswer: true,
            explanation: 'Based on a review of the content, this covers relevant topics for the subject area.',
        });

        questions.push({
            id: 'q2',
            type: 'multiple-choice',
            question: 'Based on the content, which of the following represents a key concept from the text?',
            options: [
                sentences[0]?.substring(0, 60) + '...' || 'Main concept from the reading',
                'An unrelated concept',
                'Another unrelated topic',
                'A different subject matter'
            ],
            correctAnswer: sentences[0]?.substring(0, 60) + '...' || 'Main concept from the reading',
            explanation: 'The text contains several important points. This represents one of the key concepts discussed.',
        });
    }

    console.log(`✅ Generated ${questions.length} fallback questions`);
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
        frequency[word] = (frequency[word] || 0) + 1;
    });

    // Get top frequent words
    const topWords = Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxPhrases)
        .map(([word]) => word);

    // Also look for capitalized words (proper nouns)
    const sentences = text.split(/[.!?]+/);
    const capitalizedWords = [];

    sentences.forEach(sentence => {
        // Add null check and ensure sentence is a string
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

        if (!q.id || !q.question || !q.correctAnswer) {
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
        }
    }

    return { valid: true };
}