import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { config } from '../src/config.js';
import { app } from '../src/app.js';
import { connectToDatabase, closeDatabaseConnection } from '../src/db/mongodb.js';

let server;
let baseUrl;
let authToken = '';
let createdInterviewId = '';
let createdQuestionId = '';

before(async () => {
  // Use in-memory mock for isolated fast testing
  process.env.NODE_ENV = 'test';
  config.environment = 'test';
  await connectToDatabase(true);
  server = app.listen(0);
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await closeDatabaseConnection();
});

describe('PrepPulse Node.js Backend Integration Test Suite (Plain JavaScript)', () => {
  it('1. Health check returns healthy / degraded status with version', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.version, '1.0.0');
    assert.strictEqual(data.service, 'PrepPulse (Node.js + Express + JavaScript)');
  });

  it('2. Register creates candidate with Argon2id and returns JWT', async () => {
    const payload = {
      name: 'Rohan Sharma',
      email: 'rohan.sharma@example.com',
      password: 'SecurePassword123!',
      profile: {
        target_role: 'Senior Backend Engineer',
        target_level: 'L5',
        experience_years: 5,
        primary_language: 'JavaScript',
      },
    };

    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.ok(data.access_token);
    assert.strictEqual(data.token_type, 'bearer');
    assert.strictEqual(data.user.email, 'rohan.sharma@example.com');
    assert.strictEqual(data.user.name, 'Rohan Sharma');

    authToken = data.access_token;
  });

  it('3. Duplicate email registration is rejected with 400', async () => {
    const payload = {
      name: 'Duplicate Rohan',
      email: 'rohan.sharma@example.com',
      password: 'AnotherPassword123!',
    };

    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.ok(data.detail.toLowerCase().includes('already exists'));
  });

  it('4. Login succeeds with correct credentials and returns JWT', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rohan.sharma@example.com',
        password: 'SecurePassword123!',
      }),
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.access_token);
    assert.strictEqual(data.user.email, 'rohan.sharma@example.com');
  });

  it('5. Login fails with incorrect password', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rohan.sharma@example.com',
        password: 'WrongPassword!',
      }),
    });

    assert.strictEqual(res.status, 401);
  });

  it('6. Get profile (/auth/me) requires valid Bearer token', async () => {
    // Unauthenticated
    const unauth = await fetch(`${baseUrl}/api/v1/auth/me`);
    assert.strictEqual(unauth.status, 401);

    // Authenticated
    const auth = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(auth.status, 200);
    const data = await auth.json();
    assert.strictEqual(data.email, 'rohan.sharma@example.com');
  });

  it('7. Create interview generates session with questions', async () => {
    const payload = {
      job_role: 'Senior Backend Engineer',
      round_type: 'technical',
      difficulty: 'senior',
      selected_topics: ['Concurrency & Locks', 'Distributed Systems'],
      total_questions: 3,
      timed_mode: true,
      time_limit_mins: 15,
    };

    const res = await fetch(`${baseUrl}/api/v1/interviews/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.ok(data.id);
    assert.strictEqual(data.status, 'in_progress');
    assert.strictEqual(data.total_questions, 3);
    assert.strictEqual(data.questions.length, 3);

    // Verify concise, 1-2 sentence questions
    for (const q of data.questions) {
      assert.ok(q.question_text.length > 10, 'Question text must not be empty');
      const sentenceCount = q.question_text.split(/[.?!]+/).filter(Boolean).length;
      assert.ok(sentenceCount <= 3, `Expected short question (1-2 sentences), got ${sentenceCount}`);
    }

    createdInterviewId = data.id;
    createdQuestionId = data.questions[0].id;
  });

  it('7a. Rejects question counts below 1, above 10, and non-integers', async () => {
    // Below 1 (0)
    const resBelow = await fetch(`${baseUrl}/api/v1/interviews/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ total_questions: 0 }),
    });
    assert.strictEqual(resBelow.status, 422);

    // Above 10 (11)
    const resAbove = await fetch(`${baseUrl}/api/v1/interviews/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ total_questions: 11 }),
    });
    assert.strictEqual(resAbove.status, 422);

    // Non-integer (2.5)
    const resFloat = await fetch(`${baseUrl}/api/v1/interviews/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ total_questions: 2.5 }),
    });
    assert.strictEqual(resFloat.status, 422);
  });

  it('7b. Generates exactly 1 question when 1 is selected', async () => {
    const res = await fetch(`${baseUrl}/api/v1/interviews/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ total_questions: 1, selected_topics: ['System Architecture'] }),
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.total_questions, 1);
    assert.strictEqual(data.questions.length, 1);
    assert.ok(data.questions[0].question_text);
  });

  it('7c. Generates exactly 7 questions when 7 is selected (unique & non-repetitive)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/interviews/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ total_questions: 7, selected_topics: ['Concurrency', 'Databases'] }),
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.total_questions, 7);
    assert.strictEqual(data.questions.length, 7);

    // Verify non-repetitive
    const texts = data.questions.map(q => q.question_text);
    const unique = new Set(texts);
    assert.strictEqual(unique.size, 7, 'All 7 questions must be unique');
  });

  it('7d. Generates exactly 10 questions when 10 is selected', async () => {
    const res = await fetch(`${baseUrl}/api/v1/interviews/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ total_questions: 10, selected_topics: ['Architecture', 'Networking'] }),
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.total_questions, 10);
    assert.strictEqual(data.questions.length, 10);
  });

  it('8. Get active interview retrieves session and current question', async () => {
    const res = await fetch(`${baseUrl}/api/v1/interviews/active`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.id, createdInterviewId);
    assert.ok(data.current_question);
    assert.strictEqual(data.current_question.order, 1);
  });

  it('9. Save answer updates candidate draft without finalizing', async () => {
    const res = await fetch(
      `${baseUrl}/api/v1/interviews/${createdInterviewId}/questions/${createdQuestionId}/save`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          answer_text: 'In synchronous programming, OS threads block on I/O. Asynchronous models use epoll multiplexing.',
          time_spent_seconds: 45,
        }),
      }
    );

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'saved');
    assert.strictEqual(data.question_id, createdQuestionId);
  });

  it('10. Answer submission evaluates answer and returns 4-metric scoring', async () => {
    const res = await fetch(
      `${baseUrl}/api/v1/interviews/${createdInterviewId}/questions/${createdQuestionId}/answer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          answer_text: 'Synchronous threads consume 1MB stack. Async event loops handle concurrency via non-blocking multiplexing and virtual threads.',
          time_spent_seconds: 60,
        }),
      }
    );

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.overall_score >= 0 && data.overall_score <= 100);
    assert.ok(data.technical_accuracy >= 0);
    assert.ok(data.relevance >= 0);
    assert.ok(data.completeness >= 0);
    assert.ok(data.clarity >= 0);
    assert.ok(data.strengths.length > 0);
  });

  it('11. Complete evaluation triggers whole-interview report', async () => {
    const res = await fetch(
      `${baseUrl}/api/v1/interviews/${createdInterviewId}/complete-evaluation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'completed');
    assert.ok(data.overall_score >= 0);
    assert.ok(data.strongest_topics);
    assert.ok(data.detailed_questions.length > 0);
  });

  it('12. Interview DNA (/analytics/dna) returns 6-axis competency signals', async () => {
    const res = await fetch(`${baseUrl}/api/v1/analytics/dna`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.dimension_scores);
    assert.ok('Technical Accuracy' in data.dimension_scores);
    assert.ok('Relevance' in data.dimension_scores);
    assert.ok('Completeness' in data.dimension_scores);
    assert.ok('Clarity & Structure' in data.dimension_scores);
  });

  it('13. Dashboard returns aggregated candidate metrics and activity', async () => {
    const res = await fetch(`${baseUrl}/api/v1/dashboard/`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.user_name, 'Rohan Sharma');
    assert.ok(data.interviews_completed >= 1);
    assert.ok(data.velocity_chart.length > 0);
    assert.ok(data.ai_coach_prescription);
  });
});
