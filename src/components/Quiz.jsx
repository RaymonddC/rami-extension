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
    Book,
    AlertCircle,
    Lightbulb,
} from 'lucide-react';
import { generateQuizFromReading } from '../utils/quizGeneration';

/**
 * Enhanced Quiz Component for Learning from Readings
 * Features:
 * - Supports Multiple Choice and True/False questions only
 * - Uses AI summaries for better question generation
 * - Shows detailed explanations after each answer
 * - Provides educational feedback
 * - Tracks learning progress
 */

/**
 * FIXED: Smart answer comparison that handles different types
 * Fixes the issue where correct answers are marked wrong
 */
function compareAnswers(userAnswer, correctAnswer) {
    if (userAnswer === undefined || userAnswer === null) {
        return false;
    }

    // For true/false questions
    if (typeof correctAnswer === 'boolean') {
        if (typeof userAnswer === 'string') {
            const normalized = userAnswer.toLowerCase().trim();
            if (normalized === 'true') return correctAnswer === true;
            if (normalized === 'false') return correctAnswer === false;
        }
        return userAnswer === correctAnswer;
    }

    // For multiple choice (strings)
    if (typeof correctAnswer === 'string' && typeof userAnswer === 'string') {
        return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    }

    return userAnswer === correctAnswer;
}

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
    const [showExplanation, setShowExplanation] = useState(false);
    const [hasAnswered, setHasAnswered] = useState(false);

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
                persona: preferences?.persona || 'mentor',
                questionCount: mode === 'test' ? 10 : 5,
            });

            console.log('✅ Quiz generated successfully:', generatedQuiz);
            setQuiz(generatedQuiz);
            setCurrentQuestionIndex(0);
            setAnswers({});
            setShowResults(false);
            setShowExplanation(false);
            setHasAnswered(false);
        } catch (error) {
            console.error('❌ Failed to generate quiz:', error);
            console.error('Error stack:', error.stack);

            // Show user-friendly error
            const errorMessage = error.message || 'Failed to generate quiz. Please try again.';
            alert(`Quiz Generation Error:\n\n${errorMessage}\n\nTip: Make sure the reading has enough content (at least 100 words).`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAnswerSelect = (questionId, answer) => {
        setAnswers({
            ...answers,
            [questionId]: answer,
        });

        // In practice mode, show explanation immediately
        if (quizMode === 'practice') {
            setHasAnswered(true);
            setShowExplanation(true);
        }
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
        setShowExplanation(false);
        setHasAnswered(false);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setShowExplanation(false);
            setHasAnswered(false);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
            setShowExplanation(false);
            setHasAnswered(false);
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
    const allQuestionsAnswered = quiz.questions.every(q => answers[q.id] !== undefined);
    const userAnswer = answers[currentQuestion.id];
    const isCorrect = compareAnswers(userAnswer, currentQuestion.correctAnswer);

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
            <div className="card mb-6">
                <div className="mb-6">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                            <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                                {currentQuestionIndex + 1}
                            </span>
                        </div>
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 flex-1">
                            {currentQuestion.question}
                        </h3>
                    </div>

                    {/* Question Type Badge */}
                    <div className="mb-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full text-xs font-medium text-neutral-700 dark:text-neutral-300">
                            {currentQuestion.type === 'multiple-choice' && '📊 Multiple Choice'}
                            {currentQuestion.type === 'true-false' && '✓/✗ True or False'}
                            {currentQuestion.type === 'code-test' && '💻 Code Test'}
                        </span>
                    </div>

                    {/* Code Block for code-test questions */}
                    {currentQuestion.type === 'code-test' && currentQuestion.code && (
                        <div className="mb-6 bg-neutral-900 dark:bg-neutral-950 rounded-lg p-4 overflow-x-auto">
                            <div className="text-xs text-neutral-400 mb-2 font-mono">
                                {currentQuestion.codeLanguage || 'code'}
                            </div>
                            <pre className="text-sm text-neutral-100 font-mono">
                                <code>{currentQuestion.code}</code>
                            </pre>
                        </div>
                    )}

                    {/* Answer Options */}
                    <QuestionInput
                        question={currentQuestion}
                        value={userAnswer}
                        onChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
                        showFeedback={showExplanation && hasAnswered}
                        isCorrect={isCorrect}
                    />
                </div>

                {/* Explanation (shown in practice mode after answering) */}
                <AnimatePresence>
                    {showExplanation && hasAnswered && quizMode === 'practice' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700"
                        >
                            <ExplanationPanel
                                question={currentQuestion}
                                userAnswer={userAnswer}
                                isCorrect={isCorrect}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-6 mt-6 border-t border-neutral-200 dark:border-neutral-700">
                    <button
                        onClick={handlePreviousQuestion}
                        disabled={currentQuestionIndex === 0}
                        className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                    </button>

                    {/* Answer count display */}
                    {currentQuestionIndex === quiz.questions.length - 1 && !allQuestionsAnswered && (
                        <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                            {Object.keys(answers).length}/{quiz.questions.length} questions answered
                        </div>
                    )}

                    <div className="flex gap-2">
                        {currentQuestionIndex === quiz.questions.length - 1 ? (
                            <button
                                onClick={handleSubmitQuiz}
                                disabled={!allQuestionsAnswered}
                                className={`btn-primary flex items-center gap-2 ${
                                    !allQuestionsAnswered ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                title={!allQuestionsAnswered ? 'Please answer all questions before submitting' : 'Submit quiz'}
                            >
                                Submit Quiz
                                <Target className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleNextQuestion}
                                className="btn-primary flex items-center gap-2"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Helpful Tip for Practice Mode */}
            {quizMode === 'practice' && !hasAnswered && (
                <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                Practice Mode
                            </h4>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                Select your answer to see a detailed explanation and learn why it's correct or incorrect.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Question Input Component
 */
function QuestionInput({ question, value, onChange, showFeedback, isCorrect }) {
    if (question.type === 'multiple-choice') {
        return (
            <div className="space-y-3">
                {question.options.map((option) => {
                    const isSelected = value === option;
                    const isCorrectOption = compareAnswers(option, question.correctAnswer);
                    const showCorrect = showFeedback && isCorrectOption;
                    const showWrong = showFeedback && isSelected && !isCorrectOption;

                    return (
                        <button
                            key={option}
                            onClick={() => onChange(option)}
                            className={`
                                w-full text-left p-4 rounded-lg border-2 transition-all
                                ${isSelected && !showFeedback
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                            }
                                ${showCorrect
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                : ''
                            }
                                ${showWrong
                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                : ''
                            }
                            `}
                            disabled={showFeedback}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`
                                    w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                    ${isSelected && !showFeedback
                                    ? 'border-primary-500 bg-primary-500'
                                    : 'border-neutral-300 dark:border-neutral-600'
                                }
                                    ${showCorrect ? 'border-green-500 bg-green-500' : ''}
                                    ${showWrong ? 'border-red-500 bg-red-500' : ''}
                                `}>
                                    {isSelected && !showFeedback && (
                                        <div className="w-2 h-2 bg-white rounded-full" />
                                    )}
                                    {showCorrect && <CheckCircle2 className="w-4 h-4 text-white" />}
                                    {showWrong && <XCircle className="w-4 h-4 text-white" />}
                                </div>
                                <span className="text-neutral-900 dark:text-neutral-100 flex-1">
                                    {option}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        );
    }

    if (question.type === 'true-false') {
        return (
            <div className="space-y-3">
                {[true, false].map((option) => {
                    const isSelected = value === option;
                    const isCorrectOption = compareAnswers(option, question.correctAnswer);
                    const showCorrect = showFeedback && isCorrectOption;
                    const showWrong = showFeedback && isSelected && !isCorrectOption;

                    return (
                        <button
                            key={option.toString()}
                            onClick={() => onChange(option)}
                            className={`
                                w-full text-left p-4 rounded-lg border-2 transition-all
                                ${isSelected && !showFeedback
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                            }
                                ${showCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
                                ${showWrong ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
                            `}
                            disabled={showFeedback}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`
                                    w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                    ${isSelected && !showFeedback
                                    ? 'border-primary-500 bg-primary-500'
                                    : 'border-neutral-300 dark:border-neutral-600'
                                }
                                    ${showCorrect ? 'border-green-500 bg-green-500' : ''}
                                    ${showWrong ? 'border-red-500 bg-red-500' : ''}
                                `}>
                                    {isSelected && !showFeedback && (
                                        <div className="w-2 h-2 bg-white rounded-full" />
                                    )}
                                    {showCorrect && <CheckCircle2 className="w-4 h-4 text-white" />}
                                    {showWrong && <XCircle className="w-4 h-4 text-white" />}
                                </div>
                                <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                    {option ? 'True' : 'False'}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        );
    }

    return null;
}

/**
 * Explanation Panel Component
 */
function ExplanationPanel({ question, userAnswer, isCorrect }) {
    return (
        <div className={`
            p-6 rounded-lg
            ${isCorrect
            ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800'
            : 'bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800'
        }
        `}>
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                    {isCorrect ? (
                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                    ) : (
                        <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                    )}
                </div>
                <div className="flex-1">
                    <h4 className={`
                        text-lg font-semibold mb-3
                        ${isCorrect
                        ? 'text-green-900 dark:text-green-100'
                        : 'text-orange-900 dark:text-orange-100'
                    }
                    `}>
                        {isCorrect ? '🎉 Correct!' : '📚 Learn from this'}
                    </h4>

                    {!isCorrect && (
                        <div className="mb-3 p-3 bg-white dark:bg-neutral-800 rounded-lg">
                            <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                <strong>Your answer:</strong> {formatAnswer(userAnswer)}
                            </p>
                            <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-1">
                                <strong>Correct answer:</strong> {formatAnswer(question.correctAnswer)}
                            </p>
                        </div>
                    )}

                    <div className={`
                        text-sm leading-relaxed
                        ${isCorrect
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-orange-800 dark:text-orange-200'
                    }
                    `}>
                        <strong>💡 Explanation:</strong>
                        <p className="mt-2">{question.explanation}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Reading Selector Component
 */
function ReadingSelector({ readings, onSelect }) {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="card mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <Book className="w-6 h-6 text-primary-500" />
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                        Choose a Reading to Quiz
                    </h2>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                    Select an article to generate personalized quiz questions. The quiz will be based on the
                    AI summary and content of your reading.
                </p>

                {/* Tip about summaries */}
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
                    <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                Better Questions with AI Summaries
                            </h4>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                For best results, generate an AI summary for your reading first using the "View AI Summarize" button.
                                This helps create more focused and educational quiz questions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {readings.map((reading) => (
                    <ReadingCard
                        key={reading.id}
                        reading={reading}
                        onSelect={(mode) => onSelect(reading, mode)}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Reading Card Component
 */
function ReadingCard({ reading, onSelect }) {
    const hasSummary = !!(reading.aiSummary || reading.summary);

    return (
        <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                        {reading.title}
                    </h3>
                    {/*<p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3">*/}
                    {/*    {reading.excerpt || reading.text?.substring(0, 150) + '...'}*/}
                    {/*</p>*/}

                    {/* Summary indicator */}
                    <div className="flex items-center gap-3 mb-4">
                        {hasSummary ? (
                            <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                                <CheckCircle2 className="w-3 h-3" />
                                AI Summary Available
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                                <AlertCircle className="w-3 h-3" />
                                No AI Summary
                            </span>
                        )}
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {new Date(reading.timestamp).toLocaleDateString()}
                        </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => onSelect('practice')}
                            className="btn-primary text-sm flex items-center gap-2"
                        >
                            <Play className="w-4 h-4" />
                            Practice Quiz (5 questions)
                        </button>
                        <button
                            onClick={() => onSelect('test')}
                            className="btn-secondary text-sm flex items-center gap-2"
                        >
                            <Target className="w-4 h-4" />
                            Test Mode (10 questions)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Quiz Results Component (keeping existing implementation)
 */
function QuizResults({ quiz, answers, timeElapsed, quizMode, onReset, onRetry }) {
    const score = calculateScore(quiz, answers);
    const percentage = (score / quiz.questions.length) * 100;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Results Summary */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card text-center"
            >
                <div className="text-6xl mb-4">
                    {percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '💪'}
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                    Quiz Complete!
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
                        const isCorrect = compareAnswers(userAnswer, question.correctAnswer);

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
                                            <div className="mt-3 p-3 bg-white dark:bg-neutral-800 rounded-lg">
                                                <p className="text-neutral-600 dark:text-neutral-400">
                                                    <strong className="text-neutral-900 dark:text-neutral-100">💡 Explanation:</strong>
                                                    <br />
                                                    {question.explanation}
                                                </p>
                                            </div>
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
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                    className="text-6xl mb-6"
                >
                    <Brain className="w-16 h-16 mx-auto text-primary-500" />
                </motion.div>
                <motion.h3
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-2xl font-bold text-neutral-900 dark:text-neutral-100"
                >
                    Crafting Your Quiz...
                </motion.h3>
            </div>
        </div>
    );
}

/**
 * Calculate quiz score
 */
function calculateScore(quiz, answers) {
    let correct = 0;

    quiz.questions.forEach((question) => {
        const userAnswer = answers[question.id];
        if (compareAnswers(userAnswer, question.correctAnswer)) {
            correct++;
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