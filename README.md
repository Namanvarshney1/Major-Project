# PrepPulse

> **An AI-Powered Intelligent Interview Preparation and Evaluation System**  
> *Practice Smarter. Perform Stronger.*

[![Backend Tests](https://img.shields.io/badge/pytest-23%20passed-brightgreen?style=flat-square)](./backend/tests)
[![Frontend Tests](https://img.shields.io/badge/vitest-11%20passed-brightgreen?style=flat-square)](./frontend/src/test)
[![Design Reference](https://img.shields.io/badge/Design-Google%20Stitch%20Preserved-c6f26a?style=flat-square&labelColor=1b1c17)](./design-reference)
[![Python Version](https://img.shields.io/badge/python-3.12.13-blue?style=flat-square)](https://python.org)
[![React Version](https://img.shields.io/badge/react-19.3.1-61dafb?style=flat-square)](https://react.dev)

---

## Executive Overview

**PrepPulse** is an AI-powered technical and behavioral interview preparation platform built to elevate college graduates and engineering candidates from foundational understanding to senior-level interview execution.

Rather than acting as a generic conversational chatbot or disconnected quiz widget, PrepPulse implements a rigorous, stateful engineering preparation environment. Candidates engage in structured mock interviews, receive comprehensive multi-dimensional evaluations (Technical Accuracy, Relevance, Completeness, Clarity), and view actionable recommendations backed by an evolving **Interview DNA** competency profile.

The central learning loop is:
$$\text{Practice} \longrightarrow \text{Evaluate} \longrightarrow \text{Understand} \longrightarrow \text{Improve} \longrightarrow \text{Practise Again}$$

---

## Visual Design Reference & Preservation

The user interface of PrepPulse is an intentional recreation of the **Google Stitch UI System** export provided in `design-reference/`:

- **Warm Editorial Canvas**: Warm ivory backdrop (`#fbf9f0`) paired with paper-white containers (`#ffffff`).
- **Architectural 1px Borders**: Muted, structural boundary dividers (`#c6c7c0`, `#e4e3da`) without fuzzy drop-shadows.
- **Pulse Lime Accents**: High-contrast, vibrant lime accents (`#c6f26a` / `#4b6700`) for high-velocity cognitive indicators.
- **Editorial Typography**: Pairing **Manrope** headlines, **Geist** body text, and **JetBrains Mono** tabular code metrics.
- **Pure React Native Implementation**: Built with zero iframes and zero raw HTML embedding. Every element is a native, typed TypeScript React component styled with Tailwind CSS v4.

---

## System Architecture

```
React + TypeScript + Tailwind CSS (Vite SPA)
                    │
                    ▼  (REST API with PyJWT Bearer Tokens)
         FastAPI Application Server
  ┌─────────────────┴─────────────────┐
  │                                   │
  ▼                                   ▼
Argon2id Auth & Security      LangGraph State Machine (10 Nodes)
  │                                   │
  ▼                                   ▼
MongoDB Atlas / Local / MongoMock    Groq API (Llama-3.3-70B-Versatile)
  - users                             - Structured Output Validation (Pydantic)
  - interviews                        - Minimal Context Token Efficiency
  - questions                         - Calibrated Offline Fallback Engine
  - answers & evaluations
  - achievements & practice_activity
```

---

## 10-Node LangGraph State Workflow

The interview cycle is orchestrated server-side by a stateful `StateGraph`:

1. `validate_interview`: Validates session ownership, tenant bounds, and active state.
2. `load_relevant_context`: Loads minimal role/track metadata without polluting tokens with prior conversation turns.
3. `generate_question`: Prompts the Groq-hosted Llama-3 model for question text, topic, and rubric criteria.
4. `validate_question`: Enforces question length, required concepts, and schema integrity.
5. `evaluate_answer`: Analyzes candidate submission against rubric dimensions (Accuracy, Relevance, Completeness, Clarity).
6. `validate_evaluation`: Enforces valid scoring (0–100) and structured feedback.
7. `persist_evaluation`: Records scores, awards XP, and updates question progress.
8. `select_next_action`: Branches between advancing to the next question or triggering report generation.
9. `generate_final_report`: Computes aggregate score, identifies strongest/weakest topics, and prescribes remediation.
10. `finalize_session`: Marks status as `completed` and records session timestamp.

---

## Verified Technology Stack & Dependency Versions

### Frontend
- **React**: `19.3.1`
- **TypeScript**: `6.0.3`
- **Vite**: `8.3.4`
- **Tailwind CSS**: `4.3.3` (via `@tailwindcss/vite`)
- **React Router**: `7.18.4`
- **TanStack React Query**: `5.104.5`
- **Recharts**: `3.10.1`
- **Lucide React**: `1.61.0`
- **Vitest**: `5.0.5`
- **Testing Library**: `16.3.3`

### Backend
- **Python**: `3.12.13`
- **FastAPI**: `0.135.3`
- **Pydantic**: `2.13.1`
- **Motor (Async PyMongo)**: `3.7.2`
- **Argon2-cffi**: `25.1.0`
- **PyJWT**: `2.12.1`
- **LangChain**: `1.2.14`
- **LangGraph**: `1.1.3`
- **LangChain-Groq**: `1.1.3`
- **Pytest**: `9.1.1`
- **MongoMock-Motor**: `0.0.37` (automatic local in-memory fallback)

---

## Product Screens Implemented

1. **Landing Page (`/`)**: Hero banner, core learning loop, methodology, architecture preview, features matrix.
2. **Authentication (`/login`, `/register`)**: Argon2id password hashing, PyJWT tokens, 1-click test candidate fill.
3. **Dashboard (`/dashboard`)**: Session velocity chart, AI Coach prescription, recent evaluations, streak & XP telemetry.
4. **Interview Setup (`/interview/setup`)**: Track selector (Technical, System Design, Behavioral, HR), difficulty buttons (`mid`, `senior`, `staff`), question count, timer mode toggle, topic focus matrix.
5. **Interview Arena (`/interview/:id`)**: Question cockpit, countdown timer, text editor, real-time word counter, signal detector chips, skip/end session actions.
6. **Answer Evaluation (`/interview/:id/evaluation/:qId`)**: Score hero, 4-metric matrix, coach quote, strengths, missing concepts, model answer accordion.
7. **Final Interview Report (`/interview/:id/report`)**: Overall score, answered count, strongest/weakest topics, actionable recommendations, question-by-question review, PDF print/export.
8. **AI Coach (`/coach`)**: Autonomous adaptive mentorship cockpit, personalized tactical drills, empirical diagnostic state.
9. **Interview DNA (`/dna`)**: Interactive Recharts radar polygon (6 evaluated axes), topic mastery breakdown, cognitive strengths/growth areas, ethical learning metrics disclaimer.
10. **Skill Tree (`/skill-tree`)**: Competency DAG, track completion bar, prerequisite nodes, direct 1-click drill launch.
11. **Interview History (`/history`)**: Filterable (role, difficulty, status), paginated archive table, view debrief action.
12. **Learning Centre (`/learning`)**: High-yield engineering cheat sheets (B-Tree/LSM-Tree, Sagas, Concurrency, STAR Method), targeted micro-drills, curated literature links.
13. **Achievements & Gamification (`/achievements`)**: XP progression, level progression bar, daily streak counter, active directives, milestone badges.
14. **Settings (`/settings`)**: Candidate profile parameters, preferred language, timed mode defaults, cryptographic security specs, permanent account erasure.

---

## Getting Started

### 1. Clone & Set Up Python Virtual Environment

```powershell
# In PowerShell (Windows)
python -m venv .venv
.\.venv\Scripts\activate
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `backend/.env`:
```powershell
cp ..\.env.example .env
```
*(PrepPulse runs out of the box with zero required external paid credentials; MongoMock and calibrated offline evaluation engines engage automatically if MongoDB or Groq keys are absent).*

### 3. Launch Backend

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Interactive API Swagger Docs: **http://127.0.0.1:8000/docs**

### 4. Launch Frontend

```powershell
cd ..\frontend
npm install
npm run dev
```
Web Application: **http://localhost:5173**

---

## Automated Test Results

### Backend Test Execution (Pytest)
```
============================= test session starts =============================
platform win32 -- Python 3.12.13, pytest-9.1.1, pluggy-1.7.0
rootdir: Project\backend
collected 23 items

tests/test_ai_workflow.py::test_workflow_question_generation PASSED      [  4%]
tests/test_ai_workflow.py::test_workflow_answer_evaluation PASSED        [  8%]
tests/test_ai_workflow.py::test_workflow_finalization_transition PASSED  [ 13%]
tests/test_auth.py::test_argon2id_hashing PASSED                         [ 17%]
tests/test_auth.py::test_register_success PASSED                         [ 21%]
tests/test_auth.py::test_register_duplicate_email PASSED                 [ 26%]
tests/test_auth.py::test_login_success PASSED                            [ 30%]
tests/test_auth.py::test_login_invalid_password PASSED                   [ 34%]
tests/test_auth.py::test_get_profile PASSED                              [ 39%]
tests/test_auth.py::test_update_profile PASSED                           [ 43%]
tests/test_auth.py::test_delete_account PASSED                           [ 47%]
tests/test_evaluations.py::test_submit_and_evaluate_answer PASSED        [ 52%]
tests/test_evaluations.py::test_duplicate_submission_handling PASSED     [ 56%]
tests/test_evaluations.py::test_get_final_report PASSED                  [ 60%]
tests/test_interviews.py::test_create_interview PASSED                   [ 65%]
tests/test_interviews.py::test_get_active_interview PASSED               [ 69%]
tests/test_interviews.py::test_skip_question PASSED                      [ 73%]
tests/test_interviews.py::test_end_interview PASSED                      [ 78%]
tests/test_security.py::test_unauthenticated_request_rejected PASSED     [ 82%]
tests/test_security.py::test_invalid_token_rejected PASSED               [ 86%]
tests/test_security.py::test_cross_user_interview_access_forbidden PASSED [ 91%]
tests/test_security.py::test_cross_user_answer_submission_forbidden PASSED [ 95%]
tests/test_security.py::test_cross_user_report_access_forbidden PASSED   [100%]

============================= 23 passed in 1.80s ==============================
```

### Frontend Test Execution (Vitest)
```
 RUN  v5.0.5 Project/frontend

 ✓ src/test/UIComponents.test.tsx (5 tests)
 ✓ src/test/AuthValidation.test.tsx (2 tests)
 ✓ src/test/NavigationAndApp.test.tsx (2 tests)
 ✓ src/test/InterviewSetup.test.tsx (2 tests)

 Test Files  4 passed (4)
      Tests  11 passed (11)
   Duration  2.22s
```

### Production Build (Vite + Rollup)
```
> frontend@0.0.0 build
> tsc -b && vite build

✓ 2585 modules transformed.
dist/index.html                   1.40 kB │ gzip:   0.75 kB
dist/assets/index-yJXHAlfh.css   44.76 kB │ gzip:   8.39 kB
dist/assets/index-Dm8mizR3.js   752.84 kB │ gzip: 212.04 kB
✓ built in 596ms
```

---

## Pre-Seeded Evaluation Account

To test all features immediately without registering:
- **Email**: `arjun.patel@example.com`
- **Password**: `ValidPassword123!`
- *(Click the **"Fill Arjun Patel Demo Account"** button on the Login page)*

---

## Known Limitations & Future Work

1. **Audio Recording / Speech-to-Text**: The current release focuses on written synthesis and architectural diagrams. Live microphone streaming via Web Audio API is slated for Phase 2.
2. **Vector Database / RAG**: The Learning Centre currently uses structured topic retrieval; integrating ChromaDB or Pinecone for semantic PDF embedding is designed as a modular add-on.
3. **Live Peer Coding**: The sandbox code editor provides syntax highlighting and local execution simulation; shared multi-candidate socket sessions are planned for a subsequent release.

---

## License

Academic Project License. Built for Sem 3 MCA Major Project evaluation.
