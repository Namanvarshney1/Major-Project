import { Router } from 'express';
import { getCollection } from '../db/mongodb.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const user = req.user;
  const targetRole = user.profile?.target_role || 'Senior Backend Engineer (Java & Distributed Systems)';
  const targetLevel = user.profile?.target_level || 'L5/Senior IC';

  const evaluationsColl = getCollection('evaluations');
  const evals = await evaluationsColl.find({ user_id: userId }).toArray();

  if (evals.length === 0) {
    return res.json({
      prescription: {
        ref_id: 'INIT-101',
        title: 'Core Architecture Baseline',
        description: 'You have not completed any interview evaluations yet. Take your first 5-question baseline interview to calibrate your Interview DNA.',
        focus_topics: ['Concurrency & Locks', 'System Architecture'],
        recommended_difficulty: 'mid',
        estimated_mins: 10,
        scenarios_count: 5,
        projected_gain: '+12% CALIBRATION GAIN',
        impact: 'Baseline Calibration',
        history_based: false,
        rationale: 'Establishes baseline radar metrics across Technical Accuracy, Clarity, and Relevance.',
      },
      drills: [
        {
          id: 'drill-1',
          title: 'Database Indexing & B+ Trees',
          topic: 'Database Indexing & B+ Trees',
          difficulty: 'Mid',
          time_mins: 10,
          reason: 'Crucial foundational topic for backend database scalability.',
        },
        {
          id: 'drill-2',
          title: 'Concurrency & Locks',
          topic: 'Concurrency & Locks',
          difficulty: 'Senior',
          time_mins: 12,
          reason: 'Test mutex primitives, race condition mitigation, and thread safety.',
        },
        {
          id: 'drill-3',
          title: 'Distributed Transactions & Sagas',
          topic: 'Distributed Transactions & Sagas',
          difficulty: 'Senior',
          time_mins: 15,
          reason: 'Learn to avoid 2PC bottlenecks and implement asynchronous compensations.',
        },
      ],
      target_role: targetRole,
      target_level: targetLevel,
    });
  }

  // Calculate topic scores to find weakest
  const topicScores = {};
  for (const e of evals) {
    const t = e.topic || 'System Architecture';
    if (!topicScores[t]) topicScores[t] = [];
    topicScores[t].push(e.overall_score || 75);
  }

  const sortedTopics = Object.entries(topicScores)
    .map(([t, scs]) => ({ topic: t, avg: scs.reduce((a, b) => a + b, 0) / scs.length }))
    .sort((a, b) => a.avg - b.avg);

  const weakest = sortedTopics[0]?.topic || 'Concurrency & Memory Models';

  res.json({
    prescription: {
      ref_id: 'DRILL-204',
      title: `Master ${weakest}`,
      description: `Analysis across your submitted interviews indicates prime leverage in ${weakest}. Sharpen your trade-off analysis and mechanical understanding.`,
      focus_topics: [weakest, 'System Architecture'],
      recommended_difficulty: 'senior',
      estimated_mins: 12,
      scenarios_count: 3,
      projected_gain: '+9.2% MASTERY DELTA',
      impact: 'High Priority Remediation',
      history_based: true,
      rationale: `Remediates your lowest-scoring dimension identified in live evaluation records.`,
    },
    drills: [
      {
        id: 'drill-1',
        title: `Deep Dive: ${weakest}`,
        topic: weakest,
        difficulty: 'Senior',
        time_mins: 12,
        reason: 'Addresses missing concepts identified in your recent evaluations.',
      },
      {
        id: 'drill-2',
        title: 'Distributed Consensus & Two-Phase Commits',
        topic: 'Distributed Transactions',
        difficulty: 'Senior',
        time_mins: 15,
        reason: 'Recommended companion topic for senior distributed systems readiness.',
      },
    ],
    target_role: targetRole,
    target_level: targetLevel,
  });
});

export default router;

