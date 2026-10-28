import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  Terminal,
  Timer,
  CheckCircle2,
  Code2,
  FileText,
  CloudCheck,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Flag,
  Check,
  Send,
  Loader2,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const InterviewArenaPage = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const interviewIdParam = params.id || searchParams.get('id') || searchParams.get('interview_id');

  // Session & question states
  const [interview, setInterview] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: answerText }
  const [markedForReview, setMarkedForReview] = useState({}); // { [questionId]: boolean }

  // Synchronous ref to prevent stale closures and ensure fast preservation
  const answersRef = useRef({});
  const isInitialLoadRef = useRef(true);

  // Editor states
  const [activeTab, setActiveTab] = useState('written');
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // Timer states
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 mins default
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timeoutTriggered, setTimeoutTriggered] = useState(false);

  // Flow & modal states
  const [loading, setLoading] = useState(true);
  const [submittingEvaluation, setSubmittingEvaluation] = useState(false);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [error, setError] = useState(null);

  const currentQuestion = questions[currentIndex] || null;
  const currentAnswer = currentQuestion ? (answers[currentQuestion.id] ?? '') : '';

  // 1. Load session and all questions
  const loadSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let session = null;

      if (interviewIdParam) {
        session = await api.interviews.getById(interviewIdParam);
      } else {
        session = await api.interviews.getActive();
        if (!session) {
          navigate('/interview/setup');
          return;
        }
      }

      if (session.status === 'completed') {
        navigate(`/interview/${session.id}/report`);
        return;
      }

      setInterview(session);

      // Extract all questions
      const qList = session.questions || (session.current_question ? [session.current_question] : []);
      setQuestions(qList);

      // Populate answers dictionary and ref from saved states
      const initialAnswers = {};
      qList.forEach((q) => {
        if (q.saved_answer) {
          initialAnswers[q.id] = q.saved_answer;
        }
      });
      answersRef.current = initialAnswers;
      setAnswers(initialAnswers);

      // Initial question index only set on initial load to prevent async overwriting
      if (isInitialLoadRef.current) {
        const startIdx = Math.min(session.current_question_index || 0, Math.max(0, qList.length - 1));
        setCurrentIndex(startIdx);
        isInitialLoadRef.current = false;
      }

      // Timer initialization
      if (session.timed_mode) {
        const totalSecs = (session.time_limit_mins || 10) * 60;
        setTimeRemaining(totalSecs);
      }
    } catch (err) {
      console.error('Failed to load arena session:', err);
      setError(err.message || 'Failed to initialize interview arena.');
    } finally {
      setLoading(false);
    }
  }, [interviewIdParam, navigate]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // 2. Timer Countdown & Elapsed Tracker
  useEffect(() => {
    if (!interview || timeoutTriggered) return;

    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);

      if (interview.timed_mode) {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTimeExpired();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [interview, timeoutTriggered]);

  const handleTimeExpired = () => {
    setTimeoutTriggered(true);
    // Auto-save current answer and prompt evaluation
    saveCurrentAnswer();
    setFinishModalOpen(true);
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 3. Save Answer helpers
  const saveAnswerInBackground = async (questionId, text) => {
    if (!interview || !questionId) return;
    try {
      setSavingAnswer(true);
      await api.interviews.saveAnswer(
        interview.id,
        questionId,
        text,
        timeElapsed
      );
      setLastSavedTime(new Date());
    } catch (err) {
      console.warn('Silent save failed:', err);
    } finally {
      setSavingAnswer(false);
    }
  };

  const saveCurrentAnswer = async (specificAnswerText = null) => {
    if (!interview || !currentQuestion) return;
    const textToSave = specificAnswerText !== null ? specificAnswerText : (answersRef.current[currentQuestion.id] || '');
    await saveAnswerInBackground(currentQuestion.id, textToSave);
  };

  // 4. Navigation Handlers
  const handleAnswerChange = (text) => {
    if (!currentQuestion) return;
    answersRef.current[currentQuestion.id] = text;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: text
    }));
  };

  const goToQuestion = (targetIndex) => {
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    if (targetIndex === currentIndex) return;

    // Save previous question answer without blocking navigation
    if (currentQuestion) {
      const textToSave = answersRef.current[currentQuestion.id] || '';
      saveAnswerInBackground(currentQuestion.id, textToSave);
    }

    // Immediately update active question
    setCurrentIndex(targetIndex);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      goToQuestion(currentIndex + 1);
    } else {
      // Last question -> save and open finish confirmation
      if (currentQuestion) {
        const textToSave = answersRef.current[currentQuestion.id] || '';
        saveAnswerInBackground(currentQuestion.id, textToSave);
      }
      setFinishModalOpen(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      goToQuestion(currentIndex - 1);
    }
  };

  const toggleMarkForReview = () => {
    if (!currentQuestion) return;
    setMarkedForReview((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id]
    }));
  };

  // 5. Final Evaluation Submission
  const handleFinalSubmit = async () => {
    if (!interview) return;
    setFinishModalOpen(false);
    setSubmittingEvaluation(true);
    setError(null);

    try {
      // 1. Ensure current answer is saved
      if (currentQuestion) {
        const currentText = answersRef.current[currentQuestion.id] || '';
        await api.interviews.saveAnswer(
          interview.id,
          currentQuestion.id,
          currentText,
          timeElapsed
        );
      }

      // 2. Trigger whole-interview comprehensive evaluation
      await api.interviews.completeEvaluation(interview.id);

      // 3. Navigate directly to the final report debrief
      navigate(`/interview/${interview.id}/report`);
    } catch (err) {
      console.error('Final evaluation submission error:', err);
      setError(err.message || 'Evaluation synthesis failed. Please retry.');
      setSubmittingEvaluation(false);
    }
  };

  const switchToSandbox = () => {
    setActiveTab('sandbox');
    if (!currentAnswer.includes('class') && !currentAnswer.includes('function') && !currentAnswer.includes('def ')) {
      const codeTemplate = `// Architectural implementation or pseudo-code\nfunction solution() {\n    // Implement core logic and explain operational trade-offs\n}\n`;
      handleAnswerChange(currentAnswer ? `${currentAnswer}\n\n${codeTemplate}` : codeTemplate);
    }
  };

  const switchToWritten = () => {
    setActiveTab('written');
  };

  // Metrics
  const totalQuestions = questions.length || interview?.total_questions || 10;
  const answeredCount = Object.values(answers).filter((a) => a && a.trim().length > 0).length;
  const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0;
  const progressPct = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-[#1b1c17] border-t-[#c6f26a] animate-spin"></div>
        <span className="font-mono text-xs text-[#767871] uppercase tracking-wider">
          Synthesizing Arena Telemetry Stream &amp; Questions...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-16 text-[#1b1c17] max-w-6xl mx-auto">
      {/* Submitting Full Screen Loading Overlay */}
      {submittingEvaluation && (
        <div className="fixed inset-0 bg-[#1b1c17]/85 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white p-6">
          <div className="w-16 h-16 rounded-full border-4 border-[#c6f26a] border-t-transparent animate-spin mb-6"></div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Synthesizing Whole-Interview Evaluation</h2>
          <p className="text-sm text-[#c6c7c0] max-w-md text-center font-mono leading-relaxed mb-4">
            Evaluating all {totalQuestions} questions across {interview?.job_role} rubric...
            Analyzing architectural depth, correctness, STAR indicators, and actionable improvement roadmap.
          </p>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#ffffff]/10 rounded-full border border-white/10 text-xs font-mono text-[#c6f26a]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PrepPulse AI Calibration Engine Active</span>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-3.5 bg-[#ffdad6] border border-[#ba1a1a]/40 text-[#93000a] text-xs rounded-xl font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="font-mono text-xs uppercase underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Top Cockpit Banner */}
      <div className="w-full bg-[#1a1c18] text-[#ffffff] rounded-xl p-4 sm:p-5 shadow-xl flex flex-col gap-4 mb-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-[#181d15] text-[#dfe4d8] text-[11px] font-mono uppercase tracking-wider rounded border border-[#2c3328]">
              {interview?.job_role || 'Software Engineer'}
            </span>
            <span className="px-3 py-1 bg-[#2c3328] text-[#c6f26a] text-[11px] font-mono tracking-normal rounded font-semibold uppercase">
              {interview?.round_type || interview?.interview_type || 'TECHNICAL'} ROUND
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2c3328] text-[#ffffff] text-[11px] font-mono rounded font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c6f26a]"></span>
              {interview?.difficulty?.toUpperCase() || 'SENIOR'} LEVEL
            </span>
          </div>

          {/* Question Summary & Progress Bar */}
          <div className="flex flex-col items-center gap-1.5 w-full lg:w-auto">
            <div className="flex items-center justify-between w-full lg:w-72">
              <span className="text-[11px] font-mono text-[#80867b] uppercase tracking-wider">
                Question {String(currentIndex + 1).padStart(2, '0')} of {String(totalQuestions).padStart(2, '0')}
              </span>
              <span className="text-[11px] font-mono text-[#c6f26a] font-semibold">
                {answeredCount}/{totalQuestions} Answered
              </span>
            </div>
            <div className="w-full lg:w-72 h-1.5 bg-[#43483f]/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#c6f26a] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>
          </div>

          {/* Timer & Controls */}
          <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
            <div className="flex items-center gap-1.5 bg-[#ffffff]/10 px-3 py-1.5 rounded border border-[#ffffff]/10">
              <Timer className="w-4 h-4 text-[#c6f26a]" />
              <span className="font-mono text-sm tracking-tight font-medium text-white">
                {interview?.timed_mode ? formatTimer(timeRemaining) : formatTimer(timeElapsed)}
              </span>
              <span className="text-[10px] font-mono text-[#80867b]">
                {interview?.timed_mode ? 'left' : 'elapsed'}
              </span>
            </div>

            <button
              onClick={() => setFinishModalOpen(true)}
              className="text-xs font-mono text-[#ffdad6] hover:text-[#ba1a1a] hover:underline transition-all cursor-pointer font-medium"
            >
              Finish Interview
            </button>
          </div>
        </div>

        {/* Question Selector Strip (1 to N) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#2c3328] scrollbar-none">
          {questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const hasAnswer = (answers[q.id] || '').trim().length > 0;
            const isReview = !!markedForReview[q.id];

            let buttonStyle = 'bg-[#2c3328] text-[#80867b] border-[#43483f]/40';
            if (isCurrent) {
              buttonStyle = 'bg-[#c6f26a] text-[#141f00] font-bold border-[#c6f26a] ring-2 ring-white/20';
            } else if (isReview) {
              buttonStyle = 'bg-[#ffdcc1] text-[#9c4300] border-[#9c4300] font-semibold';
            } else if (hasAnswer) {
              buttonStyle = 'bg-[#181d15] text-[#c6f26a] border-[#4b6700] font-medium';
            }

            return (
              <button
                key={q.id || idx}
                onClick={() => goToQuestion(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-mono shrink-0 transition-all cursor-pointer border flex items-center justify-center ${buttonStyle}`}
                title={`Question ${idx + 1}: ${q.topic || ''}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Question Prompt Card */}
      <div className="w-full bg-[#ffffff] border border-[#c6c7c0] rounded-xl p-6 sm:p-8 shadow-xs mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase text-[#454742] font-semibold tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4b6700]"></span>
            <span>Focus Area: {currentQuestion?.topic || 'General Engineering'}</span>
          </span>
          <div className="flex items-center gap-2 text-xs font-mono text-[#767871]">
            <Terminal className="w-3.5 h-3.5" />
            <span>STDIN ACTIVE</span>
          </div>
        </div>

        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#1b1c17] tracking-tight max-w-5xl leading-snug">
          {currentQuestion?.question_text || (currentQuestion?.topic ? `Explain fundamental mechanics, operational constraints, and architectural trade-offs for ${currentQuestion.topic}.` : 'Loading question prompt...')}
        </h2>

        {/* Expected Concepts */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {currentQuestion?.expected_concepts && currentQuestion.expected_concepts.length > 0 ? (
            currentQuestion.expected_concepts.map((concept, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-[#f0eee5] text-[#1b1c17] font-mono text-[11px] rounded border border-[#c6c7c0]"
              >
                {concept}
              </span>
            ))
          ) : (
            <span className="px-2.5 py-1 bg-[#f0eee5] text-[#1b1c17] font-mono text-[11px] rounded border border-[#c6c7c0]">
              Architectural Trade-offs &amp; Edge Cases
            </span>
          )}

          <span className="px-2.5 py-1 bg-[#eae8df] text-[#454742] font-mono text-[11px] rounded ml-auto flex items-center gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4b6700]"></span>
            Rubric: {currentQuestion?.evaluation_rubric || `${(interview?.round_type || 'Technical').toUpperCase()} Senior Analysis`}
          </span>
        </div>
      </div>

      {/* 3. Textarea / Code Editor Workspace */}
      <div className="w-full bg-[#ffffff] border border-[#c6c7c0] rounded-xl shadow-xs overflow-hidden flex flex-col">
        {/* Editor Sub-Header */}
        <div className="flex items-center justify-between bg-[#f6f4eb] px-4 py-2 border-b border-[#c6c7c0]">
          <div className="flex items-center gap-2">
            <button
              onClick={switchToWritten}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'written'
                  ? 'bg-[#ffffff] text-[#1b1c17] shadow-xs border border-[#c6c7c0]'
                  : 'text-[#454742] hover:text-[#1b1c17]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Written Explanation</span>
            </button>
            <button
              onClick={switchToSandbox}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'sandbox'
                  ? 'bg-[#ffffff] text-[#1b1c17] shadow-xs border border-[#c6c7c0]'
                  : 'text-[#454742] hover:text-[#1b1c17]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code / Diagram Sandbox</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-[#767871]">
            <span className="flex items-center gap-1 text-[#4b6700]">
              <CloudCheck className="w-3.5 h-3.5" />
              <span>{savingAnswer ? 'Saving draft...' : 'Answer preserved'}</span>
            </span>
          </div>
        </div>

        {/* Text Area */}
        <div className="relative w-full p-5 bg-[#ffffff]">
          <textarea
            className="w-full bg-transparent text-[#1b1c17] font-body text-sm leading-relaxed outline-none resize-none placeholder:text-[#767871] min-h-[260px]"
            placeholder="Type your response here. Cover real-world mechanics, architectural trade-offs, constraints, and operational mitigation..."
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            onBlur={() => saveCurrentAnswer()}
            rows={12}
          />
        </div>

        {/* Word count & telemetry footer */}
        <div className="bg-[#f6f4eb] px-4 py-3 border-t border-[#c6c7c0] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#1b1c17] font-semibold bg-[#ffffff] px-2 py-0.5 rounded border border-[#c6c7c0]">
              {wordCount} words
            </span>
            <span className="text-xs text-[#767871]">
              {wordCount >= 50
                ? '· Substantive answer depth reached'
                : '· Provide detailed technical mechanics & trade-offs'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#454742]">
            <span>Navigate freely between questions; answers auto-save on change.</span>
          </div>
        </div>
      </div>

      {/* 4. Action Command Bar */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Previous & Mark for Review */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            size="md"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-2 rounded-lg hover:bg-[#f6f4eb] border border-transparent hover:border-[#c6c7c0] transition-all">
            <input
              type="checkbox"
              checked={!!markedForReview[currentQuestion?.id]}
              onChange={toggleMarkForReview}
              className="w-4 h-4 rounded border-[#c6c7c0] text-[#1b1c17] accent-[#1b1c17] cursor-pointer"
            />
            <span className="text-xs text-[#454742] font-medium flex items-center gap-1">
              <Flag className="w-3.5 h-3.5 text-[#9c4300]" />
              <span>Mark for Review</span>
            </span>
          </label>
        </div>

        {/* Right: Next or Submit Final Evaluation */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {currentIndex < totalQuestions - 1 ? (
            <Button
              variant="primary"
              size="md"
              onClick={handleNext}
              className="gap-2 cursor-pointer"
            >
              <span>Next Question</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                saveCurrentAnswer();
                setFinishModalOpen(true);
              }}
              className="gap-2 bg-[#c6f26a] text-[#141f00] font-bold border-[#4b6700] shadow-md cursor-pointer hover:bg-[#abd551]"
            >
              <span>Submit &amp; Evaluate Interview</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 5. Finish Interview Confirmation Modal */}
      {finishModalOpen && (
        <div className="fixed inset-0 bg-[#1b1c17]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#ffffff] border border-[#c6c7c0] rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-display text-xl font-bold text-[#1b1c17] tracking-tight mb-2">
              Ready to Complete Interview?
            </h3>
            <p className="text-xs text-[#454742] leading-relaxed mb-4">
              All your submitted responses will be synthesized into a comprehensive multi-dimensional evaluation report.
            </p>

            <div className="bg-[#f6f4eb] rounded-xl p-4 border border-[#c6c7c0] mb-6 flex flex-col gap-2 font-mono text-xs">
              <div className="flex justify-between text-[#1b1c17]">
                <span>Total Questions:</span>
                <span className="font-bold">{totalQuestions}</span>
              </div>
              <div className="flex justify-between text-[#4b6700]">
                <span>Answered Questions:</span>
                <span className="font-bold">{answeredCount}</span>
              </div>
              <div className="flex justify-between text-[#ba1a1a]">
                <span>Unanswered / Skipped:</span>
                <span className="font-bold">{totalQuestions - answeredCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => setFinishModalOpen(false)}
                className="cursor-pointer"
              >
                Continue Answering
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleFinalSubmit}
                className="cursor-pointer font-bold"
              >
                Submit for Final Evaluation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
