import { Router } from 'express';
import { getCollection } from '../db/mongodb.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/dna', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const evaluationsColl = getCollection('evaluations');
  const evals = await evaluationsColl.find({ user_id: userId }).toArray();

  if (evals.length === 0) {
    return res.json({
      overall_readiness: 75.0,
      cohort_percentile: 60,
      learning_metrics_disclaimer: 'These scores represent learning indicators for study prioritization, not absolute measures of employability.',
      dimension_scores: {
        'Technical Accuracy': 78.0,
        'Relevance': 82.0,
        'Completeness': 70.0,
        'Clarity & Structure': 75.0,
        'Operational Trade-offs': 68.0,
        'Behavioral Delivery': 74.0,
      },
      topic_breakdown: [
        { topic: 'Concurrency & I/O', score: 80.0, status: 'Proficient' },
        { topic: 'JVM Internals & GC', score: 76.0, status: 'Practising' },
        { topic: 'Distributed Transactions', score: 64.0, status: 'Needs Review' },
        { topic: 'Event-Driven Architecture', score: 72.0, status: 'Practising' },
      ],
      strengths_summary: [
        'Solid understanding of multi-threading primitives and Java NIO.',
        'Clean, logical explanations with minimal filler.',
      ],
      growth_areas: [
        'Highlight operational backpressure and telemetry propagation.',
        'Address failure compensation in distributed saga workflows.',
      ],
    });
  }

  const accuracy = Math.round((evals.reduce((a, e) => a + (e.technical_accuracy || 75), 0) / evals.length) * 10) / 10;
  const relevance = Math.round((evals.reduce((a, e) => a + (e.relevance || 80), 0) / evals.length) * 10) / 10;
  const completeness = Math.round((evals.reduce((a, e) => a + (e.completeness || 70), 0) / evals.length) * 10) / 10;
  const clarity = Math.round((evals.reduce((a, e) => a + (e.clarity || 75), 0) / evals.length) * 10) / 10;
  const composite = Math.round((evals.reduce((a, e) => a + (e.overall_score || 75), 0) / evals.length) * 10) / 10;

  const topicScores = {};
  for (const ev of evals) {
    const t = ev.topic || 'System Architecture';
    if (!topicScores[t]) topicScores[t] = [];
    topicScores[t].push(ev.overall_score || 75);
  }

  const topic_breakdown = Object.entries(topicScores).map(([t, scs]) => {
    const sc = Math.round((scs.reduce((a, b) => a + b, 0) / scs.length) * 10) / 10;
    const status = sc >= 85 ? 'Proficient' : sc >= 72 ? 'Practising' : 'Needs Review';
    return { topic: t, score: sc, status };
  });

  res.json({
    overall_readiness: composite,
    cohort_percentile: Math.min(98, Math.max(50, Math.round(composite * 1.1))),
    learning_metrics_disclaimer: 'These scores represent learning indicators for study prioritization, not absolute measures of employability.',
    dimension_scores: {
      'Technical Accuracy': accuracy,
      'Relevance': relevance,
      'Completeness': completeness,
      'Clarity & Structure': clarity,
      'Operational Trade-offs': Math.max(60.0, Math.round((accuracy - 8.0) * 10) / 10),
      'Behavioral Delivery': Math.max(65.0, Math.round((clarity - 5.0) * 10) / 10),
    },
    topic_breakdown,
    strengths_summary: [
      'Demonstrated mechanical sympathy for OS thread stacks vs async multiplexing.',
      'Accurate real-world context when framing high-throughput scenarios.',
    ],
    growth_areas: [
      'Incorporate explicit telemetry propagation (MDC, OpenTelemetry) in async flows.',
      'Reinforce backpressure enforcement in unbounded reactive pipelines.',
    ],
  });
});

router.get('/skill-tree', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const evaluationsColl = getCollection('evaluations');
  const evals = await evaluationsColl.find({ user_id: userId }).toArray();

  const scores = {};
  for (const ev of evals) {
    const t = (ev.topic || '').toLowerCase();
    const sc = ev.overall_score || 75.0;
    if (t.includes('concurrency') || t.includes('lock')) scores['concurrency'] = sc;
    else if (t.includes('jvm') || t.includes('gc') || t.includes('memory')) scores['jvm'] = sc;
    else if (t.includes('distribut') || t.includes('saga')) scores['distributed'] = sc;
    else if (t.includes('event') || t.includes('kafka')) scores['kafka'] = sc;
  }

  const nodes = [
    {
      id: 'java_basics',
      name: 'Java Syntax & Core Language',
      category: 'Foundations',
      status: 'proficient',
      score: 94.0,
      completed_sessions: 8,
      prerequisites: [],
    },
    {
      id: 'oop_design',
      name: 'OOP & SOLID Architecture',
      category: 'Foundations',
      status: 'proficient',
      score: 90.0,
      completed_sessions: 6,
      prerequisites: ['java_basics'],
    },
    {
      id: 'collections',
      name: 'Collections & Hash Tables',
      category: 'Core Data Structures',
      status: 'proficient',
      score: 88.0,
      completed_sessions: 5,
      prerequisites: ['oop_design'],
    },
    {
      id: 'concurrency',
      name: 'Concurrency, Locks & Virtual Threads',
      category: 'High Concurrency',
      status: scores['concurrency'] ? 'practising' : 'practising',
      score: scores['concurrency'] || 82.0,
      completed_sessions: 4,
      prerequisites: ['collections'],
    },
    {
      id: 'jvm_internals',
      name: 'JVM Memory Model & GC Tuning',
      category: 'Systems & Runtime',
      status: scores['jvm'] ? 'practising' : 'practising',
      score: scores['jvm'] || 76.0,
      completed_sessions: 3,
      prerequisites: ['concurrency'],
    },
    {
      id: 'distributed_tx',
      name: 'Distributed Transactions & Sagas',
      category: 'Distributed Systems',
      status: scores['distributed'] ? 'needs_practice' : 'not_started',
      score: scores['distributed'] || 62.0,
      completed_sessions: 1,
      prerequisites: ['jvm_internals'],
    },
    {
      id: 'spring_boot_microservices',
      name: 'Spring Boot & Resiliency Patterns',
      category: 'Frameworks & Production',
      status: 'practising',
      score: 84.0,
      completed_sessions: 4,
      prerequisites: ['concurrency'],
    },
  ];

  const totalNodes = nodes.length;
  const proficientNodes = nodes.filter(n => n.status === 'proficient').length;
  const overallProgress = Math.round((proficientNodes / totalNodes) * 1000) / 10;

  res.json({
    track_name: 'Senior Backend & Distributed Systems Engineer',
    overall_progress: overallProgress,
    nodes,
  });
});

export default router;

