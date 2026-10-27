import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Dna, CheckCircle2, AlertTriangle, Info, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
export const InterviewDnaPage = () => {
    const [dna, setDna] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchDna = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await api.analytics.getDna();
                setDna(res);
            }
            catch (err) {
                console.error('Failed to load Interview DNA:', err);
                setError(err.message || 'Unable to load Interview DNA profile.');
            }
            finally {
                setLoading(false);
            }
        };
        fetchDna();
    }, []);
    if (loading) {
        return (<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
        <p className="font-mono text-xs uppercase tracking-widest text-on-surface-variant">
          Computing Multi-Dimensional Interview DNA Vector...
        </p>
      </div>);
    }
    if (error || !dna) {
        return (<div className="max-w-xl mx-auto my-12 p-8 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-center">
        <Info className="w-12 h-12 text-error mx-auto mb-4"/>
        <h2 className="text-xl font-bold tracking-tight mb-2">DNA Profile Unavailable</h2>
        <p className="text-sm text-on-surface-variant mb-6">{error || 'Could not load DNA model.'}</p>
        <Button onClick={() => window.location.reload()} variant="primary">
          Retry
        </Button>
      </div>);
    }
    // Format radar data
    const radarData = Object.entries(dna.dimension_scores || {}).map(([key, val]) => {
        const label = key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
        return {
            dimension: label,
            score: Math.round(val),
            benchmark: 75,
        };
    });
    return (<div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-secondary font-bold">
              Cognitive Competency Profiler
            </span>
            <span className="text-xs text-outline-variant">•</span>
            <span className="font-mono text-[10px] text-on-surface-variant uppercase">
              Cohort: 80th Percentile Calibration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <Dna className="w-7 h-7 text-secondary"/>
            Interview DNA
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-[11px] uppercase font-bold tracking-wider">
            Overall Readiness: {Math.round(dna.overall_readiness || 0)}%
          </Badge>
        </div>
      </div>

      {/* Learning Metrics Mandatory Disclaimer Banner */}
      <div className="p-4 bg-surface-container-low border border-outline-variant/40 rounded-xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-secondary shrink-0 mt-0.5"/>
        <div className="text-xs text-on-surface-variant space-y-1">
          <p className="font-bold text-on-surface font-mono uppercase text-[10px] tracking-wider">
            Learning Metric Integrity Disclaimer
          </p>
          <p className="leading-relaxed">
            {dna.learning_metrics_disclaimer ||
            'These scores represent calibrated learning indicators derived from practice mocks. They do not constitute objective assessments of personal employability or character.'}
          </p>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Radar Chart Card */}
        <div className="md:col-span-7 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold tracking-tight">Competency Polygon</h2>
              <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                6 Evaluated Axes
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Multi-dimensional evaluation vector calculated across accuracy, structural clarity, relevance, completeness, system architecture, and behavioral dynamics.
            </p>
          </div>

          <div className="w-full h-72 sm:h-80 my-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#c6c7c0" strokeOpacity={0.4}/>
                <PolarAngleAxis dataKey="dimension" tick={{ fill: '#454742', fontSize: 11, fontFamily: 'JetBrains Mono' }}/>
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#767871', fontSize: 9 }}/>
                <Radar name="Your Score" dataKey="score" stroke="#4b6700" fill="#c6f26a" fillOpacity={0.5}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 pt-2 border-t border-outline-variant/20 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-secondary-container rounded-sm border border-secondary"/>
              <span>Current Ability Vector</span>
            </div>
          </div>
        </div>

        {/* Readiness and Percentile summary */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 space-y-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant block">
              Aggregate Readiness
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black font-headline tracking-tighter text-on-surface">
                {Math.round(dna.overall_readiness || 0)}
              </span>
              <span className="font-mono text-base text-on-surface-variant">/ 100</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Synthesized from active interview sessions. Students in your tier typically pass standard technical screens with &gt;75% readiness.
            </p>
            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
              <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(5, dna.overall_readiness || 0))}%` }}/>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 space-y-4 flex-1">
            <h3 className="text-sm font-bold tracking-tight">Competency Dimensions</h3>
            <div className="space-y-3">
              {radarData.map((item, idx) => (<div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-on-surface font-semibold">{item.dimension}</span>
                    <span className="font-bold">{item.score}%</span>
                  </div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${item.score >= 80
                ? 'bg-secondary'
                : item.score >= 60
                    ? 'bg-on-surface'
                    : 'bg-error'}`} style={{ width: `${item.score}%` }}/>
                  </div>
                </div>))}
            </div>
          </div>
        </div>
      </div>

      {/* Topic Mastery Grid */}
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/20 pb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Granular Topic Mastery Matrix</h2>
            <p className="text-xs text-on-surface-variant">
              Empirical mastery evaluated across distinct knowledge categories.
            </p>
          </div>
          <span className="text-xs font-mono text-on-surface-variant">
            {dna.topic_breakdown?.length || 0} Topics Tracked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dna.topic_breakdown && dna.topic_breakdown.length > 0 ? (dna.topic_breakdown.map((t, idx) => {
            const statusColor = t.status === 'proficient'
                ? 'border-secondary/40 bg-secondary-container/10'
                : t.status === 'practising'
                    ? 'border-outline-variant/40 bg-surface-container-low'
                    : 'border-error/30 bg-error-container/10';
            return (<div key={idx} className={`p-4 rounded-xl border ${statusColor} space-y-3 flex flex-col justify-between`}>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold tracking-tight">{t.topic}</h4>
                    <span className="font-mono text-xs font-black">
                      {Math.round(t.score)}%
                    </span>
                  </div>

                  <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${t.score >= 80
                    ? 'bg-secondary'
                    : t.score >= 60
                        ? 'bg-on-surface'
                        : 'bg-error'}`} style={{ width: `${Math.min(100, Math.max(5, t.score))}%` }}/>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono uppercase text-on-surface-variant">
                    <span>Status</span>
                    <span className="font-bold capitalize">{(t.status || 'proficient').replace('_', ' ')}</span>
                  </div>
                </div>);
        })) : (<div className="col-span-3 text-center py-8 text-on-surface-variant text-xs font-mono">
              Complete mock interviews to populate detailed topic breakdown records.
            </div>)}
        </div>
      </div>

      {/* Strengths & Growth Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold tracking-tight text-secondary flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-secondary"/>
            Verified Cognitive Strengths
          </h3>
          <ul className="space-y-2 text-xs text-on-surface leading-relaxed">
            {dna.strengths_summary && dna.strengths_summary.length > 0 ? (dna.strengths_summary.map((s, idx) => (<li key={idx} className="flex items-start gap-2">
                  <span className="text-secondary font-bold font-mono">✓</span>
                  <span>{s}</span>
                </li>))) : (<li className="text-on-surface-variant italic">
                Gathering baseline interview submissions to identify key strengths.
              </li>)}
          </ul>
        </div>

        <div className="p-6 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold tracking-tight text-error flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-error"/>
            Identified Growth Areas
          </h3>
          <ul className="space-y-2 text-xs text-on-surface leading-relaxed">
            {dna.growth_areas && dna.growth_areas.length > 0 ? (dna.growth_areas.map((g, idx) => (<li key={idx} className="flex items-start gap-2">
                  <span className="text-error font-bold font-mono">!</span>
                  <span>{g}</span>
                </li>))) : (<li className="text-on-surface-variant italic">
                No acute failure patterns recorded. Continue mock sessions.
              </li>)}
          </ul>
        </div>
      </div>
    </div>);
};
