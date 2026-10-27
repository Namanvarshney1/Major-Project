import React, { useState, useEffect } from 'react';
import { Zap, Flame, CheckCircle2, Lock, Trophy, Target } from 'lucide-react';
import { api } from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
export const AchievementsPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterCat, setFilterCat] = useState('all');
    useEffect(() => {
        const fetchAchievements = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await api.gamification.getAchievements();
                setData(res);
            }
            catch (err) {
                console.error('Failed to load achievements:', err);
                setError(err.message || 'Unable to retrieve gamification telemetry.');
            }
            finally {
                setLoading(false);
            }
        };
        fetchAchievements();
    }, []);
    if (loading) {
        return (<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
        <p className="font-mono text-xs uppercase tracking-widest text-on-surface-variant">
          Computing XP Telemetry & Streak Metrics...
        </p>
      </div>);
    }
    if (error || !data) {
        return (<div className="max-w-xl mx-auto my-12 p-8 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-center">
        <Trophy className="w-12 h-12 text-error mx-auto mb-4"/>
        <h2 className="text-xl font-bold tracking-tight mb-2">Telemetry Offline</h2>
        <p className="text-sm text-on-surface-variant mb-6">{error || 'Could not load achievements.'}</p>
        <Button onClick={() => window.location.reload()} variant="primary">
          Retry
        </Button>
      </div>);
    }
    const achievementsList = data.achievements || [];
    const unlockedCount = achievementsList.filter((a) => a.unlocked).length;
    const categories = ['all', ...Array.from(new Set(achievementsList.map((a) => a.category)))];
    const filteredBadges = filterCat === 'all'
        ? achievementsList
        : achievementsList.filter((a) => a.category === filterCat);
    return (<div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-secondary font-bold">
              Engineering Progression System
            </span>
            <span className="text-xs text-outline-variant">•</span>
            <span className="font-mono text-[10px] text-on-surface-variant uppercase">
              Level {data.level} Engineer
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <Trophy className="w-7 h-7 text-secondary"/>
            Achievements & Progression
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-[11px] uppercase font-bold tracking-wider">
            {unlockedCount} of {achievementsList.length} Badges Unlocked
          </Badge>
        </div>
      </div>

      {/* Hero XP & Progression Banner */}
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-8 space-y-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-primary text-on-primary font-mono text-xs font-bold uppercase rounded-lg">
              Level {data.level || 1}
            </span>
            <span className="font-mono text-xs text-secondary font-bold flex items-center gap-1">
              <Zap className="w-4 h-4 fill-secondary"/> {data.total_xp || 0} Total XP Earned
            </span>
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Progress to Level {(data.level || 1) + 1}
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Earn XP by submitting mock answers, scoring above 80%, and completing remediation drills.
            </p>
          </div>

          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-on-surface-variant">Level Progress</span>
              <span className="font-bold">
                {Math.round(data.level_progress_percentage || 0)}% ({data.total_xp || 0} / {data.next_level_xp || 1000} XP)
              </span>
            </div>
            <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
              <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(5, data.level_progress_percentage || 0))}%` }}/>
            </div>
          </div>
        </div>

        {/* Streak Pill Card */}
        <div className="md:col-span-4 bg-surface-container-low border border-outline-variant/30 rounded-xl p-6 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-secondary-container/40 flex items-center justify-center mx-auto text-secondary">
            <Flame className="w-6 h-6 fill-secondary"/>
          </div>
          <span className="text-3xl font-black font-mono tracking-tight block">
            {data.streak_days} Days
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant block font-bold">
            Daily Practice Streak
          </span>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Practice at least once every 24 hours to preserve your cognitive streak.
          </p>
        </div>
      </div>

      {/* Daily Challenges */}
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
            <Target className="w-4 h-4 text-secondary"/>
            Active Practice Directives
          </h2>
          <span className="text-xs font-mono text-on-surface-variant">Resets in 12h</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/30 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold block">Complete 1 System Design Mock</span>
              <p className="text-[11px] text-on-surface-variant">
                Synthesize architecture tradeoffs and caching layers.
              </p>
            </div>
            <Badge variant="secondary" className="font-mono text-[10px] font-bold">
              +150 XP
            </Badge>
          </div>

          <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/30 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold block">Achieve ≥80% on a Coding Question</span>
              <p className="text-[11px] text-on-surface-variant">
                Address all boundary conditions and algorithmic complexity.
              </p>
            </div>
            <Badge variant="secondary" className="font-mono text-[10px] font-bold">
              +100 XP
            </Badge>
          </div>
        </div>
      </div>

      {/* Badges Matrix */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/20 pb-3">
          <h2 className="text-lg font-bold tracking-tight">Milestone & Mastery Badges</h2>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((c) => (<button key={c} onClick={() => setFilterCat(c)} className={`px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${filterCat === c
                ? 'bg-primary text-on-primary font-bold'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
                {c}
              </button>))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredBadges.map((badge) => (<div key={badge.key} className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-4 ${badge.unlocked
                ? 'bg-surface-container-lowest border-secondary/40 shadow-none'
                : 'bg-surface-container-lowest border-outline-variant/30 opacity-60'}`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${badge.unlocked
                ? 'bg-secondary-container text-on-secondary-fixed'
                : 'bg-surface-container text-on-surface-variant'}`}>
                    {badge.unlocked ? (<Trophy className="w-5 h-5"/>) : (<Lock className="w-4 h-4"/>)}
                  </div>

                  <span className="font-mono text-[10px] font-bold uppercase text-secondary">
                    +{badge.xp_reward} XP
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold tracking-tight text-on-surface">
                    {badge.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    {badge.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-[10px] font-mono uppercase">
                <span className="text-on-surface-variant">{badge.category}</span>
                {badge.unlocked ? (<span className="text-secondary font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3"/> Unlocked
                  </span>) : (<span className="text-on-surface-variant">Locked</span>)}
              </div>
            </div>))}
        </div>
      </div>
    </div>);
};
