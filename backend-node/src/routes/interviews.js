import { Router } from 'express';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { getCollection } from '../db/mongodb.js';
import { requireAuth } from '../middleware/auth.js';
import { aiServiceClient } from '../services/aiService.js';

const router = Router();

const interviewCreateSchema = z.object({
  job_role: z.string().default('Software Engineer'),
  round_type: z.string().optional(),
  interview_type: z.string().optional(),
  difficulty: z.string().default('senior'),
  selected_topics: z.array(z.string()).default([]),
  total_questions: z.number().int().min(1).max(10).default(5),
  timed_mode: z.boolean().default(true),
  time_limit_mins: z.number().min(1).max(120).default(10),
});

function normalizeRound(round, type) {
  const val = (round || type || 'technical').trim().toLowerCase();
  if (['technical', 'hr', 'pi', 'managerial'].includes(val)) return val;
  if (val.includes('personal')) return 'pi';
  if (val.includes('hr')) return 'hr';
  if (val.includes('managerial') || val.includes('leadership')) return 'managerial';
  return 'technical';
}

router.post('/', requireAuth, async (req, res) => {
  const parseRes = interviewCreateSchema.safeParse(req.body);
  if (!parseRes.success) {
    return res.status(422).json({ detail: parseRes.error.errors });
  }

  const data = parseRes.data;
  const round_type = normalizeRound(data.round_type, data.interview_type);
  const selected_topics = data.selected_topics.length > 0
    ? data.selected_topics
    : ['System Architecture', 'Concurrency & Locks'];

  const now = new Date();
  const interviewDoc = {
    user_id: req.user.id,
    job_role: data.job_role,
    round_type,
    interview_type: round_type,
    difficulty: data.difficulty,
    selected_topics,
    total_questions: data.total_questions,
    current_question_index: 0,
    status: 'in_progress',
    timed_mode: data.timed_mode,
    time_limit_mins: data.time_limit_mins,
    created_at: now,
    updated_at: now,
  };

  const interviewsColl = getCollection('interviews');
  const insertRes = await interviewsColl.insertOne(interviewDoc);
  const interviewId = insertRes.insertedId.toString();
  interviewDoc.id = interviewId;

  // Generate questions via Python AI service
  const generatedQuestions = await aiServiceClient.generateQuestions({
    job_role: data.job_role,
    round_type,
    difficulty: data.difficulty,
    topics: selected_topics,
    total_questions: data.total_questions,
  });

  const questionsColl = getCollection('questions');
  const savedQuestions = [];

  for (const q of generatedQuestions) {
    const qDoc = {
      user_id: req.user.id,
      interview_id: interviewId,
      question_text: q.question_text,
      topic: q.topic,
      difficulty: q.difficulty || data.difficulty,
      expected_concepts: q.expected_concepts || ['System Architecture'],
      evaluation_rubric: q.evaluation_rubric || 'Standard engineering evaluation rubric',
      order: q.order,
      created_at: now,
    };
    const qInsert = await questionsColl.insertOne(qDoc);
    savedQuestions.push({
      ...qDoc,
      id: qInsert.insertedId.toString(),
      total_questions: data.total_questions,
      saved_answer: '',
      time_spent_seconds: 0,
    });
  }

  interviewDoc.questions = savedQuestions;
  interviewDoc.current_question = savedQuestions[0] || null;

  res.status(201).json(interviewDoc);
});

router.get('/active', requireAuth, async (req, res) => {
  const interviewsColl = getCollection('interviews');
  const session = await interviewsColl.findOne({
    user_id: req.user.id,
    status: 'in_progress',
  });

  if (!session) {
    return res.json(null);
  }

  const interviewId = session._id.toString();
  const questionsColl = getCollection('questions');
  const answersColl = getCollection('answers');

  const questions = await questionsColl.find({ interview_id: interviewId }).sort({ order: 1 }).toArray();
  const answers = await answersColl.find({ interview_id: interviewId, user_id: req.user.id }).toArray();
  const answerMap = new Map(answers.map(a => [a.question_id, a]));

  const formattedQuestions = questions.map(q => {
    const a = answerMap.get(q._id.toString());
    return {
      id: q._id.toString(),
      interview_id: interviewId,
      question_text: q.question_text,
      topic: q.topic,
      difficulty: q.difficulty,
      expected_concepts: q.expected_concepts,
      order: q.order,
      total_questions: session.total_questions,
      created_at: q.created_at,
      saved_answer: a?.answer_text || '',
      time_spent_seconds: a?.time_spent_seconds || 0,
    };
  });

  const currentIdx = session.current_question_index || 0;
  const currentQ = formattedQuestions.find(q => q.order === currentIdx + 1) || formattedQuestions[0] || null;

  res.json({
    id: interviewId,
    user_id: session.user_id,
    job_role: session.job_role,
    round_type: session.round_type || 'technical',
    interview_type: session.interview_type || 'technical',
    difficulty: session.difficulty,
    selected_topics: session.selected_topics || [],
    total_questions: session.total_questions,
    current_question_index: currentIdx,
    status: session.status,
    final_score: session.final_score,
    timed_mode: session.timed_mode,
    time_limit_mins: session.time_limit_mins || 10,
    created_at: session.created_at,
    completed_at: session.completed_at,
    current_question: currentQ,
    questions: formattedQuestions,
  });
});

router.get('/:interview_id', requireAuth, async (req, res) => {
  const interview_id = String(req.params.interview_id);
  const interviewsColl = getCollection('interviews');

  let query = { _id: interview_id };
  try {
    query = { _id: new ObjectId(interview_id) };
  } catch {}

  const interview = await interviewsColl.findOne(query);
  if (!interview) {
    return res.status(404).json({ detail: 'Interview session not found.' });
  }
  if (interview.user_id !== req.user.id) {
    return res.status(403).json({ detail: 'You do not have access to this interview session' });
  }

  const questionsColl = getCollection('questions');
  const answersColl = getCollection('answers');

  const questions = await questionsColl.find({ interview_id }).sort({ order: 1 }).toArray();
  const answers = await answersColl.find({ interview_id, user_id: req.user.id }).toArray();
  const answerMap = new Map(answers.map(a => [a.question_id, a]));

  const formattedQuestions = questions.map(q => {
    const a = answerMap.get(q._id.toString());
    return {
      id: q._id.toString(),
      interview_id,
      question_text: q.question_text,
      topic: q.topic,
      difficulty: q.difficulty,
      expected_concepts: q.expected_concepts,
      order: q.order,
      total_questions: interview.total_questions,
      created_at: q.created_at,
      saved_answer: a?.answer_text || '',
      time_spent_seconds: a?.time_spent_seconds || 0,
    };
  });

  const currentIdx = interview.current_question_index || 0;
  const currentQ = formattedQuestions.find(q => q.order === currentIdx + 1) || formattedQuestions[0] || null;

  res.json({
    id: interview._id.toString(),
    user_id: interview.user_id,
    job_role: interview.job_role,
    round_type: interview.round_type || 'technical',
    interview_type: interview.interview_type || 'technical',
    difficulty: interview.difficulty,
    selected_topics: interview.selected_topics || [],
    total_questions: interview.total_questions,
    current_question_index: currentIdx,
    status: interview.status,
    final_score: interview.final_score,
    timed_mode: interview.timed_mode,
    time_limit_mins: interview.time_limit_mins || 10,
    created_at: interview.created_at,
    completed_at: interview.completed_at,
    current_question: currentQ,
    questions: formattedQuestions,
  });
});

router.post('/:interview_id/questions/:question_id/save', requireAuth, async (req, res) => {
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

  const order = question.order || 1;
  const targetIdx = Math.max(0, order - 1);
  await interviewsColl.updateOne(interviewQuery, { $set: { current_question_index: targetIdx } });

  res.json({
    status: 'saved',
    question_id,
    interview_id,
    order,
  });
});

router.post('/:interview_id/skip', requireAuth, async (req, res) => {
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

  const currentIdx = interview.current_question_index || 0;
  const total_q = interview.total_questions || 5;
  const nextIdx = Math.min(currentIdx + 1, total_q - 1);

  await interviewsColl.updateOne(interviewQuery, { $set: { current_question_index: nextIdx } });
  interview.current_question_index = nextIdx;
  interview.id = interview._id.toString();

  res.json(interview);
});

router.post('/:interview_id/end', requireAuth, async (req, res) => {
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

  const now = new Date();
  await interviewsColl.updateOne(interviewQuery, {
    $set: { status: 'completed', completed_at: now },
  });

  interview.status = 'completed';
  interview.completed_at = now;
  interview.id = interview._id.toString();

  res.json(interview);
});

export default router;

