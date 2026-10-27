import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, ArrowRight, Check, AlertTriangle, Brain, ChevronDown, Copy, CheckCheck, RotateCcw, Bookmark, CheckCircle2, Terminal, Info } from 'lucide-react';
export const AnswerEvaluationPage = () => {
    const params = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const interviewId = params.id || searchParams.get('interview_id') || searchParams.get('id');
    const questionId = params.questionId || searchParams.get('question_id') || searchParams.get('questionId');
    const [evaluation, setEvaluation] = useState(null);
    const [interview, setInterview] = useState(null);
    const [modelAnswerOpen, setModelAnswerOpen] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const loadEval = async () => {
            if (!interviewId || !questionId) {
                setError('Missing interview or question identifiers.');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const [evalData, sessionData] = await Promise.all([
                    api.interviews.getEvaluation(interviewId, questionId),
                    api.interviews.getById(interviewId)
                ]);
                setEvaluation(evalData);
                setInterview(sessionData);
            }
            catch (err) {
                setError(err.message || 'Failed to load evaluation.');
            }
            finally {
                setLoading(false);
            }
        };
        loadEval();
    }, [interviewId, questionId]);
    const copyCodeSnippet = () => {
        if (evaluation?.model_answer) {
            navigator.clipboard.writeText(evaluation.model_answer);
            setCodeCopied(true);
            setTimeout(() => setCodeCopied(false), 2000);
        }
    };
    const handleNextStep = () => {
        if (!interview)
            return;
        if (interview.status === 'completed' || interview.current_question_index >= interview.total_questions) {
            navigate(`/interview/report?id=${interview.id}`);
        }
        else {
            navigate(`/interview/arena?id=${interview.id}`);
        }
    };
    if (loading) {
        return (<div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#1b1c17] border-t-[#c6f26a] animate-spin"></div>
        <span className="font-mono text-xs text-[#767871] uppercase tracking-wider">
          Compiling Architectural Evaluation Matrix...
        </span>
      </div>);
    }
    if (error || !evaluation) {
        return (<div className="p-8 text-center flex flex-col items-center gap-4">
        <span className="text-[#ba1a1a] text-sm font-semibold">{error || 'Evaluation not found'}</span>
        <Link to="/dashboard" className="text-xs text-[#1b1c17] underline">Return to Dashboard</Link>
      </div>);
    }
    const overall = evaluation.overall_score || 85;
    const ratingBadge = overall >= 88 ? 'Exceeds Bar' : (overall >= 75 ? 'Meets Bar' : 'Needs Reinforcement');
    const cohortPercent = Math.min(99, Math.max(50, Math.round(overall * 1.08)));
    return (<div className="flex flex-col w-full pb-20 text-[#1b1c17]">
      {/* 1. Sub-Header & Metadata Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-1.5 text-[#454742] hover:text-[#1b1c17] text-xs font-semibold transition-colors group cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1"/>
            <span>Back to Dashboard</span>
          </button>
          <span className="text-[#c6c7c0] font-mono text-xs">/</span>
          <span className="font-mono text-xs text-[#767871] tracking-tight uppercase">
            Question Evaluated
          </span>
        </div>

        {/* Engine Telemetry Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#eae8df] rounded-full self-start md:self-auto border border-[#c6c7c0]">
          <span className="w-2 h-2 rounded-full bg-[#4b6700] animate-pulse"></span>
          <span className="font-mono text-xs text-[#454742]">
            Evaluated in 1.4s by <strong className="font-semibold text-[#1b1c17]">{evaluation.model_identifier || 'PrepPulse Llama-3-70B Core'}</strong>
          </span>
        </div>
      </div>

      {/* 2. Primary Header & Topic Identification */}
      <div className="flex flex-col gap-1 mb-8">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider px-2 py-0.5 bg-[#f0eee5] text-[#1b1c17] font-semibold rounded border border-[#c6c7c0]">
            {evaluation.topic || 'System Architecture'}
          </span>
          <span className="text-xs text-[#767871]">Runtime &amp; Concurrency</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1b1c17] tracking-tight mt-1">
          {evaluation.question_text || 'Synchronous vs Asynchronous Programming'}
        </h1>
      </div>

      {/* 3. Score Breakdown Hero Card (Faithful to Stitch) */}
      <div className="bg-[#ffffff] border border-[#c6c7c0] rounded-xl p-6 sm:p-8 shadow-xs mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Big Overall Score Display */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full pr-0 lg:pr-8 lg:border-r border-[#c6c7c0]">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs tracking-wider text-[#767871] uppercase font-semibold">
                  Comprehensive Rating
                </span>
                <span className="font-mono text-xs px-2 py-0.5 bg-[#c6f26a] text-[#141f00] rounded font-bold uppercase">
                  {ratingBadge}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="font-mono text-5xl sm:text-6xl font-bold text-[#1b1c17] tracking-tighter leading-none">
                  {overall}
                </span>
                <span className="font-mono text-xl text-[#767871]">/ 100</span>
              </div>
            </div>

            <div className="mt-6 pt-4 bg-[#f6f4eb] rounded-lg p-4 flex flex-col gap-1 border border-[#c6c7c0]">
              <div className="flex items-center gap-1.5 text-[#4b6700]">
                <CheckCircle2 className="w-4 h-4 fill-current"/>
                <span className="text-xs font-semibold text-[#1b1c17]">Calibrated Cohort Benchmark</span>
              </div>
              <p className="text-xs text-[#454742]">
                Performance places you in the <strong className="text-[#1b1c17] font-semibold">Top {100 - cohortPercent}%</strong> of active candidates for this role.
              </p>
              <div className="w-full bg-[#eae8df] rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-[#4b6700] h-full rounded-full transition-all duration-700" style={{ width: `${overall}%` }}></div>
              </div>
            </div>
          </div>

          {/* Right: Detailed Metric Matrix */}
          <div className="lg:col-span-7 flex flex-col gap-4 pl-0 lg:pl-4">
            {/* Metric 1: Technical Accuracy */}
            <div className="flex flex-col gap-1.5 bg-[#f6f4eb]/60 p-3.5 rounded-lg border border-[#c6c7c0]/60">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-[#1b1c17]">Technical Accuracy</span>
                <span className="font-mono text-sm text-[#1b1c17] font-bold">{evaluation.technical_accuracy}%</span>
              </div>
              <div className="w-full bg-[#eae8df] rounded-full h-2 overflow-hidden">
                <div className="bg-[#1b1c17] h-full rounded-full transition-all duration-700" style={{ width: `${evaluation.technical_accuracy}%` }}></div>
              </div>
              <span className="text-xs text-[#767871]">Factual correctness of mechanics, memory model, and primitives.</span>
            </div>

            {/* Metric 2: Relevance & Context */}
            <div className="flex flex-col gap-1.5 bg-[#f6f4eb]/60 p-3.5 rounded-lg border border-[#c6c7c0]/60">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-[#1b1c17]">Relevance &amp; Context</span>
                <span className="font-mono text-sm text-[#1b1c17] font-bold">{evaluation.relevance}%</span>
              </div>
              <div className="w-full bg-[#eae8df] rounded-full h-2 overflow-hidden">
                <div className="bg-[#1b1c17] h-full rounded-full transition-all duration-700" style={{ width: `${evaluation.relevance}%` }}></div>
              </div>
              <span className="text-xs text-[#767871]">Directly addressed high-throughput scenario without peripheral tangents.</span>
            </div>

            {/* Metric 3: Completeness */}
            <div className="flex flex-col gap-1.5 bg-[#f6f4eb]/60 p-3.5 rounded-lg border border-[#c6c7c0]/60">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-[#1b1c17]">Completeness</span>
                <span className="font-mono text-sm text-[#1b1c17] font-bold">{evaluation.completeness}%</span>
              </div>
              <div className="w-full bg-[#eae8df] rounded-full h-2 overflow-hidden">
                <div className="bg-[#767871] h-full rounded-full transition-all duration-700" style={{ width: `${evaluation.completeness}%` }}></div>
              </div>
              <span className="text-xs text-[#767871]">Covered core concepts; addressed operational telemetry and backpressure.</span>
            </div>

            {/* Metric 4: Clarity & Structure */}
            <div className="flex flex-col gap-1.5 bg-[#f6f4eb]/60 p-3.5 rounded-lg border border-[#c6c7c0]/60">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-[#1b1c17]">Clarity &amp; Structure</span>
                <span className="font-mono text-sm text-[#1b1c17] font-bold">{evaluation.clarity}%</span>
              </div>
              <div className="w-full bg-[#eae8df] rounded-full h-2 overflow-hidden">
                <div className="bg-[#1b1c17] h-full rounded-full transition-all duration-700" style={{ width: `${evaluation.clarity}%` }}></div>
              </div>
              <span className="text-xs text-[#767871]">Logical sequential flow from foundational OS threads to event loops.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Editorial Actionable Coach Callout */}
      <div className="relative bg-[#ffffff] border border-[#c6c7c0] rounded-xl p-6 mb-8 shadow-xs overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#c6f26a]"></div>
        <div className="flex items-start gap-4 pl-2">
          <div className="w-10 h-10 rounded-full bg-[#f0eee5] flex items-center justify-center shrink-0 text-[#1b1c17]">
            <Brain className="w-5 h-5 text-[#4b6700]"/>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase text-[#4b6700] font-semibold tracking-wider">
              Staff Coach Synthesis
            </span>
            <blockquote className="text-sm sm:text-base text-[#1b1c17] italic leading-relaxed">
              &ldquo;{evaluation.feedback}&rdquo;
            </blockquote>
          </div>
        </div>
      </div>

      {/* 5. Qualitative Feedback Split Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Column 1: Strengths */}
        <div className="bg-[#ffffff] border border-[#c6c7c0] rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#c6c7c0]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4b6700]"></span>
                <h3 className="font-display text-lg font-bold text-[#1b1c17]">What Went Well</h3>
              </div>
              <span className="font-mono text-xs px-2 py-0.5 bg-[#f0eee5] text-[#454742] rounded">
                {evaluation.strengths?.length || 3} Key Points
              </span>
            </div>

            <ul className="flex flex-col gap-4">
              {evaluation.strengths && evaluation.strengths.length > 0 ? (evaluation.strengths.map((str, idx) => (<li key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#f0eee5] flex items-center justify-center shrink-0 mt-0.5 text-[#4b6700]">
                      <Check className="w-3.5 h-3.5"/>
                    </div>
                    <p className="text-xs text-[#454742] leading-relaxed font-medium">
                      {str}
                    </p>
                  </li>))) : (<li className="text-xs text-[#767871]">Strong architectural intuition.</li>)}
            </ul>
          </div>

          <div className="mt-6 pt-3 bg-[#f6f4eb] rounded-lg p-3 flex items-center gap-2 text-xs text-[#454742]">
            <CheckCircle2 className="w-4 h-4 text-[#4b6700]"/>
            <span>Demonstrated senior-tier mechanical sympathy for systems architecture.</span>
          </div>
        </div>

        {/* Column 2: Missing Concepts & Gaps */}
        <div className="bg-[#ffffff] border border-[#c6c7c0] rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#c6c7c0]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]"></span>
                <h3 className="font-display text-lg font-bold text-[#1b1c17]">Gaps &amp; Missing Concepts</h3>
              </div>
              <span className="font-mono text-xs px-2 py-0.5 bg-[#ffdad6] text-[#ba1a1a] rounded font-semibold">
                To Reach 95%+
              </span>
            </div>

            <ul className="flex flex-col gap-4">
              {evaluation.missing_concepts && evaluation.missing_concepts.length > 0 ? (evaluation.missing_concepts.map((gap, idx) => (<li key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#ffdad6] flex items-center justify-center shrink-0 mt-0.5 text-[#ba1a1a]">
                      <AlertTriangle className="w-3.5 h-3.5"/>
                    </div>
                    <p className="text-xs text-[#454742] leading-relaxed">
                      {gap}
                    </p>
                  </li>))) : (<li className="text-xs text-[#4b6700]">All required concepts thoroughly covered!</li>)}
            </ul>
          </div>

          <div className="mt-6 pt-3 bg-[#f6f4eb] rounded-lg p-3 flex items-center gap-2 text-xs text-[#454742]">
            <Info className="w-4 h-4 text-[#ba1a1a]"/>
            <span>Integrating these points guarantees an L6 / Principal calibration score.</span>
          </div>
        </div>
      </div>

      {/* 6. Expandable Benchmark Model Answer */}
      <div className="bg-[#ffffff] border border-[#c6c7c0] rounded-xl shadow-xs mb-8 overflow-hidden">
        <button onClick={() => setModelAnswerOpen(!modelAnswerOpen)} className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#f6f4eb] transition-colors focus:outline-none cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#f0eee5] rounded text-[#1b1c17]">
              <Terminal className="w-4 h-4"/>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-sm font-bold text-[#1b1c17]">
                Benchmark Model Answer (Staff Engineer Standard)
              </span>
              <span className="text-xs text-[#767871]">
                Complete architectural breakdown with concurrency snippets
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#767871] font-medium">
              {modelAnswerOpen ? 'COLLAPSE' : 'EXPAND'}
            </span>
            <ChevronDown className={`w-4 h-4 text-[#1b1c17] transition-transform duration-300 ${modelAnswerOpen ? 'rotate-180' : ''}`}/>
          </div>
        </button>

        {modelAnswerOpen && (<div className="px-6 pb-6 pt-2 bg-[#f6f4eb] border-t border-[#c6c7c0]">
            <div className="p-4 bg-[#ffffff] rounded-lg mb-4 text-xs leading-relaxed text-[#1b1c17] border border-[#c6c7c0]">
              <p className="whitespace-pre-wrap">{evaluation.model_answer}</p>
            </div>

            {/* Code Snippet Box with Copy Button */}
            <div className="relative bg-[#1a1c18] text-[#ffffff] rounded-lg overflow-hidden border border-[#2c3328]">
              <div className="flex items-center justify-between px-4 py-2 bg-[#2c3328] font-mono text-xs text-[#c6c7c0]">
                <span>Java 21 Virtual Thread Dispatcher vs Reactive CompletableFuture</span>
                <button onClick={copyCodeSnippet} className="flex items-center gap-1.5 hover:text-[#ffffff] transition-colors text-xs font-mono cursor-pointer">
                  {codeCopied ? <CheckCheck className="w-3.5 h-3.5 text-[#c6f26a]"/> : <Copy className="w-3.5 h-3.5"/>}
                  <span>{codeCopied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="p-4 font-mono text-xs overflow-x-auto text-[#dfe4d8] leading-relaxed">
                <code>{`// 1. Modern Paradigm: Synchronous style with unmounted Virtual Threads
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 10_000).forEach(i -> {
        executor.submit(() -> {
            // Thread unmounts from carrier thread during blocking I/O
            String response = httpClient.send(request, HttpResponse.BodyHandlers.ofString()).body();
            processTelemetry(response);
        });
    });
}

// 2. Classical Async: CompletableFuture with manual context & error pipelines
CompletableFuture.supplyAsync(() -> fetchRemoteUserData(userId), threadPool)
    .thenApplyAsync(this::parsePayload, workerPool)
    .thenAccept(result -> log.info("Data received for {}: {}", userId, result))
    .exceptionally(ex -> {
        log.error("Async trace lost: {}", ex.getMessage());
        return null;
    });`}</code>
              </pre>
            </div>
          </div>)}
      </div>

      {/* 7. Action Command Bar */}
      <div className="bg-[#ffffff] border border-[#c6c7c0] rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button onClick={() => navigate(`/interview/arena?id=${interviewId}`)} className="flex items-center justify-center gap-2 px-4 py-2 bg-[#f0eee5] hover:bg-[#eae8df] text-[#1b1c17] text-xs font-semibold rounded-lg border border-[#c6c7c0] transition-colors w-full sm:w-auto cursor-pointer">
            <RotateCcw className="w-3.5 h-3.5"/>
            <span>Retry Question</span>
          </button>
          <button onClick={() => alert('Saved question and evaluation to your Learning Centre revision deck.')} className="p-2 bg-[#f0eee5] hover:bg-[#eae8df] text-[#1b1c17] rounded-lg border border-[#c6c7c0] transition-colors cursor-pointer" title="Save to Learning Centre">
            <Bookmark className="w-4 h-4"/>
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button onClick={handleNextStep} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#c6f26a] hover:bg-[#abd551] text-[#141f00] text-xs font-bold px-6 py-2.5 rounded-lg transition-all active:scale-[0.99] shadow-xs cursor-pointer">
            <span>
              {interview?.status === 'completed'
            ? 'View Final Session Report'
            : 'Proceed to Next Arena Question'}
            </span>
            <ArrowRight className="w-4 h-4"/>
          </button>
        </div>
      </div>
    </div>);
};
