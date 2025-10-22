import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Play,
    Trophy,
    Clock,
    Target,
    Sparkles,
    ChevronRight,
    ChevronLeft,
} from 'lucide-react';

/**
 * Quiz Component for Learning from Readings
 * Generates and manages interactive quizzes based on saved content
 */
export default function Quiz({ readings, preferences }) {
    const [selectedReading, setSelectedReading] = useState(null);
    const [quiz, setQuiz] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [quizMode, setQuizMode] = useState('practice'); // 'practice' or 'test'
    const [startTime, setStartTime] = useState(null);
    const [timeElapsed, setTimeElapsed] = useState(0);

    // Timer for test mode
    useEffect(() => {
        if (quiz && !showResults && quizMode === 'test') {
            const interval = setInterval(() => {
                setTimeElapsed(Date.now() - startTime);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [quiz, showResults, quizMode, startTime]);

    const handleGenerateQuiz = async (reading, mode = 'practice') => {
        console.log('🎬 Starting quiz generation...');
        console.log('📖 Reading:', reading);
        console.log('🎮 Mode:', mode);

        setIsGenerating(true);
        setQuizMode(mode);
        setSelectedReading(reading);
        setStartTime(Date.now());

        try {
            const generatedQuiz = await generateQuizFromReading(reading, {
                persona: preferences?.persona || 'strategist',
                difficulty: 'medium',
                questionCount: mode === 'test' ? 10 : 5,
            });

            console.log('✅ Quiz generated successfully:', generatedQuiz);
            setQuiz(generatedQuiz);
            setCurrentQuestionIndex(0);
            setAnswers({});
            setShowResults(false);
        } catch (error) {
            console.error('❌ Failed to generate quiz:', error);
            console.error('Error stack:', error.stack);

            // Show user-friendly error
            const errorMessage = error.message || 'Failed to generate quiz. Please try again.';
            alert(`Quiz Generation Error:\n\n${errorMessage}\n\nPlease check:\n- The reading has enough content (at least 100 words)\n- Try a different reading\n- Check browser console for details`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAnswerSelect = (questionId, answer) => {
        setAnswers({
            ...answers,
            [questionId]: answer,
        });
    };

    const handleSubmitQuiz = () => {
        setShowResults(true);
    };

    const handleResetQuiz = () => {
        setQuiz(null);
        setSelectedReading(null);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setShowResults(false);
        setTimeElapsed(0);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    if (readings.length === 0) {
        return <EmptyQuizState />;
    }

    if (isGenerating) {
        return <GeneratingQuizState />;
    }

    if (!quiz) {
        return (
            <ReadingSelector
                readings={readings}
                onSelect={handleGenerateQuiz}
            />
        );
    }

    if (showResults) {
        return (
            <QuizResults
                quiz={quiz}
                answers={answers}
                timeElapsed={timeElapsed}
                quizMode={quizMode}
                onReset={handleResetQuiz}
                onRetry={() => handleGenerateQuiz(selectedReading, quizMode)}
            />
        );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
    const allQuestionsAnswered = quiz.questions.every(q => answers[q.id]);

    return (
        <div className="max-w-4xl mx-auto">
            {/* Quiz Header */}
            <div className="card mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Brain className="w-6 h-6 text-primary-500" />
                        <div>
                            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                                {quiz.title}
                            </h2>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                {selectedReading?.title}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {quizMode === 'test' && (
                            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                                <Clock className="w-4 h-4" />
                                <span className="font-mono">
                  {formatTime(timeElapsed)}
                </span>
                            </div>
                        )}
                        <button
                            onClick={handleResetQuiz}
                            className="btn-ghost text-sm"
                        >
                            Exit Quiz
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </span>
                        <span className="text-neutral-600 dark:text-neutral-400">
              {Math.round(progress)}% Complete
            </span>
                    </div>
                    <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-primary-500"
                        />
                    </div>
                </div>
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="card mb-6"
                >
                    <QuestionCard
                        question={currentQuestion}
                        answer={answers[currentQuestion.id]}
                        onAnswerSelect={(answer) => handleAnswerSelect(currentQuestion.id, answer)}
                        showFeedback={quizMode === 'practice' && answers[currentQuestion.id]}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                </button>

                <div className="flex items-center gap-2">
                    {quiz.questions.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentQuestionIndex(index)}
                            className={`w-8 h-8 rounded-full transition-all ${
                                index === currentQuestionIndex
                                    ? 'bg-primary-500 text-white'
                                    : answers[quiz.questions[index].id]
                                        ? 'bg-green-500 text-white'
                                        : 'bg-neutral-200 dark:bg-neutral-700'
                            }`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>

                {currentQuestionIndex === quiz.questions.length - 1 ? (
                    <button
                        onClick={handleSubmitQuiz}
                        disabled={!allQuestionsAnswered}
                        className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Submit Quiz
                        <Target className="w-4 h-4" />
                    </button>
                ) : (
                    <button
                        onClick={handleNextQuestion}
                        className="btn-secondary flex items-center gap-2"
                    >
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * Question Card Component
 */
function QuestionCard({ question, answer, onAnswerSelect, showFeedback }) {
    return (
        <div className="space-y-6">
            {/* Question */}
            <div>
                <div className="flex items-start gap-3 mb-4">
          <span className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-semibold">
            ?
          </span>
                    <div className="flex-1">
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                            {question.question}
                        </h3>
                        {question.hint && (
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 italic">
                                Hint: {question.hint}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
                {question.type === 'multiple-choice' && (
                    <>
                        {question.options.map((option, index) => (
                            <AnswerOption
                                key={index}
                                option={option}
                                selected={answer === option}
                                correct={showFeedback && option === question.correctAnswer}
                                incorrect={showFeedback && answer === option && option !== question.correctAnswer}
                                onClick={() => onAnswerSelect(option)}
                                disabled={showFeedback}
                            />
                        ))}
                    </>
                )}

                {question.type === 'true-false' && (
                    <>
                        <AnswerOption
                            option="True"
                            selected={answer === true}
                            correct={showFeedback && question.correctAnswer === true}
                            incorrect={showFeedback && answer === true && question.correctAnswer === false}
                            onClick={() => onAnswerSelect(true)}
                            disabled={showFeedback}
                        />
                        <AnswerOption
                            option="False"
                            selected={answer === false}
                            correct={showFeedback && question.correctAnswer === false}
                            incorrect={showFeedback && answer === false && question.correctAnswer === true}
                            onClick={() => onAnswerSelect(false)}
                            disabled={showFeedback}
                        />
                    </>
                )}

                {question.type === 'short-answer' && (
                    <textarea
                        value={answer || ''}
                        onChange={(e) => onAnswerSelect(e.target.value)}
                        className="textarea min-h-[120px]"
                        placeholder="Type your answer here..."
                        disabled={showFeedback}
                    />
                )}
            </div>

            {/* Feedback */}
            {showFeedback && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg ${
                        (question.type !== 'short-answer' && answer === question.correctAnswer) ||
                        (question.type === 'short-answer' && answer?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim())
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    }`}
                >
                    <div className="flex items-start gap-3">
                        {(question.type !== 'short-answer' && answer === question.correctAnswer) ||
                        (question.type === 'short-answer' && answer?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim()) ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        ) : (
                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                            <p className="font-medium mb-1">
                                {(question.type !== 'short-answer' && answer === question.correctAnswer) ||
                                (question.type === 'short-answer' && answer?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim())
                                    ? 'Correct!'
                                    : 'Incorrect'}
                            </p>
                            <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                {question.explanation}
                            </p>
                            {question.type === 'short-answer' && (
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                                    <strong>Expected:</strong> {question.correctAnswer}
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

/**
 * Answer Option Component
 */
function AnswerOption({ option, selected, correct, incorrect, onClick, disabled }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        w-full p-4 rounded-lg border-2 text-left transition-all
        ${selected && !correct && !incorrect
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : correct
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : incorrect
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
            }
        ${disabled ? 'cursor-default' : 'cursor-pointer'}
      `}
        >
            <div className="flex items-center gap-3">
                <div className={`
          w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
          ${selected && !correct && !incorrect
                    ? 'border-primary-500 bg-primary-500'
                    : correct
                        ? 'border-green-500 bg-green-500'
                        : incorrect
                            ? 'border-red-500 bg-red-500'
                            : 'border-neutral-300 dark:border-neutral-600'
                }
        `}>
                    {selected && !correct && !incorrect && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                    {correct && <CheckCircle2 className="w-4 h-4 text-white" />}
                    {incorrect && <XCircle className="w-4 h-4 text-white" />}
                </div>
                <span className="text-neutral-900 dark:text-neutral-100">
          {typeof option === 'boolean' ? (option ? 'True' : 'False') : option}
        </span>
            </div>
        </button>
    );
}

/**
 * Reading Selector Component
 */
function ReadingSelector({ readings, onSelect }) {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="card mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <Brain className="w-6 h-6 text-primary-500" />
                    <div>
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                            Choose a Reading to Quiz
                        </h2>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Test your knowledge and reinforce what you've learned
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {readings.map((reading) => {
                        const content = reading.content || reading.text || reading.excerpt || '';
                        const contentLength = content.trim().length;
                        const hasEnoughContent = contentLength >= 100;
                        const wordCount = Math.floor(contentLength / 5); // Rough word count estimation

                        return (
                            <motion.div
                                key={reading.id}
                                whileHover={{ y: -2 }}
                                className={`card-hover ${!hasEnoughContent ? 'opacity-50' : ''}`}
                            >
                                <h3 className="font-semibold mb-2 line-clamp-2">
                                    {reading.title}
                                </h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 line-clamp-2">
                                    {reading.excerpt || content.substring(0, 100)}
                                </p>

                                {/* Content indicator */}
                                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                      hasEnoughContent
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {hasEnoughContent ? '✓' : '⚠'} ~{wordCount} words
                  </span>
                                    {!hasEnoughContent && (
                                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      (needs 100+ words)
                    </span>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onSelect(reading, 'practice')}
                                        disabled={!hasEnoughContent}
                                        className="btn-primary flex-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={!hasEnoughContent ? 'Reading needs more content' : 'Start practice quiz'}
                                    >
                                        <Play className="w-4 h-4 inline mr-1" />
                                        Practice
                                    </button>
                                    <button
                                        onClick={() => onSelect(reading, 'test')}
                                        disabled={!hasEnoughContent}
                                        className="btn-secondary flex-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={!hasEnoughContent ? 'Reading needs more content' : 'Start test quiz'}
                                    >
                                        <Target className="w-4 h-4 inline mr-1" />
                                        Test
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/**
 * Quiz Results Component
 */
function QuizResults({ quiz, answers, timeElapsed, quizMode, onReset, onRetry }) {
    const score = calculateScore(quiz, answers);
    const percentage = (score / quiz.questions.length) * 100;
    const passed = percentage >= 70;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Results Header */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="card mb-6 text-center"
            >
                <div className="text-6xl mb-4">
                    {passed ? '🎉' : '📚'}
                </div>
                <h2 className="text-3xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">
                    {passed ? 'Great Job!' : 'Keep Learning!'}
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                    You scored {score} out of {quiz.questions.length} ({percentage.toFixed(0)}%)
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-850 rounded-lg">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Trophy className="w-5 h-5 text-primary-500" />
                            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {percentage.toFixed(0)}%
              </span>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Score</p>
                    </div>
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-850 rounded-lg">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Clock className="w-5 h-5 text-primary-500" />
                            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {formatTime(timeElapsed)}
              </span>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Time</p>
                    </div>
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-850 rounded-lg">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Target className="w-5 h-5 text-primary-500" />
                            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {score}/{quiz.questions.length}
              </span>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Correct</p>
                    </div>
                </div>

                <div className="flex gap-3 justify-center">
                    <button onClick={onRetry} className="btn-primary flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Try Again
                    </button>
                    <button onClick={onReset} className="btn-secondary">
                        New Quiz
                    </button>
                </div>
            </motion.div>

            {/* Question Review */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
                    Review Your Answers
                </h3>
                <div className="space-y-4">
                    {quiz.questions.map((question, index) => {
                        const userAnswer = answers[question.id];
                        const isCorrect = question.type === 'short-answer'
                            ? userAnswer?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim()
                            : userAnswer === question.correctAnswer;

                        return (
                            <div
                                key={question.id}
                                className={`p-4 rounded-lg border-2 ${
                                    isCorrect
                                        ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                                        : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    {isCorrect ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                                    )}
                                    <div className="flex-1">
                                        <p className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                                            {index + 1}. {question.question}
                                        </p>
                                        <div className="text-sm space-y-1">
                                            <p className="text-neutral-700 dark:text-neutral-300">
                                                <strong>Your answer:</strong> {formatAnswer(userAnswer)}
                                            </p>
                                            {!isCorrect && (
                                                <p className="text-neutral-700 dark:text-neutral-300">
                                                    <strong>Correct answer:</strong> {formatAnswer(question.correctAnswer)}
                                                </p>
                                            )}
                                            <p className="text-neutral-600 dark:text-neutral-400 italic mt-2">
                                                {question.explanation}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/**
 * Empty State Component
 */
function EmptyQuizState() {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    No Readings Available
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                    Save some articles first to generate quizzes and test your knowledge!
                </p>
            </div>
        </div>
    );
}

/**
 * Generating State Component
 */
function GeneratingQuizState() {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="text-6xl mb-4"
                >
                    <Sparkles className="w-16 h-16 mx-auto text-primary-500" />
                </motion.div>
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    Generating Quiz...
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                    Creating personalized questions from your reading
                </p>
            </div>
        </div>
    );
}

/**
 * Generate quiz from reading content
 */
async function generateQuizFromReading(reading, options = {}) {
    const { persona = 'strategist', difficulty = 'medium', questionCount = 5 } = options;

    console.log('🎯 Generating quiz for:', reading.title);
    console.log('📝 Reading object:', reading);
    console.log('⚙️ Options:', options);

    // Get content from various possible fields
    const content = reading.content || reading.text || reading.excerpt || '';
    const contentLength = content.trim().length;

    console.log('📏 Content length:', contentLength);

    // Validate content
    if (contentLength < 50) {
        console.error('❌ Content too short!', { contentLength, hasContent: !!reading.content, hasText: !!reading.text, hasExcerpt: !!reading.excerpt });

        // Show helpful error with actual data
        const errorDetails = {
            title: reading.title,
            hasContent: !!reading.content,
            hasText: !!reading.text,
            hasExcerpt: !!reading.excerpt,
            contentLength: contentLength,
            readingKeys: Object.keys(reading)
        };

        console.error('Reading details:', errorDetails);

        throw new Error(
            `Reading has insufficient content to generate quiz from.\n\n` +
            `Please check:\n` +
            `- The reading has enough content (at least 100 words)\n` +
            `- Try saving the page again with full content\n` +
            `- Check if the content was properly extracted\n\n` +
            `Current content length: ${contentLength} characters`
        );
    }

    try {
        // Try using Chrome AI API first
        console.log('🤖 Checking for Chrome AI...');
        if (typeof chrome !== 'undefined' && 'ai' in chrome && chrome.ai.languageModel) {
            console.log('✅ Chrome AI available, attempting to use...');
            console.log('✅ Chrome AI available, attempting to use...');
            const session = await chrome.ai.languageModel.create({
                systemPrompt: `You are a quiz generator. Create ${questionCount} educational questions based on the provided content. Generate a mix of multiple-choice, true/false, and short-answer questions. Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "What is...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "This is correct because...",
      "hint": "Think about..."
    }
  ]
}`,
            });

            console.log('📤 Sending prompt to AI...');
            const prompt = `Create ${questionCount} quiz questions from this content:\n\n${content.substring(0, 2000)}\n\nReturn only valid JSON.`;
            const response = await session.prompt(prompt);

            console.log('🤖 AI Response received:', response.substring(0, 200) + '...');

            // Parse the AI response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                console.log('✅ Successfully parsed AI response:', parsed);
                return {
                    title: `Quiz: ${reading.title}`,
                    questions: parsed.questions,
                    generationMethod: 'ai',
                };
            } else {
                console.warn('⚠️ No JSON found in AI response');
            }
        } else {
            console.log('ℹ️ Chrome AI not available');
        }
    } catch (error) {
        console.error('⚠️ AI generation failed:', error);
        console.error('Error details:', error.message);
    }

    // Fallback: Generate simple questions from content
    console.log('🔄 Using fallback generation...');
    return generateFallbackQuiz(reading, questionCount, content);
}

/**
 * Fallback quiz generation (rule-based)
 */
function generateFallbackQuiz(reading, questionCount = 5, providedContent = null) {
    console.log('🔧 Starting fallback quiz generation');
    const content = providedContent || reading.content || reading.text || reading.excerpt || '';

    console.log('📏 Content length:', content.length);

    if (content.length < 50) {
        console.error('❌ Content too short for quiz generation');
        throw new Error('Reading content is too short to generate a quiz');
    }

    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    console.log('📝 Found sentences:', sentences.length);

    const questions = [];

    // Generate questions from key sentences
    const keyPhrases = extractKeyPhrases(content);
    console.log('🔑 Extracted key phrases:', keyPhrases);

    for (let i = 0; i < Math.min(questionCount, keyPhrases.length); i++) {
        const phrase = keyPhrases[i];

        if (i % 3 === 0) {
            // Multiple choice question
            questions.push({
                id: `q${i + 1}`,
                type: 'multiple-choice',
                question: `What is mentioned about "${phrase}"?`,
                options: [
                    `${phrase} is discussed in detail`,
                    'It is not mentioned',
                    'It is briefly referenced',
                    'It is the main topic',
                ],
                correctAnswer: `${phrase} is discussed in detail`,
                explanation: `The text discusses "${phrase}" as part of the main content.`,
                hint: 'Look for key terms in the reading.',
            });
        } else if (i % 3 === 1) {
            // True/False question
            questions.push({
                id: `q${i + 1}`,
                type: 'true-false',
                question: `The reading discusses "${phrase}". True or False?`,
                correctAnswer: true,
                explanation: `The text mentions "${phrase}" as part of the content.`,
                hint: 'Think about the main themes covered.',
            });
        } else {
            // Short answer question
            questions.push({
                id: `q${i + 1}`,
                type: 'short-answer',
                question: `Describe the significance of "${phrase}" in the reading.`,
                correctAnswer: phrase,
                explanation: `"${phrase}" is a key concept discussed in the text.`,
                hint: 'Consider the main ideas presented.',
            });
        }
    }

    console.log('✅ Generated questions:', questions.length);

    if (questions.length === 0) {
        console.error('❌ Failed to generate any questions');
        throw new Error('Could not generate questions from this content');
    }

    return {
        title: `Quiz: ${reading.title}`,
        questions,
        generationMethod: 'fallback',
    };
}

/**
 * Extract key phrases from text
 */
function extractKeyPhrases(text) {
    console.log('🔍 Extracting key phrases from text...');

    if (!text || text.length < 50) {
        console.warn('⚠️ Text too short for phrase extraction');
        return ['the main topic', 'key concepts', 'important ideas', 'the content', 'the subject'];
    }

    const words = text.split(/\s+/).filter(w => w.length > 3);
    console.log('📝 Total words:', words.length);

    const phrases = [];

    // Extract noun phrases (simple heuristic: capitalize words and 2-3 word sequences)
    for (let i = 0; i < words.length - 2; i++) {
        const phrase = words.slice(i, i + 3).join(' ')
            .replace(/[^\w\s]/g, '') // Remove special characters
            .trim();

        if (phrase.length > 10 && phrase.length < 60) {
            phrases.push(phrase);
        }
    }

    // Also extract single important words
    const importantWords = words.filter(w =>
        w.length > 6 &&
        !/^(the|and|that|this|with|from|have|been|were|their|there|which|would|could|should)$/i.test(w)
    );

    // Combine and deduplicate
    const allPhrases = [...new Set([...phrases, ...importantWords])];
    console.log('✅ Extracted phrases:', allPhrases.length);

    // If we didn't get enough phrases, add some generic ones
    if (allPhrases.length < 5) {
        console.warn('⚠️ Not enough phrases extracted, adding generic ones');
        allPhrases.push(
            'the main concept',
            'key information',
            'important details',
            'the central theme',
            'core ideas'
        );
    }

    return allPhrases.slice(0, 15); // Return max 15 phrases
}

/**
 * Calculate quiz score
 */
function calculateScore(quiz, answers) {
    let correct = 0;

    quiz.questions.forEach((question) => {
        const userAnswer = answers[question.id];

        if (question.type === 'short-answer') {
            if (userAnswer?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim()) {
                correct++;
            }
        } else {
            if (userAnswer === question.correctAnswer) {
                correct++;
            }
        }
    });

    return correct;
}

/**
 * Format time in MM:SS
 */
function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format answer for display
 */
function formatAnswer(answer) {
    if (typeof answer === 'boolean') {
        return answer ? 'True' : 'False';
    }
    return answer || 'Not answered';
}