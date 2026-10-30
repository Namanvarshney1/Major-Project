/**
 * PrepPulse Interview Configuration System
 * Centralized source of truth for 18 supported roles, 4 round types, question counts, and dynamic topic matrices.
 */

export const SUPPORTED_ROLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Java Developer',
  'Python Developer',
  'React Developer',
  'Data Analyst',
  'Data Engineer',
  'AI/ML Engineer',
  'DevOps Engineer',
  'QA/Test Engineer',
  'Salesforce Developer',
  'Cloud Engineer',
  'Cybersecurity Engineer',
  'Mobile App Developer',
  'Site Reliability Engineer',
  'Product Engineer',
];

export const ROUND_TYPES = [
  {
    id: 'technical',
    name: 'Technical',
    badge: 'Code & Architecture',
    description: 'System design, core algorithms, data structures & engineering depth',
  },
  {
    id: 'hr',
    name: 'HR',
    badge: 'Culture & Fit',
    description: 'Teamwork, behavioral situations, communication & company culture',
  },
  {
    id: 'pi',
    name: 'PI',
    badge: 'Personal Interview',
    description: 'Resume projects, career motivations, background & academic journey',
  },
  {
    id: 'managerial',
    name: 'Managerial',
    badge: 'Leadership & Strategy',
    description: 'Leadership, conflict mediation, delegation & strategic prioritization',
  },
];

export const QUESTION_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const SENIORITY_LEVELS = [
  { id: 'junior', label: 'Junior' },
  { id: 'mid', label: 'Mid' },
  { id: 'senior', label: 'Senior' },
  { id: 'staff', label: 'Staff' },
];

export const HR_TOPICS = [
  'Self-Introduction',
  'Strengths and Weaknesses',
  'Career Goals',
  'Company Fit',
  'Teamwork',
  'Conflict Resolution',
  'Adaptability',
  'Behavioral Questions',
];

export const PI_TOPICS = [
  'Personal Background',
  'Resume-Based Questions',
  'Academic Projects',
  'Internship Experience',
  'Achievements',
  'Challenges Faced',
  'Career Motivation',
  'Future Goals',
];

export const MANAGERIAL_TOPICS = [
  'Leadership',
  'Decision-Making',
  'Team Management',
  'Conflict Resolution',
  'Delegation',
  'Prioritization',
  'Stakeholder Communication',
  'Situational Judgment',
];

export const TECHNICAL_ROLE_TOPICS = {
  'Backend Developer': [
    'Data Structures and Algorithms',
    'REST APIs',
    'Database Design and SQL',
    'Authentication and Authorization',
    'System Design',
    'Caching and Performance',
    'Concurrency',
    'Testing and Debugging',
  ],
  'Frontend Developer': [
    'HTML and CSS',
    'JavaScript',
    'React and Components',
    'State Management',
    'API Integration',
    'Performance Optimization',
    'Accessibility',
    'Frontend Testing',
  ],
  'Java Developer': [
    'Core Java',
    'OOP and Design Patterns',
    'Collections Framework',
    'Multithreading',
    'JVM and Garbage Collection',
    'Spring Boot',
    'SQL and Database Design',
    'REST APIs and Testing',
  ],
  'Data Analyst': [
    'SQL and Joins',
    'Python and Pandas',
    'Data Cleaning',
    'Statistics',
    'Exploratory Data Analysis',
    'Power BI and Visualization',
    'Business Metrics',
    'Analytical Case Studies',
  ],
  'Salesforce Developer': [
    'Apex',
    'SOQL and SOSL',
    'Lightning Web Components',
    'Salesforce Data Model',
    'Flows and Automation',
    'Triggers and Governor Limits',
    'Security and Sharing',
    'Integrations',
  ],
  'Software Engineer': [
    'Data Structures and Algorithms',
    'OOP and Design Patterns',
    'System Design and Architecture',
    'Relational Databases and SQL',
    'Concurrency and Multithreading',
    'REST APIs and Microservices',
    'Clean Code and Refactoring',
    'Testing and Debugging',
  ],
  'Full Stack Developer': [
    'Frontend Architecture and React',
    'Backend API Design and Services',
    'Database Modeling (SQL and NoSQL)',
    'Authentication and Security',
    'State Management and Client Sync',
    'System Scalability and Caching',
    'Cloud Deployment and Docker',
    'End-to-End Testing',
  ],
  'Python Developer': [
    'Python Core and Data Structures',
    'Generators, Decorators and Metaclasses',
    'AsyncIO and Concurrency',
    'Web Frameworks (FastAPI / Django)',
    'Database ORMs and SQL Optimization',
    'API Design and Serialization',
    'Testing with Pytest and Mocking',
    'Performance Profiling and Tuning',
  ],
  'React Developer': [
    'React Hooks and Lifecycle Mechanics',
    'Component Architecture and Reusability',
    'State Management (Redux / Zustand)',
    'React Router and Navigation',
    'Virtual DOM and Rendering Optimization',
    'Server-Side Rendering (SSR) & Next.js',
    'Custom Hooks and Utilities',
    'React Testing Library and Vitest',
  ],
  'Data Engineer': [
    'Distributed Computing and Spark',
    'Data Warehousing (BigQuery / Snowflake)',
    'ETL / ELT Pipeline Orchestration',
    'Data Modeling and Schema Design',
    'Stream Processing and Kafka',
    'SQL Optimization and Partitioning',
    'Data Lakehouse Architectures',
    'Data Quality and Governance',
  ],
  'AI/ML Engineer': [
    'Machine Learning Fundamentals',
    'Deep Learning and Neural Architectures',
    'Model Training and Evaluation',
    'Feature Engineering and Preprocessing',
    'LLMs, Prompt Engineering and RAG',
    'MLOps and Model Deployment',
    'Vector Databases and Search',
    'PyTorch / TensorFlow Mechanics',
  ],
  'DevOps Engineer': [
    'Infrastructure as Code (Terraform)',
    'Docker and Containerization',
    'Kubernetes Orchestration',
    'CI/CD Pipelines (GitHub Actions)',
    'Cloud Infrastructure (AWS / GCP / Azure)',
    'Linux Systems and Shell Scripting',
    'Monitoring and Observability',
    'Security and Secrets Management',
  ],
  'QA/Test Engineer': [
    'Test Strategy and Test Planning',
    'Automated Testing (Playwright / Selenium)',
    'API Testing and Automation',
    'Performance and Load Testing',
    'CI/CD Pipeline Integration',
    'Defect Lifecycle and Root Cause Analysis',
    'Database Validation and SQL for QA',
    'Security and Penetration Testing Basics',
  ],
  'Cloud Engineer': [
    'Cloud Architecture Frameworks',
    'Virtual Networks, VPCs and Subnets',
    'Compute Services and Serverless',
    'Identity and Access Management (IAM)',
    'Cloud Storage and High Availability',
    'Cloud Cost Optimization and FinOps',
    'Disaster Recovery and Backups',
    'Infrastructure as Code Automation',
  ],
  'Cybersecurity Engineer': [
    'Network Security and Cryptography',
    'Threat Modeling and Risk Assessment',
    'Web Application Security (OWASP Top 10)',
    'Identity and Access Management (IAM)',
    'Incident Response and Forensics',
    'Vulnerability Assessment and Pentesting',
    'Cloud Security and Zero Trust',
    'Security Compliance and Auditing',
  ],
  'Mobile App Developer': [
    'Mobile UI Architecture and Design',
    'State Management and Reactive Flows',
    'Offline Storage and Database Sync',
    'Networking and REST APIs',
    'Native Device APIs and Permissions',
    'Mobile Performance and Battery Optimization',
    'App Store Deployment and CI/CD',
    'Mobile Security and Keychains',
  ],
  'Site Reliability Engineer': [
    'Incident Management and Post-Mortems',
    'SLIs, SLOs and Error Budgets',
    'Observability, Distributed Tracing and Metrics',
    'Chaos Engineering and Resiliency',
    'Capacity Planning and Load Balancing',
    'Automated Remediation and Runbooks',
    'Distributed Systems Failure Modes',
    'Configuration Management',
  ],
  'Product Engineer': [
    'Product Architecture and Scoping',
    'User-Centric Feature Engineering',
    'Rapid Prototyping and MVPs',
    'A/B Testing and Telemetry Analytics',
    'Cross-Functional Engineering Trade-offs',
    'Technical Debt vs Feature Velocity',
    'System Reliability and User Experience',
    'Domain Modeling and Business Logic',
  ],
};

/**
 * Returns available topics for a given role and round type
 */
export const getTopicsForRoleAndRound = (role, roundType) => {
  const normRound = (roundType || 'technical').toLowerCase();

  if (normRound === 'hr') {
    return [...HR_TOPICS];
  }
  if (normRound === 'pi' || normRound === 'personal') {
    return [...PI_TOPICS];
  }
  if (normRound === 'managerial') {
    return [...MANAGERIAL_TOPICS];
  }

  // Technical round
  if (TECHNICAL_ROLE_TOPICS[role]) {
    return [...TECHNICAL_ROLE_TOPICS[role]];
  }

  // Partial match fallback
  for (const [r, topics] of Object.entries(TECHNICAL_ROLE_TOPICS)) {
    if (r.toLowerCase().includes((role || '').toLowerCase()) || (role || '').toLowerCase().includes(r.toLowerCase())) {
      return [...topics];
    }
  }

  return [...TECHNICAL_ROLE_TOPICS['Software Engineer']];
};
