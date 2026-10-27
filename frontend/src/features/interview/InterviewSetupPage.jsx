import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Clock, Check, ArrowRight, ShieldCheck } from 'lucide-react';
const AVAILABLE_TOPICS = [
    'Concurrency & Locks',
    'JVM Internals & GC Tuning',
    'Distributed Transactions (2PC vs Saga)',
    'Event-Driven Systems & Kafka',
    'Database Indexing & B+ Trees',
    'API Gateway & Non-blocking I/O',
    'Spring Boot Resiliency Patterns',
    'Cache Invalidation Strategies'
];
export const InterviewSetupPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const navState = location.state || {};
    const [jobRole, setJobRole] = useState('Senior Backend Engineer (Java & Distributed Systems)');
    const [interviewType, setInterviewType] = useState(navState.interview_type || 'technical');
    const [difficulty, setDifficulty] = useState(navState.difficulty || 'senior');
    const [totalQuestions, setTotalQuestions] = useState(navState.total_questions || 5);
    const [selectedTopics, setSelectedTopics] = useState(navState.topics || (navState.topic ? [navState.topic] : [
        'Concurrency & Locks',
        'JVM Internals & GC Tuning',
        'Distributed Transactions (2PC vs Saga)'
    ]));
    const [timedMode, setTimedMode] = useState(true);
    const [timeLimitMins, setTimeLimitMins] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const toggleTopic = (topic) => {
        if (selectedTopics.includes(topic)) {
            if (selectedTopics.length > 1) {
                setSelectedTopics(selectedTopics.filter((t) => t !== topic));
            }
        }
        else {
            setSelectedTopics([...selectedTopics, topic]);
        }
    };
    const handleStartInterview = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            const session = await api.interviews.create({
                job_role: jobRole,
                interview_type: interviewType,
                difficulty: difficulty,
                selected_topics: selectedTopics,
                total_questions: totalQuestions,
                timed_mode: timedMode,
                time_limit_mins: timeLimitMins
            });
            navigate(`/interview/${session.id}`);
        }
        catch (err) {
            setError(err.message || 'Failed to initialize interview session.');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="flex flex-col w-full max-w-4xl mx-auto pb-16">
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#767871]">
          <span className="w-2 h-2 rounded-full bg-[#c6f26a]"></span>
          <span>Cockpit Calibration</span>
          <span>/</span>
          <span>Targeted Configuration</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-[#1b1c17] tracking-tight">
          Configure Interview Session
        </h1>
        <p className="text-sm text-[#454742]">
          Tailor question generation, difficulty boundaries, and architectural topics for your next mock.
        </p>
      </div>

      <form onSubmit={handleStartInterview} className="flex flex-col gap-6">
        {error && (<div className="p-3 bg-[#ffdad6] border border-[#ba1a1a]/40 text-[#93000a] text-xs rounded-lg font-medium">
            {error}
          </div>)}

        {/* 1. Track & Role Specification */}
        <Card className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-[#c6c7c0] pb-3">
            <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#1b1c17]">
              01 // Target Role &amp; Interview Track
            </span>
            <Badge variant="lime">Required</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#454742] uppercase tracking-wider">
                Target Engineering Role
              </label>
              <select className="w-full px-3.5 py-2.5 bg-[#f6f4eb] border border-[#c6c7c0] rounded-lg text-xs font-medium text-[#1b1c17] focus:outline-none focus:border-[#1b1c17]" value={jobRole} onChange={(e) => setJobRole(e.target.value)}>
                <option value="Senior Backend Engineer (Java & Distributed Systems)">Senior Backend (Java & Distributed)</option>
                <option value="Distributed Systems & Infrastructure Architect">Distributed Systems Architect</option>
                <option value="Full-Stack Engineer (React & Microservices)">Full-Stack Engineer (React & Microservices)</option>
                <option value="Senior Frontend Engineer (React/TypeScript)">Senior Frontend Engineer</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#454742] uppercase tracking-wider">
                Interview Track
              </label>
              <select className="w-full px-3.5 py-2.5 bg-[#f6f4eb] border border-[#c6c7c0] rounded-lg text-xs font-medium text-[#1b1c17] focus:outline-none focus:border-[#1b1c17]" value={interviewType} onChange={(e) => setInterviewType(e.target.value)}>
                <option value="technical">Technical Deep-Dive (Architecture &amp; Code)</option>
                <option value="system_design">System Design &amp; Scalability</option>
                <option value="behavioral">Behavioral &amp; Leadership (STAR Method)</option>
                <option value="hr">Culture &amp; Engineering Values</option>
              </select>
            </div>
          </div>
        </Card>

        {/* 2. Difficulty & Question Count */}
        <Card className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-[#c6c7c0] pb-3">
            <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#1b1c17]">
              02 // Difficulty Level &amp; Pacing
            </span>
            <Badge variant="gray">Calibration</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#454742] uppercase tracking-wider">
                Seniority Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['junior', 'mid', 'senior', 'staff'].map((lvl) => (<button key={lvl} type="button" onClick={() => setDifficulty(lvl)} className={`py-2 px-3 text-xs font-mono uppercase tracking-wider font-semibold rounded-lg border transition-all cursor-pointer text-center ${difficulty === lvl
                ? 'bg-[#1b1c17] text-[#c6f26a] border-[#1b1c17]'
                : 'bg-[#f6f4eb] text-[#454742] border-[#c6c7c0] hover:border-[#1b1c17]'}`}>
                    {lvl}
                  </button>))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#454742] uppercase tracking-wider">
                Session Length
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 5, 10].map((num) => (<button key={num} type="button" onClick={() => setTotalQuestions(num)} className={`py-2 px-2 text-xs font-mono font-semibold rounded-lg border transition-all cursor-pointer text-center ${totalQuestions === num
                ? 'bg-[#c6f26a] text-[#141f00] border-[#4b6700]'
                : 'bg-[#f6f4eb] text-[#454742] border-[#c6c7c0] hover:border-[#1b1c17]'}`}>
                    {num} Qs
                  </button>))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#454742] uppercase tracking-wider">
                Timer Mode
              </label>
              <button type="button" onClick={() => setTimedMode(!timedMode)} className={`py-2 px-3 flex items-center justify-center gap-2 text-xs font-mono font-semibold rounded-lg border transition-all cursor-pointer ${timedMode
            ? 'bg-[#f0eee5] text-[#1b1c17] border-[#4b6700]'
            : 'bg-[#f6f4eb] text-[#767871] border-[#c6c7c0]'}`}>
                <Clock className="w-3.5 h-3.5"/>
                <span>{timedMode ? 'Timed (10m / Q)' : 'Untimed'}</span>
              </button>
            </div>
          </div>
        </Card>

        {/* 3. Topics Checklist */}
        <Card className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-[#c6c7c0] pb-3">
            <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#1b1c17]">
              03 // Topic Focus Matrix
            </span>
            <span className="text-xs text-[#767871] font-mono">
              {selectedTopics.length} Selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Array.from(new Set([...AVAILABLE_TOPICS, ...selectedTopics])).map((topic) => {
            const active = selectedTopics.includes(topic);
            return (<button key={topic} type="button" onClick={() => toggleTopic(topic)} className={`flex items-center justify-between p-3 rounded-lg border text-xs text-left transition-all cursor-pointer ${active
                    ? 'bg-[#1a1c18] text-[#ffffff] border-[#1a1c18]'
                    : 'bg-[#f6f4eb] text-[#454742] border-[#c6c7c0] hover:border-[#767871]'}`}>
                  <span className="font-medium truncate">{topic}</span>
                  {active && (<Check className="w-4 h-4 text-[#c6f26a] shrink-0 ml-2"/>)}
                </button>);
        })}
          </div>
        </Card>

        {/* Launch Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-[#767871]">
            <ShieldCheck className="w-4 h-4 text-[#4b6700]"/>
            <span>Autonomous LangGraph State Machine will orchestrate this session</span>
          </div>

          <Button type="submit" variant="primary" size="lg" disabled={loading}>
            {loading ? (<span>Synthesizing Arena...</span>) : (<>
                <span>Enter Interview Arena</span>
                <ArrowRight className="w-4 h-4 ml-1"/>
              </>)}
          </Button>
        </div>
      </form>
    </div>);
};
