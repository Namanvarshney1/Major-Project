import { Router } from 'express';
import { getCollection } from '../db/mongodb.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const status = req.query.status;
  const difficulty = req.query.difficulty;
  const role = req.query.role;
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '20', 10)));
  const skip = Math.max(0, parseInt(req.query.skip || '0', 10));

  const interviewsColl = getCollection('interviews');
  const query = { user_id: userId };
  if (status) query.status = status;

  const total = await interviewsColl.countDocuments(query);
  const rawItems = await interviewsColl
    .find(query)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  let filtered = rawItems.map(item => ({
    ...item,
    id: item._id.toString(),
  }));

  if (difficulty) {
    filtered = filtered.filter(i => i.difficulty === difficulty);
  }
  if (role) {
    filtered = filtered.filter(i => (i.job_role || '').toLowerCase().includes(role.toLowerCase()));
  }

  res.json({
    total,
    items: filtered,
    limit,
    skip,
  });
});

export default router;

