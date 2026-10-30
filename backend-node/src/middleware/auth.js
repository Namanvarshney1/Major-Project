import { verifyAccessToken } from '../services/security.js';
import { getCollection } from '../db/mongodb.js';
import { ObjectId } from 'mongodb';

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Not authenticated. Bearer token missing.' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);
  if (!payload || !payload.sub) {
    return res.status(401).json({ detail: 'Invalid or expired authentication token.' });
  }

  try {
    const usersColl = getCollection('users');
    let userQuery = { email: payload.email };
    try {
      userQuery = { _id: new ObjectId(payload.sub) };
    } catch {
      userQuery = { _id: payload.sub };
    }

    let user = await usersColl.findOne(userQuery);
    if (!user && payload.email) {
      user = await usersColl.findOne({ email: payload.email });
    }

    if (!user) {
      return res.status(401).json({ detail: 'User session invalid or candidate account not found.' });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      profile: user.profile || {},
      preferences: user.preferences || {},
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
    next();
  } catch (err) {
    return res.status(500).json({ detail: `Authentication error: ${err.message}` });
  }
}

