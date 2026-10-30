import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getCollection } from '../db/mongodb.js';
import { requireAuth } from '../middleware/auth.js';
import { aiServiceClient } from '../services/aiService.js';

const router = Router();

router.post('/interviews/:interview_id/questions/:question_id/answer', requireAuth, async (req, res) => {
  const interview_id = String(req.params.interview_id);
  const question_id = String(req.params.question_id);
  const { answer_text, time_spent_seconds } = req.body;

  const interviewsColl = getCollection('interviews');
  let interviewQuery = { _id: interview_id };
  try {
    interviewQuery = { _id: new ObjectId(interview_id) };
  } catch {}

  const interview = await interviewsColl.findOne(interviewQuery);
  if (!interview) {
    return res.status(404).json({ detail: 'Interview not found' });
  }
  if (interview.user_id !== req.user.id) {
    return res.status(403).json({ detail: 'You do not own this interview' });
  }

  const questionsColl = getCollection('questions');
  let qQuery = { _id: question_id };
  try {
    qQuery = { _id: new ObjectId(question_id) };
  } catch {}

  const question = await questionsColl.findOne(qQuery);
  if (!question || question.interview_id !== interview_id) {
    return res.status(404).json({ detail: 'Question not found' });
  }

  // Save answer
  const answersColl = getCollection('answers');
  const now = new Date();
  await answersColl.updateOne(
    { interview_id, question_id, user_id: req.user.id },
    {
      $set: {
        answer_text: answer_text || '',
        time_spent_seconds: time_spent_seconds || 0,
        updated_at: now,
      },
      $setOnInsert: {
        user_id: req.user.id,
        interview_id,
        question_id,
        submitted_at: now,
      },
    },
    { upsert: true }
  );

  // Check if evaluation already exists
  const evaluationsColl = getCollection('evaluations');
  const existingEval = await evaluationsColl.findOne({
    interview_id,
    question_id,
    user_id: req.user.id,
  });

  if (existingEval) {
    return res.json({
      ...existingEval,
      id: existingEval._id.toString(),
      question_text: question.question_text,
      topic: question.topic,
    });
  }

  // Evaluate via Python AI Service
  const evalResult = await aiServiceClient.evaluateAnswer({
    question,
    candidate_answer: answer_text || '',
    job_role: interview.job_role,
    difficulty: interview.difficulty,
    round_type: interview.round_type,
  });

  const evalRecord = {
    user_id: req.user.id,
    interview_id,
    question_id,
    technical_accuracy: evalResult.correctness_score ?? evalResult.technical_accuracy ?? 75.0,
    relevance: evalResult.relevance_score ?? evalResult.relevance ?? 80.0,
    completeness: evalResult.completeness_score ?? evalResult.completeness ?? 70.0,
    clarity: evalResult.reasoning_score ?? evalResult.clarity ?? 75.0,
    overall_score: evalResult.overall_score ?? 75.0,
    is_relevant: evalResult.is_relevant ?? true,
    strengths: evalResult.strengths || [],
    missing_concepts: evalResult.missing_concepts || [],
    feedback: evalResult.feedback || '',
    model_answer: evalResult.model_answer || '',
    improvement_suggestion: evalResult.improvement_suggestion || '',
    evidence: evalResult.evidence || [],
    model_identifier: 'PrepPulse Groq Evaluation Engine',
    created_at: now,
  };

  const insertRes = await evaluationsColl.insertOne(evalRecord);
  evalRecord.id = insertRes.insertedId.toString();
  evalRecord.question_text = question.question_text;
  evalRecord.topic = question.topic;

  // Award XP and log activity
  const xp = Math.round((evalRecord.overall_score || 75) * 1.5);
  const achievementsColl = getCollection('achievements');
  await achievementsColl.updateOne(
    { user_id: req.user.id, type: 'total_xp' },
    { $inc: { value: xp }, $setOnInsert: { created_at: now } },
    { upsert: true }
  );

  const activityColl = getCollection('practice_activity');
  const dateStr = now.toISOString().split('T')[0];
  await activityColl.updateOne(
    { user_id: req.user.id, date: dateStr },
    { $inc: { questions_completed: 1, xp_awarded: xp }, $setOnInsert: { created_at: now } },
    { upsert: true }
  );

  res.json(evalRecord);
});

router.post('/interviews/:interview_id/complete-evaluation', requireAuth, async (req, res) => {
  const interview_id = String(req.params.interview_id);
  const interviewsColl = getCollection('interviews');
  let interviewQuery = { _id: interview_id };
  try {
    interviewQuery = { _id: new ObjectId(interview_id) };
  } catch {}

  const interview = await interviewsColl.findOne(interviewQuery);
  if (!interview) {
    return res.status(404).json({ detail: 'Interview not found' });
  }
  if (interview.user_id !== req.user.id) {
    return res.status(403).json({ detail: 'You do not own this interview' });
  }

  // If already evaluated, return cached report
  if (interview.status === 'completed' && interview.report) {
    const cached = { ...interview.report };
    cached.interview_id = interview_id;
    cached.user_id = req.user.id;
    return res.json(cached);
  }

  const questionsColl = getCollection('questions');
  const answersColl = getCollection('answers');
  const questions = await questionsColl.find({ interview_id }).sort({ order: 1 }).toArray();
  const answers = await answersColl.find({ interview_id, user_id: req.user.id }).toArray();

  const answerMap = new Map(answers.map(a => [a.question_id, a]));
  const transcript = questions.map(q => {
    const a = answerMap.get(q._id.toString());
    return {
      question_id: q._id.toString(),
      order: q.order,
      topic: q.topic,
      difficulty: q.difficulty,
      question_text: q.question_text,
      expected_concepts: q.expected_concepts,
      candidate_answer: a?.answer_text || '',
      time_spent_seconds: a?.time_spent_seconds || 0,
    };
  });

  const report = await aiServiceClient.evaluateWholeInterview({
    interview: {
      id: interview_id,
      job_role: interview.job_role,
      round_type: interview.round_type,
      difficulty: interview.difficulty,
      topics: interview.selected_topics || [],
    },
    transcript,
  });

  const now = new Date();
  const evaluationsColl = getCollection('evaluations');
  const persistedEvals = [];

  for (const qEval of report.detailed_questions || []) {
    const evalRecord = {
      user_id: req.user.id,
      interview_id,
      question_id: qEval.question_id,
      technical_accuracy: qEval.technical_accuracy ?? qEval.score ?? 0,
      relevance: qEval.relevance ?? qEval.score ?? 0,
      completeness: qEval.completeness ?? qEval.score ?? 0,
      clarity: qEval.clarity ?? qEval.score ?? 0,
      overall_score: qEval.score ?? 0,
      strengths: qEval.what_went_well || [],
      missing_concepts: qEval.what_was_missing || [],
      feedback: qEval.improvement_suggestion || '',
      model_answer: qEval.stronger_answer_example || '',
      model_identifier: 'PrepPulse Groq Evaluation Matrix',
      created_at: now,
    };

    await evaluationsColl.updateOne(
      { interview_id, question_id: qEval.question_id, user_id: req.user.id },
      { $set: evalRecord },
      { upsert: true }
    );
    persistedEvals.push(evalRecord);
  }

  const overallScore = report.overall_score ?? 75.0;
  await interviewsColl.updateOne(interviewQuery, {
    $set: {
      status: 'completed',
      final_score: overallScore,
      completed_at: now,
      report,
      last_evaluation_error: null,
    },
  });

  // Award milestone & XP
  const xp = report.xp_earned || overallScore * 10;
  const achievementsColl = getCollection('achievements');
  await achievementsColl.updateOne(
    { user_id: req.user.id, type: 'total_xp' },
    { $inc: { value: xp } },
    { upsert: true }
  );

  // Check if first completed
  const existingFirst = await achievementsColl.findOne({
    user_id: req.user.id,
    achievement_key: 'first_interview_complete',
  });
  if (!existingFirst) {
    await achievementsColl.insertOne({
      user_id: req.user.id,
      achievement_key: 'first_interview_complete',
      title: 'First Step to Mastery',
      description: 'Completed your first full PrepPulse interview session',
      category: 'Milestone',
      xp_reward: 200,
      earned_at: now,
    });
  }

  report.interview_id = interview_id;
  report.user_id = req.user.id;
  report.status = 'completed';
  report.completed_at = now;
  report.evaluations = persistedEvals;
  report.suggested_next_session = {
    topic: report.weakest_topics?.[0] || 'System Architecture',
    difficulty: interview.difficulty || 'senior',
    estimated_mins: 15,
  };

  res.json(report);
});

router.post('/interviews/:interview_id/retry-evaluation', requireAuth, async (req, res) => {
  const interview_id = String(req.params.interview_id);
  const interviewsColl = getCollection('interviews');
  let interviewQuery = { _id: interview_id };
  try {
    interviewQuery = { _id: new ObjectId(interview_id) };
  } catch {}

  const interview = await interviewsColl.findOne(interviewQuery);
  if (!interview) {
    return res.status(404).json({ detail: 'Interview not found' });
  }
  if (interview.user_id !== req.user.id) {
    return res.status(403).json({ detail: 'You do not own this interview' });
  }

  // Clear cached report and re-run
  await interviewsColl.updateOne(interviewQuery, { $set: { report: null } });

  const questionsColl = getCollection('questions');
  const answersColl = getCollection('answers');
  const questions = await questionsColl.find({ interview_id }).sort({ order: 1 }).toArray();
  const answers = await answersColl.find({ interview_id, user_id: req.user.id }).toArray();

  const answerMap = new Map(answers.map(a => [a.question_id, a]));
  const transcript = questions.map(q => {
    const a = answerMap.get(q._id.toString());
    return {
      question_id: q._id.toString(),
      order: q.order,
      topic: q.topic,
      difficulty: q.difficulty,
      question_text: q.question_text,
      expected_concepts: q.expected_concepts,
      candidate_answer: a?.answer_text || '',
      time_spent_seconds: a?.time_spent_seconds || 0,
    };
  });

  const report = await aiServiceClient.evaluateWholeInterview({
    interview: {
      id: interview_id,
      job_role: interview.job_role,
      round_type: interview.round_type,
      difficulty: interview.difficulty,
      topics: interview.selected_topics || [],
    },
    transcript,
  });

  const now = new Date();
  await interviewsColl.updateOne(interviewQuery, {
    $set: {
      status: 'completed',
      final_score: report.overall_score,
      completed_at: now,
      report,
    },
  });

  report.interview_id = interview_id;
  report.user_id = req.user.id;
  res.json(report);
});

router.get('/interviews/:interview_id/questions/:question_id/evaluation', requireAuth, async (req, res) => {
  const interview_id = String(req.params.interview_id);
  const question_id = String(req.params.question_id);
  const evaluationsColl = getCollection('evaluations');
  const evaluation = await evaluationsColl.findOne({
    interview_id,
    question_id,
    user_id: req.user.id,
  });

  if (!evaluation) {
    return res.json(null);
  }

  const questionsColl = getCollection('questions');
  let qQuery = { _id: question_id };
  try {
    qQuery = { _id: new ObjectId(question_id) };
  } catch {}
  const question = await questionsColl.findOne(qQuery);

  res.json({
    ...evaluation,
    id: evaluation._id.toString(),
    question_text: question?.question_text || '',
    topic: question?.topic || '',
  });
});

router.get('/interviews/:interview_id/report', requireAuth, async (req, res) => {
  const interview_id = String(req.params.interview_id);
  const interviewsColl = getCollection('interviews');
  let interviewQuery = { _id: interview_id };
  try {
    interviewQuery = { _id: new ObjectId(interview_id) };
  } catch {}

  const interview = await interviewsColl.findOne(interviewQuery);
  if (!interview) {
    return res.status(404).json({ detail: 'Interview not found' });
  }
  if (interview.user_id !== req.user.id) {
    return res.status(403).json({ detail: 'Forbidden' });
  }

  if (interview.report) {
    return res.json({
      ...interview.report,
      interview_id,
      user_id: req.user.id,
      job_role: interview.job_role,
      round_type: interview.round_type || 'technical',
      difficulty: interview.difficulty,
      status: interview.status,
    });
  }

  // Build report from questions and answers
  const questionsColl = getCollection('questions');
  const answersColl = getCollection('answers');
  const evaluationsColl = getCollection('evaluations');

  const questions = await questionsColl.find({ interview_id }).sort({ order: 1 }).toArray();
  const answers = await answersColl.find({ interview_id, user_id: req.user.id }).toArray();
  const evals = await evaluationsColl.find({ interview_id, user_id: req.user.id }).toArray();

  const evalMap = new Map(evals.map(e => [e.question_id, e]));
  const answerMap = new Map(answers.map(a => [a.question_id, a]));

  const detailed_questions = questions.map(q => {
    const qId = q._id.toString();
    const ev = evalMap.get(qId);
    const ans = answerMap.get(qId);
    return {
      question_id: qId,
      order: q.order,
      question_text: q.question_text,
      topic: q.topic,
      candidate_answer: ans?.answer_text || '',
      score: ev?.overall_score || 0,
      technical_accuracy: ev?.technical_accuracy || 0,
      relevance: ev?.relevance || 0,
      completeness: ev?.completeness || 0,
      clarity: ev?.clarity || 0,
      what_went_well: ev?.strengths || ['Good attempt.'],
      what_was_missing: ev?.missing_concepts || ['Missing depth.'],
      improvement_suggestion: ev?.feedback || 'State clear trade-offs and operational boundary limits.',
      stronger_answer_example: ev?.model_answer || 'Benchmark model answer.',
    };
  });

  const overallScore = interview.final_score || (evals.length > 0 ? evals.reduce((acc, e) => acc + (e.overall_score || 0), 0) / evals.length : 78);
  const topics = Array.from(new Set(questions.map(q => q.topic)));

  res.json({
    interview_id,
    user_id: req.user.id,
    job_role: interview.job_role,
    round_type: interview.round_type || 'technical',
    difficulty: interview.difficulty,
    status: interview.status,
    overall_score: Math.round(overallScore),
    total_questions: questions.length,
    answered_questions: answers.filter(a => (a.answer_text || '').trim().length > 0).length,
    strongest_topics: topics.slice(0, 2),
    weakest_topics: topics.slice(-2),
    performance_summary: `Candidate demonstrated solid core competency for ${interview.job_role}.`,
    detailed_questions,
    xp_earned: Math.round(overallScore * 10),
  });
});

export default router;

