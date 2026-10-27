import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Printer, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Lightbulb, Sparkles, Layers, ArrowLeft } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
export const FinalReportPage = () => {
    const params = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const id = params.id || searchParams.get('id') || searchParams.get('interview_id');
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedEval, setExpandedEval] = useState(null);
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
            }
            catch (err) {
                console.error('Failed to load final report:', err);
                setError(err.message || 'Unable to retrieve interview debrief.');
            }
            finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [id]);
    const handlePrint = () => {
        window.print();
    };
    if (loading) {
        return (<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
        <p className="font-mono text-xs uppercase tracking-widest text-on-surface-variant">
          Synthesizing Final Debrief & Metric Analysis...
        </p>
      </div>);
    }
    if (error || !report) {
        return (<div className="max-w-xl mx-auto my-12 p-8 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-center">
        <AlertTriangle className="w-12 h-12 text-error mx-auto mb-4"/>
        <h2 className="text-xl font-bold tracking-tight mb-2">Report Unavailable</h2>
        <p className="text-sm text-on-surface-variant mb-6">{error || 'Session report not found.'}</p>
        <Button onClick={() => navigate('/dashboard')} variant="primary">
          Return to Dashboard
        </Button>
      </div>);
    }
    const scoreColor = report.overall_score >= 80
        ? 'text-secondary font-black'
        : report.overall_score >= 60
            ? 'text-on-surface font-black'
            : 'text-error font-black';
    return (<div className="max-w-5xl mx-auto space-y-8 pb-16 print:p-0 print:space-y-4">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4 print:hidden">
        <div className="flex items-center gap-2">
          <Link to="/history" className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors">
            <ArrowLeft className="w-4 h-4"/>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                Debrief & Diagnostic Report
              </span>
              <span className="text-xs text-outline-variant">•</span>
              <span className="font-mono text-[10px] text-on-surface-variant uppercase">
                ID: {report.interview_id?.slice(-6) || report.id?.slice(-6) || id?.slice(-6) || 'SESSION'}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight capitalize">
              {report.job_role} • {report.difficulty}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="w-3.5 h-3.5"/>
            Export / Print
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')} className="gap-2">
            Return to Dashboard
          </Button>
        </div>
      </div>

      {/* Hero Overview Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 sm:p-8">
        <div className="md:col-span-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-outline-variant/30 pb-6 md:pb-0 md:pr-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
                {report.interview_type} Track
              </Badge>
              <Badge variant="secondary" className="font-mono text-[10px] uppercase font-bold tracking-wider">
                +{report.xp_earned || 0} XP EARNED
              </Badge>
            </div>
            <div className="flex items-baseline gap-3 my-2">
              <span className={`text-6xl tracking-tighter ${scoreColor}`}>
                {Math.round(report.overall_score || 0)}
              </span>
              <span className="font-mono text-lg text-on-surface-variant">/ 100</span>
            </div>
            <p className="text-xs text-on-surface-variant uppercase font-mono tracking-widest">
              Aggregate Competency Score
            </p>
          </div>

          <div className="pt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                Questions
              </p>
              <p className="text-lg font-bold">
                {report.answered_questions || 0} / {report.total_questions || 0}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                Status
              </p>
              <p className="text-lg font-bold capitalize text-secondary">
                {(report.status || 'completed').replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>

        {/* Right side: Strongest & Weakest Topics */}
        <div className="md:col-span-7 flex flex-col justify-between pl-0 md:pl-2 space-y-6">
          <div>
            <h3 className="font-mono text-xs uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-secondary"/>
              Verified Competency Anchors
            </h3>
            <div className="flex flex-wrap gap-2">
              {report.strongest_topics && report.strongest_topics.length > 0 ? (report.strongest_topics.map((t, idx) => (<span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary-container/30 border border-secondary/30 rounded-lg text-xs font-semibold text-on-surface">
                    <CheckCircle2 className="w-3 h-3 text-secondary"/>
                    {t}
                  </span>))) : (<span className="text-xs text-on-surface-variant italic">
                  Additional baseline evaluations required.
                </span>)}
            </div>
          </div>

          <div>
            <h3 className="font-mono text-xs uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-error"/>
              Target Revision Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {report.weakest_topics && report.weakest_topics.length > 0 ? (report.weakest_topics.map((t, idx) => (<span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-error-container/30 border border-error/30 rounded-lg text-xs font-semibold text-on-surface">
                    <AlertTriangle className="w-3 h-3 text-error"/>
                    {t}
                  </span>))) : (<span className="text-xs text-on-surface-variant italic">
                  No critical deficiencies detected in this session.
                </span>)}
            </div>
          </div>

          {/* Suggested Next Practice Session CTA */}
          {report.suggested_next_session && (<div className="p-4 bg-surface-container rounded-xl border border-outline-variant/40 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-secondary font-bold">
                  AI Coach Prescribed Next Step
                </span>
                <p className="text-sm font-bold">
                  {report.suggested_next_session.topic} ({report.suggested_next_session.difficulty})
                </p>
                <p className="text-xs text-on-surface-variant">
                  Est. {report.suggested_next_session.estimated_mins} mins • Targeted Remediation
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={() => navigate('/interview/setup', {
                state: {
                    topic: report.suggested_next_session.topic,
                    difficulty: report.suggested_next_session.difficulty,
                },
            })} className="gap-2 shrink-0">
                Launch Drill <ArrowRight className="w-3.5 h-3.5"/>
              </Button>
            </div>)}
        </div>
      </div>

      {/* Actionable Recommendations */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-secondary"/>
          Actionable Takeaways & Next Steps
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(report.recommendations || []).map((rec, i) => (<div key={i} className="p-5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl space-y-2 hover:border-outline-variant transition-colors">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-on-surface-variant uppercase">
                <span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center text-[10px]">
                  0{i + 1}
                </span>
                Prescription
              </div>
              <p className="text-xs text-on-surface leading-relaxed">{rec}</p>
            </div>))}
        </div>
      </div>

      {/* Question by Question Review Accordion */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-on-surface-variant"/>
            Detailed Question Evaluations ({report.evaluations?.length || 0})
          </h2>
          <span className="text-xs font-mono text-on-surface-variant">Click question to inspect rubric</span>
        </div>

        <div className="space-y-3">
          {(report.evaluations || []).map((evalItem, index) => {
            const isExpanded = expandedEval === index;
            return (<div key={evalItem.id || index} className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl overflow-hidden transition-all duration-200">
                <button type="button" onClick={() => setExpandedEval(isExpanded ? null : index)} className="w-full text-left p-5 flex items-start sm:items-center justify-between gap-4 hover:bg-surface-container-low transition-colors">
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center font-mono text-xs font-bold shrink-0">
                      Q{index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold line-clamp-1">
                        {evalItem.question_text || `Question ${index + 1} on ${evalItem.topic || 'Core Engineering'}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[10px] text-on-surface-variant uppercase">
                          Topic: {evalItem.topic || 'General'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="font-mono text-sm font-bold">
                        {Math.round(evalItem.overall_score)}%
                      </span>
                      <p className="text-[9px] font-mono uppercase text-on-surface-variant">Score</p>
                    </div>
                    {isExpanded ? (<ChevronUp className="w-4 h-4 text-on-surface-variant"/>) : (<ChevronDown className="w-4 h-4 text-on-surface-variant"/>)}
                  </div>
                </button>

                {isExpanded && (<div className="p-6 border-t border-outline-variant/20 bg-surface/50 space-y-6">
                    {/* Breakdown 4 dimensions */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/30 text-center">
                        <span className="text-[10px] font-mono uppercase text-on-surface-variant block">Accuracy</span>
                        <span className="text-base font-bold font-mono">{evalItem.technical_accuracy}%</span>
                      </div>
                      <div className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/30 text-center">
                        <span className="text-[10px] font-mono uppercase text-on-surface-variant block">Relevance</span>
                        <span className="text-base font-bold font-mono">{evalItem.relevance}%</span>
                      </div>
                      <div className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/30 text-center">
                        <span className="text-[10px] font-mono uppercase text-on-surface-variant block">Completeness</span>
                        <span className="text-base font-bold font-mono">{evalItem.completeness}%</span>
                      </div>
                      <div className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/30 text-center">
                        <span className="text-[10px] font-mono uppercase text-on-surface-variant block">Clarity</span>
                        <span className="text-base font-bold font-mono">{evalItem.clarity}%</span>
                      </div>
                    </div>

                    {/* Strengths & Missing Concepts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-secondary-container/20 border border-secondary/30 rounded-xl space-y-2">
                        <h4 className="text-xs font-mono font-bold uppercase text-secondary flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5"/> Strengths Demonstrated
                        </h4>
                        <ul className="text-xs space-y-1.5 list-disc list-inside text-on-surface">
                          {evalItem.strengths.map((s, i) => (<li key={i}>{s}</li>))}
                        </ul>
                      </div>

                      <div className="p-4 bg-error-container/20 border border-error/30 rounded-xl space-y-2">
                        <h4 className="text-xs font-mono font-bold uppercase text-error flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5"/> Missing or Incomplete Concepts
                        </h4>
                        <ul className="text-xs space-y-1.5 list-disc list-inside text-on-surface">
                          {evalItem.missing_concepts.map((m, i) => (<li key={i}>{m}</li>))}
                        </ul>
                      </div>
                    </div>

                    {/* Detailed feedback */}
                    <div className="p-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl space-y-2">
                      <h4 className="text-xs font-mono font-bold uppercase text-on-surface-variant">
                        Evaluator Feedback
                      </h4>
                      <p className="text-xs text-on-surface leading-relaxed">{evalItem.feedback}</p>
                    </div>

                    {/* Model Answer */}
                    <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/30 space-y-2">
                      <h4 className="text-xs font-mono font-bold uppercase text-secondary flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5"/> Golden Standard / Model Response
                      </h4>
                      <p className="text-xs font-mono text-on-surface leading-relaxed whitespace-pre-line bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/20">
                        {evalItem.model_answer}
                      </p>
                    </div>
                  </div>)}
              </div>);
        })}
        </div>
      </div>
    </div>);
};
