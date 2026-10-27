import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/authContext';
import { api } from '../../lib/api';
import { Play, ArrowRight, Timer, TrendingUp, CheckCircle2, AlertTriangle, Info, ExternalLink, Zap, Sliders } from 'lucide-react';
export const DashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const loadMetrics = async () => {
            try {
                const data = await api.dashboard.getMetrics();
                setMetrics(data);
            }
            catch (err) {
                console.error('Failed to load dashboard metrics:', err);
            }
            finally {
                setLoading(false);
            }
        };
        loadMetrics();
    }, []);
    if (loading) {
        return (<div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#1b1c17] border-t-[#c6f26a] animate-spin"></div>
        <span className="font-mono text-xs text-[#767871] uppercase tracking-wider">
          Aggregating Cohort Telemetry...
        </span>
      </div>);
    }
    const userDisplayName = user?.name || metrics?.user_name || 'Candidate';
    const targetRole = user?.profile?.target_role || metrics?.target_role || 'Senior Backend Engineer (Java & Distributed Systems)';
    const targetLevel = user?.profile?.target_level || metrics?.target_level || 'L5/Senior IC';
    return (<div className="flex flex-col w-full pb-16">
      {/* 1. Top Editorial Header & Quick Resume Pill */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#c6c7c0]">
        <div className="flex flex-col gap-2 max-w-3xl">
          <div className="flex items-center gap-2 text-[#454742] font-mono text-xs uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#4b6700]"></span>
            <span>Telemetry Stream Active</span>
            <span className="text-[#767871]">/</span>
            <span>Snapshot {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1b1c17] tracking-tight">
            Good morning, {userDisplayName}. <br className="hidden sm:inline"/>
            Ready to sharpen your edge?
          </h1>

          <p className="text-sm text-[#454742]">
            Candidate Profile:{' '}
            <span className="text-[#1b1c17] font-medium">{targetRole}</span>
            <span className="mx-2 text-[#767871]">·</span>
            Target: <span className="text-[#1b1c17] font-medium">{targetLevel}</span>
          </p>
        </div>

        {/* Quick Action Pill Button */}
        {metrics?.active_session ? (<Link to={metrics.active_session.id ? `/interview/${metrics.active_session.id}` : '/interview/arena'} className="group flex items-center justify-between gap-4 px-4 py-3 bg-[#ffffff] border border-[#c6c7c0] hover:border-[#1b1c17] rounded-xl transition-all shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#c6f26a] flex items-center justify-center text-[#141f00]">
                <Play className="w-4 h-4 fill-current"/>
              </div>
              <div className="flex flex-col text-left">
                <span className="font-mono text-[10px] text-[#767871] uppercase tracking-wider">Active Session</span>
                <span className="text-xs font-bold text-[#1b1c17] group-hover:underline">
                  {metrics.active_session.topics || 'Concurrency Arena'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-4 border-l border-[#c6c7c0]">
              <span className="font-mono text-xs text-[#4b6700] font-semibold">
                Q {metrics.active_session.current_question}/{metrics.active_session.total_questions}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#767871] group-hover:translate-x-0.5 transition-transform"/>
            </div>
          </Link>) : (<Link to="/interview/setup" className="flex items-center gap-2 px-4 py-3 bg-[#c6f26a] hover:bg-[#abd551] text-[#141f00] font-semibold text-xs rounded-xl transition-all shadow-xs">
            <Zap className="w-4 h-4 fill-current"/>
            <span>Start Practice Mock</span>
            <ArrowRight className="w-3.5 h-3.5"/>
          </Link>)}
      </section>

      {/* 2. Contextual Coaching Panel (AI Coach Prescription) */}
      <section className="mt-8">
        <div className="relative bg-[#ffffff] border border-[#c6c7c0] rounded-xl p-8 overflow-hidden shadow-xs">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#c6f26a]"></div>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="flex flex-col gap-3 max-w-4xl">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 bg-[#eae8df] text-[#1b1c17] font-mono text-[11px] uppercase tracking-wider rounded">
                  AI Coach Prescription
                </span>
                <span className="px-2 py-0.5 bg-[#c6f26a] text-[#141f00] font-mono text-[11px] font-semibold uppercase tracking-wider rounded">
                  {metrics?.ai_coach_prescription.impact || 'High Impact'}
                </span>
                <span className="text-[#767871] text-xs font-mono">
                  REF {metrics?.ai_coach_prescription.ref_id || '#GC-702'}
                </span>
              </div>

              <h2 className="font-display text-2xl font-bold text-[#1b1c17] tracking-tight">
                {metrics?.ai_coach_prescription.title || 'Strengthen System Design Trade-offs & Garbage Collection Tuning'}
              </h2>

              <p className="text-sm text-[#454742] leading-relaxed">
                {metrics?.ai_coach_prescription.description ||
            'Your evaluations highlight key opportunities when comparing G1GC vs ZGC throughput under sustained concurrency. Complete a targeted 10-minute sprint to reinforce this gap.'}
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-1 text-xs font-mono text-[#767871]">
                <div className="flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-[#767871]"/>
                  <span>EST. {metrics?.ai_coach_prescription.estimated_mins || 10} MINS</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#767871]"/>
                  <span>{metrics?.ai_coach_prescription.scenarios_count || 3} SCENARIOS · 1 ARCHITECTURAL PROMPT</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#4b6700] font-semibold">
                  <TrendingUp className="w-3.5 h-3.5"/>
                  <span>{metrics?.ai_coach_prescription.projected_gain || '+8.4% PROJECTED MASTERY'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-2 w-full lg:w-auto shrink-0">
              <button onClick={() => navigate('/interview/setup', { state: { topic: 'JVM Internals & GC Tuning', difficulty: 'senior', total_questions: 3 } })} className="flex items-center justify-center gap-2 bg-[#c6f26a] hover:bg-[#abd551] text-[#141f00] font-semibold text-xs px-6 py-2.5 rounded-lg transition-all shadow-xs cursor-pointer">
                <Zap className="w-4 h-4 fill-current"/>
                <span>Start 10-Min Focus Drill</span>
              </button>
              <Link to="/coach" className="flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs text-[#454742] hover:text-[#1b1c17] font-medium transition-colors">
                <span>View Coach Rationale</span>
                <ArrowRight className="w-3.5 h-3.5"/>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Performance Snapshot Metrics (Asymmetrical Structural Grid) */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-1.5 font-mono uppercase tracking-wider text-[#767871]">
            <span className="font-semibold">Core Telemetry</span>
            <span>/</span>
            <span className="text-[#454742]">Real-Time Cohort Calibration</span>
          </div>
          <span className="font-mono text-[#767871]">Aggregated L5 Baseline</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
          {/* Metric 1: Interviews Completed (3 cols) */}
          <div className="lg:col-span-3 bg-[#ffffff] border border-[#c6c7c0] rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#767871]">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">Interviews Completed</span>
              <CheckCircle2 className="w-4 h-4 text-[#767871]"/>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-[#1b1c17]">
                {metrics?.interviews_completed ?? 42}
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 bg-[#eae8df] text-[#1b1c17] rounded font-semibold">
                +4 this week
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-[#c6c7c0] flex items-center justify-between text-xs font-mono text-[#767871]">
              <span>Target: 50 Sessions</span>
              <span className="text-[#1b1c17] font-semibold">84% to Milestone</span>
            </div>
          </div>

          {/* Metric 2: Average Score (4 cols) */}
          <div className="lg:col-span-4 bg-[#ffffff] border border-[#c6c7c0] rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#767871]">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">Average Readiness Score</span>
              <div className="flex items-center gap-1 text-[#4b6700]">
                <CheckCircle2 className="w-3.5 h-3.5 fill-current"/>
                <span className="font-mono text-[10px] font-semibold">VALIDATED</span>
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-[#1b1c17]">
                {metrics?.average_score ? `${metrics.average_score}%` : '84.2%'}
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 bg-[#c6f26a] text-[#141f00] rounded font-semibold">
                Top 12%
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-[#c6c7c0] flex items-center justify-between text-xs text-[#454742]">
              <span>Benchmarked in Senior Java Cohort</span>
              <span className="font-mono font-semibold text-[#1b1c17]">n=1,420</span>
            </div>
          </div>

          {/* Metric 3: Practice Streak (2 cols) */}
          <div className="lg:col-span-2 bg-[#ffffff] border border-[#c6c7c0] rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#767871]">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">Streak</span>
              <span className="text-base leading-none">🔥</span>
            </div>
            <div className="mt-4 flex items-baseline">
              <span className="font-mono text-3xl font-bold text-[#1b1c17] tracking-tight">
                {String(metrics?.streak_days ?? 6).padStart(2, '0')}
              </span>
              <span className="font-mono text-[10px] text-[#767871] ml-1.5 uppercase">Days</span>
            </div>
            <div className="mt-4 pt-3 border-t border-[#c6c7c0] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4b6700]"></span>
              <span className="font-mono text-[11px] text-[#454742]">Personal best: 14d</span>
            </div>
          </div>

          {/* Metric 4: Diagnostic Trajectory Delta & Weakest Anchor (3 cols) */}
          <div className="lg:col-span-3 bg-[#ffffff] border border-[#c6c7c0] rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#767871]">
                  Improving Competency
                </span>
                <span className="text-xs font-bold text-[#1b1c17] mt-1">
                  {metrics?.improving_competency || 'JVM Internals & Systems'}
                </span>
              </div>
              <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[#eae8df] text-[#4b6700] font-bold rounded">
                {metrics?.improving_delta || '+14% Δ'}
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-[#c6c7c0] flex flex-col">
              <span className="font-mono text-[10px] text-[#ba1a1a] font-semibold uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3 h-3"/>
                Weakest Anchor
              </span>
              <span className="text-xs font-medium text-[#1b1c17] truncate mt-1">
                {metrics?.weakest_anchor || 'Distributed Tx (2PC vs Saga)'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Progress Over Time (Performance Velocity Visualization) */}
      <section className="mt-8">
        <div className="bg-[#ffffff] border border-[#c6c7c0] rounded-xl p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#c6c7c0]">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#1b1c17]"></span>
                <h3 className="font-display text-xl font-bold text-[#1b1c17]">Performance Velocity (Last 30 Days)</h3>
              </div>
              <p className="text-xs text-[#767871]">
                Score trajectory across Technical Depth, Clarity, and Architectural Trade-offs
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#1b1c17]"></span>
                <span className="text-[#1b1c17] font-medium">Trajectory Index</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 border-b-2 border-dashed border-[#4b6700]"></span>
                <span className="text-[#767871]">L5 Target (80%)</span>
              </div>
              <div className="px-2 py-0.5 bg-[#f0eee5] rounded text-[#1b1c17] font-semibold">
                Cohort Avg: 76.4%
              </div>
            </div>
          </div>

          {/* SVG Velocity Canvas strictly matching Stitch visual specifications */}
          <div className="relative w-full mt-6 overflow-x-auto">
            <div className="min-w-[680px]">
              <svg className="w-full h-56 select-none" fill="none" viewBox="0 0 880 260" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="velocityFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#C7F36B" stopOpacity="0.28"/>
                    <stop offset="100%" stopColor="#C7F36B" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>
                {/* Horizontal Grid lines */}
                <line stroke="#E4E3DA" strokeWidth="1" x1="40" x2="860" y1="30" y2="30"/>
                <text fill="#767871" fontFamily="JetBrains Mono" fontSize="10" textAnchor="start" x="10" y="34">100%</text>
                
                {/* 80% Benchmark Line (Dashed) */}
                <line stroke="#4B6700" strokeDasharray="4 4" strokeWidth="1.5" x1="40" x2="860" y1="80" y2="80"/>
                <text fill="#4B6700" fontFamily="JetBrains Mono" fontSize="10" fontWeight="600" textAnchor="start" x="10" y="84">80%</text>
                
                <line stroke="#E4E3DA" strokeWidth="1" x1="40" x2="860" y1="130" y2="130"/>
                <text fill="#767871" fontFamily="JetBrains Mono" fontSize="10" textAnchor="start" x="10" y="134">60%</text>
                
                <line stroke="#E4E3DA" strokeWidth="1" x1="40" x2="860" y1="180" y2="180"/>
                <text fill="#767871" fontFamily="JetBrains Mono" fontSize="10" textAnchor="start" x="10" y="184">40%</text>
                
                <line stroke="#C6C7C0" strokeWidth="1" x1="40" x2="860" y1="230" y2="230"/>
                <text fill="#767871" fontFamily="JetBrains Mono" fontSize="10" textAnchor="start" x="10" y="234">20%</text>

                {/* Filled Area Under Curve */}
                <path d="M 60 160 L 140 145 L 220 150 L 300 130 L 380 115 L 460 120 L 540 95 L 620 90 L 700 82 L 780 60 L 840 55 L 840 230 L 60 230 Z" fill="url(#velocityFill)"/>
                
                {/* Trajectory Polyline */}
                <path d="M 60 160 L 140 145 L 220 150 L 300 130 L 380 115 L 460 120 L 540 95 L 620 90 L 700 82 L 780 60 L 840 55" stroke="#1B1C17" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"/>

                {/* Data Points */}
                {[
            [60, 160], [140, 145], [220, 150], [300, 130],
            [380, 115], [460, 120], [540, 95], [620, 90], [700, 82]
        ].map(([cx, cy], i) => (<circle key={i} cx={cx} cy={cy} fill="#FFFFFF" r="3.5" stroke="#1B1C17" strokeWidth="2"/>))}

                {/* Focused Milestone Point: May 26 */}
                <g className="cursor-pointer">
                  <line stroke="#767871" strokeDasharray="2 2" strokeWidth="1" x1="780" x2="780" y1="30" y2="230"/>
                  <circle cx="780" cy="60" fill="#C6F26A" r="6" stroke="#1B1C17" strokeWidth="2"/>
                  <circle cx="780" cy="60" fill="#1B1C17" r="2"/>
                  
                  {/* Tooltip Overlay */}
                  <g transform="translate(680, 8)">
                    <rect fill="#1B1C17" height="42" rx="4" width="180"/>
                    <text fill="#C6F26A" fontFamily="JetBrains Mono" fontSize="11" fontWeight="600" x="12" y="18">May 26: 88.0%</text>
                    <text fill="#FFFFFF" fontFamily="Geist" fontSize="10" x="12" y="32">+6.0% vs baseline · L5 Ready</text>
                  </g>
                </g>

                <circle cx="840" cy="55" fill="#C6F26A" r="4.5" stroke="#1B1C17" strokeWidth="2"/>

                {/* X-Axis Labels */}
                <text fill="#767871" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" x="60" y="248">May 01</text>
                <text fill="#767871" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" x="220" y="248">May 07</text>
                <text fill="#767871" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" x="380" y="248">May 14</text>
                <text fill="#767871" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" x="540" y="248">May 21</text>
                <text fill="#1B1C17" fontFamily="JetBrains Mono" fontSize="10" fontWeight="600" textAnchor="middle" x="780" y="248">May 26</text>
                <text fill="#767871" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" x="840" y="248">May 28</text>
              </svg>
            </div>
          </div>

          {/* Footer Insight */}
          <div className="mt-4 pt-4 border-t border-[#c6c7c0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#454742]">
            <div className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#4b6700]"/>
              <span>
                Consistent progression observed over last 14 sessions. Readiness slope:{' '}
                <span className="font-mono text-[#1b1c17] font-semibold">+1.8 pts/week</span>.
              </span>
            </div>
            <Link to="/analytics/dna" className="font-mono text-xs text-[#1b1c17] font-semibold hover:underline flex items-center gap-1">
              <span>Deconstruct Velocity Vectors</span>
              <ArrowRight className="w-3.5 h-3.5"/>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Recent Evaluations Table */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-xl font-bold text-[#1b1c17]">Recent Evaluations</h3>
            <span className="px-2 py-0.5 bg-[#eae8df] font-mono text-[11px] text-[#454742] rounded">
              {metrics?.recent_evaluations?.length || 3} of {metrics?.interviews_completed || 42}
            </span>
          </div>
          <Link to="/history" className="text-xs text-[#454742] hover:text-[#1b1c17] flex items-center gap-1 font-medium">
            <span>View Full Session Archive</span>
            <ArrowRight className="w-3.5 h-3.5"/>
          </Link>
        </div>

        <div className="bg-[#ffffff] border border-[#c6c7c0] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#c6c7c0] bg-[#f6f4eb] font-mono text-[11px] text-[#767871] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Target Role &amp; Topic</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Completion</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c6c7c0] text-xs">
                {metrics?.recent_evaluations && metrics.recent_evaluations.length > 0 ? (metrics.recent_evaluations.map((row) => (<tr key={row.id} className="hover:bg-[#f6f4eb]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#1b1c17]">{row.role}</span>
                          <span className="text-[#767871]">{row.topics}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-[#f0eee5] text-[#1b1c17] font-mono text-[10px] rounded">
                          {row.mode}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[#1b1c17]">
                        {row.completion}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-[#767871] font-mono text-[11px]">
                        {row.timestamp}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#c6f26a] text-[#141f00] font-mono text-[10px] rounded font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4b6700]"></span>
                          {row.result}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <Link to={`/interview/report?id=${row.id}`} className="text-xs text-[#1b1c17] font-semibold hover:text-[#4b6700] hover:underline inline-flex items-center gap-1">
                          <span>View Report</span>
                          <ExternalLink className="w-3 h-3"/>
                        </Link>
                      </td>
                    </tr>))) : (<tr>
                    <td colSpan={6} className="py-8 text-center text-[#767871]">
                      No mock sessions completed yet. Click <strong>Start Practice Mock</strong> to begin your first evaluation.
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>);
};
