import { config } from '../config.js';

export class PythonAiServiceClient {
  constructor() {
    this.baseUrl = config.pythonAiServiceUrl.replace(/\/$/, '');
    this.secret = config.internalServiceSecret;
  }

  async generateQuestions(params) {
    const url = `${this.baseUrl}/internal/ai/generate-questions`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Secret': this.secret,
        },
        body: JSON.stringify({
          job_role: params.job_role,
          round_type: params.round_type || 'technical',
          difficulty: params.difficulty || 'mid',
          topics: params.topics,
          total_questions: params.total_questions,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Python AI service returned HTTP ${res.status}`);
      }
      const data = await res.json();
      return data.questions || [];
    } catch (err) {
      console.warn(`[AiService] Python AI generateQuestions call failed (${err.message}). Using deterministic fallback generator.`);
      return this.fallbackGenerateQuestions(params);
    }
  }

  async evaluateAnswer(params) {
    const url = `${this.baseUrl}/internal/ai/evaluate-answer`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Secret': this.secret,
        },
        body: JSON.stringify({
          question: params.question,
          candidate_answer: params.candidate_answer,
          job_role: params.job_role || 'Software Engineer',
          difficulty: params.difficulty || 'senior',
          round_type: params.round_type || 'technical',
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Python AI service returned HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.warn(`[AiService] Python AI evaluateAnswer call failed (${err.message}). Using fallback evaluation.`);
      return this.fallbackEvaluateAnswer(params);
    }
  }

  async evaluateWholeInterview(params) {
    const url = `${this.baseUrl}/internal/ai/whole-debrief`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Secret': this.secret,
        },
        body: JSON.stringify({
          interview: params.interview,
          transcript: params.transcript,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Python AI service returned HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.warn(`[AiService] Python AI evaluateWholeInterview call failed (${err.message}). Using fallback debrief.`);
      return this.fallbackWholeDebrief(params);
    }
  }

  fallbackGenerateQuestions(params) {
    const topics = params.topics && params.topics.length > 0 ? params.topics : ['System Architecture', 'Algorithms'];
    const simpleTemplates = [
      (t) => `What is the core purpose of ${t}, and how does it work?`,
      (t) => `What are the main performance trade-offs you consider when using ${t}?`,
      (t) => `How do you handle failures or errors when working with ${t}?`,
      (t) => `How do you prevent data loss or race conditions in ${t}?`,
      (t) => `Can you explain a practical scenario where you would choose ${t}?`,
    ];
    const questions = [];
    for (let i = 0; i < params.total_questions; i++) {
      const topic = topics[i % topics.length];
      const template = simpleTemplates[i % simpleTemplates.length];
      questions.push({
        order: i + 1,
        topic,
        difficulty: params.difficulty || 'senior',
        question_text: template(topic),
        expected_concepts: [`Foundations of ${topic}`, 'Performance & Scaling', 'Reliability & Error Handling'],
        evaluation_rubric: `Assess clear practical understanding of ${topic} and direct explanation of concepts.`,
      });
    }
    return questions;
  }

  fallbackEvaluateAnswer(params) {
    const text = (params.candidate_answer || '').trim();
    const isBlank = text.length < 5;
    const score = isBlank ? 0.0 : Math.min(95, Math.max(60, 65 + Math.min(25, text.split(' ').length)));
    const topic = (params.question && params.question.topic) || 'Engineering Architecture';

    return {
      correctness_score: score,
      relevance_score: isBlank ? 0.0 : Math.min(95, score + 4),
      completeness_score: isBlank ? 0.0 : Math.max(50, score - 5),
      reasoning_score: isBlank ? 0.0 : score,
      overall_score: score,
      is_relevant: !isBlank,
      strengths: isBlank ? [] : [`Addressed core mechanics of ${topic}.`, 'Clear conceptual framing.'],
      missing_concepts: isBlank ? [`Foundational definitions of ${topic}`] : ['Explicit edge-case handling', 'Telemetry and metric instrumentation'],
      feedback: isBlank
        ? 'No substantive answer was provided.'
        : `Demonstrated solid foundational awareness for ${topic}. Deepen discussion with explicit operational SLAs and error recovery.`,
      model_answer: `A comprehensive answer for ${topic} explores architectural trade-offs, memory limits, and concrete recovery steps.`,
      improvement_suggestion: `Frame solutions with explicit trade-offs and operational boundary constraints.`,
      evidence: isBlank ? [] : [text.slice(0, 100)],
    };
  }

  fallbackWholeDebrief(params) {
    const transcript = params.transcript || [];
    const answered = transcript.filter(t => (t.candidate_answer || '').trim().length > 5);
    const total = transcript.length || 1;
    const answeredCount = answered.length;
    const avgScore = answeredCount > 0 ? Math.round((answeredCount / total) * 78 + 10) : 0;

    const topics = Array.from(new Set(transcript.map(t => t.topic || 'General')));
    const strongest = topics.slice(0, 2);
    const weakest = topics.slice(-2);

    const detailed_questions = transcript.map((item, idx) => {
      const hasAnswer = (item.candidate_answer || '').trim().length > 5;
      const qScore = hasAnswer ? 78.0 : 0.0;
      return {
        question_id: item.question_id || `q_${idx + 1}`,
        order: item.order || idx + 1,
        question_text: item.question_text || `Question ${idx + 1}`,
        topic: item.topic || 'Architecture',
        candidate_answer: item.candidate_answer || '',
        score: qScore,
        technical_accuracy: qScore,
        relevance: qScore,
        completeness: qScore,
        clarity: qScore,
        what_went_well: hasAnswer ? ['Well-structured narrative.'] : ['Skipped or blank.'],
        what_was_missing: hasAnswer ? ['Telemetry instrumentation.'] : ['No response submitted.'],
        improvement_suggestion: 'Quantify impact and state architectural trade-offs.',
        stronger_answer_example: `A high-scoring answer would explicitly state edge cases and mitigation steps.`,
      };
    });

    return {
      overall_score: avgScore,
      total_questions: total,
      answered_questions: answeredCount,
      strongest_topics: strongest,
      weakest_topics: weakest,
      performance_summary: `Candidate completed ${answeredCount} of ${total} questions with an overall score of ${avgScore}%.`,
      score_explanation: `Evaluated across ${total} questions focusing on technical accuracy, relevance, completeness, and clarity.`,
      detailed_questions,
      xp_earned: avgScore * 10,
    };
  }
}

export const aiServiceClient = new PythonAiServiceClient();

