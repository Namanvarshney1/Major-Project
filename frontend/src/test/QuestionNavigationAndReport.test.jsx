import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { InterviewArenaPage } from '../features/interview/InterviewArenaPage';
import { FinalReportPage } from '../features/interview/FinalReportPage';
import { api } from '../lib/api';

vi.mock('../lib/api', () => ({
  api: {
    interviews: {
      getById: vi.fn(),
      getActive: vi.fn(),
      saveAnswer: vi.fn(),
      completeEvaluation: vi.fn(),
      retryEvaluation: vi.fn(),
      getReport: vi.fn(),
    },
    history: {
      list: vi.fn(),
    },
  },
}));

describe('TASK 2 & 5: Question Navigation & Text Diversity in InterviewArenaPage', () => {
  const mockInterviewSession = {
    id: 'mock-session-123',
    job_role: 'Full Stack Developer',
    round_type: 'technical',
    difficulty: 'senior',
    timed_mode: false,
    total_questions: 10,
    current_question_index: 0,
    status: 'in_progress',
    questions: [
      {
        id: 'q-1',
        order: 1,
        topic: 'React Architecture',
        question_text: 'Explain React 19 server components vs client components with hydration trade-offs.',
        expected_concepts: ['Server Components', 'Streaming Hydration', 'Bundle Size'],
        evaluation_rubric: 'Technical architectural depth and practical trade-offs',
        saved_answer: '',
      },
      {
        id: 'q-2',
        order: 2,
        topic: 'Database Optimization',
        question_text: 'How do you diagnose and resolve B-tree index fragmentation in PostgreSQL?',
        expected_concepts: ['REINDEX CONCURRENTLY', 'Write Amplification', 'Buffer Cache'],
        evaluation_rubric: 'Database engineering accuracy and operational safety',
        saved_answer: '',
      },
      {
        id: 'q-3',
        order: 3,
        topic: 'System Concurrency',
        question_text: 'Analyze optimistic vs pessimistic locking in distributed inventory allocation.',
        expected_concepts: ['Version Columns', 'Deadlock Detection', 'Throughput Impact'],
        evaluation_rubric: 'Distributed systems reasoning and fault tolerance',
        saved_answer: '',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api.interviews.getById.mockResolvedValue(mockInterviewSession);
    api.interviews.saveAnswer.mockResolvedValue({ status: 'saved' });
  });

  it('renders Question 1 with its specific text and topic', async () => {
    render(
      <MemoryRouter initialEntries={['/interview/mock-session-123']}>
        <Routes>
          <Route path="/interview/:id" element={<InterviewArenaPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for session to load
    expect(await screen.findByText(/Focus Area: React Architecture/i)).toBeInTheDocument();
    expect(screen.getByText(/Explain React 19 server components vs client components/i)).toBeInTheDocument();
    expect(screen.getByText('Server Components')).toBeInTheDocument();
  });

  it('navigates to Question 2 and verifies question text and topic change', async () => {
    render(
      <MemoryRouter initialEntries={['/interview/mock-session-123']}>
        <Routes>
          <Route path="/interview/:id" element={<InterviewArenaPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Focus Area: React Architecture/i)).toBeInTheDocument();

    // Click "Next Question"
    const nextBtn = screen.getByRole('button', { name: /next question/i });
    fireEvent.click(nextBtn);

    // Question 2 data must be visible
    expect(await screen.findByText(/Focus Area: Database Optimization/i)).toBeInTheDocument();
    expect(screen.getByText(/How do you diagnose and resolve B-tree index fragmentation/i)).toBeInTheDocument();
    expect(screen.getByText('REINDEX CONCURRENTLY')).toBeInTheDocument();

    // Question 1 text must NOT be visible
    expect(screen.queryByText(/Explain React 19 server components vs client components/i)).not.toBeInTheDocument();
  });

  it('preserves answer when navigating forward and backward', async () => {
    render(
      <MemoryRouter initialEntries={['/interview/mock-session-123']}>
        <Routes>
          <Route path="/interview/:id" element={<InterviewArenaPage />} />
        </Routes>
      </MemoryRouter>
    );

    const textarea = await screen.findByPlaceholderText(/Type your response here/i);

    // Type answer for Question 1
    fireEvent.change(textarea, { target: { value: 'Server components run exclusively on the server.' } });
    expect(textarea.value).toBe('Server components run exclusively on the server.');

    // Navigate to Question 2
    const nextBtn = screen.getByRole('button', { name: /next question/i });
    fireEvent.click(nextBtn);

    // On Question 2, answer should be blank initially
    const q2Textarea = await screen.findByPlaceholderText(/Type your response here/i);
    expect(q2Textarea.value).toBe('');

    // Navigate back to Question 1
    const prevBtn = screen.getByRole('button', { name: /previous/i });
    fireEvent.click(prevBtn);

    // On Question 1, original answer must be preserved!
    const restoredTextarea = await screen.findByPlaceholderText(/Type your response here/i);
    expect(restoredTextarea.value).toBe('Server components run exclusively on the server.');
    expect(screen.getByText(/Focus Area: React Architecture/i)).toBeInTheDocument();
  });

  it('allows direct jumping via numbered question buttons', async () => {
    render(
      <MemoryRouter initialEntries={['/interview/mock-session-123']}>
        <Routes>
          <Route path="/interview/:id" element={<InterviewArenaPage />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText(/Focus Area: React Architecture/i);

    // Click button '3' in question selector strip
    const q3Btn = screen.getByRole('button', { name: '3' });
    fireEvent.click(q3Btn);

    // Question 3 data rendered
    expect(await screen.findByText(/Focus Area: System Concurrency/i)).toBeInTheDocument();
    expect(screen.getByText(/Analyze optimistic vs pessimistic locking/i)).toBeInTheDocument();
    expect(screen.getByText('Version Columns')).toBeInTheDocument();
  });
});

describe('TASK 4: FinalReportPage Debrief & Stats Verification', () => {
  const mockReport = {
    interview_id: 'mock-session-123',
    job_role: 'Software Engineer',
    round_type: 'technical',
    difficulty: 'senior',
    overall_score: 84.5,
    final_score: 84.5,
    total_questions: 10,
    answered_questions: 8,
    unanswered_questions: 2,
    skipped_questions: 2,
    evaluation_status: 'completed',
    performance_summary: 'Demonstrated solid understanding of system design and concurrency.',
    score_explanation: 'Composite score 84.5 represents the arithmetic mean across all 10 questions.',
    strengths: ['Clear explanation of B-tree index mechanics.', 'Accurate concurrency primitives.'],
    areas_for_improvement: ['Deepen memory alignment knowledge.'],
    detailed_questions: [
      {
        question_id: 'q-1',
        order: 1,
        topic: 'React Architecture',
        question_text: 'Explain React 19 server components.',
        candidate_answer: 'Server components run on the server and reduce bundle size.',
        score: 88,
        what_went_well: ['Addressed server components and bundle impact.'],
        what_was_missing: ['Streaming protocol specifics.'],
        improvement_suggestion: 'Mention flight protocol data streams.',
        stronger_answer_example: 'Benchmark standard answer.',
      },
      {
        question_id: 'q-2',
        order: 2,
        topic: 'Database Optimization',
        question_text: 'How do you resolve B-tree index fragmentation?',
        candidate_answer: '(No answer submitted / Skipped)',
        score: 0,
        what_went_well: ['Question was skipped.'],
        what_was_missing: ['No response provided.'],
        improvement_suggestion: 'Review PostgreSQL maintenance commands.',
        stronger_answer_example: 'Benchmark standard answer.',
      },
    ],
  };

  it('renders report with accurate answered, skipped, and total questions', async () => {
    api.interviews.getReport.mockResolvedValue(mockReport);

    render(
      <MemoryRouter initialEntries={['/interview/mock-session-123/report']}>
        <Routes>
          <Route path="/interview/:id/report" element={<FinalReportPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify header and score
    expect(await screen.findByText('Total Configured:')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument(); // Answered
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1); // Unanswered / Skipped
    expect(screen.getByText(/COMPLETED/i)).toBeInTheDocument();

    // Verify question feedback items
    expect(screen.getByText('Explain React 19 server components.')).toBeInTheDocument();
    expect(screen.getByText('How do you resolve B-tree index fragmentation?')).toBeInTheDocument();
    expect(screen.getByText('Answered')).toBeInTheDocument();
    expect(screen.getByText('Skipped (0 pts)')).toBeInTheDocument();
  });
});
