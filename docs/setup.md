# PrepPulse — Local Setup & Development Guide

This guide describes how to run and verify **PrepPulse** locally on Windows, macOS, or Linux.

---

## 1. Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended).
- **Python**: v3.11 or v3.12 (Python 3.12.13 used in this environment).
- **MongoDB**: Optional (PrepPulse includes an automatic in-memory mock fallback when local MongoDB is not running).
- **Groq API Key**: Optional (PrepPulse includes a deterministic offline evaluation fallback engine for local grading without API credentials).

---

## 2. Monorepo Structure

```
Project/
├── .venv/                  # Python Virtual Environment
├── backend/                # FastAPI Application & AI Workflows
│   ├── app/
│   ├── tests/
│   └── requirements.txt
├── frontend/               # React + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── design-reference/       # Extracted Google Stitch UI assets & reference
├── docs/                   # Architecture, Security, API Documentation
├── docker-compose.yml      # Container orchestration
└── README.md               # Master Project Overview
```

---

## 3. Quick Start Commands

### Step 1: Configure Environment Variables

Create `.env` files for both frontend and backend using `.env.example`:

```bash
# In the Project root:
cp .env.example backend/.env
```

### Step 2: Start the FastAPI Backend

Open a terminal in the project root:

```powershell
# Windows PowerShell
.\.venv\Scripts\activate
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The interactive OpenAPI documentation will be accessible at:  
👉 **http://127.0.0.1:8000/docs**

### Step 3: Start the React Frontend

Open a second terminal window:

```powershell
cd frontend
npm install
npm run dev
```

The application will be live at:  
👉 **http://localhost:5173**

---

## 4. Pre-Seeded Demo Candidate Credentials

For quick evaluation during college project defense, click the **"Fill Arjun Patel Demo Account"** button on the Login page:

- **Email**: `arjun.patel@example.com`
- **Password**: `ValidPassword123!`
- **Role**: Senior Backend Engineer (Java & Distributed Systems)

Or register a new account on `/register`.

---

## 5. Running the Automated Test Suites

### Backend Unit & Integration Tests (23 Tests)

```powershell
cd backend
..\.venv\Scripts\pytest -v
```

Expected output:
```
tests/test_ai_workflow.py::test_workflow_question_generation PASSED
tests/test_ai_workflow.py::test_workflow_answer_evaluation PASSED
tests/test_ai_workflow.py::test_workflow_finalization_transition PASSED
tests/test_auth.py::test_argon2id_hashing PASSED
tests/test_auth.py::test_register_success PASSED
...
============================= 23 passed in 1.80s ==============================
```

### Frontend Component & Route Tests (11 Tests)

```powershell
cd frontend
npm test
```

Expected output:
```
 ✓ src/test/UIComponents.test.tsx (5 tests)
 ✓ src/test/AuthValidation.test.tsx (2 tests)
 ✓ src/test/NavigationAndApp.test.tsx (2 tests)
 ✓ src/test/InterviewSetup.test.tsx (2 tests)

 Test Files  4 passed (4)
      Tests  11 passed (11)
```

### Production Build Verification

```powershell
cd frontend
npm run build
```
