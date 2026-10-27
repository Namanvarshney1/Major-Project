# PrepPulse — Security Architecture & Threat Model

PrepPulse implements an enterprise-grade defense-in-depth security model adhering to OWASP Application Security Verification Standards (ASVS).

---

## 1. Cryptographic Authentication & Password Storage

- **Password Hashing Algorithm**: **Argon2id (RFC 9106)**.
  - Parameters: Memory cost = 65,536 KiB (64 MiB), Time cost = 3 iterations, Parallelism = 4 threads.
  - Mitigates GPU-accelerated brute force and side-channel timing attacks.
  - Zero plain-text passwords or weak MD5/SHA-256 hashes are ever permitted.
- **Session Tokens**: **Signed JWTs (PyJWT)** using HMAC-SHA256 (`HS256`).
  - Access tokens have an expiration period (`ACCESS_TOKEN_EXPIRE_MINUTES`, default 120 minutes).
  - Encoded payload contains only non-sensitive subject claims (`sub: user_id`).
  - Invalid, tampered, or expired tokens immediately trigger `401 Unauthorized` responses.

---

## 2. Multi-Tenant Resource Isolation

Every database query that retrieves, mutates, or deletes user-owned data is strictly scoped to the authenticated `user_id`:

```python
# Enforced pattern across all repositories
async def get_by_id_and_user(self, interview_id: str, user_id: str):
    doc = await self.collection.find_one({
        "_id": ObjectId(interview_id),
        "user_id": user_id
    })
    if not doc:
        raise NotFoundException("Resource not found or unauthorized")
    return doc
```

### Verified Test Cases:
- `test_cross_user_interview_access_forbidden`: Candidate A cannot view Candidate B's interview session.
- `test_cross_user_answer_submission_forbidden`: Candidate A cannot submit answers to Candidate B's question.
- `test_cross_user_report_access_forbidden`: Candidate A cannot access Candidate B's final report.

---

## 3. Duplicate Submission Protection

To prevent concurrent race conditions, double-clicks, or replay attacks during answer submission, the database enforces a unique compound index:

```python
await db.answers.create_index(
    [("interview_id", 1), ("question_id", 1)],
    unique=True
)
```

If a candidate attempts to resubmit an answer to a question that has already been recorded, the system raises a `409 Conflict` error (`DuplicateSubmissionException`).

---

## 4. API Key Confidentiality

- **Groq API Key**: Kept exclusively within backend environment variables (`GROQ_API_KEY`).
- The browser frontend communicates only with the FastAPI application and has zero access or knowledge of AI provider API keys.
- All outbound requests to Groq are executed server-side via LangChain ChatGroq.

---

## 5. Input Sanitization & Attack Mitigation

- **Pydantic v2 Strong Typing**: Every request payload undergoes schema validation before reaching business logic.
- **BSON Injection Prevention**: All URL parameters are validated against `ObjectId.is_valid()` before executing database queries.
- **CORS Restrictions**: Configurable allowed origins (`FRONTEND_ORIGINS`) to prevent malicious cross-origin requests.
- **Rate Limiting**: Configured request limits per client IP to safeguard against denial-of-service attempts.
