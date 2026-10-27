import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Target, Clock, AlertCircle, TrendingUp, Cpu, Compass } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
export const CoachPage = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchCoach = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await api.coach.getRecommendation();
                setData(res);
            }
            catch (err) {
                console.error('Failed to load coach recommendations:', err);
                setError(err.message || 'Unable to retrieve coaching prescription.');
            }
            finally {
                setLoading(false);
            }
        };
        fetchCoach();
    }, []);
    const handleStartDrill = (topic, difficulty) => {
        navigate('/interview/setup', {
            state: {
                topic,
                difficulty: difficulty.toLowerCase(),
                interview_type: 'technical'
            }
        });
    };
    if (loading) {
        return (<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
        <p className="font-mono text-xs uppercase tracking-widest text-on-surface-variant">
          Synthesizing AI Coach Diagnostics & Remediation Paths...
        </p>
      </div>);
    }
    if (error || !data) {
        return (<div className="max-w-xl mx-auto my-12 p-8 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-center">
        <AlertCircle className="w-12 h-12 text-error mx-auto mb-4"/>
        <h2 className="text-xl font-bold tracking-tight mb-2">Coach Offline</h2>
        <p className="text-sm text-on-surface-variant mb-6">{error || 'Could not load coaching telemetry.'}</p>
        <Button onClick={() => navigate('/dashboard')} variant="primary">
          Back to Dashboard
        </Button>
      </div>);
    }
    const prescription = data.prescription || data.prescriptions?.[0] || {
        ref_id: 'INIT-101',
        title: data.title || 'Core Architecture Baseline',
        description: data.summary || 'Personalized focus sprint calibrated from your performance history.',
        focus_topics: data.weak_topics || ['System Architecture'],
        recommended_difficulty: 'senior',
        estimated_mins: 10,
        scenarios_count: 3,
        projected_gain: '+8.4% PROJECTED MASTERY',
        impact: 'High Impact',
        history_based: Boolean(data.has_history),
        rationale: 'Calibrated diagnostic to systematically elevate core technical capabilities.'
    };
    const historical_diagnostic = data.historical_diagnostic || {
        completed_interviews: data.has_history ? 1 : 0,
        average_score: 80,
        detected_weaknesses: data.weak_topics || ['System Architecture'],
        needs_baseline: !data.has_history
    };
    const drills = data.drills || [
        {
            id: 'drill-1',
            title: 'Database Indexing & B+ Trees',
            topic: 'Database Indexing & B+ Trees',
            difficulty: 'Mid',
            time_mins: 10,
            reason: 'Crucial foundational topic for backend database scalability.'
        },
        {
            id: 'drill-2',
            title: 'Concurrency & Locks',
            topic: 'Concurrency & Locks',
            difficulty: 'Senior',
            time_mins: 12,
            reason: 'Test mutex primitives, race condition mitigation, and thread safety.'
        },
        {
            id: 'drill-3',
            title: 'Distributed Transactions & Sagas',
            topic: 'Distributed Transactions (2PC vs Saga)',
            difficulty: 'Senior',
            time_mins: 15,
            reason: 'Essential for microservices consistency and compensation logic.'
        }
    ];
    return (<div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-secondary font-bold">
              Autonomous Adaptive Mentorship
            </span>
            <span className="text-xs text-outline-variant">•</span>
            <span className="font-mono text-[10px] text-on-surface-variant uppercase">
              Target: {data.target_role || 'Senior Backend Engineer'} ({data.target_level || 'Senior IC'})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">AI Coach Cockpit</h1>
        </div>

        <div className="flex items-center gap-2">
          {historical_diagnostic.needs_baseline ? (<Badge variant="outline" className="font-mono text-[10px] uppercase text-on-surface-variant">
              Mode: Baseline Diagnostic
            </Badge>) : (<Badge variant="secondary" className="font-mono text-[10px] uppercase font-bold tracking-wider">
              Empirical: {historical_diagnostic.completed_interviews} Sessions Evaluated
            </Badge>)}
        </div>
      </div>

      {/* Hero Prescription Card */}
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-secondary-container/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"/>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-secondary-container text-on-secondary-fixed text-[10px] font-mono font-bold uppercase rounded-md tracking-wider">
                Prescription #{prescription.ref_id}
              </span>
              <span className="text-xs font-mono text-on-surface-variant flex items-center gap-1">
                <Clock className="w-3.5 h-3.5"/> Est. {prescription.estimated_mins} mins
              </span>
              <span className="text-xs font-mono text-secondary font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5"/> {prescription.projected_gain}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight">{prescription.title}</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl">
              {prescription.description}
            </p>

            <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/30 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant block font-bold">
                Diagnostic Rationale
              </span>
              <p className="text-xs text-on-surface leading-relaxed">{prescription.rationale}</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {(prescription.focus_topics || []).map((topic, i) => (<span key={i} className="px-2.5 py-1 bg-surface-container-highest/60 rounded-md font-mono text-xs font-semibold text-on-surface">
                  #{topic}
                </span>))}
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-3 justify-center items-start lg:items-end border-t lg:border-t-0 lg:border-l border-outline-variant/30 pt-6 lg:pt-0 lg:pl-8">
            <div className="text-left lg:text-right w-full mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant block">
                Target Difficulty
              </span>
              <span className="text-lg font-bold font-mono capitalize">
                {prescription.recommended_difficulty || 'senior'}
              </span>
            </div>

            <Button variant="primary" size="lg" onClick={() => handleStartDrill(prescription.focus_topics?.[0] || 'System Architecture', prescription.recommended_difficulty || 'senior')} className="w-full justify-center gap-2 text-sm font-bold">
              Start Prescribed Drill <ArrowRight className="w-4 h-4"/>
            </Button>
          </div>
        </div>
      </div>

      {/* Recommended Practice Drills Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-secondary"/>
            Personalized Tactical Drills
          </h2>
          <span className="text-xs font-mono text-on-surface-variant">Calibrated for your gap profile</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {drills && drills.length > 0 ? (drills.map((drill, index) => (<div key={drill.id || index} className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 flex flex-col justify-between hover:border-outline-variant transition-all hover:shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-wider">
                      {drill.topic}
                    </Badge>
                    <span className="text-[10px] font-mono text-on-surface-variant uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3"/> {drill.time_mins}m
                    </span>
                  </div>

                  <h3 className="text-base font-bold tracking-tight">{drill.title}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{drill.reason}</p>
                </div>

                <div className="pt-5 mt-4 border-t border-outline-variant/20 flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold text-on-surface-variant">
                    Level: {drill.difficulty}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => handleStartDrill(drill.topic, drill.difficulty)} className="gap-1.5 text-xs font-semibold hover:bg-surface-container">
                    Launch <ArrowRight className="w-3 h-3"/>
                  </Button>
                </div>
              </div>))) : (<div className="col-span-3 p-8 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-center">
              <Compass className="w-8 h-8 text-on-surface-variant mx-auto mb-2"/>
              <p className="text-sm font-bold">No Custom Drills Queued</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Complete a session in the Interview Arena to trigger tailored remediation drills.
              </p>
            </div>)}
        </div>
      </div>

      {/* Empirical Performance Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7 bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
            <Cpu className="w-4 h-4 text-on-surface-variant"/>
            Performance Diagnostic State
          </h3>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-surface-container rounded-lg border border-outline-variant/30">
              <span className="text-[10px] font-mono uppercase text-on-surface-variant block">Sessions</span>
              <span className="text-2xl font-bold font-mono">
                {historical_diagnostic.completed_interviews}
              </span>
            </div>
            <div className="p-4 bg-surface-container rounded-lg border border-outline-variant/30">
              <span className="text-[10px] font-mono uppercase text-on-surface-variant block">Avg Score</span>
              <span className="text-2xl font-bold font-mono">
                {Math.round(historical_diagnostic.average_score || 0)}%
              </span>
            </div>
            <div className="p-4 bg-surface-container rounded-lg border border-outline-variant/30">
              <span className="text-[10px] font-mono uppercase text-on-surface-variant block">State</span>
              <span className="text-xs font-bold font-mono uppercase text-secondary block mt-2">
                {historical_diagnostic.needs_baseline ? 'Calibrating' : 'Active'}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant block mb-2 font-bold">
              Active Focus & Deficiencies
            </span>
            <div className="flex flex-wrap gap-2">
              {historical_diagnostic.detected_weaknesses && historical_diagnostic.detected_weaknesses.length > 0 ? (historical_diagnostic.detected_weaknesses.map((w, i) => (<span key={i} className="px-3 py-1 bg-error-container/30 border border-error/30 rounded-lg text-xs font-semibold text-on-surface flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3 text-error"/> {w}
                  </span>))) : (<span className="text-xs text-on-surface-variant italic">
                  Complete baseline mock interviews to calibrate individual weaknesses.
                </span>)}
            </div>
          </div>
        </div>

        <div className="md:col-span-5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-secondary"/>
              Coaching Methodology
            </h3>
            <p className="text-xs text-on-surface-variant mt-3 leading-relaxed">
              PrepPulse’s AI Coach analyzes the structured evaluation rubrics from your mock sessions. It isolates specific sub-competencies (e.g. Distributed Consensus, Indexing, Concurrency) and assigns micro-drills to prevent repetitive failures.
            </p>
          </div>

          <div className="p-4 bg-surface-container rounded-lg border border-outline-variant/30 text-xs space-y-1">
            <span className="font-mono text-[9px] uppercase tracking-widest text-secondary font-bold block">
              Ethical AI Standard
            </span>
            <p className="text-on-surface-variant text-[11px] leading-relaxed">
              Recommendations are learning indicators designed to guide practice, not static personality or employment judgements.
            </p>
          </div>
        </div>
      </div>
    </div>);
};
