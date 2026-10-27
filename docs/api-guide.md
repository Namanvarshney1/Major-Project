# PrepPulse — REST API Reference Guide

Base Path: `/api/v1`  
Authentication: HTTP Bearer Token (`Authorization: Bearer <token>`)

---

## 1. Authentication Endpoints

### `POST /auth/register`
Creates a new candidate account.
- **Request Body**:
  ```json
  {
    "name": "Arjun Patel",
    "email": "arjun.patel@example.com",
    "password": "ValidPassword123!",
    "profile": {
      "target_role": "Backend Engineer",
      "target_level": "Mid",
      "experience_years": 3,
      "primary_language": "Java"
    }
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": { "id": "67b9f...", "name": "Arjun Patel", "email": "arjun.patel@example.com" }
  }
  ```

### `POST /auth/login`
Authenticates with email and password.
- **Request Body**:
  ```json
  {
    "email": "arjun.patel@example.com",
    "password": "ValidPassword123!"
  }
  ```
- **Response** (`200 OK`): Auth token and user payload.

### `GET /auth/me`
Retrieves authenticated candidate's profile and preferences.

### `PUT /auth/me`
Updates candidate settings, target roles, or preferences.

### `DELETE /auth/me`
Permanently deletes candidate account and all associated interview records.

---

## 2. Interview Management Endpoints

### `POST /interviews/`
Configures and launches a new interview session.
- **Request Body**:
  ```json
  {
    "job_role": "Senior Backend Engineer (Java & Distributed Systems)",
    "interview_type": "technical",
    "difficulty": "senior",
    "selected_topics": ["Distributed Systems", "SQL Indexing"],
    "total_questions": 3,
    "timed_mode": true
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "id": "67b9fa...",
    "job_role": "Senior Backend Engineer...",
    "status": "in_progress",
    "current_question_index": 0,
    "current_question": {
      "id": "67b9fb...",
      "question_text": "How do LSM-trees compare to B+ trees in high-write transactional systems?",
      "topic": "Distributed Storage",
      "difficulty": "senior",
      "order": 0
    }
  }
  ```

### `GET /interviews/active`
Retrieves currently unfinished interview session for session recovery.

### `GET /interviews/{id}`
Retrieves session details by ID.

### `POST /interviews/{id}/questions/{q_id}/answer`
Submits an answer and runs the LangGraph AI evaluation node.
- **Request Body**:
  ```json
  {
    "answer_text": "LSM-Trees append writes sequentially to a write-ahead log (WAL) and memory table, while B+ trees require random page writes..."
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "technical_accuracy": 92.0,
    "relevance": 95.0,
    "completeness": 88.0,
    "clarity": 90.0,
    "overall_score": 91.5,
    "strengths": ["Clear distinction between sequential vs random I/O"],
    "missing_concepts": ["Bloom filters used to optimize read latency"],
    "feedback": "Strong architectural breakdown.",
    "model_answer": "A comprehensive answer highlights that LSM-Trees buffer in MemTable..."
  }
  ```

### `POST /interviews/{id}/skip`
Skips the current question and advances session.

### `POST /interviews/{id}/end`
Prematurely concludes the interview session.

### `GET /interviews/{id}/report`
Retrieves final interview debrief, aggregate score, and recommendations.

---

## 3. Analytics, Coach & Gamification

### `GET /dashboard/`
Returns candidate velocity curve, recent evaluations, and AI coach prescription.

### `GET /coach/`
Returns personalized practice drills and diagnostic telemetry.

### `GET /analytics/dna`
Returns multi-dimensional competency vector and topic mastery breakdown.

### `GET /analytics/skill-tree`
Returns competency Directed Acyclic Graph (DAG) with prerequisites and status.

### `GET /gamification/achievements`
Returns XP, levels, daily streak, and milestone badges.

### `GET /history/`
Returns paginated list of past interviews with query filters.
