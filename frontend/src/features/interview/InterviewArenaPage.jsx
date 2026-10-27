import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Terminal, Timer, CheckCircle2, Code2, FileText, CloudCheck, Lightbulb, ArrowRight, AlertCircle } from 'lucide-react';
export const InterviewArenaPage = () => {
    const params = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const interviewIdParam = params.id || searchParams.get('id') || searchParams.get('interview_id');
    const [interview, setInterview] = useState(null);
    const [question, setQuestion] = useState(null);
    const [answerText, setAnswerText] = useState('');
    const [activeTab, setActiveTab] = useState('written');
    const [timeRemaining, setTimeRemaining] = useState(522); // 8m 42s default
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [markedForReview, setMarkedForReview] = useState(false);
    const timeRemainingRef = React.useRef(timeRemaining);
    React.useEffect(() => {
        timeRemainingRef.current = timeRemaining;
    }, [timeRemaining]);
    // Load session or active session
    useEffect(() => {
        const loadSession = async () => {
            try {
                setLoading(true);
                let session = null;
                if (interviewIdParam) {
                    session = await api.interviews.getById(interviewIdParam);
                }
                else {
                    session = await api.interviews.getActive();
                    if (!session) {
                        // No active session -> redirect to setup
                        navigate('/interview/setup');
                        return;
                    }
                }
                if (session.status === 'completed') {
                    navigate(`/interview/${session.id}/report`);
                    return;
                }
                setInterview(session);
                if (session.time_limit_mins) {
                    setTimeRemaining(session.time_limit_mins * 60);
                }
                if (session.current_question) {
                    setQuestion(session.current_question);
                }
            }
            catch (err) {
                setError(err.message || 'Failed to load interview arena session.');
            }
            finally {
                setLoading(false);
            }
        };
        loadSession();
    }, [interviewIdParam, navigate]);
    // Countdown timer
    useEffect(() => {
        if (!interview?.timed_mode || timeRemaining <= 0)
            return;
        const interval = setInterval(() => {
            setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [interview, timeRemaining]);
    // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to submit
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                handleSubmitAnswer();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [answerText, question, interview]);
    const formatTimer = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };
    const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;
    const handleSubmitAnswer = async () => {
        if (!interview || !question)
            return;
        if (answerText.trim().length < 10) {
            setError('Please provide a substantive architectural response before evaluating.');
            return;
        }
        try {
            setSubmitting(true);
            setError(null);
            const totalSeconds = (interview.time_limit_mins ? interview.time_limit_mins * 60 : 600);
            const elapsedSeconds = Math.max(5, totalSeconds - timeRemainingRef.current);
            const evaluation = await api.interviews.submitAnswer(interview.id, question.id, answerText, elapsedSeconds);
            // Navigate to evaluation screen
            navigate(`/interview/${interview.id}/evaluation/${question.id}`);
        }
        catch (err) {
            setError(err.message || 'Failed to submit and evaluate answer.');
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleSkipQuestion = async () => {
        if (!interview)
            return;
        try {
            setLoading(true);
            const updated = await api.interviews.skip(interview.id);
            if (updated.status === 'completed') {
                navigate(`/interview/${interview.id}/report`);
            }
            else {
                setInterview(updated);
                setQuestion(updated.current_question || null);
                setAnswerText('');
            }
        }
        catch (err) {
            setError(err.message || 'Could not skip question.');
        }
        finally {
            setLoading(false);
        }
    };
    const handleEndSession = async () => {
        if (!interview)
            return;
        if (confirm('Are you sure you want to end this interview session? Your answered questions will be evaluated into a report.')) {
            try {
                await api.interviews.end(interview.id);
                navigate(`/interview/${interview.id}/report`);
            }
            catch (err) {
                setError(err.message || 'Failed to end session.');
            }
        }
    };
    const switchToSandbox = () => {
        setActiveTab('sandbox');
        if (!answerText.includes('class') && !answerText.includes('void main')) {
            setAnswerText(`// Java 21 Virtual Threads & Multiplexing Sandbox
public class IngressRouter {
    public static void main(String[] args) {
        try (var executor = java.util.concurrent.Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 10_000; i++) {
                final int id = i;
                executor.submit(() -> handleRequest(id));
            }
        }
    }

    static void handleRequest(int id) {
        // Non-blocking simulated I/O
        java.util.concurrent.locks.LockSupport.parkNanos(1_000_000L);
    }
}`);
        }
    };
    const switchToWritten = () => {
        setActiveTab('written');
    };
    if (loading) {
        return (<div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#1b1c17] border-t-[#c6f26a] animate-spin"></div>
        <span className="font-mono text-xs text-[#767871] uppercase tracking-wider">
          Initializing Arena Telemetry Stream...
        </span>
      </div>);
    }
    const currentOrder = question?.order || 1;
    const totalQuestions = interview?.total_questions || 5;
    const progressPct = Math.round((currentOrder / totalQuestions) * 100);
    return (<div className="flex flex-col w-full pb-16 text-[#1b1c17]">
      {error && (<div className="mb-4 p-3.5 bg-[#ffdad6] border border-[#ba1a1a]/40 text-[#93000a] text-xs rounded-xl font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0"/>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="font-mono text-xs uppercase underline">Dismiss</button>
        </div>)}

      {/* 1. Top Cockpit Banner (Faithful to Stitch design) */}
      <div className="w-full bg-[#1a1c18] text-[#ffffff] rounded-xl p-4 sm:p-5 shadow-xl flex flex-col gap-4 mb-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-[#181d15] text-[#dfe4d8] text-[11px] font-mono uppercase tracking-wider rounded border border-[#2c3328]">
              {interview?.job_role || 'Senior Backend Engineer (L5)'}
            </span>
            <span className="px-3 py-1 bg-[#2c3328] text-[#c6c7c0] text-[11px] font-mono tracking-normal rounded">
              {interview?.interview_type === 'technical' ? 'Technical Deep-Dive' : 'System Design'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2c3328] text-[#c6f26a] text-[11px] font-mono rounded font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c6f26a]"></span>
              {interview?.difficulty?.toUpperCase() || 'SENIOR'} · Level 4/5
            </span>
          </div>

          {/* Progress Segment Bar */}
          <div className="flex flex-col items-center gap-1.5 w-full lg:w-auto">
            <div className="flex items-center justify-between w-full lg:w-72">
              <span className="text-[11px] font-mono text-[#80867b] uppercase tracking-wider">
                Question {String(currentOrder).padStart(2, '0')} of {String(totalQuestions).padStart(2, '0')}
              </span>
              <span className="text-[11px] font-mono text-[#c6f26a] font-semibold">
                {progressPct}% Complete
              </span>
            </div>
            <div className="grid grid-cols-10 gap-1 w-full lg:w-72 h-1.5">
              {Array.from({ length: 10 }).map((_, i) => {
            const step = (i + 1) * 10;
            const isPassed = step < progressPct;
            const isCurrent = step === progressPct || (i === 0 && progressPct <= 10);
            return (<div key={i} className={`rounded-xs transition-all ${isPassed
                    ? 'bg-[#c6f26a]'
                    : isCurrent
                        ? 'bg-[#c6f26a] animate-pulse'
                        : 'bg-[#43483f]/40'}`}/>);
        })}
            </div>
          </div>

          {/* Timer & Controls */}
          <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
            <div className="flex items-center gap-1.5 bg-[#ffffff]/10 px-3 py-1.5 rounded border border-[#ffffff]/10">
              <Timer className="w-4 h-4 text-[#c6f26a]"/>
              <span className="font-mono text-sm tracking-tight font-medium text-white">
                {formatTimer(timeRemaining)}
              </span>
              <span className="text-[10px] font-mono text-[#80867b]">left</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#80867b]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#c6f26a]"></span>
              <span>Active</span>
            </div>
            <button onClick={handleEndSession} className="text-xs font-mono text-[#ffdad6] hover:text-[#ba1a1a] hover:underline transition-all cursor-pointer">
              End Session
            </button>
          </div>
        </div>
      </div>

      {/* 2. Architecture Prompt Card */}
      <div className="w-full bg-[#ffffff] border border-[#c6c7c0] rounded-xl p-6 sm:p-8 shadow-xs mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase text-[#454742] font-semibold tracking-wider">
            Architecture Prompt // {question?.topic || 'Concurrency & I/O Subsystems'}
          </span>
          <div className="flex items-center gap-1 text-xs font-mono text-[#767871]">
            <Terminal className="w-3.5 h-3.5"/>
            <span>STDIN MODE</span>
          </div>
        </div>

        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#1b1c17] tracking-tight max-w-5xl leading-snug">
          {question?.question_text ||
            'Explain the difference between synchronous and asynchronous programming. Give a practical example in a high-throughput backend service, and discuss how threads and I/O multiplexing behave in each model.'}
        </h2>

        {/* Expected Concept Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {question?.expected_concepts && question.expected_concepts.length > 0 ? (question.expected_concepts.map((concept, idx) => (<span key={idx} className="px-2.5 py-1 bg-[#f0eee5] text-[#1b1c17] font-mono text-[11px] rounded border border-[#c6c7c0]">
                {concept}
              </span>))) : (<>
              <span className="px-2.5 py-1 bg-[#f0eee5] text-[#1b1c17] font-mono text-[11px] rounded border border-[#c6c7c0]">Java NIO</span>
              <span className="px-2.5 py-1 bg-[#f0eee5] text-[#1b1c17] font-mono text-[11px] rounded border border-[#c6c7c0]">Concurrency</span>
              <span className="px-2.5 py-1 bg-[#f0eee5] text-[#1b1c17] font-mono text-[11px] rounded border border-[#c6c7c0]">Throughput vs Latency</span>
              <span className="px-2.5 py-1 bg-[#f0eee5] text-[#1b1c17] font-mono text-[11px] rounded border border-[#c6c7c0]">Event Loop</span>
            </>)}

          <span className="px-2.5 py-1 bg-[#eae8df] text-[#454742] font-mono text-[11px] rounded ml-auto flex items-center gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4b6700]"></span>
            Expected Depth: Architectural Trade-offs
          </span>
        </div>
      </div>

      {/* 3. Textarea / Code Sandbox Workspace */}
      <div className="w-full bg-[#ffffff] border border-[#c6c7c0] rounded-xl shadow-xs overflow-hidden flex flex-col">
        {/* Editor Sub-Header Tabs */}
        <div className="flex items-center justify-between bg-[#f6f4eb] px-4 py-2 border-b border-[#c6c7c0]">
          <div className="flex items-center gap-2">
            <button onClick={switchToWritten} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${activeTab === 'written'
            ? 'bg-[#ffffff] text-[#1b1c17] shadow-xs border border-[#c6c7c0]'
            : 'text-[#454742] hover:text-[#1b1c17]'}`}>
              <FileText className="w-3.5 h-3.5"/>
              <span>Written Explanation (Markdown)</span>
            </button>
            <button onClick={switchToSandbox} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${activeTab === 'sandbox'
            ? 'bg-[#ffffff] text-[#1b1c17] shadow-xs border border-[#c6c7c0]'
            : 'text-[#454742] hover:text-[#1b1c17]'}`}>
              <Code2 className="w-3.5 h-3.5"/>
              <span>Code Sandbox (Java 21)</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-[#767871]">
            <span className="flex items-center gap-1 text-[#4b6700]">
              <CloudCheck className="w-3.5 h-3.5"/>
              <span>Session persisted</span>
            </span>
          </div>
        </div>

        {/* Text Area */}
        <div className="relative w-full p-5 bg-[#ffffff]">
          <textarea className="w-full bg-transparent text-[#1b1c17] font-body text-sm leading-relaxed outline-none resize-none placeholder:text-[#767871] min-h-[260px]" placeholder="Synthesize your architectural analysis or code implementation..." value={answerText} onChange={(e) => setAnswerText(e.target.value)} rows={12}/>
        </div>

        {/* Telemetry Footer */}
        <div className="bg-[#f6f4eb] px-4 py-3 border-t border-[#c6c7c0] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#1b1c17] font-semibold bg-[#ffffff] px-2 py-0.5 rounded border border-[#c6c7c0]">
              {wordCount} words
            </span>
            <span className="text-xs text-[#767871]">
              {wordCount > 60
            ? '· Comprehensive answer length reached'
            : '· Provide detailed technical mechanics'}
            </span>
          </div>

          {/* Detected Signal Chips matching Stitch design */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-mono text-[#767871] mr-1">Detected Signals:</span>
            {['Synchronous blocking', 'Non-blocking I/O', 'Thread overhead', 'Event loop / Epoll'].map((sig, i) => (<span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#ffffff] text-[#4b6700] font-mono text-[10px] rounded border border-[#c6c7c0] font-medium">
                <CheckCircle2 className="w-2.5 h-2.5 text-[#4b6700]"/>
                {sig}
              </span>))}
          </div>
        </div>
      </div>

      {/* 4. Action Command Bar */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button onClick={handleSkipQuestion} className="px-4 py-2 text-[#454742] hover:text-[#1b1c17] text-xs font-semibold transition-colors cursor-pointer">
            Skip Question
          </button>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={markedForReview} onChange={(e) => setMarkedForReview(e.target.checked)} className="w-4 h-4 rounded border-[#c6c7c0] text-[#1b1c17] accent-[#1b1c17]"/>
            <span className="text-xs text-[#454742] font-medium">Mark for Review</span>
          </label>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button type="button" className="flex items-center gap-1.5 px-4 py-2 bg-[#f0eee5] hover:bg-[#eae8df] text-[#1b1c17] text-xs font-semibold rounded-lg border border-[#c6c7c0] transition-colors cursor-pointer" onClick={() => alert('Hint: Contrast kernel threads consuming memory stacks against non-blocking event loops using epoll, or mention Java 21 Virtual Threads unmounting during I/O.')}>
            <Lightbulb className="w-3.5 h-3.5 text-[#4b6700]"/>
            <span>Hints (1 remaining)</span>
          </button>

          <button onClick={handleSubmitAnswer} disabled={submitting} className="flex items-center gap-2 bg-[#c6f26a] hover:bg-[#abd551] text-[#141f00] font-semibold text-xs px-6 py-2.5 rounded-lg transition-all active:scale-[0.99] shadow-xs cursor-pointer disabled:opacity-50">
            {submitting ? (<span>Evaluating through LangGraph...</span>) : (<>
                <span>Submit Answer &amp; Evaluate</span>
                <ArrowRight className="w-4 h-4"/>
                <span className="ml-1 px-1.5 py-0.5 bg-black/10 text-[#141f00] font-mono text-[10px] rounded">
                  ⌘+Enter
                </span>
              </>)}
          </button>
        </div>
      </div>
    </div>);
};
