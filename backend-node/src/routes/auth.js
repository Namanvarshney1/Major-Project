import { Router } from 'express';
import { z } from 'zod';
import { getCollection } from '../db/mongodb.js';
import { hashPassword, verifyPassword, createAccessToken } from '../services/security.js';
import { requireAuth } from '../middleware/auth.js';
import { ObjectId } from 'mongodb';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  profile: z.object({
    target_role: z.string().optional(),
    target_level: z.string().optional(),
    experience_years: z.number().min(0).max(50).optional(),
    primary_language: z.string().optional(),
  }).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const updateProfileSchema = z.object({
  name: z.string().optional(),
  profile: z.object({
    target_role: z.string().optional(),
    target_level: z.string().optional(),
    experience_years: z.number().optional(),
    primary_language: z.string().optional(),
  }).optional(),
  preferences: z.object({
    theme: z.string().optional(),
    timed_mode_default: z.boolean().optional(),
    sound_enabled: z.boolean().optional(),
  }).optional(),
});

router.post('/register', async (req, res) => {
  const parseRes = registerSchema.safeParse(req.body);
  if (!parseRes.success) {
    return res.status(422).json({ detail: parseRes.error.errors });
  }

  const { name, email, password, profile } = parseRes.data;
  const usersColl = getCollection('users');

  const existing = await usersColl.findOne({ email });
  if (existing) {
    return res.status(400).json({ detail: 'A user with this email address already exists.' });
  }

  const pwdHash = await hashPassword(password);
  const now = new Date();
  const userDoc = {
    name,
    email,
    password_hash: pwdHash,
    profile: {
      target_role: profile?.target_role || 'Senior Backend Engineer (Java & Distributed Systems)',
      target_level: profile?.target_level || 'L5/Senior IC',
      experience_years: profile?.experience_years ?? 4,
      primary_language: profile?.primary_language || 'Java',
    },
    preferences: {
      theme: 'light',
      timed_mode_default: true,
      sound_enabled: true,
    },
    created_at: now,
    updated_at: now,
  };

  const insertRes = await usersColl.insertOne(userDoc);
  const userId = insertRes.insertedId.toString();

  const token = createAccessToken({ sub: userId, email });
  res.status(201).json({
    access_token: token,
    token_type: 'bearer',
    user: {
      id: userId,
      name: userDoc.name,
      email: userDoc.email,
      profile: userDoc.profile,
      preferences: userDoc.preferences,
      created_at: userDoc.created_at,
      updated_at: userDoc.updated_at,
    },
  });
});

router.post('/login', async (req, res) => {
  const parseRes = loginSchema.safeParse(req.body);
  if (!parseRes.success) {
    return res.status(422).json({ detail: parseRes.error.errors });
  }

  const { email, password } = parseRes.data;
  const usersColl = getCollection('users');
  const user = await usersColl.findOne({ email });

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ detail: 'Invalid credentials. Please verify your email and password.' });
  }

  const userId = user._id.toString();
  const token = createAccessToken({ sub: userId, email });

  res.json({
    access_token: token,
    token_type: 'bearer',
    user: {
      id: userId,
      name: user.name,
      email: user.email,
      profile: user.profile || {},
      preferences: user.preferences || {},
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
  });
});

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

router.put('/me', requireAuth, async (req, res) => {
  const parseRes = updateProfileSchema.safeParse(req.body);
  if (!parseRes.success) {
    return res.status(422).json({ detail: parseRes.error.errors });
  }

  const updateData = parseRes.data;
  const usersColl = getCollection('users');
  let userQuery = { email: req.user.email };
  try {
    userQuery = { _id: new ObjectId(req.user.id) };
  } catch {}

  const setObj = { updated_at: new Date() };
  if (updateData.name) setObj.name = updateData.name;
  if (updateData.profile) {
    for (const [k, v] of Object.entries(updateData.profile)) {
      setObj[`profile.${k}`] = v;
    }
  }
  if (updateData.preferences) {
    for (const [k, v] of Object.entries(updateData.preferences)) {
      setObj[`preferences.${k}`] = v;
    }
  }

  await usersColl.updateOne(userQuery, { $set: setObj });
  const updatedUser = await usersColl.findOne(userQuery);

  res.json({
    id: updatedUser._id.toString(),
    name: updatedUser.name,
    email: updatedUser.email,
    profile: updatedUser.profile || {},
    preferences: updatedUser.preferences || {},
    created_at: updatedUser.created_at,
    updated_at: updatedUser.updated_at,
  });
});

router.delete('/me', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const usersColl = getCollection('users');
  let userQuery = { email: req.user.email };
  try {
    userQuery = { _id: new ObjectId(userId) };
  } catch {}

  await usersColl.deleteOne(userQuery);

  // Clean up candidate records across all collections
  const interviewsColl = getCollection('interviews');
  const questionsColl = getCollection('questions');
  const answersColl = getCollection('answers');
  const evaluationsColl = getCollection('evaluations');
  const achievementsColl = getCollection('achievements');
  const activityColl = getCollection('practice_activity');

  await interviewsColl.deleteOne({ user_id: userId });
  await questionsColl.deleteOne({ user_id: userId });
  await answersColl.deleteOne({ user_id: userId });
  await evaluationsColl.deleteOne({ user_id: userId });
  await achievementsColl.deleteOne({ user_id: userId });
  await activityColl.deleteOne({ user_id: userId });

  res.json({ success: true, message: 'Account successfully purged' });
});

export default router;

