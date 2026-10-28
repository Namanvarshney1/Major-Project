import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  Printer,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  Layers,
  ArrowLeft,
  RotateCcw,
  ShieldCheck,
  Target,
  BookOpen,
  Award,
  FileText,
  Clock,
  Compass
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';

export const FinalReportPage = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = params.id || searchParams.get('id') || searchParams.get('interview_id');

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        let targetId = id;

        if (!targetId) {
          const historyData = await api.history.list({ limit: 1 });
          if (historyData?.items && historyData.items.length > 0) {
            targetId = historyData.items[0].id;
          } else {
            setError('No interview session found to generate a report.');
            setLoading(false);
            return;
          }
        }

        const data = await api.interviews.getReport(targetId);
        setReport(data);
      } catch (err) {
        console.error('Failed to load final report:', err);
        setError(err.message || 'Unable to retrieve interview debrief.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const handleRetryEvaluation = async () => {
    if (!report?.interview_id && !id) return;
    const targetId = report?.interview_id || id;
    try {
      setRetrying(true);
      setError(null);
      const updated = await api.interviews.retryEvaluation(targetId);
      setReport(updated);
    } catch (err) {
      console.error('Retry evaluation failed:', err);
      setError(err.message || 'Retry evaluation failed.');
    } finally {
      setRetrying(false);
    }
  };

  const toggleQuestionExpand = (qId) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="w-12 h-12 border-3 border-[#1b1c17] border-t-[#c6f26a] rounded-full animate-spin" />
        <p className="font-mono text-xs uppercase tracking-widest text-[#767871]">
          Synthesizing Multi-Dimensional Debrief &amp; Metric Analysis...
        </p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-[#ffffff] border border-[#c6c7c0] rounded-2xl text-center shadow-lg">
        <AlertTriangle className="w-12 h-12 text-[#ba1a1a] mx-auto mb-4" />
        <h2 className="text-xl font-bold tracking-tight mb-2 text-[#1b1c17]">Report Unavailable</h2>
        <p className="text-xs text-[#454742] mb-6 font-mono leading-relaxed">{error || 'Session report not found.'}</p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={handleRetryEvaluation} variant="outline" size="sm" disabled={retrying}>
            {retrying ? 'Retrying...' : 'Retry Evaluation'}
          </Button>
          <Button onClick={() => navigate('/dashboard')} variant="primary" size="sm">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const overall = Math.round(report.overall_score || 0);
  const scoreBadgeColor =
    overall >= 85
      ? 'bg-[#c6f26a] text-[#141f00]'
      : overall >= 70
      ? 'bg-[#f0eee5] text-[#1b1c17]'
      : 'bg-[#ffdad6] text-[#93000a]';

  const roundName = report.round_type || report.interview_type || 'Technical';
  const detailedQuestions = report.detailed_questions || report.evaluations || [];
  const roundAssessment = report.round_specific_assessment || {};
  const readiness = report.readiness_assessment || {};
  const improvementPlan = report.actionable_improvement_plan || {};

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 print:p-0 print:space-y-4 text-[#1b1c17]">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#c6c7c0] pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            to="/history"
            className="p-2 rounded-lg hover:bg-[#f6f4eb] text-[#454742] transition-colors border border-transparent hover:border-[#c6c7c0]"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#4b6700] font-bold">
                Debrief &amp; Comprehensive Diagnostic Report
              </span>
              <span className="text-xs text-[#c6c7c0]">•</span>
              <span className="font-mono text-[10px] text-[#767871] uppercase">
                ID: {report.interview_id?.slice(-8) || id?.slice(-8) || 'SESSION'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight capitalize mt-0.5">
              {report.job_role} • {roundName} Round ({report.difficulty})
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetryEvaluation}
            disabled={retrying}
            className="gap-2 cursor-pointer text-xs"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
            <span>{retrying ? 'Synthesizing...' : 'Retry Evaluation'}</span>
          </Button>

          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 cursor-pointer text-xs">
            <Printer className="w-3.5 h-3.5" />
            <span>Export / Print</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="gap-2 cursor-pointer text-xs"
          >
            <span>Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* SECTION 1: Overall Score & Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#ffffff] border border-[#c6c7c0] rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="md:col-span-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#e4e3da] pb-6 md:pb-0 md:pr-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="lime" className="font-mono text-[10px] uppercase tracking-wider font-bold">
                {roundName} Round
              </Badge>
              <Badge variant="gray" className="font-mono text-[10px] uppercase font-bold tracking-wider">
                +{report.xp_earned || overall * 10} XP EARNED
              </Badge>
            </div>

            <div className="flex items-baseline gap-3 my-2">
              <span className="text-6xl font-black tracking-tighter text-[#1b1c17]">
                {overall}
              </span>
              <span className="text-sm font-mono text-[#767871]">/ 100 Composite</span>
            </div>

            <div className="inline-block mt-1">
              <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase ${scoreBadgeColor}`}>
                {readiness?.readiness_level || (overall >= 80 ? 'Interview Ready' : 'Developing')}
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#e4e3da] text-xs font-mono text-[#767871] space-y-1.5">
            <div className="flex justify-between">
              <span>Total Configured:</span>
              <span className="font-bold text-[#1b1c17]">{report.total_questions || detailedQuestions.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Answered:</span>
              <span className="font-bold text-[#4b6700]">{report.answered_questions ?? detailedQuestions.filter(q => q.candidate_answer && !q.candidate_answer.includes('No answer')).length}</span>
            </div>
            <div className="flex justify-between">
              <span>Unanswered / Skipped:</span>
              <span className="font-bold text-[#ba1a1a]">{(report.unanswered_questions ?? report.skipped_questions) ?? ((report.total_questions || detailedQuestions.length) - (report.answered_questions || 0))}</span>
            </div>
            <div className="flex justify-between">
              <span>Seniority Target:</span>
              <span className="font-bold text-[#1b1c17] uppercase">{report.difficulty}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-[#e4e3da]/60">
              <span>Evaluation Status:</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#4b6700] bg-[#f0eee5] px-2 py-0.5 rounded border border-[#c6c7c0] uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4b6700]"></span>
                {report.evaluation_status || 'COMPLETED'}
              </span>
            </div>
          </div>
        </div>

        {/* Performance Summary & Score Explanation */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-4">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-[#454742] font-semibold flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#4b6700]" />
              <span>01 // Performance Summary &amp; Score Calibration</span>
            </span>
            <p className="text-sm font-body leading-relaxed text-[#1b1c17] font-medium">
              {report.performance_summary ||
                `Completed a comprehensive ${report.total_questions || detailedQuestions.length}-question ${roundName} evaluation. Overall performance achieved ${overall}/100.`}
            </p>
          </div>

          <div className="bg-[#f6f4eb] p-4 rounded-xl border border-[#c6c7c0] text-xs text-[#454742] leading-relaxed font-mono">
            <span className="font-bold text-[#1b1c17] block mb-1">Score Explanation:</span>
            {report.score_explanation ||
              `The composite score reflects factual correctness, structured communication, concept coverage, and practical depth against ${report.difficulty.toUpperCase()} industry standards.`}
          </div>
        </div>
      </div>

      {/* SECTION 2: Round-Specific Assessment */}
      {roundAssessment && (
        <Card className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-[#c6c7c0] pb-3">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#1b1c17]">
                02 // Round-Specific Assessment Matrix ({roundName.toUpperCase()})
              </span>
              <p className="text-xs text-[#767871] mt-0.5">
                Evaluation dimensions tailored to {roundName} criteria
              </p>
            </div>
            <Badge variant="lime">Calibrated</Badge>
          </div>

          {roundAssessment.summary && (
            <p className="text-xs text-[#454742] leading-relaxed bg-[#f6f4eb] p-3 rounded-lg border border-[#c6c7c0]">
              {roundAssessment.summary}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {['dimension_1', 'dimension_2', 'dimension_3', 'dimension_4'].map((dimKey, idx) => {
              const dim = roundAssessment[dimKey];
              if (!dim) return null;
              return (
                <div key={idx} className="bg-[#f6f4eb] border border-[#c6c7c0] p-4 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-[11px] text-[#767871] uppercase tracking-wider block mb-1">
                      {dim.name}
                    </span>
                    <span className="text-2xl font-black text-[#1b1c17]">
                      {Math.round(dim.score || overall)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-[#454742] leading-snug mt-3">
                    {dim.description}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* SECTION 3: Question-by-Question Feedback */}
      <Card className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-[#c6c7c0] pb-3">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#1b1c17]">
              03 // Question-by-Question Feedback &amp; Benchmark Answers
            </span>
            <p className="text-xs text-[#767871] mt-0.5">
              Detailed breakdown of answers, missing concepts, concrete suggestions, and model standards
            </p>
          </div>
          <span className="font-mono text-xs text-[#767871]">
            {detailedQuestions.length} Questions Evaluated
          </span>
        </div>

        <div className="space-y-4">
          {detailedQuestions.map((q, idx) => {
            const qId = q.question_id || q.id || idx;
            const isExpanded = !!expandedQuestions[qId];
            const qScore = Math.round(q.score || q.overall_score || 0);

            return (
              <div
                key={qId}
                className="border border-[#c6c7c0] rounded-xl overflow-hidden bg-[#ffffff] transition-all"
              >
                {/* Question Header Accordion Trigger */}
                <button
                  type="button"
                  onClick={() => toggleQuestionExpand(qId)}
                  className="w-full p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 text-left hover:bg-[#f6f4eb]/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-[#1b1c17] text-[#c6f26a] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {q.order || idx + 1}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] uppercase font-bold text-[#4b6700] bg-[#f0eee5] px-2 py-0.5 rounded border border-[#c6c7c0]">
                          {q.topic || 'General'}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-[#1b1c17]">
                          Score: {qScore}/100
                        </span>
                        {q.candidate_answer && !q.candidate_answer.includes('No answer submitted') && !q.candidate_answer.includes('Skipped') ? (
                          <span className="font-mono text-[10px] font-semibold text-[#4b6700] bg-[#eef7db] px-2 py-0.5 rounded border border-[#c6f26a]">
                            Answered
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] font-semibold text-[#93000a] bg-[#ffdad6] px-2 py-0.5 rounded border border-[#ba1a1a]/30">
                            Skipped (0 pts)
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-[#1b1c17] line-clamp-2">
                        {q.question_text}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono text-[#767871] hidden sm:inline">
                      {isExpanded ? 'Hide Analysis' : 'View Analysis'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#1b1c17]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#1b1c17]" />
                    )}
                  </div>
                </button>

                {/* Expanded Question Content */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 border-t border-[#e4e3da] bg-[#fbf9f0]/40 space-y-5">
                    {/* Candidate Answer */}
                    <div className="space-y-1.5">
                      <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-[#454742]">
                        Candidate Submitted Response:
                      </span>
                      <div className="p-3.5 bg-[#ffffff] rounded-lg border border-[#c6c7c0] text-xs font-body text-[#1b1c17] leading-relaxed whitespace-pre-wrap">
                        {q.candidate_answer || '(No answer provided)'}
                      </div>
                    </div>

                    {/* What went well & What was missing */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* What was done well */}
                      <div className="p-3.5 bg-[#f0eee5] rounded-lg border border-[#c6c7c0] space-y-1.5">
                        <span className="font-mono text-[11px] font-bold text-[#4b6700] uppercase flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>What Was Done Well</span>
                        </span>
                        <ul className="text-xs text-[#1b1c17] space-y-1 list-disc list-inside">
                          {Array.isArray(q.what_went_well) ? (
                            q.what_went_well.map((item, i) => <li key={i}>{item}</li>)
                          ) : (
                            <li>{q.what_went_well || q.feedback || 'Answer addressed the core prompt.'}</li>
                          )}
                        </ul>
                      </div>

                      {/* What was missing or incorrect */}
                      <div className="p-3.5 bg-[#ffdad6]/40 rounded-lg border border-[#ba1a1a]/30 space-y-1.5">
                        <span className="font-mono text-[11px] font-bold text-[#93000a] uppercase flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#ba1a1a]" />
                          <span>What Was Missing / Incorrect</span>
                        </span>
                        <ul className="text-xs text-[#1b1c17] space-y-1 list-disc list-inside">
                          {Array.isArray(q.what_was_missing) && q.what_was_missing.length > 0 ? (
                            q.what_was_missing.map((item, i) => <li key={i}>{item}</li>)
                          ) : (
                            <li>Consider detailing high-scale edge cases and operational trade-offs.</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Concrete Suggestion for Improvement */}
                    <div className="p-3.5 bg-[#ffffff] rounded-lg border border-[#c6c7c0] space-y-1">
                      <span className="font-mono text-[11px] font-bold text-[#1b1c17] uppercase flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-[#4b6700]" />
                        <span>Concrete Suggestion for Improvement</span>
                      </span>
                      <p className="text-xs text-[#454742] leading-relaxed">
                        {q.improvement_suggestion || q.feedback || 'Structure future answers with low-level trade-offs.'}
                      </p>
                    </div>

                    {/* Stronger Model Answer */}
                    <div className="p-3.5 bg-[#1b1c17] text-[#ffffff] rounded-lg space-y-1.5">
                      <span className="font-mono text-[11px] font-bold text-[#c6f26a] uppercase flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5" />
                        <span>Benchmark Staff-Standard Model Answer</span>
                      </span>
                      <p className="text-xs font-mono text-[#c6c7c0] leading-relaxed whitespace-pre-wrap">
                        {q.stronger_answer_example || q.model_answer || 'Benchmark standard answer.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* SECTION 4 & 5: Strengths & Areas for Improvement */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-[#c6c7c0] pb-3">
            <CheckCircle2 className="w-4 h-4 text-[#4b6700]" />
            <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#1b1c17]">
              04 // Demonstrated Strengths
            </span>
          </div>
          <ul className="space-y-2.5 text-xs text-[#1b1c17]">
            {(report.strengths || ['Solid engineering foundation across core concepts.']).map((str, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4b6700] mt-1.5 shrink-0" />
                <span className="leading-relaxed">{str}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Areas for Improvement */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-[#c6c7c0] pb-3">
            <AlertTriangle className="w-4 h-4 text-[#ba1a1a]" />
            <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#1b1c17]">
              05 // Key Areas for Improvement
            </span>
          </div>
          <ul className="space-y-2.5 text-xs text-[#1b1c17]">
            {(report.areas_for_improvement || ['Address high-throughput edge cases in system design.']).map((gap, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] mt-1.5 shrink-0" />
                <span className="leading-relaxed">{gap}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* SECTION 6: Actionable Improvement Plan */}
      <Card className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-[#c6c7c0] pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#4b6700]" />
            <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#1b1c17]">
              06 // Actionable Improvement Plan
            </span>
          </div>
          <Badge variant="lime">Prescriptive Roadmap</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Priority Topics */}
          <div className="bg-[#f6f4eb] p-4 rounded-xl border border-[#c6c7c0] space-y-2">
            <span className="font-mono text-[11px] font-bold text-[#1b1c17] uppercase block">
              Priority Topics to Revise
            </span>
            <ul className="text-xs text-[#454742] space-y-1.5 list-disc list-inside">
              {(improvementPlan.priority_topics_to_revise || report.weakest_topics || ['Core Concurrency']).map((topic, i) => (
                <li key={i} className="font-medium text-[#1b1c17]">{topic}</li>
              ))}
            </ul>
          </div>

          {/* Skills to Practice */}
          <div className="bg-[#f6f4eb] p-4 rounded-xl border border-[#c6c7c0] space-y-2">
            <span className="font-mono text-[11px] font-bold text-[#1b1c17] uppercase block">
              Skills to Practice
            </span>
            <ul className="text-xs text-[#454742] space-y-1.5 list-disc list-inside">
              {(improvementPlan.skills_to_practice || [
                'Formulate concise STAR summaries',
                'Analyze write amplification and disk compaction'
              ]).map((skill, i) => (
                <li key={i}>{skill}</li>
              ))}
            </ul>
          </div>

          {/* Suggested Exercises */}
          <div className="bg-[#f6f4eb] p-4 rounded-xl border border-[#c6c7c0] space-y-2">
            <span className="font-mono text-[11px] font-bold text-[#1b1c17] uppercase block">
              Suggested Practice Exercises
            </span>
            <ul className="text-xs text-[#454742] space-y-1.5 list-disc list-inside">
              {(improvementPlan.suggested_exercises || [
                'Take a 15-minute targeted drill on weakest topic',
                'Write out design trade-off matrix'
              ]).map((ex, i) => (
                <li key={i}>{ex}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Next Step Action Plan */}
        <div className="p-4 bg-[#f0eee5] rounded-xl border border-[#4b6700]/30 text-xs text-[#1b1c17] flex items-start gap-3">
          <Compass className="w-5 h-5 text-[#4b6700] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5 font-mono">Prescribed Next-Step Action Plan:</span>
            <p className="leading-relaxed">
              {improvementPlan.next_step_plan ||
                `Dedicate 45 minutes to revising priority topics and take a follow-up mock interview on ${report.job_role} (${report.difficulty}) to measure progress.`}
            </p>
          </div>
        </div>
      </Card>

      {/* SECTION 7: Readiness Assessment */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-[#c6c7c0] pb-3">
          <ShieldCheck className="w-4 h-4 text-[#4b6700]" />
          <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#1b1c17]">
            07 // Engineering Readiness Assessment
          </span>
        </div>

        <div className="bg-[#f6f4eb] p-5 rounded-xl border border-[#c6c7c0] space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono uppercase text-[#767871]">Candidate Standing:</span>
            <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase ${scoreBadgeColor}`}>
              {readiness.readiness_level || 'Interview Ready'}
            </span>
            <span className="text-xs font-mono text-[#767871]">
              against {report.difficulty?.toUpperCase()} {report.job_role} standard
            </span>
          </div>

          <p className="text-xs text-[#454742] leading-relaxed pt-1">
            {readiness.reasoning ||
              `Performance aligns with benchmark criteria for this specialization, with consistent reasoning and structured articulation.`}
          </p>
        </div>
      </Card>

      {/* Bottom Floating Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-[#c6c7c0] print:hidden">
        <Button variant="outline" size="md" onClick={() => navigate('/history')} className="gap-2 cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          <span>View Session History</span>
        </Button>

        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/interview/setup')}
          className="gap-2 cursor-pointer font-bold"
        >
          <span>Start New Mock Interview</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
