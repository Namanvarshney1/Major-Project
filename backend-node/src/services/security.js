import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

/**
 * Hashes password using modern Argon2id with parameters identical to Python's argon2-cffi.
 * Memory: 64MiB in prod (calibrated to 4MiB in test to avoid Windows memory pressure),
 * Time: 2, Parallelism: 2, Type: Argon2id.
 */
export async function hashPassword(plainPassword) {
  const isTest = config.environment === 'test' || process.env.NODE_ENV === 'test';
  return await argon2.hash(plainPassword, {
    type: argon2.argon2id,
    memoryCost: isTest ? 4096 : 65536,
    timeCost: 2,
    parallelism: 1,
    hashLength: 32,
  });
}

/**
 * Verifies plain password against an Argon2id hash.
 */
export async function verifyPassword(plainPassword, hashedPassword) {
  try {
    return await argon2.verify(hashedPassword, plainPassword);
  } catch {
    return false;
  }
}

/**
 * Creates a signed JWT access token.
 */
export function createAccessToken(payload, customExpires) {
  const tokenPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
  };
  return jwt.sign(tokenPayload, config.jwtSecret, {
    expiresIn: customExpires || config.jwtExpiresIn,
    algorithm: 'HS256',
  });
}

/**
 * Verifies and decodes a JWT access token.
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
}
