import { describe, it } from 'node:test';
import assert from 'node:assert';
import { aiServiceClient } from '../src/services/aiService.js';

describe('Python AI Microservice Client Integration (Plain JavaScript)', () => {
  it('calls Python AI microservice or deterministic fallback to generate questions', async () => {
    const questions = await aiServiceClient.generateQuestions({
      job_role: 'Senior Backend Engineer',
      round_type: 'technical',
      difficulty: 'senior',
      topics: ['Concurrency', 'Distributed Systems'],
      total_questions: 2,
    });

    assert.ok(Array.isArray(questions));
    assert.strictEqual(questions.length, 2);
    assert.ok(questions[0].question_text);
    assert.ok(questions[0].topic);
  });

  it('calls Python AI microservice or deterministic fallback to evaluate a candidate answer', async () => {
    const evalResult = await aiServiceClient.evaluateAnswer({
      question: {
        topic: 'Concurrency',
        question_text: 'Explain virtual threads and how they scale.',
      },
      candidate_answer: 'Virtual threads are lightweight threads managed by the JVM rather than 1:1 OS threads.',
      job_role: 'Senior Backend Engineer',
      difficulty: 'senior',
      round_type: 'technical',
    });

    assert.ok(evalResult);
    assert.ok(evalResult.overall_score >= 0 && evalResult.overall_score <= 100);
    assert.ok(evalResult.strengths);
  });
});

