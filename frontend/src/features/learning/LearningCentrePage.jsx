import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
const TOPICS_LIBRARY = [
    {
        id: 'db-indexing',
        title: 'B-Tree & LSM-Tree Database Indexing',
        category: 'Databases & Storage',
        readTime: '6 min read',
        summary: 'Understanding how composite indexes, clustered vs secondary keys, and B+Tree range traversals prevent full table scans in high-concurrency systems.',
        keyPoints: [
            'Leftmost prefix matching rule for composite indexes (e.g. INDEX(a, b, c)).',
            'Covering indexes eliminate secondary lookup trips to clustered index storage.',
            'LSM-Trees trade sequential append log writes for background compaction overhead.',
        ],
    },
    {
        id: 'distributed-transactions',
        title: 'Sagas vs Two-Phase Commit (2PC)',
        category: 'System Architecture',
        readTime: '8 min read',
        summary: 'Managing consistency across microservice boundaries without locking network resources via orchestrator and choreography saga patterns.',
        keyPoints: [
            '2PC introduces single points of coordinator failure and synchronous locking.',
            'Sagas achieve eventual consistency through backward-compensating transactions.',
            'Idempotency keys are mandatory to prevent duplicate financial or state mutations.',
        ],
    },
    {
        id: 'concurrency-locks',
        title: 'Optimistic vs Pessimistic Concurrency Control',
        category: 'Backend Engineering',
        readTime: '5 min read',
        summary: 'Handling race conditions under high contention using database version columns, atomic CAS operations, and distributed Redis locks (Redlock).',
        keyPoints: [
            'Optimistic locking (version/timestamp) excels when read frequency dominates writes.',
            'Pessimistic locking (SELECT FOR UPDATE) avoids starvation during high contention.',
            'Distributed locks require short TTLs with automatic background renewal heartbeats.',
        ],
    },
    {
        id: 'behavioral-star',
        title: 'The STAR Framework for Senior Leadership',
        category: 'Behavioral & Leadership',
        readTime: '4 min read',
        summary: 'Structuring behavioral narratives for Amazon Leadership Principles, Google Googlyness, and conflict resolution scenarios.',
        keyPoints: [
            'Situation: Ground the operational context in 2 concise sentences.',
            'Task: Clearly distinguish your personal ownership from overall team mandates.',
            'Action: Detail the technical decisions, risk calculations, and tradeoffs made.',
            'Result: Quantify impact using metrics (e.g. "Reduced P99 latency by 42%").',
        ],
    },
];
const CURATED_RESOURCES = [
    {
        title: 'The System Design Primer (Donne Martin)',
        url: 'https://github.com/donnemartin/system-design-primer',
        tag: 'Architecture Standard',
        desc: 'An authoritative open-source collection for scalable system architecture interviews.',
    },
    {
        title: 'Patterns of Distributed Systems (Martin Fowler)',
        url: 'https://martinfowler.com/articles/patterns-of-distributed-systems/',
        tag: 'Distributed Systems',
        desc: 'Deep dives into state machines, consensus, write-ahead logs, and gossip protocols.',
    },
    {
        title: 'High Scalability Architectural Case Studies',
        url: 'http://highscalability.com/',
        tag: 'Production Architecture',
        desc: 'Real production post-mortems and scaling blueprints from Uber, Netflix, and Discord.',
    },
];
export const LearningCentrePage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('cheat-sheets');
    return (<div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-secondary font-bold">
              Engineering Knowledge Base
            </span>
            <span className="text-xs text-outline-variant">•</span>
            <span className="font-mono text-[10px] text-on-surface-variant uppercase">
              Curated Revision Decks
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-secondary"/>
            Learning Centre
          </h1>
        </div>

        <Button variant="primary" onClick={() => navigate('/interview/setup')} className="gap-2">
          Practice What You Learn <ArrowRight className="w-4 h-4"/>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-2">
        <button onClick={() => setActiveTab('cheat-sheets')} className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${activeTab === 'cheat-sheets'
            ? 'bg-primary text-on-primary font-bold'
            : 'hover:bg-surface-container text-on-surface-variant'}`}>
          High-Yield Cheat Sheets
        </button>
        <button onClick={() => setActiveTab('remediation')} className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${activeTab === 'remediation'
            ? 'bg-primary text-on-primary font-bold'
            : 'hover:bg-surface-container text-on-surface-variant'}`}>
          Targeted Quizzes
        </button>
        <button onClick={() => setActiveTab('resources')} className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${activeTab === 'resources'
            ? 'bg-primary text-on-primary font-bold'
            : 'hover:bg-surface-container text-on-surface-variant'}`}>
          Curated Literature
        </button>
      </div>

      {/* Cheat Sheets Deck */}
      {activeTab === 'cheat-sheets' && (<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TOPICS_LIBRARY.map((topic) => (<div key={topic.id} className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 flex flex-col justify-between hover:border-outline-variant transition-all space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-wider">
                    {topic.category}
                  </Badge>
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase">
                    {topic.readTime}
                  </span>
                </div>

                <h3 className="text-base font-bold tracking-tight">{topic.title}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">{topic.summary}</p>

                <div className="p-3.5 bg-surface-container rounded-xl border border-outline-variant/20 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-on-surface-variant block">
                    Core Architectural Takeaways
                  </span>
                  <ul className="text-xs space-y-1 text-on-surface list-disc list-inside">
                    {topic.keyPoints.map((kp, i) => (<li key={i}>{kp}</li>))}
                  </ul>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => navigate('/interview/setup', {
                    state: { topic: topic.title, interview_type: 'technical' },
                })} className="gap-2 text-xs font-semibold">
                  Drill This Topic <ArrowRight className="w-3.5 h-3.5"/>
                </Button>
              </div>
            </div>))}
        </div>)}

      {/* Targeted Quizzes Tab */}
      {activeTab === 'remediation' && (<div className="space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-secondary"/>
              Adaptive Micro-Drills (5 Questions, 10 Minutes)
            </h2>
            <p className="text-xs text-on-surface-variant max-w-2xl leading-relaxed">
              Rapid targeted quizzes focused on specific failure modes. Ideal for daily practice sessions to maintain cognitive readiness.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-5 bg-surface-container rounded-xl border border-outline-variant/30 space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-secondary font-bold block">
                  Drill #01
                </span>
                <h4 className="text-sm font-bold">SQL Indexing & Execution Plans</h4>
                <p className="text-xs text-on-surface-variant">
                  Evaluate composite index ordering, index seek vs scan, and deadlock resolution.
                </p>
                <Button variant="primary" size="sm" onClick={() => navigate('/interview/setup', {
                state: { topic: 'SQL & Database Indexing', total_questions: 3 },
            })} className="w-full justify-center gap-2 mt-2">
                  Start Drill
                </Button>
              </div>

              <div className="p-5 bg-surface-container rounded-xl border border-outline-variant/30 space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-secondary font-bold block">
                  Drill #02
                </span>
                <h4 className="text-sm font-bold">Microservice Resiliency Patterns</h4>
                <p className="text-xs text-on-surface-variant">
                  Master circuit breakers, retries with exponential backoff & jitter, and bulkheads.
                </p>
                <Button variant="primary" size="sm" onClick={() => navigate('/interview/setup', {
                state: { topic: 'System Design', total_questions: 3 },
            })} className="w-full justify-center gap-2 mt-2">
                  Start Drill
                </Button>
              </div>

              <div className="p-5 bg-surface-container rounded-xl border border-outline-variant/30 space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-secondary font-bold block">
                  Drill #03
                </span>
                <h4 className="text-sm font-bold">Java Collections & Thread Safety</h4>
                <p className="text-xs text-on-surface-variant">
                  ConcurrentHashMap bucket locking, volatile visibility, and ReentrantLock idioms.
                </p>
                <Button variant="primary" size="sm" onClick={() => navigate('/interview/setup', {
                state: { topic: 'Java Collections', total_questions: 3 },
            })} className="w-full justify-center gap-2 mt-2">
                  Start Drill
                </Button>
              </div>
            </div>
          </div>
        </div>)}

      {/* Curated Literature Tab */}
      {activeTab === 'resources' && (<div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CURATED_RESOURCES.map((res, i) => (<a key={i} href={res.url} target="_blank" rel="noreferrer" className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 hover:border-outline-variant transition-all space-y-3 flex flex-col justify-between group">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-secondary font-bold">
                      {res.tag}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-primary transition-colors"/>
                  </div>
                  <h3 className="text-sm font-bold tracking-tight group-hover:text-primary transition-colors">
                    {res.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{res.desc}</p>
                </div>

                <div className="pt-3 border-t border-outline-variant/20 text-[10px] font-mono text-on-surface-variant uppercase flex items-center gap-1">
                  <span>Visit External Resource</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform"/>
                </div>
              </a>))}
          </div>
        </div>)}
    </div>);
};
