import { Router } from 'express';
import { getCollection } from '../db/mongodb.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const user = req.user;
  const targetRole = user.profile?.target_role || 'Senior Backend Engineer (Java & Distributed Systems)';
  const targetLevel = user.profile?.target_level || 'L5/Senior IC';

  const interviewsColl = getCollection('interviews');
  const evaluationsColl = getCollection('evaluations');
  const achievementsColl = getCollection('achievements');
  const activityColl = getCollection('practice_activity');

  const completedInterviews = await interviewsColl.find({ user_id: userId, status: 'completed' }).toArray();
  const completedCount = completedInterviews.length;

  const allEvals = await evaluationsColl.find({ user_id: userId }).toArray();
  let avgScore = 0.0;
  if (allEvals.length > 0) {
    avgScore = Math.round((allEvals.reduce((acc, e) => acc + (e.overall_score || 0), 0) / allEvals.length) * 10) / 10;
  } else if (completedCount > 0) {
    const scores = completedInterviews.map(i => i.final_score).filter(s => s !== undefined && s !== null);
    avgScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0.0;
  }

  // Calculate XP & Level
  const xpDoc = await achievementsColl.findOne({ user_id: userId, type: 'total_xp' });
  const totalXp = xpDoc?.value || (completedCount * 750 + allEvals.length * 100);
  const level = Math.max(1, Math.floor(totalXp / 500) + 1);

  // Calculate Streak
  const activities = await activityColl.find({ user_id: userId }).sort({ date: -1 }).toArray();
  const streakDays = Math.max(1, activities.length);

  // Active session
  const activeSession = await interviewsColl.findOne({ user_id: userId, status: 'in_progress' });
  let formattedActive = null;
  if (activeSession) {
    formattedActive = {
      id: activeSession._id.toString(),
      job_role: activeSession.job_role || targetRole,
      topics: (activeSession.selected_topics || []).slice(0, 2).join(', '),
      current_question: (activeSession.current_question_index || 0) + 1,
      total_questions: activeSession.total_questions || 5,
    };
  }

  // Topic metrics
  const topicScores = {};
  for (const e of allEvals) {
    const t = e.topic || 'System Architecture';
    if (!topicScores[t]) topicScores[t] = [];
    topicScores[t].push(e.overall_score || 75);
  }

  let improvingCompetency = 'JVM Internals & Systems';
  let weakestAnchor = 'Distributed Transactions (2PC vs Saga)';
  if (Object.keys(topicScores).length > 0) {
    const sorted = Object.entries(topicScores)
      .map(([t, scs]) => ({ topic: t, avg: scs.reduce((a, b) => a + b, 0) / scs.length }))
      .sort((a, b) => a.avg - b.avg);
    weakestAnchor = sorted[0].topic;
    improvingCompetency = sorted[sorted.length - 1].topic;
  }

  // Recent evaluations / sessions table
  const recentSessions = await interviewsColl.find({ user_id: userId }).sort({ created_at: -1 }).limit(5).toArray();
  const formattedRecent = recentSessions.map(s => {
    const sc = s.final_score;
    const label = sc && sc >= 85 ? `${Math.round(sc)}% · Superior` : sc && sc >= 75 ? `${Math.round(sc)}% · Proficient` : 'In Progress';
    const ts = s.created_at instanceof Date ? s.created_at.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent';
    return {
      id: s._id.toString(),
      role: s.job_role || targetRole,
      topics: (s.selected_topics || ['General']).join(', '),
      mode: (s.interview_type || 'technical').charAt(0).toUpperCase() + (s.interview_type || 'technical').slice(1),
      completion: `${s.current_question_index || 0} / ${s.total_questions || 5}`,
      timestamp: ts,
      result: label,
      status: s.status || 'in_progress',
    };
  });

  // Velocity chart points
  const velocityChart = [];
  if (allEvals.length >= 3) {
    allEvals.slice(-10).forEach((ev, idx) => {
      const dt = ev.created_at instanceof Date ? ev.created_at.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `Q${idx + 1}`;
      velocityChart.push({
        date: dt,
        score: Math.round(ev.overall_score || 75),
        benchmark: 80,
      });
    });
  } else {
    const baseDates = ['May 01', 'May 07', 'May 14', 'May 21', 'May 26', 'May 28'];
    const baseScores = [68, 74, 76, 82, 88, Math.max(85, Math.round(avgScore) || 86)];
    baseDates.forEach((d, i) => {
      velocityChart.push({ date: d, score: baseScores[i], benchmark: 80 });
    });
  }

  const aiCoachPrescription = {
    ref_id: '#GC-702',
    title: `Strengthen ${weakestAnchor}`,
    description: `Your evaluations highlight key opportunities when reasoning through ${weakestAnchor}. Complete a targeted 10-minute focus sprint to sharpen your trade-offs.`,
    estimated_mins: 10,
    scenarios_count: 3,
    projected_gain: '+8.4% PROJECTED MASTERY',
    impact: 'High Impact',
    history_based: allEvals.length > 0,
  };

  res.json({
    user_name: user.name,
    target_role: targetRole,
    target_level: targetLevel,
    streak_days: streakDays,
    interviews_completed: completedCount,
    average_score: avgScore,
    improving_competency: improvingCompetency,
    improving_delta: '+14% Δ',
    weakest_anchor: weakestAnchor,
    active_session: formattedActive,
    ai_coach_prescription: aiCoachPrescription,
    recent_evaluations: formattedRecent,
    velocity_chart: velocityChart,
    total_xp: totalXp,
    level,
  });
});

export default router;

