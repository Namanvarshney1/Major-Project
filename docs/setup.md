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
├── backend-node/           # Primary Application Backend (Node.js + Express + JavaScript ES Modules)
│   ├── src/                # Auth (Argon2id), Interviews, DB CRUD, Analytics, Coach (all .js)
│   ├── test/               # Integration tests
│   ├── Dockerfile
│   └── package.json
├── backend/                # Python AI Microservice (FastAPI + LangGraph + Groq)
│   ├── app/                # 10-Node Workflow, Groq LLM, /internal/ai endpoints
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/               # React (JavaScript + JSX) + Vite + Tailwind CSS
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── design-reference/       # Extracted Google Stitch UI assets & reference
├── docs/                   # Architecture, Security, API Documentation
├── docker-compose.yml      # Multi-container orchestration (Node, Python AI, Mongo, React)
└── README.md               # Master Project Overview
```

---

## 3. Quick Start Commands

### Step 1: Configure Environment Variables

```bash
# In the Project root:
cp .env.example .env
cp .env.example backend-node/.env
cp .env.example backend/.env
```

Key environment settings:
- `PORT=8000` (Node.js main backend)
- `PYTHON_AI_SERVICE_URL=http://127.0.0.1:8001`
- `AI_SERVICE_PORT=8001` (Python AI microservice)
- `INTERNAL_SERVICE_SECRET=preppulse-internal-secret-change-in-prod`

---

### Step 2: Start the Python AI Microservice (Port 8001)

Open Terminal 1:

```powershell
# Windows PowerShell
.\.venv\Scripts\activate
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

*The Python microservice provides the 10-node LangGraph state machine, Groq question generation, and 4-metric evaluation engine via internal service-to-service endpoints.*

---

### Step 3: Start the Node.js Primary Backend (Port 8000)

Open Terminal 2:

```powershell
cd backend-node
npm install
npm start
# For development with file watching: npm run dev
```

*The Node.js backend handles client authentication, MongoDB persistence, session state, analytics DNA, and proxies AI workflows to port 8001.*

---

### Step 4: Start the React Frontend (Port 5173)

Open Terminal 3:

```powershell
cd frontend
npm install
npm run dev
```

The application is live at:  
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

### Node.js Backend Integration Test Suite (15 Tests)

```powershell
cd backend-node
npm test
```

Verifies:
- Health check endpoints
- Argon2id registration and password verification
- JWT issuance, verification, and revocation
- Interview lifecycle (create, get active, save draft, submit answer)
- 4-metric AI scoring & deterministic fallback
- Whole-interview report generation
- 6-axis Interview DNA & Dashboard metrics
- Python AI microservice client communication

---

### Python AI Microservice Tests (34 Tests)

```powershell
cd backend
..\.venv\Scripts\pytest -v
```

Verifies:
- LangGraph 10-node state machine workflow
- Question generation schemas
- Answer evaluation scoring logic
- Service-to-service authentication (`X-Internal-Secret`)
- Internal API endpoints (`/internal/ai/generate-questions`, `/internal/ai/evaluate-answer`, `/internal/ai/whole-debrief`, `/internal/ai/health`)

---

### Frontend Production Build Verification

```powershell
cd frontend
npm run build
```
