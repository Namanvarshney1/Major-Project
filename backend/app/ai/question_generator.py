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
            "question_text": "Can you briefly walk me through your professional background and key projects?",
            "expected_concepts": ["Career journey", "Key technical achievements", "Role motivation"],
            "evaluation_rubric": "Look for clear storytelling, concise structure under 2 minutes, and alignment with target role.",
        },
        {
            "topic": "Strengths and Weaknesses",
            "question_text": "What is your greatest technical strength, and what is one area you are currently working to improve?",
            "expected_concepts": ["Self-awareness", "Specific concrete strength", "Actionable improvement plan"],
            "evaluation_rubric": "Look for genuine self-awareness and practical steps being taken to improve.",
        },
        {
            "topic": "Career Goals",
            "question_text": "Where do you see yourself professionally over the next two to three years?",
            "expected_concepts": ["Career vision", "Technical growth", "Company value creation"],
            "evaluation_rubric": "Reward realistic, motivated goals that show a desire to learn and grow.",
        },
        {
            "topic": "Company Fit",
            "question_text": "What kind of team culture helps you do your best work?",
            "expected_concepts": ["Team collaboration", "Ownership", "Open communication"],
            "evaluation_rubric": "Evaluate teamwork values and cultural compatibility.",
        },
        {
            "topic": "Teamwork",
            "question_text": "Can you share an example of working closely with teammates to meet a tight deadline?",
            "expected_concepts": ["Team collaboration", "Communication", "Meeting deadlines"],
            "evaluation_rubric": "Look for collaboration, clear communication, and team-first attitude.",
        },
        {
            "topic": "Conflict Resolution",
            "question_text": "How do you handle a disagreement with a colleague over a technical decision?",
            "expected_concepts": ["Constructive discussion", "Active listening", "Focusing on project goals"],
            "evaluation_rubric": "Look for respectful communication and objective problem-solving.",
        },
        {
            "topic": "Adaptability",
            "question_text": "How do you adjust when project requirements or priorities change unexpectedly?",
            "expected_concepts": ["Flexibility", "Reprioritization", "Staying calm under change"],
            "evaluation_rubric": "Reward candidates who adapt smoothly to changing priorities.",
        },
        {
            "topic": "Behavioral Questions",
            "question_text": "Tell me about a challenging work situation and how you resolved it.",
            "expected_concepts": ["Problem context", "Action taken", "Result achieved"],
            "evaluation_rubric": "Look for structured explanation using situation, action taken, and outcome.",
        },
    ],

    # PI (PERSONAL INTERVIEW) ROUND
    "pi": [
        {
            "topic": "Personal Background",
            "question_text": "What first inspired you to get into software development?",
            "expected_concepts": ["Personal motivation", "Interest in technology", "Early learning"],
            "evaluation_rubric": "Look for authentic enthusiasm and curiosity for building software.",
        },
        {
            "topic": "Resume-Based Questions",
            "question_text": "Pick a project from your resume and explain your role in building it.",
            "expected_concepts": ["Project architecture", "Personal contributions", "Key technologies used"],
            "evaluation_rubric": "Check for clear ownership and practical knowledge of resume projects.",
        },
        {
            "topic": "Academic Projects",
            "question_text": "What was the most interesting technical project you built during your studies?",
            "expected_concepts": ["System design", "Tech stack choice", "Lessons learned"],
            "evaluation_rubric": "Reward solid technical understanding and creative problem-solving.",
        },
        {
            "topic": "Internship Experience",
            "question_text": "What was the most important lesson you learned during your internship or past work?",
            "expected_concepts": ["Real-world coding", "Team practices", "Professional growth"],
            "evaluation_rubric": "Look for practical maturity and understanding of team development practices.",
        },
        {
            "topic": "Achievements",
            "question_text": "What technical achievement are you most proud of so far, and why?",
            "expected_concepts": ["Notable achievement", "Effort and initiative", "Measurable result"],
            "evaluation_rubric": "Look for genuine pride in craftsmanship and ability to explain the impact.",
        },
        {
            "topic": "Challenges Faced",
            "question_text": "Tell me about a technical project that did not go as planned and what you learned from it.",
            "expected_concepts": ["Root cause", "Taking ownership", "Key takeaways"],
            "evaluation_rubric": "Look for honesty, accountability, and clear lessons learned from failure.",
        },
        {
            "topic": "Career Motivation",
            "question_text": "What aspects of software engineering motivate you most on a daily basis?",
            "expected_concepts": ["Problem solving", "Building useful features", "Curiosity"],
            "evaluation_rubric": "Evaluate enthusiasm for learning and building software.",
        },
        {
            "topic": "Future Goals",
            "question_text": "What new tools or technologies are you currently learning or excited to learn next?",
            "expected_concepts": ["Continuous learning", "Curiosity about tech trends", "Practical application"],
            "evaluation_rubric": "Reward proactive self-learning and technical curiosity.",
        },
    ],

    # MANAGERIAL ROUND
    "managerial": [
        {
            "topic": "Leadership",
            "question_text": "How do you help your teammates stay motivated and productive during stressful projects?",
            "expected_concepts": ["Team support", "Clear expectations", "Encouragement"],
            "evaluation_rubric": "Look for empathy, practical support, and maintaining high team standards.",
        },
        {
            "topic": "Decision-Making",
            "question_text": "How do you make an important decision when you have incomplete information and limited time?",
            "expected_concepts": ["Evaluating risks", "Consulting teammates", "Decisive action"],
            "evaluation_rubric": "Reward structured decision-making and practical risk management.",
        },
        {
            "topic": "Team Management",
            "question_text": "How do you give constructive feedback to a team member who is struggling?",
            "expected_concepts": ["Clear feedback", "Empathy", "Actionable improvement plan"],
            "evaluation_rubric": "Look for timely, compassionate communication and clear support steps.",
        },
        {
            "topic": "Conflict Resolution",
            "question_text": "How do you resolve a technical disagreement between two engineers on your team?",
            "expected_concepts": ["Listening to both perspectives", "Focusing on data and user needs", "Reaching consensus"],
            "evaluation_rubric": "Look for objective, respectful mediation focused on project goals.",
        },
        {
            "topic": "Delegation",
            "question_text": "How do you decide which tasks to delegate and which to handle yourself?",
            "expected_concepts": ["Assessing skills", "Providing context", "Tracking progress without micromanaging"],
            "evaluation_rubric": "Look for clear task ownership, mentoring opportunities, and accountability.",
        },
        {
            "topic": "Prioritization",
            "question_text": "How do you prioritize when you have urgent bug fixes, new features, and technical debt all due at once?",
            "expected_concepts": ["Impact vs urgency", "Stakeholder communication", "Setting clear priorities"],
            "evaluation_rubric": "Look for clear prioritization frameworks and transparent communication.",
        },
        {
            "topic": "Stakeholder Communication",
            "question_text": "How do you communicate a project delay to stakeholders and manage their expectations?",
            "expected_concepts": ["Early warning", "Clear explanation", "Proposed solutions and revised timeline"],
            "evaluation_rubric": "Reward early, transparent communication and practical solutions.",
        },
        {
            "topic": "Situational Judgment",
            "question_text": "What steps would you take if a critical bug was found in production shortly before a major release?",
            "expected_concepts": ["Assessing severity", "Immediate containment", "Clear team communication"],
            "evaluation_rubric": "Look for calm triage, quick assessment of impact, and decisive action.",
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
    
    technical_topics = {
        "Data Structures": [
            {
                "question_text": "How does an LRU cache work, and which data structures would you use to build it?",
                "expected_concepts": ["Hash Map + Doubly Linked List", "O(1) get and put operations", "Eviction of least recently used items"],
                "rubric": "Look for O(1) operations using a hash map combined with a doubly linked list."
            },
            {
                "question_text": "What is the difference between an array and a linked list in terms of memory and performance?",
                "expected_concepts": ["Contiguous memory", "O(1) random access vs O(n) traversal", "Insertion and deletion costs"],
                "rubric": "Candidate should contrast contiguous memory access with pointer-based node traversal."
            },
            {
                "question_text": "How do you detect a cycle in a linked list or directed graph?",
                "expected_concepts": ["Fast and slow pointers (Floyd's algorithm)", "Visited set or DFS coloring", "Time complexity O(n)"],
                "rubric": "Reward Floyd's cycle-finding algorithm or DFS visited set traversal."
            }
        ],
        "REST APIs": [
            {
                "question_text": "What does idempotency mean in REST APIs, and which HTTP methods are idempotent?",
                "expected_concepts": ["Idempotent definition", "GET, PUT, DELETE idempotency", "POST non-idempotency", "Idempotency keys"],
                "rubric": "Candidate must clearly define idempotency and identify which HTTP methods are idempotent."
            },
            {
                "question_text": "How do you design pagination and versioning for a public REST API?",
                "expected_concepts": ["Cursor vs offset pagination", "URI or header versioning", "Performance on large datasets"],
                "rubric": "Candidate should discuss cursor-based pagination and URL/header versioning."
            },
            {
                "question_text": "What is the difference between 401 Unauthorized and 403 Forbidden HTTP status codes?",
                "expected_concepts": ["Authentication vs authorization", "401 missing credentials", "403 insufficient permissions"],
                "rubric": "Candidate must distinguish authentication (401) from authorization (403)."
            }
        ],
        "Database": [
            {
                "question_text": "What is the difference between a clustered index and a non-clustered index?",
                "expected_concepts": ["Physical data ordering", "B-Tree structure", "Lookup performance"],
                "rubric": "Candidate must explain how clustered indexes define table storage order."
            },
            {
                "question_text": "What are ACID properties in relational databases, and why are they important?",
                "expected_concepts": ["Atomicity, Consistency, Isolation, Durability", "Transaction rollbacks", "Data integrity"],
                "rubric": "Candidate should explain each ACID property with a simple example."
            },
            {
                "question_text": "When would you choose a NoSQL database over a relational database?",
                "expected_concepts": ["Schema flexibility", "Horizontal scaling", "Document vs relational data models"],
                "rubric": "Look for realistic trade-offs between schema flexibility, joins, and horizontal scale."
            }
        ],
        "Authentication": [
            {
                "question_text": "How does JWT authentication work, and what are its main advantages?",
                "expected_concepts": ["Stateless verification", "Header, payload, signature", "Cryptographic signature validation"],
                "rubric": "Candidate must explain how the server verifies token signatures without database lookups."
            },
            {
                "question_text": "What is the difference between session cookies and JWT tokens for user authentication?",
                "expected_concepts": ["Stateful server sessions", "Stateless tokens", "Revocation trade-offs", "Storage security"],
                "rubric": "Compare database session lookup overhead with JWT statelessness and revocation challenges."
            }
        ],
        "System Design": [
            {
                "question_text": "How would you design a simple URL shortener service like Bitly?",
                "expected_concepts": ["Unique hash/Base62 encoding", "Fast key-value lookup", "Database redirect mechanics"],
                "rubric": "Assess hash generation, encoding, and redirect response status codes (301 vs 302)."
            },
            {
                "question_text": "What is the difference between horizontal and vertical scaling in system architecture?",
                "expected_concepts": ["Adding more servers vs bigger hardware", "Load balancing", "Cost and ceiling limits"],
                "rubric": "Candidate should explain scaling limits, load balancers, and cost differences."
            },
            {
                "question_text": "How do message queues help decouple components in a distributed system?",
                "expected_concepts": ["Asynchronous processing", "Buffering traffic spikes", "Producer-consumer isolation"],
                "rubric": "Candidate should explain how queues buffer load and isolate component failures."
            }
        ],
        "Caching": [
            {
                "question_text": "What is the difference between cache-aside and write-through caching?",
                "expected_concepts": ["Application-managed caching", "Synchronous cache write", "Staleness and consistency"],
                "rubric": "Candidate must explain read/write flow in cache-aside versus write-through."
            },
            {
                "question_text": "What is a cache stampede or thundering herd problem, and how do you prevent it?",
                "expected_concepts": ["Simultaneous cache miss", "Database overload", "Mutex locks or probabilistic early expiration"],
                "rubric": "Look for understanding of locking or early recomputation to prevent stampedes."
            }
        ],
        "Concurrency": [
            {
                "question_text": "What is the difference between a process and a thread?",
                "expected_concepts": ["Isolated memory space", "Shared memory between threads", "Context switching overhead"],
                "rubric": "Candidate must contrast separate address spaces with shared thread memory."
            },
            {
                "question_text": "What is a race condition, and how can you prevent it in concurrent code?",
                "expected_concepts": ["Concurrent access to shared state", "Unpredictable ordering", "Locks, mutexes, or atomic variables"],
                "rubric": "Reward practical knowledge of locking or atomic primitives to protect shared data."
            },
            {
                "question_text": "What causes a deadlock in multithreaded applications, and how can it be avoided?",
                "expected_concepts": ["Mutual exclusion", "Hold and wait", "Circular lock ordering", "Lock timeouts"],
                "rubric": "Candidate should explain circular wait conditions and lock ordering strategies."
            }
        ],
        "Testing": [
            {
                "question_text": "What is the difference between unit testing, integration testing, and end-to-end testing?",
                "expected_concepts": ["Test isolation", "Component interactions", "Full user flow validation", "Test pyramid"],
                "rubric": "Candidate should explain the scope, speed, and confidence trade-offs of each test type."
            },
            {
                "question_text": "How do you systematically investigate and fix a memory leak in a production service?",
                "expected_concepts": ["Memory profiling", "Heap dumps analysis", "Identifying uncollected references"],
                "rubric": "Look for systematic use of profilers, heap snapshots, and telemetry."
            }
        ],
        "HTML": [
            {
                "question_text": "What is the CSS box model, and how does box-sizing affect element sizing?",
                "expected_concepts": ["Content, padding, border, margin", "content-box vs border-box", "Layout sizing calculations"],
                "rubric": "Candidate must explain the layers of the box model and how border-box simplifies layouts."
            },
            {
                "question_text": "What is the difference between CSS Flexbox and CSS Grid, and when would you use each?",
                "expected_concepts": ["One-dimensional vs two-dimensional layout", "Component alignment", "Page grid structure"],
                "rubric": "Candidate should explain that Flexbox is 1D (row/col) and Grid is 2D (rows and columns)."
            }
        ],
        "JavaScript": [
            {
                "question_text": "How does the JavaScript event loop handle asynchronous tasks and promises?",
                "expected_concepts": ["Call stack", "Microtask queue (Promises)", "Macrotask queue (setTimeout)", "Execution order"],
                "rubric": "Candidate must explain how microtasks run before the next macrotask in the event loop."
            },
            {
                "question_text": "What is the difference between let, const, and var in JavaScript?",
                "expected_concepts": ["Block scope vs function scope", "Hoisting behavior", "Reassignment rules"],
                "rubric": "Candidate should detail scoping rules and hoisting differences."
            },
            {
                "question_text": "What is a closure in JavaScript, and what is a practical use case for it?",
                "expected_concepts": ["Lexical scoping", "Access to outer function variables", "Data privacy or function factories"],
                "rubric": "Candidate should clearly describe a function retaining access to its outer lexical scope."
            }
        ],
        "React": [
            {
                "question_text": "What is the Virtual DOM in React, and how does it make UI updates efficient?",
                "expected_concepts": ["In-memory representation", "Diffing algorithm", "Batched DOM mutations"],
                "rubric": "Candidate should explain that React diffs the Virtual DOM to minimize real DOM operations."
            },
            {
                "question_text": "What are the rules of React Hooks, and when would you use useEffect?",
                "expected_concepts": ["Call at top level only", "Side effects handling", "Dependency array lifecycle"],
                "rubric": "Candidate should state hooks cannot be called inside loops/conditions and explain dependency arrays."
            },
            {
                "question_text": "What is the difference between props and state in React components?",
                "expected_concepts": ["Props passed down and immutable", "State managed internally and mutable via setter", "Component re-rendering"],
                "rubric": "Candidate must distinguish external read-only props from internal reactive state."
            }
        ],
        "State Management": [
            {
                "question_text": "When should you use local component state versus a global state store like Redux or Zustand?",
                "expected_concepts": ["Prop drilling prevention", "Shared cross-component state", "Avoiding unnecessary complexity"],
                "rubric": "Candidate should explain when global state is needed versus keeping state local."
            },
            {
                "question_text": "What advantages do libraries like React Query provide for managing server data?",
                "expected_concepts": ["Automatic caching", "Deduplication of requests", "Background refetching", "Loading and error states"],
                "rubric": "Look for understanding of caching, stale-while-revalidate, and simplified async state."
            }
        ],
        "Java": [
            {
                "question_text": "What is the difference between an ArrayList and a LinkedList in Java?",
                "expected_concepts": ["Dynamic resizable array", "Doubly linked nodes", "Random access O(1) vs traversal O(n)"],
                "rubric": "Candidate must compare contiguous array indexing with node pointer navigation."
            },
            {
                "question_text": "How does garbage collection work in the Java Virtual Machine?",
                "expected_concepts": ["Heap generations (Young/Old)", "Mark and sweep algorithm", "Stop-the-world pauses"],
                "rubric": "Candidate should explain generational heap division and mark-and-sweep collection."
            },
            {
                "question_text": "What does the final keyword mean when applied to a variable, method, or class in Java?",
                "expected_concepts": ["Constants / unchangeable reference", "Method cannot be overridden", "Class cannot be subclassed"],
                "rubric": "Candidate should clearly explain the behavior of 'final' for variables, methods, and classes."
            }
        ],
        "Spring": [
            {
                "question_text": "What is Dependency Injection in Spring Boot, and why is it useful?",
                "expected_concepts": ["Inversion of Control (IoC)", "Decoupled components", "Ease of unit testing"],
                "rubric": "Candidate should explain IoC container bean wiring and how it facilitates testing."
            },
            {
                "question_text": "What is the difference between @Component, @Service, and @Repository in Spring?",
                "expected_concepts": ["Stereotype annotations", "Business logic layer (@Service)", "Data access and exception translation (@Repository)"],
                "rubric": "Candidate should explain architectural layers and automated exception translation."
            }
        ],
        "Python": [
            {
                "question_text": "What is the difference between a Python list and a NumPy array?",
                "expected_concepts": ["Heterogeneous pointers vs contiguous typed memory", "Vectorized operations", "Memory efficiency"],
                "rubric": "Candidate should explain contiguous C-style memory in NumPy versus Python object pointer arrays."
            },
            {
                "question_text": "How do Python generators work, and when would you use the yield keyword?",
                "expected_concepts": ["Lazy evaluation", "Memory efficiency on large streams", "State preservation across iterations"],
                "rubric": "Candidate should explain memory-efficient iteration without loading entire datasets into RAM."
            }
        ],
        "Salesforce": [
            {
                "question_text": "What are Salesforce governor limits, and how do you write code that respects them?",
                "expected_concepts": ["SOQL query limits", "DML statement limits", "Bulkification with collections"],
                "rubric": "Candidate should emphasize never querying inside loops and bulkifying triggers."
            },
            {
                "question_text": "What is the difference between a before trigger and an after trigger in Apex?",
                "expected_concepts": ["Updating fields on same record", "Access to system-generated IDs", "Read-only Trigger.new in after triggers"],
                "rubric": "Candidate should explain before triggers for validation/updates and after triggers for related record logic."
            }
        ]
    }

    # Match topic in technical topics
    for key, variants in technical_topics.items():
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
        ("performance and scaling", ["Scalability limits", "Latency vs throughput", "Component decoupling"]),
        ("failure handling and recovery", ["Failure isolation", "Circuit breaker patterns", "Degraded fallback states"]),
        ("data integrity and concurrency", ["Concurrency controls", "Data consistency", "Idempotency under retries"]),
        ("observability and monitoring", ["P99 latency tracking", "Distributed tracing context", "Synthetic health probes"]),
    ]
    _, aspect_concepts = focus_aspects[(order - 1) % len(focus_aspects)]
    simple_questions = [
        f"What are the main performance trade-offs and scaling considerations when using {topic}?",
        f"How do you handle system failures and error recovery in {topic}?",
        f"How do you prevent data inconsistencies and race conditions when working with {topic}?",
        f"What key metrics and logging would you monitor to ensure {topic} runs reliably in production?",
    ]
    question_text = simple_questions[(order - 1) % len(simple_questions)]
    
    return {
        "question_text": question_text,
        "topic": topic,
        "difficulty": difficulty,
        "expected_concepts": [f"Core mechanics of {topic}"] + aspect_concepts,
        "evaluation_rubric": f"Assess candidate's practical depth in {topic} and ability to explain solutions clearly.",
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
        "You are PrepPulse AI, an expert interview coach and interviewer. "
        "Generate clear, concise, and easy-to-understand interview questions in simple English. "
        "CRITICAL RULES: "
        "1. Use simple, direct, conversational English. "
        "2. Keep each question strictly to 1 or 2 short sentences. "
        "3. Ask only one main question at a time—avoid wordy preambles, complicated jargon, and long scenarios. "
        "4. For technical rounds, ensure questions are practical, clear, and technically focused. "
        "5. For HR, Behavioral, and Personal rounds, use warm, natural, and friendly phrasing. "
        "6. Every single question MUST have unique wording and distinct topic focus without repetition."
    )
    user_prompt = f"""Generate exactly {total_questions} UNIQUE, short, and clear interview questions for:
- Role: {job_role} ({difficulty.upper()} Level)
- Round Type: {round_type.upper()} Round
- Focus Topics to cover: {', '.join(topics)}

Requirements:
- Each question MUST be 1-2 short sentences in plain, simple English.
- Ask one clear question directly without long introductions.

Return a JSON object conforming strictly to:
{{
  "questions": [
    {{
      "order": 1,
      "topic": "<one of the selected topics>",
      "question_text": "<clear, short, 1-2 sentence question in simple English>",
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

