import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Clock,
  Check,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Layers,
  Users,
  Briefcase,
  UserCheck,
  Award
} from 'lucide-react';
import {
  SUPPORTED_ROLES,
  ROUND_TYPES,
  QUESTION_COUNT_OPTIONS,
  SENIORITY_LEVELS,
  getTopicsForRoleAndRound
} from './interviewConfig';

export const InterviewSetupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state || {};

  // Form states
  const [jobRole, setJobRole] = useState(navState.job_role || 'Software Engineer');
  const [roundType, setRoundType] = useState(navState.round_type || 'technical');
  const [difficulty, setDifficulty] = useState(navState.difficulty || 'senior');
  const [totalQuestions, setTotalQuestions] = useState(navState.total_questions || 5);
  const [timedMode, setTimedMode] = useState(true);
  const [timeLimitMins, setTimeLimitMins] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Available topics dynamically computed from role + round
  const availableTopics = getTopicsForRoleAndRound(jobRole, roundType);

  // Selected topics initialized with top 3 defaults
  const [selectedTopics, setSelectedTopics] = useState(() => {
    if (navState.topics && Array.isArray(navState.topics) && navState.topics.length > 0) {
      return navState.topics;
    }
    const initial = getTopicsForRoleAndRound(navState.job_role || 'Software Engineer', navState.round_type || 'technical');
    return initial.slice(0, 3);
  });

  // When role or round changes, synchronize topics and prune invalid selections
  useEffect(() => {
    const currentAvailable = getTopicsForRoleAndRound(jobRole, roundType);
    setSelectedTopics((prev) => {
      // Retain already selected topics that are still valid for this role/round
      const retained = prev.filter((t) => currentAvailable.includes(t));
      if (retained.length > 0) {
        return retained;
      }
      // If none retained, provide first 3 topics as default
      return currentAvailable.slice(0, 3);
    });
  }, [jobRole, roundType]);

  const toggleTopic = (topic) => {
    if (selectedTopics.includes(topic)) {
      if (selectedTopics.length > 1) {
        setSelectedTopics(selectedTopics.filter((t) => t !== topic));
      }
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleStartInterview = async (e) => {
    e.preventDefault();
    if (!selectedTopics || selectedTopics.length === 0) {
      setError('Please select at least one topic for your interview focus.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const session = await api.interviews.create({
        job_role: jobRole,
        round_type: roundType,
        interview_type: roundType,
        difficulty: difficulty,
        selected_topics: selectedTopics,
        total_questions: totalQuestions,
        timed_mode: timedMode,
        time_limit_mins: timeLimitMins
      });
      navigate(`/interview/${session.id}`);
    } catch (err) {
      setError(err.message || 'Failed to initialize interview session.');
    } finally {
      setLoading(false);
    }
  };

  const getRoundIcon = (type) => {
    switch (type) {
      case 'hr':
        return <Users className="w-4 h-4" />;
      case 'pi':
        return <UserCheck className="w-4 h-4" />;
      case 'managerial':
        return <Briefcase className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto pb-16">
      {/* Top Breadcrumb & Title */}
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
          Tailor target role, round type, difficulty pacing, and dynamic topic matrices for your next mock.
        </p>
      </div>

      <form onSubmit={handleStartInterview} className="flex flex-col gap-6">
        {error && (
          <div className="p-3 bg-[#ffdad6] border border-[#ba1a1a]/40 text-[#93000a] text-xs rounded-lg font-medium">
            {error}
          </div>
        )}

        {/* 1. Target Engineering Role */}
        <Card className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-[#c6c7c0] pb-3">
            <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#1b1c17]">
              01 // Target Engineering Role
            </span>
            <Badge variant="lime">Required</Badge>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#454742] uppercase tracking-wider">
              Select Engineering Specialization
            </label>
            <select
              className="w-full px-3.5 py-2.5 bg-[#f6f4eb] border border-[#c6c7c0] rounded-lg text-xs font-medium text-[#1b1c17] focus:outline-none focus:border-[#1b1c17] cursor-pointer"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
            >
              {SUPPORTED_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* 2. Type of Round */}
        <Card className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-[#c6c7c0] pb-3">
            <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#1b1c17]">
              02 // Type of Round
            </span>
            <span className="text-xs text-[#767871] font-mono">
              Influences topics, generation &amp; scoring rubric
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ROUND_TYPES.map((round) => {
              const active = roundType === round.id;
              return (
                <button
                  key={round.id}
                  type="button"
                  onClick={() => setRoundType(round.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                    active
                      ? 'bg-[#1b1c17] text-[#ffffff] border-[#1b1c17] shadow-md ring-2 ring-[#c6f26a]'
                      : 'bg-[#f6f4eb] text-[#1b1c17] border-[#c6c7c0] hover:border-[#1b1c17]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className={active ? 'text-[#c6f26a]' : 'text-[#454742]'}>
                        {getRoundIcon(round.id)}
                      </span>
                      <span className="font-bold text-sm tracking-tight">{round.name}</span>
                    </div>
                    {active && <Check className="w-4 h-4 text-[#c6f26a] shrink-0" />}
                  </div>
                  <p className={`text-[11px] leading-relaxed line-clamp-2 ${active ? 'text-[#c6c7c0]' : 'text-[#454742]'}`}>
                    {round.description}
                  </p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* 3. Difficulty Level & Pacing */}
        <Card className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-[#c6c7c0] pb-3">
            <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#1b1c17]">
              03 // Difficulty Level &amp; Pacing
            </span>
            <Badge variant="gray">Calibration</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Seniority */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#454742] uppercase tracking-wider">
                Seniority Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SENIORITY_LEVELS.map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setDifficulty(lvl.id)}
                    className={`py-2 px-2 text-xs font-mono uppercase tracking-wider font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                      difficulty === lvl.id
                        ? 'bg-[#1b1c17] text-[#c6f26a] border-[#1b1c17]'
                        : 'bg-[#f6f4eb] text-[#454742] border-[#c6c7c0] hover:border-[#1b1c17]'
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Questions Dropdown: 1 to 10 */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="question-count-select" className="text-xs font-semibold text-[#454742] uppercase tracking-wider">
                Number of Questions
              </label>
              <select
                id="question-count-select"
                aria-label="Number of Questions"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 bg-[#f6f4eb] border border-[#c6c7c0] rounded-lg text-xs font-medium text-[#1b1c17] focus:outline-none focus:border-[#1b1c17] cursor-pointer"
              >
                {QUESTION_COUNT_OPTIONS.map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Question' : 'Questions'}
                  </option>
                ))}
              </select>
            </div>

            {/* Timer Mode */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#454742] uppercase tracking-wider">
                Timer Mode
              </label>
              <button
                type="button"
                onClick={() => setTimedMode(!timedMode)}
                className={`py-2 px-3 flex items-center justify-center gap-2 text-xs font-mono font-semibold rounded-lg border transition-all cursor-pointer ${
                  timedMode
                    ? 'bg-[#f0eee5] text-[#1b1c17] border-[#4b6700]'
                    : 'bg-[#f6f4eb] text-[#767871] border-[#c6c7c0]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{timedMode ? 'Timed (10m / Q)' : 'Untimed Practice'}</span>
              </button>
            </div>
          </div>
        </Card>

        {/* 4. Dynamic Topic Focus Matrix */}
        <Card className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-[#c6c7c0] pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#1b1c17]">
                04 // Topic Focus Matrix
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f0eee5] text-[#4b6700] border border-[#c6c7c0]">
                {roundType.toUpperCase()} · {jobRole}
              </span>
            </div>
            <span className="text-xs text-[#767871] font-mono font-semibold">
              {selectedTopics.length} of {availableTopics.length} Selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {availableTopics.map((topic) => {
              const active = selectedTopics.includes(topic);
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className={`flex items-center justify-between p-3 rounded-lg border text-xs text-left transition-all cursor-pointer ${
                    active
                      ? 'bg-[#1a1c18] text-[#ffffff] border-[#1a1c18]'
                      : 'bg-[#f6f4eb] text-[#454742] border-[#c6c7c0] hover:border-[#767871]'
                  }`}
                >
                  <span className="font-medium truncate">{topic}</span>
                  {active && <Check className="w-4 h-4 text-[#c6f26a] shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Launch Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-[#767871]">
            <ShieldCheck className="w-4 h-4 text-[#4b6700]" />
            <span>Autonomous AI Calibration Engine will generate {totalQuestions} questions</span>
          </div>

          <Button type="submit" variant="primary" size="lg" disabled={loading}>
            {loading ? (
              <span>Synthesizing Arena...</span>
            ) : (
              <>
                <span>Enter Interview Arena</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
