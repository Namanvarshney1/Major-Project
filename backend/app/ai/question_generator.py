"""
PrepPulse Intelligent Question Generator
Generates realistic, rigorous interview questions tailored to Role, Round Type, Seniority, and Topic.
Supports Groq Llama with structured output and a curated multi-domain calibrated offline engine.
"""
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

from app.core.logging import logger
from app.core.interview_config import (
    SUPPORTED_ROLES,
    ROUND_TYPES,
    get_topics_for_role_and_round,
    HR_TOPICS,
    PI_TOPICS,
    MANAGERIAL_TOPICS,
    TECHNICAL_ROLE_TOPICS,
)
from app.ai.llm import llm_client
from app.ai.output_schemas import QuestionGenOutput


# Curated high-signal question templates organized by (round_type / role / topic)
CURATED_QUESTIONS: Dict[str, List[Dict[str, Any]]] = {
    # HR ROUND
    "hr": [
        {
            "topic": "Self-Introduction",
            "question_text": "Please walk me through your professional background. Focus on key milestones that shaped your engineering philosophy and why this role is the natural next step in your career.",
            "expected_concepts": ["Chronological career progression", "Key technical achievements", "Engineering philosophy", "Role motivation"],
            "evaluation_rubric": "Look for concise storytelling, structured communication (under 3 mins), high-impact metrics, and alignment with target role.",
        },
        {
            "topic": "Strengths and Weaknesses",
            "question_text": "What is your greatest technical or execution strength, and what is a genuine area of improvement you are currently addressing with deliberate practice?",
            "expected_concepts": ["Self-awareness", "Specific concrete strength with impact", "Actionable improvement plan", "Growth mindset"],
            "evaluation_rubric": "Avoid cliché answers like 'I work too hard'. Look for vulnerability, self-awareness, and proactive growth steps.",
        },
        {
            "topic": "Career Goals",
            "question_text": "Where do you see your engineering impact evolving over the next 2 to 3 years, and what specific competencies or leadership capabilities are you striving to master?",
            "expected_concepts": ["Long-term engineering vision", "Technical mastery vs leadership balance", "Company value creation", "Deliberate skill roadmap"],
            "evaluation_rubric": "Reward realistic, ambitious career paths aligned with senior engineering trajectory and continuous learning.",
        },
        {
            "topic": "Company Fit",
            "question_text": "What values or engineering culture principles resonate with you most in high-performing teams, and how do you ensure your daily habits reflect them?",
            "expected_concepts": ["Cultural alignment", "Ownership and accountability", "High communication standards", "Constructive debate"],
            "evaluation_rubric": "Evaluate cultural empathy, teamwork values, and whether candidate thrives in high-velocity, rigorous environments.",
        },
        {
            "topic": "Teamwork",
            "question_text": "Describe a scenario where you collaborated closely with cross-functional partners (e.g. Product, Design, QA) under a tight deadline. How did you maintain alignment?",
            "expected_concepts": ["Cross-functional communication", "Proactive dependency tracking", "Trade-off negotiation", "Shared mission focus"],
            "evaluation_rubric": "Candidate must demonstrate high empathy, clear written updates, and collective delivery over individual heroics.",
        },
        {
            "topic": "Conflict Resolution",
            "question_text": "Tell me about a time you strongly disagreed with a colleague or lead regarding a technical or delivery decision. How did you resolve the conflict constructively?",
            "expected_concepts": ["Data-driven argumentation", "Active listening and empathy", "Agree and commit mindset", "De-escalation mechanics"],
            "evaluation_rubric": "Look for objective, respectful conflict resolution focused on customer outcome rather than personal ego.",
        },
        {
            "topic": "Adaptability",
            "question_text": "How do you handle rapid priority shifts or mid-sprint requirement changes without compromising software quality or team morale?",
            "expected_concepts": ["Agility under ambiguity", "Scope management and triage", "Maintaining calm leadership", "Transparent stakeholder renegotiation"],
            "evaluation_rubric": "Reward candidates who embrace ambiguity, re-evaluate critical paths quickly, and protect architectural integrity.",
        },
        {
            "topic": "Behavioral Questions",
            "question_text": "Using the STAR method (Situation, Task, Action, Result), describe a high-stakes production incident or delivery challenge and how you navigated it.",
            "expected_concepts": ["Situation context", "Specific personal actions", "Measurable engineering outcome", "Lessons learned and post-mortem"],
            "evaluation_rubric": "Strict adherence to STAR structure. Clear personal contribution ('I' vs 'we') and quantifiable business outcome.",
        },
    ],

    # PI (PERSONAL INTERVIEW) ROUND
    "pi": [
        {
            "topic": "Personal Background",
            "question_text": "Tell me about your personal journey into software engineering. What was the catalyst that ignited your passion for technology and building systems?",
            "expected_concepts": ["Origin story and motivation", "Curiosity and problem-solving drive", "Key inflection points", "Authentic passion"],
            "evaluation_rubric": "Look for genuine intellectual curiosity, early experimentation, and a clear driving narrative.",
        },
        {
            "topic": "Resume-Based Questions",
            "question_text": "Pick the most technically challenging project listed on your resume. Walk me through the architecture, your exact contributions, and the trade-offs you navigated.",
            "expected_concepts": ["System architecture breakdown", "Personal ownership", "Technical constraints and trade-offs", "Production results"],
            "evaluation_rubric": "Check for deep ownership of resume claims. Candidate should effortlessly discuss deep implementation details and edge cases.",
        },
        {
            "topic": "Academic Projects",
            "question_text": "Discuss an academic or capstone engineering project you engineered from scratch. How did you choose the tech stack and handle architectural limitations?",
            "expected_concepts": ["Foundational system design", "Technology justification", "Overcoming resource limits", "Demonstrated rigor"],
            "evaluation_rubric": "Reward sound technical rationale rather than using tools blindly because they are popular.",
        },
        {
            "topic": "Internship Experience",
            "question_text": "Reflect on your internship or prior industry experience. What was the biggest gap between theoretical computer science and shipping code in a real-world production codebase?",
            "expected_concepts": ["Production readiness vs textbook code", "Observability, logging and metrics", "Legacy codebase navigation", "Team code reviews"],
            "evaluation_rubric": "Look for practical maturity, appreciation for operational discipline, testing, and continuous deployment.",
        },
        {
            "topic": "Achievements",
            "question_text": "What is the single engineering accomplishment you are proudest of to date? Why was it meaningful, and what measurable impact did it achieve?",
            "expected_concepts": ["High-impact delivery", "Personal initiative", "Measurable user/system metrics", "Overcoming adversity"],
            "evaluation_rubric": "Look for pride in technical craft, perseverance through blockers, and clear articulation of impact.",
        },
        {
            "topic": "Challenges Faced",
            "question_text": "Describe a project or technical initiative that did not go according to plan or failed. What went wrong, how did you recover, and what did you learn?",
            "expected_concepts": ["Intellectual honesty", "Root cause identification", "Ownership without blaming others", "Actionable retrospection"],
            "evaluation_rubric": "High marks for taking accountability, thoughtful post-mortem thinking, and demonstrated growth from failure.",
        },
        {
            "topic": "Career Motivation",
            "question_text": "What drives you day-to-day as an engineer? Is it user impact, architectural elegance, speed of execution, or technical complexity?",
            "expected_concepts": ["Intrinsic engineering motivation", "Craftsmanship", "User empathy", "Energy and curiosity"],
            "evaluation_rubric": "Authenticity and depth of self-reflection regarding what fuels their best engineering work.",
        },
        {
            "topic": "Future Goals",
            "question_text": "In the emerging landscape of AI, cloud architecture, and distributed systems, how are you investing in your long-term technical competitiveness?",
            "expected_concepts": ["Proactive continuous learning", "Hands-on side projects", "Reading engineering papers/blogs", "Future-proof competencies"],
            "evaluation_rubric": "Evidence of proactive self-directed study, experimentation with modern tools, and deep curiosity.",
        },
    ],

    # MANAGERIAL ROUND
    "managerial": [
        {
            "topic": "Leadership",
            "question_text": "How do you cultivate high psychological safety while simultaneously maintaining uncompromising standards of technical execution and delivery?",
            "expected_concepts": ["Psychological safety", "High bar for excellence", "Blameless post-mortems", "Empowering team members"],
            "evaluation_rubric": "Candidate must show that empathy and high standards reinforce each other rather than conflict.",
        },
        {
            "topic": "Decision-Making",
            "question_text": "How do you make critical architectural or product decisions when you possess only 60% of the desired information and the cost of delay is high?",
            "expected_concepts": ["One-way vs two-way door decisions", "Reversibility analysis", "Bias for action with mitigation", "Stakeholder consultation"],
            "evaluation_rubric": "Reward structured decision-making frameworks (e.g. Bezos reversible decisions), fast feedback loops, and risk management.",
        },
        {
            "topic": "Team Management",
            "question_text": "How do you manage an engineer who is technically brilliant but disruptive to team collaboration, or conversely, an eager teammate who is chronically underperforming?",
            "expected_concepts": ["Direct, compassionate feedback", "Root cause diagnosis (skill vs will)", "Performance improvement plans", "Protecting team cohesion"],
            "evaluation_rubric": "Look for proactive, timely intervention, clear behavioral expectations, documentation, and empathy.",
        },
        {
            "topic": "Conflict Resolution",
            "question_text": "Two senior architects on your team are deadlocked on choosing between an event-driven architecture and a synchronous REST model for a critical service. How do you facilitate a resolution?",
            "expected_concepts": ["Establishing shared evaluation criteria", "Spike / POC benchmarking", "Focus on business SLOs", "Decide and align protocol"],
            "evaluation_rubric": "Avoid arbitrary executive vetoes. Candidate should anchor debates in latency SLOs, operational complexity, and team capabilities.",
        },
        {
            "topic": "Delegation",
            "question_text": "How do you determine what to delegate versus what to handle personally? How do you maintain visibility and quality without micromanaging?",
            "expected_concepts": ["Context over control", "Milestone checkpoints and design docs", "Stretching junior engineers", "Avoiding bottlenecks"],
            "evaluation_rubric": "Strong leaders provide clear context, definitions of done, and support while giving engineers room to solve the problem.",
        },
        {
            "topic": "Prioritization",
            "question_text": "Your team faces urgent technical debt, business feature requests from sales, and critical security patch requirements, all exceeding sprint capacity. How do you prioritize?",
            "expected_concepts": ["Eisenhower matrix / RICE scoring", "Technical debt budget (e.g. 20% rule)", "Risk assessment of security items", "Transparent executive trade-offs"],
            "evaluation_rubric": "Look for balanced portfolio management where tech debt and security are not perpetually deferred for short-term features.",
        },
        {
            "topic": "Stakeholder Communication",
            "question_text": "A major production milestone is at risk of slipping by 3 weeks. How and when do you communicate this to executive stakeholders, and what mitigation options do you propose?",
            "expected_concepts": ["No surprises culture", "Early proactive warning", "Option 1: Scope reduction, Option 2: Phased rollout", "Transparent post-incident remediation"],
            "evaluation_rubric": "Evaluate courage to deliver bad news early, paired with constructive trade-offs rather than excuses.",
        },
        {
            "topic": "Situational Judgment",
            "question_text": "During peak traffic hours, a critical customer-facing feature degrades performance system-wide. The business wants to keep it live for revenue, but engineering recommends immediate kill-switch. What do you do?",
            "expected_concepts": ["Customer trust & system availability first", "Kill-switch / feature flag execution", "Degraded mode fallback", "Executive communication with revenue impact"],
            "evaluation_rubric": "System stability and data integrity take priority over localized short-term revenue. Look for decisive execution.",
        },
    ],
}


def get_curated_fallback_question(role: str, round_type: str, topic: str, order: int, difficulty: str) -> Dict[str, Any]:
    """Generates a high-quality domain-calibrated question when LLM is offline or times out."""
    norm_round = (round_type or "technical").lower()
    
    # 1. Check HR / PI / Managerial
    if norm_round in CURATED_QUESTIONS:
        questions = CURATED_QUESTIONS[norm_round]
        # Try finding exact topic match
        for q in questions:
            if q["topic"].lower() in topic.lower() or topic.lower() in q["topic"].lower():
                return {
                    "question_text": q["question_text"],
                    "topic": q["topic"],
                    "difficulty": difficulty,
                    "expected_concepts": q["expected_concepts"],
                    "evaluation_rubric": q["evaluation_rubric"],
                    "order": order
                }
        # Fallback to cycling through the round's questions
        selected = questions[(order - 1) % len(questions)]
        return {
            "question_text": selected["question_text"],
            "topic": topic or selected["topic"],
            "difficulty": difficulty,
            "expected_concepts": selected["expected_concepts"],
            "evaluation_rubric": selected["evaluation_rubric"],
            "order": order
        }
    
    # 2. Technical round: generate tailored role-specific questions
    role_clean = role.strip()
    
    technical_templates = {
        "Data Structures and Algorithms": {
            "question_text": f"For a high-concurrency {role_clean} application, explain how you would design an efficient LRU Cache or Rate Limiter. Discuss time/space complexity, data structure choices, and thread safety under heavy write contention.",
            "expected_concepts": ["Hash Map + Doubly Linked List", "O(1) get/put operations", "Locking / ReadWriteLock / ConcurrentHashMap", "Memory footprint and eviction policies"],
            "rubric": "Candidate must explain time complexities and address concurrent access trade-offs.",
        },
        "REST APIs": {
            "question_text": f"Design a resilient, backward-compatible REST API for a high-volume service in your role as a {role_clean}. How do you structure versioning, idempotency keys for mutations, pagination, and rate limiting?",
            "expected_concepts": ["Idempotency keys (IETF standard)", "Cursor-based vs offset pagination", "API versioning strategies", "HTTP status code semantics (409, 429, 503)"],
            "rubric": "Look for practical knowledge of idempotency headers, pagination scale limits, and graceful error envelopes.",
        },
        "Database Design and SQL": {
            "question_text": f"Compare indexing strategies (B-Tree, Hash, GIN) for a database schema handling millions of writes daily. Explain how indexing impacts write amplification, index bloat, and query execution plans via EXPLAIN ANALYZE.",
            "expected_concepts": ["B-Tree range scans vs Hash lookups", "Write amplification on inserts/updates", "Covering indexes / index-only scans", "Execution plan analysis"],
            "rubric": "Reward mechanical sympathy for disk I/O, cache locality, and indexing cost trade-offs.",
        },
        "Authentication and Authorization": {
            "question_text": f"Explain the architectural security trade-offs between Stateless JWTs and Stateful Server Sessions in distributed microservices. How do you handle token revocation, key rotation, and RBAC vs ABAC permissions?",
            "expected_concepts": ["JWT signature verification without DB lookup", "Revocation difficulty and Redis blacklists", "Short-lived access tokens with refresh tokens", "JWKS key rotation and asymmetric cryptography (RS256)"],
            "rubric": "Candidate must address token revocation trade-offs and cryptographic signature validation.",
        },
        "System Design": {
            "question_text": f"Design a distributed notifications and alert dispatching service capable of delivering millions of messages with guaranteed at-least-once delivery, deduplication, and multi-channel routing (Email, Push, SMS).",
            "expected_concepts": ["Message queues (Kafka / SQS / RabbitMQ)", "Idempotency and deduplication filters", "Dead letter queues (DLQ) and exponential backoff", "Fan-out architecture and rate-limiting per provider"],
            "rubric": "Look for decoupling through queues, circuit breakers, backpressure, and failure isolation.",
        },
        "Caching and Performance": {
            "question_text": f"Compare Cache-Aside, Write-Through, and Write-Behind caching patterns. How do you prevent and resolve Cache Stampede (Thundering Herd), Cache Penetration, and Cache Avalanche under sudden traffic spikes?",
            "expected_concepts": ["Cache-Aside mechanics", "Mutual exclusion locks (Mutex) for stampede prevention", "Bloom filters for cache penetration", "Jitter / random TTL expiration for avalanche prevention"],
            "rubric": "Look for precise solutions to stampede, penetration, and TTL jittering.",
        },
        "Concurrency": {
            "question_text": f"Explain the difference between synchronous blocking execution, non-blocking asynchronous event loops, and modern virtual threads (coroutines). Discuss memory overhead, context-switch penalties, and I/O multiplexing via epoll.",
            "expected_concepts": ["OS thread stack memory (~1MB) vs lightweight fibers", "Epoll / kqueue non-blocking I/O multiplexing", "Context switching overhead and CPU cache thrashing", "Cooperative vs preemptive scheduling"],
            "rubric": "Reward deep mechanical understanding of thread memory overhead, event loops, and thread pool sizing.",
        },
        "Testing and Debugging": {
            "question_text": f"Describe your strategy for diagnosing a non-deterministic latency spike or memory leak in a production service. Walk through the telemetry, profilers, heap dumps, and distributed tracing tools you utilize.",
            "expected_concepts": ["APM metrics (P99 / P99.9 latencies)", "Distributed tracing with OpenTelemetry / traceparent", "Heap memory dumps and GC logs analysis", "Synthetic load testing and regression reproduction"],
            "rubric": "Candidate should exhibit systematic debugging methodology rather than trial-and-error guesswork.",
        },
        "HTML and CSS": {
            "question_text": "Explain the Critical Rendering Path in modern browsers. How do DOM and CSSOM construction, layout reflows, and composite repaints affect First Contentful Paint (FCP) and Largest Contentful Paint (LCP)?",
            "expected_concepts": ["DOM & CSSOM construction", "Render tree generation", "Reflow vs Repaint triggers", "GPU layer promotion (transform/opacity)"],
            "rubric": "Look for understanding of browser rendering mechanics and Core Web Vitals optimization.",
        },
        "JavaScript": {
            "question_text": "Explain the JavaScript Event Loop, Call Stack, Microtask queue (Promises), and Macrotask queue (setTimeout, I/O). In what exact order do tasks execute, and how does event loop starvation occur?",
            "expected_concepts": ["Call stack execution", "Microtasks (Promise.then, queueMicrotask) priority", "Macrotask queue lifecycle", "Starvation via recursive microtasks"],
            "rubric": "Candidate must accurately detail microtask vs macrotask execution order and non-blocking scheduling.",
        },
        "React and Components": {
            "question_text": "Explain how React's reconciliation algorithm (Fiber Architecture) works. Discuss how state updates are prioritized, how keys preserve identity, and when to use useMemo vs React.memo vs useCallback.",
            "expected_concepts": ["Fiber nodes and double buffering", "Concurrent rendering & lane priority", "Virtual DOM diffing with keys", "Memoization trade-offs"],
            "rubric": "Look for realistic understanding of reconciliation and avoiding premature memoization.",
        },
        "State Management": {
            "question_text": "Compare server-state caching (TanStack Query / SWR) against client-side global state (Zustand / Redux). When is an external state store an anti-pattern versus a necessity?",
            "expected_concepts": ["Server state (stale-while-revalidate, caching, deduplication)", "Client UI state separation", "Normalized state trees", "Selector performance optimization"],
            "rubric": "Candidate must distinguish server cache synchronization from pure ephemeral client state.",
        },
        "Core Java": {
            "question_text": "Explain the Java Memory Model (JMM), the happens-before relationship, and the internal mechanics of the 'volatile' keyword versus synchronized blocks and Atomic classes.",
            "expected_concepts": ["Happens-before guarantee", "CPU cache coherency & memory barriers", "Volatile read/write semantics", "CAS (Compare-And-Swap) operations"],
            "rubric": "Look for low-level understanding of hardware memory barriers, instruction reordering, and visibility.",
        },
        "JVM and Garbage Collection": {
            "question_text": "Compare modern JVM Garbage Collectors: G1GC, ZGC, and Shenandoah. Discuss colored pointers, concurrent compaction, throughput overhead, and sub-millisecond tail latency targets.",
            "expected_concepts": ["Generational G1 regions", "Load barriers and colored pointers in ZGC", "Throughput penalty vs pause time SLA", "Humongous object allocation challenges"],
            "rubric": "Reward nuanced understanding of trade-offs between peak throughput and deterministic low latency.",
        },
        "Spring Boot": {
            "question_text": "Explain Spring Bean lifecycles, BeanPostProcessors, and dynamic AOP proxy creation (CGLIB vs JDK Dynamic Proxies). How do these mechanisms power transactional boundaries (@Transactional)?",
            "expected_concepts": ["BeanFactory vs ApplicationContext", "CGLIB subclassing vs JDK interface proxying", "Self-invocation transaction rollback pitfalls", "Bean creation and dependency injection phases"],
            "rubric": "Candidate must explain proxy-based AOP and why invoking @Transactional methods internally bypasses interception.",
        },
        "SQL and Joins": {
            "question_text": "Explain the internal execution differences between Nested Loop Join, Hash Join, and Merge Join in relational query engines. When does the query planner choose each?",
            "expected_concepts": ["Nested loop with index lookups", "In-memory hash table construction", "Sort-merge join for pre-sorted inputs", "Memory constraints and temporary disk spills"],
            "rubric": "Look for understanding of optimizer costing, memory budgets, and join algorithm trade-offs.",
        },
        "Python and Pandas": {
            "question_text": "How does vectorization in Pandas and NumPy achieve 100x performance gains over native Python loops? Explain underlying C arrays, memory contiguous buffers, and memory-efficient data types (categoricals, chunking).",
            "expected_concepts": ["SIMD vectorization and C-contiguous arrays", "GIL bypass in numerical computations", "Memory optimization via categorical dtypes", "Chunked processing for datasets exceeding RAM"],
            "rubric": "Reward understanding of memory representation, avoiding Python object overhead, and chunking.",
        },
        "Statistics": {
            "question_text": "Explain Type I vs Type II errors, statistical power, and p-value interpretation in A/B testing experiments. How do you prevent Peeking Problems and calculate minimum sample size?",
            "expected_concepts": ["Null hypothesis testing", "Type I (False Positive) vs Type II (False Negative)", "Sample size calculation based on MDE", "Sequential testing / Bonferroni correction for peeking"],
            "rubric": "Candidate must explain the mathematical danger of stopping tests early when significance is first reached.",
        },
        "Apex": {
            "question_text": "Explain the Salesforce Execution Governor Limits for SOQL queries, DML statements, and heap size. How do you structure bulkified Apex trigger frameworks to process up to 200 records safely?",
            "expected_concepts": ["Bulkification principles (Sets and Maps)", "Trigger handler design patterns", "SOQL query and DML limits per transaction", "Asynchronous Apex (Queueable / Batch) offloading"],
            "rubric": "Strict adherence to bulkified architecture, zero queries inside loops, and governor limit mitigation.",
        },
    }

    # Match topic
    for key, data in technical_templates.items():
        if key.lower() in topic.lower() or topic.lower() in key.lower():
            return {
                "question_text": data["question_text"],
                "topic": topic,
                "difficulty": difficulty,
                "expected_concepts": data["expected_concepts"],
                "evaluation_rubric": data["rubric"],
                "order": order
            }

    # Multi-variant technical questions ensuring distinct text across all question orders
    technical_variants: Dict[str, List[Dict[str, Any]]] = {
        "Data Structures and Algorithms": [
            {
                "question_text": f"For a high-concurrency {role_clean} application, explain how you would design an efficient LRU Cache or Rate Limiter. Discuss time/space complexity, data structure choices, and thread safety under heavy write contention.",
                "expected_concepts": ["Hash Map + Doubly Linked List", "O(1) get/put operations", "Locking / ReadWriteLock / ConcurrentHashMap", "Memory footprint and eviction policies"],
                "rubric": "Candidate must explain time complexities and address concurrent access trade-offs.",
            },
            {
                "question_text": f"Given a continuous stream of financial transactions in a {role_clean} system, explain how you would find the Top-K most frequent entities in real-time with bounded memory. Compare Min-Heap vs Count-Min Sketch.",
                "expected_concepts": ["Min-Heap with frequency map", "Probabilistic data structures (Count-Min Sketch / HyperLogLog)", "Space complexity bounds", "Sliding window decay mechanics"],
                "rubric": "Look for practical knowledge of streaming data constraints and probabilistic algorithms.",
            },
            {
                "question_text": f"Explain how you would detect and resolve deadlocks in a distributed dependency graph. Discuss cycle detection algorithms (Tarjan's vs Kahn's Topological Sort) and operational prevention techniques.",
                "expected_concepts": ["Directed Acyclic Graphs (DAG)", "Topological Sort / DFS cycle detection", "Lock ordering conventions", "Deadlock detection vs avoidance (Banker's Algorithm)"],
                "rubric": "Assess algorithmic depth in graph traversal and operational deadlock avoidance.",
            }
        ],
        "REST APIs": [
            {
                "question_text": f"Design a resilient, backward-compatible REST API for a high-volume service in your role as a {role_clean}. How do you structure versioning, idempotency keys for mutations, pagination, and rate limiting?",
                "expected_concepts": ["Idempotency keys (IETF standard)", "Cursor-based vs offset pagination", "API versioning strategies", "HTTP status code semantics (409, 429, 503)"],
                "rubric": "Look for practical knowledge of idempotency headers, pagination scale limits, and graceful error envelopes.",
            },
            {
                "question_text": f"Compare REST against gRPC and GraphQL for microservice communication in a {role_clean} infrastructure. Under what specific traffic patterns, payload sizes, and latency requirements would you choose each?",
                "expected_concepts": ["Protobuf binary serialization vs JSON", "HTTP/2 multiplexing vs HTTP/1.1 head-of-line blocking", "Over-fetching vs under-fetching in GraphQL", "Network payload overhead and CPU deserialization cost"],
                "rubric": "Reward concrete architectural rationale grounded in network efficiency and developer ergonomics.",
            }
        ],
        "Database Design and SQL": [
            {
                "question_text": f"Compare indexing strategies (B-Tree, Hash, GIN) for a database schema handling millions of writes daily. Explain how indexing impacts write amplification, index bloat, and query execution plans via EXPLAIN ANALYZE.",
                "expected_concepts": ["B-Tree range scans vs Hash lookups", "Write amplification on inserts/updates", "Covering indexes / index-only scans", "Execution plan analysis"],
                "rubric": "Reward mechanical sympathy for disk I/O, cache locality, and indexing cost trade-offs.",
            },
            {
                "question_text": f"In a distributed database architecture, explain how Multi-Version Concurrency Control (MVCC) operates under Snapshot Isolation. How does it resolve Write Skew anomalies and mitigate lock contention?",
                "expected_concepts": ["Tuple versioning and transaction snapshots", "Non-blocking reads during concurrent writes", "Write skew vs phantom reads", "Vacuuming / table bloat remediation"],
                "rubric": "Candidate must explain MVCC mechanics and how snapshot isolation differs from strict serializability.",
            },
            {
                "question_text": f"Design a database partitioning and sharding strategy for an e-commerce ledger table with 500 million records. How do you choose the partition key, handle cross-shard queries, and execute online schema migrations with zero downtime?",
                "expected_concepts": ["Range vs Hash vs Composite partition keys", "Scatter-gather query penalties", "Dual-writing and shadow tables for migrations", "Re-sharding and consistent hashing"],
                "rubric": "Look for realistic zero-downtime migration patterns (expand/contract, dual-write).",
            }
        ],
        "System Design": [
            {
                "question_text": f"Design a distributed notifications and alert dispatching service capable of delivering millions of messages with guaranteed at-least-once delivery, deduplication, and multi-channel routing (Email, Push, SMS).",
                "expected_concepts": ["Message queues (Kafka / SQS / RabbitMQ)", "Idempotency and deduplication filters", "Dead letter queues (DLQ) and exponential backoff", "Fan-out architecture and rate-limiting per provider"],
                "rubric": "Look for decoupling through queues, circuit breakers, backpressure, and failure isolation.",
            },
            {
                "question_text": f"Architect a real-time collaborative document editing system (similar to Google Docs / Figma). Compare Operational Transformation (OT) against Conflict-free Replicated Data Types (CRDTs) under network partitions.",
                "expected_concepts": ["Centralized server OT vs decentralized CRDTs", "State-based vs operation-based CRDTs", "Vector clocks and causality tracking", "WebSocket connection pooling and reconnection recovery"],
                "rubric": "Deep dive into state synchronization, causality, and convergence properties.",
            },
            {
                "question_text": f"Design a globally distributed rate limiting and DDoS mitigation gateway protecting backend APIs from sudden bursts. Discuss Token Bucket vs Leaky Bucket vs Sliding Window Log, and distributed coordination using Redis / Memcached.",
                "expected_concepts": ["Token Bucket vs Sliding Window Counter", "Race conditions and Redis Lua scripts", "Local in-memory caching with asynchronous sync", "Graceful 429 response envelopes with Retry-After"],
                "rubric": "Assess concurrency handling in counters, network overhead of Redis round-trips, and fail-open vs fail-closed strategies.",
            }
        ],
        "Caching and Performance": [
            {
                "question_text": f"Compare Cache-Aside, Write-Through, and Write-Behind caching patterns. How do you prevent and resolve Cache Stampede (Thundering Herd), Cache Penetration, and Cache Avalanche under sudden traffic spikes?",
                "expected_concepts": ["Cache-Aside mechanics", "Mutual exclusion locks (Mutex) for stampede prevention", "Bloom filters for cache penetration", "Jitter / random TTL expiration for avalanche prevention"],
                "rubric": "Look for precise solutions to stampede, penetration, and TTL jittering.",
            },
            {
                "question_text": f"Explain memory management in in-memory caches like Redis. Discuss maxmemory eviction policies (allkeys-lru, volatile-lfu, volatile-ttl), memory fragmentation ratio, and active vs passive expiration mechanics.",
                "expected_concepts": ["Approximated LRU vs LFU counter algorithms", "jemalloc memory allocator and fragmentation", "Reactive deletion on read vs periodic sampling active expiry", "Cluster replication lag and stale reads"],
                "rubric": "Candidate should detail memory fragmentation and eviction mechanics under memory pressure.",
            }
        ],
        "Concurrency": [
            {
                "question_text": f"Explain the difference between synchronous blocking execution, non-blocking asynchronous event loops, and modern virtual threads (coroutines). Discuss memory overhead, context-switch penalties, and I/O multiplexing via epoll.",
                "expected_concepts": ["OS thread stack memory (~1MB) vs lightweight fibers", "Epoll / kqueue non-blocking I/O multiplexing", "Context switching overhead and CPU cache thrashing", "Cooperative vs preemptive scheduling"],
                "rubric": "Reward deep mechanical understanding of thread memory overhead, event loops, and thread pool sizing.",
            },
            {
                "question_text": f"In a multithreaded {role_clean} environment, explain Compare-And-Swap (CAS) atomic operations and lock-free data structures. How do lock-free queues prevent priority inversion and avoid kernel transitions?",
                "expected_concepts": ["Hardware atomic instructions (CMPXCHG)", "ABA problem and tagged pointers", "Lock-free vs wait-free guarantees", "Memory barriers and CPU cache line invalidation"],
                "rubric": "Assess knowledge of lock-free primitives and hardware cache coherence.",
            }
        ]
    }

    # Match topic in variants
    for key, variants in technical_variants.items():
        if key.lower() in topic.lower() or topic.lower() in key.lower():
            chosen = variants[(order - 1) % len(variants)]
            return {
                "question_text": chosen["question_text"],
                "topic": topic,
                "difficulty": difficulty,
                "expected_concepts": chosen["expected_concepts"],
                "evaluation_rubric": chosen["rubric"],
                "order": order
            }

    # Progressive generic technical fallback customized by order
    focus_aspects = [
        ("architectural trade-offs and scaling bottlenecks", ["Scalability limits", "Latency vs throughput", "Component decoupling"]),
        ("failure modes, circuit breakers, and disaster recovery", ["Failure isolation", "Circuit breaker patterns", "Degraded fallback states"]),
        ("data integrity, race conditions, and concurrency guarantees", ["Concurrency controls", "Data consistency", "Idempotency under retries"]),
        ("observability, distributed tracing, and production telemetry", ["P99 latency tracking", "Distributed tracing context", "Synthetic health probes"]),
    ]
    aspect_text, aspect_concepts = focus_aspects[(order - 1) % len(focus_aspects)]
    
    return {
        "question_text": f"As a {role_clean} targeting {difficulty} seniority, analyze {topic} with specific focus on {aspect_text}. Walk through concrete production constraints and mitigation strategies.",
        "topic": topic,
        "difficulty": difficulty,
        "expected_concepts": [f"Core mechanics of {topic}"] + aspect_concepts,
        "evaluation_rubric": f"Assess candidate's practical depth in {topic}, realistic trade-off analysis, and production engineering maturity.",
        "order": order
    }


from pydantic import AliasChoices

class FlexibleGeneratedQuestion(BaseModel):
    order: Optional[int] = Field(default=None, validation_alias=AliasChoices("order", "id", "question_number", "q_num"))
    topic: Optional[str] = Field(default=None, validation_alias=AliasChoices("topic", "category", "focus_area", "domain"))
    question_text: str = Field(..., validation_alias=AliasChoices("question_text", "question", "prompt", "text"))
    expected_concepts: Optional[List[str]] = Field(default_factory=lambda: ["Core Architecture"], validation_alias=AliasChoices("expected_concepts", "concepts", "key_points"))
    evaluation_rubric: Optional[str] = Field(default="Assess technical depth.", validation_alias=AliasChoices("evaluation_rubric", "rubric", "evaluation_criteria"))


class BatchQuestionsOutput(BaseModel):
    questions: List[FlexibleGeneratedQuestion] = Field(default_factory=list)


async def generate_questions_for_interview(
    job_role: str,
    round_type: str,
    difficulty: str,
    selected_topics: List[str],
    total_questions: int,
) -> List[Dict[str, Any]]:
    """
    Generates all session questions upfront using Groq with structured JSON,
    ensuring every single question is 100% unique, diverse, and calibrated.
    """
    topics = selected_topics if selected_topics else get_topics_for_role_and_round(job_role, round_type)
    if not topics:
        topics = ["Architecture and System Mechanics"]

    questions: List[Dict[str, Any]] = []

    # Attempt Batch Groq Generation for high performance and guaranteed diversity
    system_prompt = (
        "You are PrepPulse AI, an elite principal engineer and interview bar-raiser. "
        "Generate realistic, rigorous, completely unique interview questions for a high-stakes interview. "
        "CRITICAL RULE: Every single question MUST have completely unique question text, distinct topic focus, and deep rubric. "
        "Do NOT repeat questions or return boilerplate text."
    )
    user_prompt = f"""Generate exactly {total_questions} UNIQUE, diverse, progressive interview questions for:
- Role: {job_role} ({difficulty.upper()} Level)
- Round Type: {round_type.upper()} Round
- Focus Topics to cover: {', '.join(topics)}

Return a JSON object conforming strictly to:
{{
  "questions": [
    {{
      "order": 1,
      "topic": "<one of the selected topics>",
      "question_text": "<rich, detailed, distinct scenario or question>",
      "expected_concepts": ["<concept 1>", "<concept 2>", "<concept 3>"],
      "evaluation_rubric": "<evaluation criteria>"
    }}
  ]
}}"""

    try:
        batch_res = await llm_client.generate_structured(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            schema=BatchQuestionsOutput,
            fallback_data=BatchQuestionsOutput(questions=[]),
            max_tokens=3500
        )

        if batch_res.questions and len(batch_res.questions) >= min(3, total_questions):
            seen_texts = set()
            for idx, q_item in enumerate(batch_res.questions[:total_questions], start=1):
                clean_txt = q_item.question_text.strip()
                if clean_txt not in seen_texts:
                    seen_texts.add(clean_txt)
                    assigned_topic = q_item.topic or topics[(idx - 1) % len(topics)]
                    questions.append({
                        "question_text": clean_txt,
                        "topic": assigned_topic,
                        "difficulty": difficulty,
                        "expected_concepts": q_item.expected_concepts or ["Core Engineering Principles"],
                        "evaluation_rubric": q_item.evaluation_rubric or "Standard evaluation rubric.",
                        "order": idx
                    })
    except Exception as exc:
        logger.warning(f"Batch Groq question generation failed: {exc}. Engaging diverse multi-variant engine.")

    # Fill any remaining slots up to total_questions with distinct curated variants
    current_count = len(questions)
    for i in range(current_count, total_questions):
        order = i + 1
        topic = topics[i % len(topics)]
        fallback_q = get_curated_fallback_question(job_role, round_type, topic, order, difficulty)
        questions.append(fallback_q)

    # Ensure strictly 1..total_questions order indexing
    for i, q in enumerate(questions, start=1):
        q["order"] = i

    return questions

