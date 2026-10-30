import { Router } from 'express';
import { getCollection } from '../db/mongodb.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const ALL_ACHIEVEMENTS = [
  {
    key: 'first_interview_complete',
    title: 'First Step to Mastery',
    description: 'Completed your first full PrepPulse interview session',
    category: 'Milestone',
    xp_reward: 200,
    icon: 'military_tech',
  },
  {
    key: 'streak_3_days',
    title: 'Consistency Catalyst',
    description: 'Maintained an active interview preparation streak for 3 consecutive days',
    category: 'Streak',
    xp_reward: 300,
    icon: 'local_fire_department',
  },
  {
    key: 'high_accuracy_90',
    title: 'Staff Engineer Caliber',
    description: 'Scored 90% or above on technical accuracy in an architectural session',
    category: 'Excellence',
    xp_reward: 500,
    icon: 'verified',
  },
  {
    key: 'concurrency_specialist',
    title: 'Concurrency Virtuoso',
    description: 'Successfully answered 5 Concurrency & Memory Model questions',
    category: 'Topic',
    xp_reward: 400,
    icon: 'terminal',
  },
  {
    key: 'speedy_synthesizer',
    title: 'Rapid Synthesizer',
    description: 'Submitted a comprehensive architectural response within 8 minutes',
    category: 'Pacing',
    xp_reward: 250,
    icon: 'timer',
  },
];

router.get('/achievements', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const achievementsColl = getCollection('achievements');
  const activityColl = getCollection('practice_activity');

  const userAchievements = await achievementsColl.find({ user_id: userId, achievement_key: { $exists: true } }).toArray();
  const unlockedKeys = new Map(userAchievements.map(a => [a.achievement_key, a.earned_at]));

  const xpDoc = await achievementsColl.findOne({ user_id: userId, type: 'total_xp' });
  const totalXp = xpDoc?.value || 350;

  const activities = await activityColl.find({ user_id: userId }).toArray();
  const streakDays = Math.max(1, activities.length);

  const level = Math.max(1, Math.floor(totalXp / 500) + 1);
  const nextLevelXp = level * 500;
  const currentLevelBase = (level - 1) * 500;
  const progressPct = Math.round(((totalXp - currentLevelBase) / 500) * 1000) / 10;

  const achievementsList = ALL_ACHIEVEMENTS.map(ach => {
    const isUnlocked = unlockedKeys.has(ach.key);
    return {
      key: ach.key,
      title: ach.title,
      description: ach.description,
      category: ach.category,
      xp_reward: ach.xp_reward,
      icon: ach.icon,
      unlocked: isUnlocked,
      earned_at: isUnlocked ? unlockedKeys.get(ach.key) : null,
    };
  });

  res.json({
    total_xp: totalXp,
    level,
    next_level_xp: nextLevelXp,
    level_progress_percentage: Math.min(100.0, Math.max(0.0, progressPct)),
    streak_days: streakDays,
    achievements: achievementsList,
  });
});

export default router;

