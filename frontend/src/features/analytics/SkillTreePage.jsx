import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitFork, Play } from 'lucide-react';
import { api } from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
export const SkillTreePage = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    useEffect(() => {
        const fetchTree = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await api.analytics.getSkillTree();
                setData(res);
            }
            catch (err) {
                console.error('Failed to load Skill Tree:', err);
                setError(err.message || 'Unable to load curriculum skill tree.');
            }
            finally {
                setLoading(false);
            }
        };
        fetchTree();
    }, []);
    const handleLaunchDrill = (topicName) => {
        navigate('/interview/setup', {
            state: {
                topic: topicName,
                interview_type: 'technical',
            },
        });
    };
    if (loading) {
        return (<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
        <p className="font-mono text-xs uppercase tracking-widest text-on-surface-variant">
          Traversing Curriculum Graph & Prerequisites...
        </p>
      </div>);
    }
    if (error || !data) {
        return (<div className="max-w-xl mx-auto my-12 p-8 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-center">
        <GitFork className="w-12 h-12 text-error mx-auto mb-4"/>
        <h2 className="text-xl font-bold tracking-tight mb-2">Skill Tree Offline</h2>
        <p className="text-sm text-on-surface-variant mb-6">{error || 'Could not load skill tree.'}</p>
        <Button onClick={() => window.location.reload()} variant="primary">
          Retry
        </Button>
      </div>);
    }
    const categories = ['all', ...Array.from(new Set((data.nodes || []).map((n) => n.category)))];
    const filteredNodes = selectedCategory === 'all'
        ? (data.nodes || [])
        : (data.nodes || []).filter((n) => n.category === selectedCategory);
    return (<div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-secondary font-bold">
              Competency Directed Acyclic Graph (DAG)
            </span>
            <span className="text-xs text-outline-variant">•</span>
            <span className="font-mono text-[10px] text-on-surface-variant uppercase">
              {data.track_name}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <GitFork className="w-7 h-7 text-secondary rotate-90"/>
            Skill Tree Roadmap
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-[11px] uppercase font-bold tracking-wider">
            Track Mastery: {Math.round(data.overall_progress || 0)}%
          </Badge>
        </div>
      </div>

      {/* Track Progress Overview */}
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">{data.track_name}</h2>
            <p className="text-xs text-on-surface-variant">
              Systematic learning roadmap. Master prerequisite nodes to unlock advanced architectural domains.
            </p>
          </div>
          <div className="text-right sm:text-right">
            <span className="text-2xl font-black font-mono">
              {Math.round(data.overall_progress || 0)}%
            </span>
            <span className="font-mono text-xs text-on-surface-variant block uppercase">Completion</span>
          </div>
        </div>

        <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
          <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(5, data.overall_progress || 0))}%` }}/>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {categories.map((cat) => (<button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${selectedCategory === cat
                ? 'bg-primary text-on-primary font-bold'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'}`}>
              {cat}
            </button>))}
        </div>
      </div>

      {/* Nodes Timeline / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredNodes.map((node, index) => {
            const isProficient = node.status === 'proficient';
            const isPractising = node.status === 'practising';
            const isNeedsPractice = node.status === 'needs_practice';
            const isNotStarted = node.status === 'not_started';
            return (<div key={node.id} className={`bg-surface-container-lowest border rounded-xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-sm ${isProficient
                    ? 'border-secondary/40 shadow-none'
                    : isPractising
                        ? 'border-outline-variant/60 shadow-none'
                        : isNeedsPractice
                            ? 'border-error/40'
                            : 'border-outline-variant/30 opacity-75'}`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant">
                    Step {index + 1} • {node.category}
                  </span>
                  {isProficient && (<Badge variant="secondary" className="text-[9px] uppercase font-bold">
                      Proficient
                    </Badge>)}
                  {isPractising && (<Badge variant="outline" className="text-[9px] uppercase font-mono">
                      In Practice
                    </Badge>)}
                  {isNeedsPractice && (<Badge variant="destructive" className="text-[9px] uppercase font-mono">
                      Needs Practice
                    </Badge>)}
                  {isNotStarted && (<Badge variant="outline" className="text-[9px] uppercase font-mono text-outline">
                      Not Started
                    </Badge>)}
                </div>

                <div>
                  <h3 className="text-base font-bold tracking-tight text-on-surface">{node.name}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs font-mono text-on-surface-variant">
                    <span>Score: {node.score > 0 ? `${Math.round(node.score)}%` : '--'}</span>
                    <span>•</span>
                    <span>{node.completed_sessions} Sessions</span>
                  </div>
                </div>

                {node.prerequisites && node.prerequisites.length > 0 && (<div className="p-2.5 bg-surface-container rounded-lg border border-outline-variant/20">
                    <span className="text-[9px] font-mono uppercase text-on-surface-variant block font-bold mb-1">
                      Prerequisites:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {node.prerequisites.map((req, i) => (<span key={i} className="px-1.5 py-0.5 bg-surface-container-lowest rounded text-[10px] font-mono text-on-surface-variant">
                          {req}
                        </span>))}
                    </div>
                  </div>)}
              </div>

              <div className="pt-5 mt-4 border-t border-outline-variant/20 flex items-center justify-between">
                <div className="w-24 bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${isProficient ? 'bg-secondary' : isPractising ? 'bg-on-surface' : 'bg-outline-variant'}`} style={{ width: `${Math.min(100, Math.max(5, node.score))}%` }}/>
                </div>

                <Button variant={isProficient ? 'outline' : 'primary'} size="sm" onClick={() => handleLaunchDrill(node.name)} className="gap-1.5 text-xs font-semibold">
                  <Play className="w-3 h-3"/>
                  {isProficient ? 'Refine' : isPractising ? 'Resume' : 'Start'}
                </Button>
              </div>
            </div>);
        })}
      </div>
    </div>);
};
