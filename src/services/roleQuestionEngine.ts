import { Question, InterviewType, ExperienceLevel, QuestionDifficulty, ExtractedResumeData, InterviewFocus } from '../types/interview';
import { storageService } from './storage';

export interface GenerateRoleQuestionOptions {
  candidateName: string;
  role: string;
  experienceLevel: ExperienceLevel;
  category: InterviewType;
  difficulty: QuestionDifficulty;
  language?: string;
  questionNumber: number;
  totalQuestions: number;
  excludeSignatures?: string[];
  resumeData?: ExtractedResumeData | null;
  jobDescription?: string;
  interviewFocus?: InterviewFocus;
}

// ─── Normalization & Deduplication Helpers ─────────────────────────────────────

export function normalizeQuestionText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function createQuestionSignature(text: string): string {
  // Extract key non-filler words for semantic uniqueness
  const stopWords = new Set([
    'hello', 'hi', 'welcome', 'to', 'your', 'interview', 'for', 'the', 'role',
    'could', 'you', 'please', 'tell', 'me', 'about', 'how', 'would', 'what', 'is',
    'are', 'in', 'and', 'with', 'a', 'an', 'of', 'on', 'can', 'explain', 'describe'
  ]);
  const words = normalizeQuestionText(text)
    .split(' ')
    .filter(w => w.length > 2 && !stopWords.has(w));
  return words.slice(0, 8).join('_');
}

// ─── Personalized Question Openers ─────────────────────────────────────────────

function getInterviewerOpener(
  candidateName: string,
  questionNumber: number,
  totalQuestions: number,
  role: string,
  experienceLevel: ExperienceLevel
): string {
  const name = candidateName?.trim() || 'Candidate';
  const expLabel = experienceLevel === 'fresher' ? 'fresher' :
                   experienceLevel === 'junior' ? 'junior' :
                   experienceLevel === 'mid' ? 'mid-level' : 'senior';

  if (questionNumber === 1) {
    const openers = [
      `Hello ${name}, welcome to your interview for the ${role} position. To kick off our session:`,
      `Good day ${name}! It is a pleasure to meet you for this ${role} interview. Let's begin:`,
      `Welcome ${name}. I am excited to conduct your ${role} assessment today. For our opening question:`,
      `Hello ${name}, thank you for joining. Considering this role as a ${role}, let's start with this:`
    ];
    return openers[Math.floor(Math.random() * openers.length)];
  }

  if (questionNumber === totalQuestions) {
    const finalOpeners = [
      `${name}, for your final question in this interview:`,
      `${name}, we have arrived at our concluding question for the ${role} round:`,
      `To wrap up our interview today, ${name}:`,
      `Thank you for your responses so far, ${name}. Here is your final question:`
    ];
    return finalOpeners[Math.floor(Math.random() * finalOpeners.length)];
  }

  const standardOpeners = [
    `${name}, moving forward in our ${role} evaluation:`,
    `${name}, considering your background as a ${expLabel} professional in ${role}:`,
    `${name}, let's dive into the next scenario:`,
    `${name}, could you explain the following:`,
    `Thank you ${name}. For your next question:`,
    `${name}, in the context of real-world ${role} responsibilities:`,
    `${name}, let's explore your technical problem-solving on this topic:`,
    `${name}, here is an important concept for a ${role}:`
  ];
  return standardOpeners[Math.floor(Math.random() * standardOpeners.length)];
}

// ─── Domain Specific Blueprints ────────────────────────────────────────────────

interface QuestionBlueprint {
  category: InterviewType;
  experienceLevels: ExperienceLevel[];
  coreQuestionTemplate: (ctx: { name: string; role: string; exp: ExperienceLevel; scenario: string; constraint: string }) => string;
  contextHint: string;
  expectedKeywords: string[];
  modelAnswer: string;
  rubricCriteria: { criterion: string; weight: number; description: string }[];
  testCases?: { input: string; expectedOutput: string }[];
}

// Scenario and constraint variations to prevent repetition
const SCENARIOS = [
  'a high-traffic fintech payment gateway',
  'a scalable e-commerce marketplace with seasonal traffic spikes',
  'a real-time collaborative workspace platform',
  'a distributed healthcare data processing pipeline',
  'a multi-tenant enterprise B2B SaaS platform',
  'a high-frequency telemetry analytics engine',
  'a media streaming service handling millions of concurrent viewers',
  'a mission-critical banking ledger system'
];

const CONSTRAINTS = [
  'strict sub-100 millisecond response time SLAs',
  'a zero-downtime 99.99% availability requirement',
  'handling sudden 10x traffic surges during marketing events',
  'rigorous data privacy and regulatory compliance standards',
  'resource-constrained memory and network bandwidth environments',
  'backward compatibility across existing legacy microservices',
  'idempotent processing to prevent duplicate transactions'
];

// ─── Role Banks ────────────────────────────────────────────────────────────────

const ROLE_BLUEPRINTS: Record<string, QuestionBlueprint[]> = {
  // ─────────────────────────────────────────────────────────────────────────────
  // FRONTEND DEVELOPER
  // ─────────────────────────────────────────────────────────────────────────────
  'Frontend Developer (React / TypeScript)': [
    {
      category: 'technical',
      experienceLevels: ['fresher', 'junior'],
      coreQuestionTemplate: ({ name, scenario }) => 
        `Explain how the React Virtual DOM and the reconciliation diffing algorithm work. If you are building an interactive product feed for ${scenario}, why is using array index as a 'key' prop problematic, and what should be used instead?`,
      contextHint: 'Explain how React compares the previous and next Virtual DOM trees and why stable, unique keys preserve component state.',
      expectedKeywords: ['Virtual DOM', 'reconciliation', 'diffing algorithm', 'keys', 'component re-render', 'fiber', 'state preservation'],
      modelAnswer: 'React maintains a lightweight Virtual DOM representation in memory. When state updates, React generates a new Virtual DOM tree and runs its reconciliation diffing algorithm (React Fiber) to determine minimal DOM mutations. Using array index as keys causes bugs when list items are reordered, inserted, or filtered, because React relies on keys to map components across renders. Always use stable unique identifiers such as database IDs or UUIDs.',
      rubricCriteria: [
        { criterion: 'Reconciliation Understanding', weight: 40, description: 'Clear explanation of Virtual DOM comparison and Fiber diffing.' },
        { criterion: 'Key Prop Mechanics', weight: 35, description: 'Explaining why array index causes state mismatch during reordering.' },
        { criterion: 'Best Practices', weight: 25, description: 'Recommending stable unique identifiers.' }
      ]
    },
    {
      category: 'technical',
      experienceLevels: ['fresher', 'junior'],
      coreQuestionTemplate: ({ name, exp }) =>
        `What is the difference between useEffect, useMemo, and useCallback hooks in React? In your experience as a ${exp} developer, describe a scenario where misusing useMemo or useCallback actually degrades performance rather than improving it.`,
      contextHint: 'Differentiate between side effects, memoizing values, and memoizing function references. Discuss the cost of dependency array comparison.',
      expectedKeywords: ['useEffect', 'useMemo', 'useCallback', 'memoization', 'dependency array', 'premature optimization', 'garbage collection'],
      modelAnswer: 'useEffect manages side effects after render. useMemo caches computed values to avoid re-calculation across renders unless dependencies change. useCallback memoizes function instances to maintain reference equality for child components wrapped in React.memo. Misusing them for cheap computations adds overhead because comparing dependency arrays and allocating closure memory costs more than recalculating lightweight logic.',
      rubricCriteria: [
        { criterion: 'Hook Distinction', weight: 40, description: 'Accurate differentiation between effects, value memoization, and function identity.' },
        { criterion: 'Performance Cost Analysis', weight: 40, description: 'Explaining dependency checking overhead and premature optimization.' },
        { criterion: 'Practical Application', weight: 20, description: 'Giving sensible use cases such as expensive charts or stable prop passing.' }
      ]
    },
    {
      category: 'technical',
      experienceLevels: ['mid', 'senior'],
      coreQuestionTemplate: ({ name, scenario, constraint }) =>
        `How would you architect web performance optimization for ${scenario} with ${constraint}? Address Core Web Vitals (LCP, CLS, INP), code-splitting strategies, and critical rendering path optimizations.`,
      contextHint: 'Focus on Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), and Interaction to Next Paint (INP) with concrete tools and techniques.',
      expectedKeywords: ['Core Web Vitals', 'LCP', 'CLS', 'INP', 'code splitting', 'dynamic import', 'hydration', 'critical CSS', 'resource hints'],
      modelAnswer: 'To optimize Core Web Vitals: For LCP, optimize the critical rendering path with preload resource hints, responsive next-gen image formats (AVIF/WebP), and server-side rendering or edge caching. For CLS, specify explicit aspect-ratio attributes on media and reserve layout space for dynamic ads/widgets. For INP, minimize main-thread execution by splitting long tasks using requestIdleCallback, Web Workers, and debounce/throttle event handlers. Code split routes and heavy third-party bundles using dynamic import() and React Suspense.',
      rubricCriteria: [
        { criterion: 'Core Web Vitals Metrics', weight: 35, description: 'In-depth coverage of LCP, CLS, and INP metrics and remedies.' },
        { criterion: 'Architectural Optimization', weight: 35, description: 'Route splitting, tree shaking, SSR/SSG caching, and bundle analysis.' },
        { criterion: 'Real-World Production Focus', weight: 30, description: 'Demonstrating systematic profiling using DevTools, Lighthouse, and RUM.' }
      ]
    },
    {
      category: 'technical',
      experienceLevels: ['mid', 'senior'],
      coreQuestionTemplate: ({ name, exp }) =>
        `As a ${exp} frontend engineer, compare Server-Side Rendering (SSR), Static Site Generation (SSG), and Client-Side Hydration in frameworks like Next.js. What are hydration mismatch errors, and how do you prevent or troubleshoot them in production?`,
      contextHint: 'Discuss server vs client HTML generation, TTFB vs TTI trade-offs, and reasons for hydration mismatch like window checks or timestamps.',
      expectedKeywords: ['SSR', 'SSG', 'hydration mismatch', 'Next.js', 'TTFB', 'TTI', 'Server Components', 'suppressHydrationWarning'],
      modelAnswer: 'SSG pre-renders HTML at build time for optimal TTFB and CDN caching, ideal for content pages. SSR generates HTML per request, necessary for personalized dynamic data. Hydration is the client-side process where React attaches event listeners to the server-rendered HTML. Hydration mismatches occur when the server-rendered DOM does not match the client initial render—such as accessing window/localStorage, displaying dynamic timestamps, or browser extensions mutating HTML. Prevent them using useEffect for client-only state or dynamic imports with ssr: false.',
      rubricCriteria: [
        { criterion: 'Rendering Strategies', weight: 35, description: 'Clear comparison of SSR, SSG, and client hydration.' },
        { criterion: 'Hydration Mechanics', weight: 40, description: 'Detailed explanation of why hydration mismatches occur.' },
        { criterion: 'Resolution Patterns', weight: 25, description: 'Effective strategies for preventing mismatches.' }
      ]
    },
    {
      category: 'coding',
      experienceLevels: ['fresher', 'junior', 'mid', 'senior'],
      coreQuestionTemplate: ({ name }) =>
        `Implement a debounce utility function in JavaScript/TypeScript that delays executing a callback until after a specified wait time has elapsed since the last time it was invoked, including support for an immediate execution flag. Explain how closures manage the timer.`,
      contextHint: 'Use clearTimeout on previous timers and maintain state in a closure.',
      expectedKeywords: ['debounce', 'closure', 'clearTimeout', 'setTimeout', 'immediate flag', 'this context', 'arguments'],
      modelAnswer: 'A debounce function returns a wrapper that cancels any pending timer using clearTimeout and schedules a new execution using setTimeout. If immediate is true and no timer is running, the function runs immediately, and subsequent calls within the interval reset the cooldown timer.',
      rubricCriteria: [
        { criterion: 'Closure & Timer Management', weight: 45, description: 'Proper use of closures and timer clearing.' },
        { criterion: 'Edge Case & Immediate Flag', weight: 35, description: 'Correct handling of the immediate execution option.' },
        { criterion: 'Context & Arguments', weight: 20, description: 'Preserving this binding and parameter propagation.' }
      ],
      testCases: [
        { input: 'debounce(fn, 100) called 3 times in 50ms', expectedOutput: 'Executed once after 100ms silence' }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // BACKEND ENGINEER
  // ─────────────────────────────────────────────────────────────────────────────
  'Backend Engineer (Node.js / Python / Java)': [
    {
      category: 'technical',
      experienceLevels: ['fresher', 'junior'],
      coreQuestionTemplate: ({ name, exp }) =>
        `Explain how asynchronous I/O and the event loop handle concurrent requests in Node.js (or async worker processes in Python/Java). What happens if an API endpoint performs a heavy CPU-bound computation on the main thread?`,
      contextHint: 'Contrast non-blocking I/O with CPU-bound blocking operations. Mention worker threads, child processes, or thread pools.',
      expectedKeywords: ['Event Loop', 'non-blocking I/O', 'call stack', 'libuv', 'worker threads', 'blocking', 'concurrency'],
      modelAnswer: 'Node.js utilizes a single-threaded event loop powered by libuv for asynchronous non-blocking I/O (network, filesystem). Asynchronous tasks are offloaded to OS kernel threads or the libuv thread pool. However, if a route executes CPU-intensive logic (like large image processing or heavy cryptography), it blocks the call stack, preventing the event loop from servicing any other concurrent client requests. To resolve this, offload CPU work to Worker Threads, cluster processes, or dedicated background queues.',
      rubricCriteria: [
        { criterion: 'Event Loop Mechanics', weight: 40, description: 'Explaining call stack, task queues, and non-blocking I/O.' },
        { criterion: 'Main Thread Blocking', weight: 35, description: 'Describing how CPU tasks starve incoming requests.' },
        { criterion: 'Architecture Solutions', weight: 25, description: 'Worker threads, clustering, or background worker queues.' }
      ]
    },
    {
      category: 'technical',
      experienceLevels: ['fresher', 'junior'],
      coreQuestionTemplate: ({ name, scenario }) =>
        `In designing a relational database for ${scenario}, explain the purpose of database indexing (B-Tree). What are composite indexes, and why does the column order in a composite index matter when querying?`,
      contextHint: 'Explain how B-Trees accelerate lookups and the leftmost prefix rule for composite indexes.',
      expectedKeywords: ['B-Tree', 'database index', 'composite index', 'leftmost prefix rule', 'table scan', 'cardinality', 'query execution plan'],
      modelAnswer: 'A B-Tree index maintains a sorted tree structure pointing to row locations, transforming full table scans of O(N) into logarithmic lookups of O(log N). A composite index covers multiple columns (e.g. status, createdAt). The column order is critical because databases evaluate multi-column indexes using the Leftmost Prefix Rule: queries filtering on (status) or (status, createdAt) will utilize the index, but queries filtering solely on (createdAt) cannot use this index efficiently.',
      rubricCriteria: [
        { criterion: 'Index Mechanism', weight: 40, description: 'Clear understanding of B-Tree traversal vs table scans.' },
        { criterion: 'Composite Index & Leftmost Rule', weight: 40, description: 'Detailed explanation of why column sequence matters.' },
        { criterion: 'Cardinality & Performance', weight: 20, description: 'Considering high-selectivity columns first.' }
      ]
    },
    {
      category: 'technical',
      experienceLevels: ['mid', 'senior'],
      coreQuestionTemplate: ({ name, scenario, constraint }) =>
        `Design a scalable distributed caching strategy for ${scenario} facing ${constraint}. Compare Cache-Aside, Write-Through, and Write-Back patterns. How do you handle cache invalidation and prevent cache stampede (thundering herd)?`,
      contextHint: 'Discuss Redis caching topologies, TTL strategies, mutex locking/probabilistic early expiration for stampedes.',
      expectedKeywords: ['Cache-Aside', 'Write-Through', 'Write-Back', 'cache stampede', 'thundering herd', 'Redis', 'mutex lock', 'probabilistic expiration', 'TTL'],
      modelAnswer: 'Under Cache-Aside, the application first reads from cache; upon a miss, it fetches from DB and writes to cache. Write-Through updates cache and DB synchronously, ensuring consistency at the cost of write latency. To prevent cache stampede when popular keys expire simultaneously, use distributed mutex locks (e.g., Redlock) so only one worker queries the database, apply jitter to TTLs, or implement probabilistic early recomputation (XFetch algorithm).',
      rubricCriteria: [
        { criterion: 'Caching Pattern Comparison', weight: 35, description: 'Accurate trade-offs of Cache-Aside, Write-Through, Write-Back.' },
        { criterion: 'Cache Stampede Mitigation', weight: 35, description: 'Mutex locks, TTL jitter, and early background regeneration.' },
        { criterion: 'Data Consistency & Redis Architecture', weight: 30, description: 'Handling cache invalidation and distributed sync.' }
      ]
    },
    {
      category: 'technical',
      experienceLevels: ['mid', 'senior'],
      coreQuestionTemplate: ({ name, exp }) =>
        `As a ${exp} backend engineer, how do you implement robust rate limiting and DDoS throttling on public APIs? Compare the Token Bucket, Leaky Bucket, and Sliding Window Counter algorithms in a distributed multi-node environment.`,
      contextHint: 'Focus on distributed synchronization with Redis, atomic operations (INCR/Lua scripts), and HTTP 429 Retry-After headers.',
      expectedKeywords: ['Token Bucket', 'Leaky Bucket', 'Sliding Window', 'Redis Lua scripts', 'HTTP 429', 'Retry-After', 'distributed rate limiting'],
      modelAnswer: 'Token Bucket allows traffic bursts up to bucket capacity and refills steadily. Leaky Bucket smooths traffic to a constant egress rate. Sliding Window Log provides exact counting but uses high memory; Sliding Window Counter approximates by interpolating previous and current minute counts. In distributed clusters, implement rate limiting via Redis using atomic Lua scripts (or Redis Cell) to prevent race conditions across multiple API gateway nodes, returning 429 Too Many Requests with Retry-After headers.',
      rubricCriteria: [
        { criterion: 'Algorithm Analysis', weight: 40, description: 'Thorough comparison of Token, Leaky, and Sliding Window counters.' },
        { criterion: 'Distributed Coordination', weight: 35, description: 'Using Redis atomic Lua scripts to prevent concurrency race conditions.' },
        { criterion: 'HTTP Standards & Headers', weight: 25, description: 'Providing 429 status codes and Retry-After headers.' }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // FULL STACK SOFTWARE ENGINEER
  // ─────────────────────────────────────────────────────────────────────────────
  'Full Stack Software Engineer': [
    {
      category: 'technical',
      experienceLevels: ['fresher', 'junior'],
      coreQuestionTemplate: ({ name, exp }) =>
        `Walk me through the complete end-to-end lifecycle when a user submits an authentication form on the frontend to the backend verification and database session creation. Where do CORS errors originate, and how should they be properly configured?`,
      contextHint: 'Detail form capture, payload serialization, HTTPS handshake, CORS preflight OPTIONS request, password hashing, and secure cookie/JWT generation.',
      expectedKeywords: ['end-to-end lifecycle', 'HTTPS', 'CORS preflight', 'OPTIONS request', 'password hashing', 'bcrypt', 'JWT', 'HTTP-only cookie'],
      modelAnswer: 'The client captures inputs and sends an HTTPS POST. If cross-origin, the browser initiates a CORS OPTIONS preflight request. The server responds with allowed origins, headers, and credentials. The backend parses the payload, validates formats, queries the DB, and compares password hashes using bcrypt. Upon verification, the server generates a signed JWT or session token stored in a secure, HTTP-only, SameSite cookie, returning a 200 OK.',
      rubricCriteria: [
        { criterion: 'End-to-End Pipeline', weight: 40, description: 'Covers frontend dispatch, networking, server validation, DB, and cookie issuance.' },
        { criterion: 'CORS & Security', weight: 35, description: 'Explaining browser preflight OPTIONS and Access-Control-Allow-Origin headers.' },
        { criterion: 'Authentication Security', weight: 25, description: 'Password hashing and HTTP-only cookie storage.' }
      ]
    },
    {
      category: 'technical',
      experienceLevels: ['mid', 'senior'],
      coreQuestionTemplate: ({ name, scenario, constraint }) =>
        `For ${scenario} operating under ${constraint}, how would you implement real-time bidirectional synchronization between web clients and the backend? Compare WebSockets vs Server-Sent Events (SSE) vs Long Polling, and explain how you scale WebSockets horizontally across server nodes.`,
      contextHint: 'Discuss bidirectional vs unidirectional needs, connection persistence, Redis Pub/Sub adapter for multi-node socket coordination.',
      expectedKeywords: ['WebSockets', 'Server-Sent Events', 'SSE', 'horizontal scaling', 'Redis Pub/Sub', 'sticky sessions', 'connection lifecycle'],
      modelAnswer: 'SSE is ideal for server-to-client unidirectional streaming (e.g. notifications, status feeds) with automatic HTTP reconnection. WebSockets offer full-duplex bidirectional communication with low protocol overhead, required for chat or interactive collaboration. To scale WebSockets across multiple server nodes, connect all nodes to a shared message broker like Redis Pub/Sub so a message received by Node A is broadcast to clients connected to Node B.',
      rubricCriteria: [
        { criterion: 'Protocol Selection', weight: 35, description: 'Clear trade-offs between SSE, WebSockets, and Long Polling.' },
        { criterion: 'Horizontal Scaling Architecture', weight: 40, description: 'Using Redis Pub/Sub or message bus across clustered instances.' },
        { criterion: 'Connection Resilience', weight: 25, description: 'Handling heartbeat pings, exponential reconnect backoff, and reconnection state.' }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // DATA ANALYST & BUSINESS INTELLIGENCE
  // ─────────────────────────────────────────────────────────────────────────────
  'Data Analyst & Business Intelligence': [
    {
      category: 'technical',
      experienceLevels: ['fresher', 'junior'],
      coreQuestionTemplate: ({ name, exp }) =>
        `Explain the difference between WHERE and HAVING clauses in SQL, and when you would use window functions like ROW_NUMBER(), RANK(), and DENSE_RANK(). Provide an example of finding the top 3 highest-spending customers per region.`,
      contextHint: 'Explain row filtering before aggregation (WHERE) vs aggregated group filtering (HAVING). Contrast ranking behavior with ties.',
      expectedKeywords: ['WHERE', 'HAVING', 'GROUP BY', 'window function', 'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'PARTITION BY', 'ORDER BY'],
      modelAnswer: 'WHERE filters individual records before aggregation. HAVING filters grouped rows after aggregation with GROUP BY. Window functions perform calculations across related rows without collapsing them into a single row. For ranking: ROW_NUMBER assigns sequential numbers without handling ties. RANK skips ranks after duplicates (e.g. 1, 2, 2, 4). DENSE_RANK maintains consecutive numbering without gaps (e.g. 1, 2, 2, 3). For top 3 customers per region, use DENSE_RANK() OVER (PARTITION BY region ORDER BY total_spend DESC) inside a CTE, then filter WHERE rank <= 3.',
      rubricCriteria: [
        { criterion: 'SQL Filter Mechanics', weight: 35, description: 'Clear contrast of WHERE pre-filter vs HAVING post-aggregation filter.' },
        { criterion: 'Window Functions Comparison', weight: 35, description: 'Precise explanation of ROW_NUMBER vs RANK vs DENSE_RANK with ties.' },
        { criterion: 'Partition & Practical Query', weight: 30, description: 'Using CTE and PARTITION BY to retrieve top N per category.' }
      ]
    },
    {
      category: 'technical',
      experienceLevels: ['mid', 'senior'],
      coreQuestionTemplate: ({ name, scenario, constraint }) =>
        `In designing a data warehouse and reporting layer for ${scenario}, explain the differences between Star Schema and Snowflake Schema. How do you design Fact tables and Dimension tables to optimize query performance for executive BI dashboards?`,
      contextHint: 'Discuss denormalization vs normalization in data marts, surrogate keys, slowly changing dimensions (SCD), and query joins.',
      expectedKeywords: ['Star Schema', 'Snowflake Schema', 'Fact table', 'Dimension table', 'denormalization', 'SCD', 'BI dashboard performance', 'surrogate keys'],
      modelAnswer: 'A Star Schema denormalizes dimensions directly around a central fact table, reducing SQL joins and dramatically accelerating BI aggregation queries. A Snowflake Schema normalizes dimension tables into hierarchies, saving storage but adding multi-table joins. In modern data warehouses (BigQuery, Snowflake), Star Schema is preferred for BI because columnar storage optimizes wide tables, and fewer joins maximize interactive dashboard speed.',
      rubricCriteria: [
        { criterion: 'Schema Modeling', weight: 40, description: 'Thorough comparison of Star vs Snowflake dimensional architectures.' },
        { criterion: 'Fact vs Dimension Architecture', weight: 35, description: 'Defining additive metrics in facts and descriptive attributes in dimensions.' },
        { criterion: 'Query Performance Tuning', weight: 25, description: 'Explaining columnar storage benefits and indexing/partitioning.' }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // CLOUD & DEVOPS ENGINEER
  // ─────────────────────────────────────────────────────────────────────────────
  'Cloud & DevOps Engineer': [
    {
      category: 'technical',
      experienceLevels: ['fresher', 'junior'],
      coreQuestionTemplate: ({ name, exp }) =>
        `What is the difference between a Docker image and a Docker container? Explain the best practices for writing a clean, secure, and lightweight Dockerfile using multi-stage builds.`,
      contextHint: 'Differentiate build artifact vs running instance. Mention multi-stage builds, non-root users, .dockerignore, minimal base images (Alpine/Distroless).',
      expectedKeywords: ['Docker image', 'Docker container', 'multi-stage build', 'minimal base image', 'non-root user', 'dockerignore', 'layer caching'],
      modelAnswer: 'A Docker image is a read-only immutable template containing application code, libraries, and dependencies organized in layers. A container is a runnable, isolated instance of that image with a thin writable layer on top. Best practices include: using multi-stage builds to compile in a heavy environment and copy only final artifacts into a lightweight runtime image (e.g. distroless or alpine), running as an unprivileged non-root user, maintaining a .dockerignore file, and ordering Dockerfile commands from least to most frequently modified to maximize layer cache hits.',
      rubricCriteria: [
        { criterion: 'Image vs Container Distinction', weight: 35, description: 'Clear understanding of immutable blueprint vs running process.' },
        { criterion: 'Multi-Stage Optimization', weight: 40, description: 'Explaining separation of build tools and runtime image size reduction.' },
        { criterion: 'Security & Layer Caching', weight: 25, description: 'Non-root execution, vulnerability minimization, and caching efficiency.' }
      ]
    },
    {
      category: 'technical',
      experienceLevels: ['mid', 'senior'],
      coreQuestionTemplate: ({ name, scenario, constraint }) =>
        `For ${scenario} requiring ${constraint}, design an automated CI/CD deployment pipeline. Contrast Blue-Green deployments with Canary deployments. How do you implement automated health checks and instant automated rollbacks in Kubernetes?`,
      contextHint: 'Discuss traffic switching via ingress/load balancer, metric-based canary analysis, Kubernetes readiness probes, and GitOps rollbacks.',
      expectedKeywords: ['CI/CD pipeline', 'Blue-Green', 'Canary deployment', 'automated rollback', 'Kubernetes', 'readiness probes', 'traffic routing', 'GitOps'],
      modelAnswer: 'Blue-Green runs two identical production environments; traffic is cut over 100% via load balancer/DNS once the new version passes smoke tests, allowing instant rollback by redirecting traffic back. Canary gradually routes a small percentage (e.g. 5%, 25%, 100%) of real traffic to the new version while monitoring error rates, latency, and logs. In Kubernetes, combine readiness and liveness probes with tools like Argo Rollouts or Flagger. If canary error thresholds are breached, the rollout aborts and routes 100% traffic to stable pods automatically.',
      rubricCriteria: [
        { criterion: 'Deployment Strategy Comparison', weight: 40, description: 'In-depth contrast of Blue-Green vs Canary trade-offs.' },
        { criterion: 'Automated Rollback & Health Probing', weight: 35, description: 'Readiness probes, metric thresholds, and automated regression detection.' },
        { criterion: 'Production Reliability', weight: 25, description: 'Ensuring zero downtime and minimal customer impact during failures.' }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // QUALITY ASSURANCE & AUTOMATION ENGINEER
  // ─────────────────────────────────────────────────────────────────────────────
  'Quality Assurance & Automation Engineer': [
    {
      category: 'technical',
      experienceLevels: ['fresher', 'junior'],
      coreQuestionTemplate: ({ name, exp }) =>
        `Explain the Page Object Model (POM) design pattern in test automation (using Playwright, Cypress, or Selenium). Why is it superior to procedural scripting, and how does it make test suites maintainable when UI elements change?`,
      contextHint: 'Discuss separation of page selectors/actions from test verification assertions and reduced code duplication.',
      expectedKeywords: ['Page Object Model', 'POM', 'maintainability', 'selectors', 'reusability', 'Playwright', 'test assertions'],
      modelAnswer: 'The Page Object Model (POM) abstracts web pages or components into dedicated classes containing the element locators and user interaction methods. Test specs only interact with page object methods and perform assertions. When a UI element changes (e.g. button ID or DOM hierarchy), you update the locator in a single page object file rather than dozens of test files, eliminating maintenance nightmares and code duplication.',
      rubricCriteria: [
        { criterion: 'POM Architecture', weight: 40, description: 'Clear separation of UI locators/actions from test logic.' },
        { criterion: 'Maintainability Impact', weight: 35, description: 'Explaining single-point updates when UI selectors change.' },
        { criterion: 'Readability & Reusability', weight: 25, description: 'Creating expressive, clean, and declarative test code.' }
      ]
    },
    {
      category: 'technical',
      experienceLevels: ['mid', 'senior'],
      coreQuestionTemplate: ({ name, scenario, constraint }) =>
        `In ${scenario} with rapid CI/CD deployments, how do you eliminate flaky automated tests? Address race conditions, network flakiness, asynchronous DOM rendering, and test parallelization across isolated worker containers.`,
      contextHint: 'Focus on replacing arbitrary sleep/wait timers with auto-waiting, dynamic polling, mocked network contracts, and hermetic test databases.',
      expectedKeywords: ['flaky tests', 'race conditions', 'auto-waiting', 'network mocking', 'test isolation', 'parallel execution', 'idempotency'],
      modelAnswer: 'Flaky tests stem from arbitrary sleep calls, shared mutable state, or third-party network jitter. To eliminate flakiness: 1) Replace hardcoded timeouts with explicit auto-waiting assertions (like Playwright expect.toBeVisible). 2) Ensure test isolation by creating ephemeral test data or transactional rollbacks per test worker. 3) Mock non-essential external third-party dependencies with wiremock or MSW. 4) Run tests in parallel across isolated Docker containers, quarantining unstable tests until fixed.',
      rubricCriteria: [
        { criterion: 'Root Cause Identification', weight: 35, description: 'Identifying timing issues, DOM delays, and shared state.' },
        { criterion: 'Modern Auto-Waiting Patterns', weight: 35, description: 'Banning sleep() in favor of state-driven event polling.' },
        { criterion: 'CI Parallelization & Isolation', weight: 30, description: 'Database isolation and containerized test execution.' }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // PRODUCT MANAGER / ASSOCIATE PM
  // ─────────────────────────────────────────────────────────────────────────────
  'Product Manager / Associate PM': [
    {
      category: 'technical',
      experienceLevels: ['fresher', 'junior'],
      coreQuestionTemplate: ({ name, exp }) =>
        `How do you prioritize competing feature requests from sales, engineering, and customers? Explain frameworks like RICE (Reach, Impact, Confidence, Effort) and MoSCoW with an example feature decision.`,
      contextHint: 'Explain how RICE quantifies prioritization and how MoSCoW defines MVP scope.',
      expectedKeywords: ['RICE framework', 'MoSCoW', 'Reach', 'Impact', 'Confidence', 'Effort', 'prioritization', 'stakeholder alignment', 'MVP'],
      modelAnswer: 'I use the RICE framework: Reach (how many users impacted over a period), Impact (delta per user: minimal to massive), Confidence (data certainty percentage), divided by Effort (engineering person-months). This provides an objective score that mitigates loud stakeholder biases. For release planning, MoSCoW (Must have, Should have, Could have, Wont have) establishes the minimum viable scope for launch.',
      rubricCriteria: [
        { criterion: 'Framework Mechanics', weight: 40, description: 'Accurate breakdown of RICE calculation and MoSCoW buckets.' },
        { criterion: 'Objective Decision-Making', weight: 35, description: 'Balancing data vs intuition against business objectives.' },
        { criterion: 'Stakeholder Communication', weight: 25, description: 'Saying no constructively using transparent scorecards.' }
      ]
    },
    {
      category: 'technical',
      experienceLevels: ['mid', 'senior'],
      coreQuestionTemplate: ({ name, scenario, constraint }) =>
        `For ${scenario}, define the North Star Metric and 3 input metrics. If your North Star metric suddenly dropped by 15% week-over-week, walk me through your systematic root cause investigation framework.`,
      contextHint: 'Distinguish input vs output metrics. Provide a structured funnel, cohort, technical, and external market investigation plan.',
      expectedKeywords: ['North Star Metric', 'input metrics', 'root cause analysis', 'funnel drop-off', 'cohort analysis', 'release regression', 'telemetry'],
      modelAnswer: 'A North Star Metric captures the core value delivered to customers (e.g. Weekly Active Users completing a core workflow). Input metrics track breadth, frequency, and friction. To investigate a 15% drop: 1) Verify data integrity and telemetry pipeline. 2) Segment by dimensions (platform, region, app version, user tenure). 3) Correlate with recent deployments or outages. 4) Inspect funnel conversion drop-offs. 5) Check external factors like holidays or competitor launches.',
      rubricCriteria: [
        { criterion: 'Metric Design', weight: 35, description: 'Clear North Star aligned with business model plus actionable inputs.' },
        { criterion: 'Diagnostic Framework', weight: 40, description: 'Structured top-down segmentation and hypothesis elimination.' },
        { criterion: 'Actionable Remediation', weight: 25, description: 'Cross-functional coordination and communication.' }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // CAMPUS PLACEMENT FRESHER (ALL DISCIPLINES)
  // ─────────────────────────────────────────────────────────────────────────────
  'Campus Placement Fresher (All Disciplines)': [
    {
      category: 'technical',
      experienceLevels: ['fresher', 'junior'],
      coreQuestionTemplate: ({ name }) =>
        `Explain the four fundamental pillars of Object-Oriented Programming (OOP)—Encapsulation, Abstraction, Inheritance, and Polymorphism. Give a real-world software design example demonstrating how Polymorphism enables flexible code.`,
      contextHint: 'Define all four pillars clearly and provide an example like a PaymentProcessor interface with CreditCard and UPI implementations.',
      expectedKeywords: ['Encapsulation', 'Abstraction', 'Inheritance', 'Polymorphism', 'method overriding', 'method overloading', 'interface', 'OOP pillars'],
      modelAnswer: 'Encapsulation bundles data and methods while restricting direct access. Abstraction hides internal complexity and exposes only essential interfaces. Inheritance allows child classes to reuse parent properties. Polymorphism allows objects to take multiple forms through method overriding (runtime) and overloading (compile time). For example, an interface PaymentGateway with processPayment() implemented differently by Stripe, PayPal, and UPI allows client code to process transactions polymorphically.',
      rubricCriteria: [
        { criterion: 'Four Pillars Definition', weight: 40, description: 'Accurate and comprehensive explanation of each pillar.' },
        { criterion: 'Polymorphism Implementation', weight: 35, description: 'Runtime overriding vs compile-time overloading.' },
        { criterion: 'Real-World Example', weight: 25, description: 'Clean analogy or software architecture scenario.' }
      ]
    },
    {
      category: 'technical',
      experienceLevels: ['fresher', 'junior'],
      coreQuestionTemplate: ({ name }) =>
        `What is the difference between a Process and a Thread in operating systems? Explain what a Deadlock is, the four necessary Coffman conditions for a deadlock to occur, and how one can be prevented.`,
      contextHint: 'Compare process memory isolation with thread shared memory. State Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait.',
      expectedKeywords: ['Process', 'Thread', 'context switching', 'shared memory', 'Deadlock', 'Coffman conditions', 'Circular Wait', 'Mutual Exclusion'],
      modelAnswer: 'A Process is an executing program with its own dedicated memory space, while a Thread is a lightweight execution unit within a process sharing memory and file handles. Deadlock is a state where processes are permanently blocked waiting for resources held by each other. The four Coffman conditions are: Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait. Prevent deadlock by breaking Circular Wait (enforcing a global resource ordering hierarchy).',
      rubricCriteria: [
        { criterion: 'Process vs Thread', weight: 35, description: 'Address space, overhead, and context switching differences.' },
        { criterion: 'Coffman Conditions', weight: 40, description: 'Listing all 4 necessary conditions accurately.' },
        { criterion: 'Deadlock Prevention', weight: 25, description: 'Resource ordering or preemption strategies.' }
      ]
    },
    {
      category: 'coding',
      experienceLevels: ['fresher', 'junior'],
      coreQuestionTemplate: ({ name }) =>
        `Given an array of integers, write an algorithm to find two numbers that add up to a specific target sum. What is the time and space complexity of the brute force approach versus the optimal hash map approach?`,
      contextHint: 'Brute force checks all pairs in O(n^2). The optimal approach stores seen numbers in a hash map for O(n) time.',
      expectedKeywords: ['Two Sum', 'Hash Map', 'complement', 'O(n) time', 'O(n) space', 'brute force O(n^2)'],
      modelAnswer: 'The brute force approach uses two nested loops comparing every pair with O(N^2) time and O(1) space. The optimal solution uses a Hash Map: for each element, calculate complement = target - current. If the complement exists in the map, return indices. Otherwise, insert current with its index. This achieves O(N) time and O(N) space complexity.',
      rubricCriteria: [
        { criterion: 'Algorithmic Complexity', weight: 40, description: 'Analyzing O(N^2) brute force vs O(N) hash map.' },
        { criterion: 'Hash Map Lookup', weight: 40, description: 'Complement calculation and single-pass traversal.' },
        { criterion: 'Edge Cases', weight: 20, description: 'Handling duplicate values, negative numbers, and empty inputs.' }
      ],
      testCases: [
        { input: 'nums = [2, 7, 11, 15], target = 9', expectedOutput: '[0, 1]' }
      ]
    }
  ]
};

// ─── Universal Behavioral & HR Blueprints (Tied to Role & Experience) ──────────

const BEHAVIORAL_BLUEPRINTS: QuestionBlueprint[] = [
  {
    category: 'hr',
    experienceLevels: ['fresher', 'junior'],
    coreQuestionTemplate: ({ name, role, exp }) =>
      `As someone targeting a ${role} position as a ${exp}, describe a demanding project or assignment where you encountered an unexpected technical obstacle or deadline pressure. How did you diagnose the problem, manage your time, and deliver a successful result?`,
    contextHint: 'Structure using the STAR framework (Situation, Task, Action, Result). Highlight individual contribution and measurable outcome.',
    expectedKeywords: ['STAR method', 'Situation', 'Task', 'Action', 'Result', 'time management', 'problem-solving', 'learning'],
    modelAnswer: 'In my final semester project, our API integration failed 48 hours before review due to an undocumented payload format change. I mapped the incoming network response, identified schema mismatches, and coordinated with the team to write an adapter middleware. We delivered on time with zero validation errors, earning an A grade.',
    rubricCriteria: [
      { criterion: 'STAR Structure', weight: 40, description: 'Clear narrative arc from problem to quantifiable resolution.' },
      { criterion: 'Ownership & Action', weight: 35, description: 'Focus on personal initiative rather than passive team involvement.' },
      { criterion: 'Reflection & Growth', weight: 25, description: 'Articulating key lessons learned.' }
    ]
  },
  {
    category: 'hr',
    experienceLevels: ['mid', 'senior'],
    coreQuestionTemplate: ({ name, role, exp }) =>
      `As an experienced ${role}, describe a situation where you had a significant disagreement with a product manager or senior stakeholder regarding technical debt versus new feature delivery. How did you navigate the conversation and arrive at an aligned decision?`,
    contextHint: 'Emphasize data-driven persuasion, risk assessment, business impact translation, and constructive compromise.',
    expectedKeywords: ['technical debt', 'stakeholder alignment', 'trade-offs', 'business impact', 'risk assessment', 'compromise', 'collaboration'],
    modelAnswer: 'Our product lead wanted to launch a new checkout feature while our database connection pool was nearing exhaustion under peak loads. Rather than saying no, I compiled an incident risk assessment showing that unaddressed database latency could cause cart abandonment. We agreed to allocate 25% of the sprint to connection pool optimization while delivering the core checkout UI on schedule, preventing black Friday outages.',
    rubricCriteria: [
      { criterion: 'Business Alignment', weight: 40, description: 'Framing technical debt in terms of revenue, availability, and customer trust.' },
      { criterion: 'Diplomatic Negotiation', weight: 35, description: 'Finding win-win phased delivery rather than deadlocks.' },
      { criterion: 'Leadership Maturity', weight: 25, description: 'Demonstrating calm, constructive problem-solving.' }
    ]
  }
];

// ─── Universal Aptitude & Communication Blueprints ──────────────────────────────

const APTITUDE_BLUEPRINTS: QuestionBlueprint[] = [
  {
    category: 'aptitude',
    experienceLevels: ['fresher', 'junior', 'mid', 'senior'],
    coreQuestionTemplate: ({ name, role }) =>
      `A distributed service processes 300 requests per second across 3 servers. Server A handles 40%, Server B handles 35%, and Server C handles 25%. If Server A fails and its traffic is distributed between Server B and C in the ratio 3:2, how many requests per second will Server B now handle?`,
    contextHint: 'Calculate Server A traffic (120 req/s), allocate 3/5 to B (72 req/s) and add to existing B traffic (105 req/s).',
    expectedKeywords: ['ratio', 'proportions', 'requests per second', 'capacity', '177 req/s', 'arithmetic calculation'],
    modelAnswer: 'Total traffic = 300 req/s. Server A = 40% of 300 = 120 req/s. Server B currently = 35% of 300 = 105 req/s. When A fails, 120 req/s is distributed in ratio 3:2. B receives 3/5 of 120 = 72 req/s. Total traffic for Server B = 105 + 72 = 177 requests per second.',
    rubricCriteria: [
      { criterion: 'Step-by-step Calculation', weight: 45, description: 'Correct intermediate math and proportion distribution.' },
      { criterion: 'Final Correctness', weight: 40, description: 'Arriving at 177 req/s.' },
      { criterion: 'Clarity of Explanation', weight: 15, description: 'Clear explanation of logic.' }
    ]
  }
];

const COMMUNICATION_BLUEPRINTS: QuestionBlueprint[] = [
  {
    category: 'communication',
    experienceLevels: ['fresher', 'junior', 'mid', 'senior'],
    coreQuestionTemplate: ({ name, role }) =>
      `Explain an intricate technical challenge or architectural decision from your work as a ${role} to a non-technical executive or customer who has zero coding background. Use a clear, everyday real-world analogy.`,
    contextHint: 'Eliminate jargon, employ relatable analogies (e.g. airport logistics, postal service, plumbing), and tie directly to business value.',
    expectedKeywords: ['analogy', 'non-technical communication', 'jargon-free', 'executive presence', 'clarity', 'business value'],
    modelAnswer: 'I use the airport luggage analogy: An API gateway is like the airport check-in desk checking passports and routing luggage, the message queue is the baggage carousel buffering suitcases during surges, and background workers are baggage handlers loading planes. This conveys system architecture without confusing acronyms.',
    rubricCriteria: [
      { criterion: 'Analogy Effectiveness', weight: 40, description: 'Relatable everyday comparison without technical jargon.' },
      { criterion: 'Audience Empathy', weight: 35, description: 'Tailoring tone and language for non-technical stakeholders.' },
      { criterion: 'Business Translation', weight: 25, description: 'Connecting engineering mechanisms to customer outcomes.' }
    ]
  }
];

// ─── Dynamic Custom Role Generator ─────────────────────────────────────────────

function generateDynamicCustomRoleQuestion(
  opts: GenerateRoleQuestionOptions,
  category: InterviewType
): Question {
  const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
  const constraint = CONSTRAINTS[Math.floor(Math.random() * CONSTRAINTS.length)];
  const opener = getInterviewerOpener(opts.candidateName, opts.questionNumber, opts.totalQuestions, opts.role, opts.experienceLevel);
  const expTitle = opts.experienceLevel === 'fresher' ? 'fresher' :
                   opts.experienceLevel === 'junior' ? 'junior professional' :
                   opts.experienceLevel === 'mid' ? 'mid-level specialist' : 'senior lead';

  let questionText = '';
  let keywords: string[] = [opts.role, 'architecture', 'best practices', 'scalability', 'performance'];
  let modelAnswer = '';

  if (category === 'technical') {
    const topics = [
      `what are the primary technical trade-offs you evaluate when choosing the core technology stack for ${scenario} under ${constraint}?`,
      `walk me through how you design, debug, and monitor production workloads to ensure high reliability and zero downtime.`,
      `explain the most complex architectural obstacle you have solved in your experience with ${opts.role}, and how your solution optimized performance.`,
      `how do you ensure security, data integrity, and compliance across all components in a modern ${opts.role} workflow?`
    ];
    const pickedTopic = topics[(opts.questionNumber - 1) % topics.length];
    questionText = `${opener} As a ${expTitle} in ${opts.role}, ${pickedTopic}`;
    keywords = [opts.role, 'system design', 'reliability', 'trade-offs', 'monitoring'];
    modelAnswer = `A strong answer for a ${opts.role} details core framework principles, evaluating architectural trade-offs between speed, maintainability, and scalability. It includes concrete examples of production troubleshooting, metric monitoring, and adherence to security best practices.`;
  } else if (category === 'coding') {
    questionText = `${opener} In the context of ${opts.role}, describe how you would write an algorithmic module to process and filter incoming stream events with deduplication and low latency. Detail the time and space complexity.`;
    keywords = ['algorithm', 'time complexity', 'space complexity', 'deduplication', 'low latency'];
    modelAnswer = 'Use a hash set or sliding window cache with TTL to filter duplicates in O(1) time per event with bounded memory footprint.';
  } else if (category === 'hr') {
    questionText = `${opener} Describe a situation in your journey as a ${opts.role} where project priorities shifted unexpectedly. How did you adapt your workflow, communicate with peers, and maintain quality?`;
    keywords = ['adaptability', 'communication', 'STAR method', 'priorities', 'quality'];
    modelAnswer = 'Use the STAR method to describe adapting to changing requirements while maintaining high engineering rigor and transparent stakeholder communication.';
  } else {
    questionText = `${opener} How do you articulate the core business and technical impact of your deliverables as a ${opts.role} to stakeholders who do not share your technical specialization?`;
    keywords = ['communication', 'clarity', 'analogy', 'business impact'];
    modelAnswer = 'Bridge the technical and business gap by using clear analogies and linking deliverables to key business metrics like revenue, latency, and operational efficiency.';
  }

  return {
    id: `dyn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    category,
    difficulty: opts.difficulty,
    question: questionText,
    contextHint: `Tailor your response specifically to the ${opts.role} domain, highlighting hands-on experiences.`,
    expectedKeywords: keywords,
    modelAnswer,
    source: 'ai_generated',
    isFollowUp: false,
    rubricCriteria: [
      { criterion: `${opts.role} Domain Knowledge`, weight: 40, description: `Deep understanding of ${opts.role} competencies.` },
      { criterion: 'Technical Reasoning', weight: 35, description: 'Structuring logical arguments with trade-off analysis.' },
      { criterion: 'Articulation & Clarity', weight: 25, description: 'Clear communication addressing the prompt directly.' }
    ]
  };
}

// ─── Resume-Grounded Question Generator ────────────────────────────────────────

function generateResumeGroundedQuestion(
  opts: GenerateRoleQuestionOptions,
  category: InterviewType,
  excludeSet: Set<string>
): Question | null {
  const resume = opts.resumeData;
  if (!resume) return null;

  const candidateName = opts.candidateName?.trim() || resume.candidateName || 'Candidate';
  const projects = (resume.projects || []).filter(p => p.title && p.title.trim().length > 3);
  const skills = (resume.technicalSkills || []).concat(resume.toolsAndTechnologies || []).filter(s => s && s.trim());
  const experience = (resume.experience || []).filter(e => e.company || e.role);
  const education = (resume.education || []).filter(ed => ed.degree || ed.institution);

  // Pool of candidate questions directly generated from the actual uploaded resume
  const candidatePool: Array<{
    category: InterviewType;
    question: string;
    contextHint: string;
    expectedKeywords: string[];
    modelAnswer: string;
    resumeEvidence: string;
    rubricCriteria: { criterion: string; weight: number; description: string }[];
  }> = [];

  // 1. Project-grounded questions
  projects.forEach((proj, idx) => {
    const techList = (proj.technologies || []).filter(t => t.trim());
    const techStr = techList.length > 0 ? techList.join(' and ') : 'your chosen stack';

    // Architecture & data flow
    candidatePool.push({
      category: 'technical',
      question: `${candidateName}, on your resume you highlighted the "${proj.title}" project built with ${techStr}. Can you walk me through the system architecture and explain how data flows across the components?`,
      contextHint: `Discuss the component breakdown, API endpoints, and data lifecycle in "${proj.title}".`,
      expectedKeywords: [proj.title, ...techList, 'architecture', 'data flow', 'API', 'components', 'state'],
      modelAnswer: `In "${proj.title}", the architecture cleanly separates concerns. Requests originate from the frontend client, pass through validated endpoints, and execute domain logic against persistent storage, returning structured payloads.`,
      resumeEvidence: `Project: ${proj.title} (${proj.technologies?.join(', ') || 'Listed on resume'})`,
      rubricCriteria: [
        { criterion: 'Architecture & Component Design', weight: 40, description: `Deep understanding of "${proj.title}" architecture.` },
        { criterion: 'Data Flow & Protocols', weight: 35, description: 'Explaining communication between layers.' },
        { criterion: 'Clarity & Technical Depth', weight: 25, description: 'Articulating individual contribution.' }
      ]
    });

    // Technical trade-offs & challenges
    candidatePool.push({
      category: 'technical',
      question: `${candidateName}, regarding your project "${proj.title}": what was the most difficult technical bug or architectural obstacle you encountered, and how did you resolve it?`,
      contextHint: `Recall a specific debugging session, concurrency issue, or integration failure in "${proj.title}".`,
      expectedKeywords: [proj.title, ...techList, 'debugging', 'trade-off', 'resolution', 'root cause', 'performance'],
      modelAnswer: `A strong answer identifies a specific failure mode in "${proj.title}" (such as asynchronous state desync, schema mismatch, or CORS/network latency), detailing the diagnostic steps and the sustainable fix implemented.`,
      resumeEvidence: `Project: ${proj.title}`,
      rubricCriteria: [
        { criterion: 'Problem Solving & Debugging', weight: 45, description: 'Methodical diagnostic approach.' },
        { criterion: 'Technical Trade-off Evaluation', weight: 35, description: 'Explaining why the fix was appropriate.' },
        { criterion: 'Engineering Rigor', weight: 20, description: 'Preventative measures and testing.' }
      ]
    });

    // Validation & Error Handling
    if (proj.description && /validation|error|extract/i.test(proj.description)) {
      candidatePool.push({
        category: 'technical',
        question: `${candidateName}, you noted that "${proj.title}" includes input validation and error handling. How did you validate incoming payloads on both frontend and backend to protect system integrity?`,
        contextHint: 'Explain client-side schema checks, server-side defensive validation, and HTTP status handling.',
        expectedKeywords: ['validation', 'error handling', 'sanitization', 'HTTP status', 'try-catch', 'defensive'],
        modelAnswer: 'Defensive validation requires client-side feedback for UX and strict server-side validation using schemas or regex to reject malformed requests before processing.',
        resumeEvidence: `Project: ${proj.title} - ${proj.description.slice(0, 100)}`,
        rubricCriteria: [
          { criterion: 'Validation Strategy', weight: 40, description: 'Client vs server validation responsibilities.' },
          { criterion: 'Security & Sanitization', weight: 35, description: 'Preventing injection and malformed inputs.' },
          { criterion: 'Error Response Design', weight: 25, description: 'Clear error codes and recovery UX.' }
        ]
      });
      // 3. Deployment, Caching & Scaling
      candidatePool.push({
        category: 'technical',
        question: `${candidateName}, how did you package, deploy, or run "${proj.title}" during development or testing, and what steps did you take to ensure responsive performance?`,
        contextHint: `Explain local server setup, build optimizations, containers, or caching in "${proj.title}".`,
        expectedKeywords: [proj.title, 'deployment', 'build', 'performance', 'optimization', 'caching'],
        modelAnswer: `Deployment of "${proj.title}" includes modular packaging, environment configuration, and asset optimization for fast load times and predictable runtime execution.`,
        resumeEvidence: `Project: ${proj.title} (Deployment & Scaling)`,
        rubricCriteria: [
          { criterion: 'Deployment Strategy', weight: 40, description: 'Runtime setup and environment control.' },
          { criterion: 'Performance Optimization', weight: 35, description: 'Caching, latency, and resource efficiency.' },
          { criterion: 'Engineering Practicality', weight: 25, description: 'Practical operational considerations.' }
        ]
      });
    }
  });

  // 2. Skill-grounded questions
  skills.forEach((skill) => {
    candidatePool.push({
      category: 'technical',
      question: `${candidateName}, you listed ${skill} as a core technical skill on your resume. How have you applied ${skill} in your projects, and what are its key advantages or pitfalls in production?`,
      contextHint: `Provide a concrete scenario where you utilized ${skill} to solve a practical requirement.`,
      expectedKeywords: [skill, 'application', 'production', 'performance', 'trade-offs', 'best practices'],
      modelAnswer: `A thorough answer explains real-world application of ${skill}, discussing design patterns, memory or performance implications, and standard production pitfalls.`,
      resumeEvidence: `Technical Skill: ${skill}`,
      rubricCriteria: [
        { criterion: `${skill} Competence`, weight: 40, description: `Hands-on understanding of ${skill}.` },
        { criterion: 'Practical Application', weight: 35, description: 'Relating skill to concrete project work.' },
        { criterion: 'Engineering Trade-offs', weight: 25, description: 'Awareness of limitations and alternatives.' }
      ]
    });
  });

  // 3. Experience / Internship questions
  experience.forEach((exp) => {
    candidatePool.push({
      category: 'hr',
      question: `${candidateName}, during your experience as a ${exp.role || 'Developer'} at ${exp.company || 'your internship'}, what was your most impactful engineering contribution and how did you collaborate with your team?`,
      contextHint: 'Use the STAR method: Situation, Task, Action taken, and measurable Result.',
      expectedKeywords: [exp.company || 'team', 'contribution', 'collaboration', 'STAR method', 'impact'],
      modelAnswer: 'Articulate individual ownership using the STAR method, detailing the technical deliverables and positive team or product impact.',
      resumeEvidence: `Experience: ${exp.role} at ${exp.company}`,
      rubricCriteria: [
        { criterion: 'Ownership & Impact', weight: 40, description: 'Demonstrating accountability and initiative.' },
        { criterion: 'Collaboration', weight: 35, description: 'Effective teamwork and communication.' },
        { criterion: 'STAR Articulation', weight: 25, description: 'Clear structured storytelling.' }
      ]
    });
  });

  // 4. Education / Foundational questions
  education.forEach((ed) => {
    candidatePool.push({
      category: 'aptitude',
      question: `${candidateName}, reflecting on your study of ${ed.degree || 'Computer Science'} at ${ed.institution || 'university'}, what foundational academic concept has proven most valuable in your hands-on coding work?`,
      contextHint: 'Connect theoretical foundations (algorithms, databases, OS) to real-world code.',
      expectedKeywords: ['foundations', 'algorithms', 'data structures', 'theory to practice'],
      modelAnswer: 'Connect theoretical principles—such as algorithmic time complexity or database indexing—to day-to-day decisions in writing efficient software.',
      resumeEvidence: `Education: ${ed.degree} from ${ed.institution}`,
      rubricCriteria: [
        { criterion: 'Foundational Grounding', weight: 40, description: 'Grasping fundamental principles.' },
        { criterion: 'Practical Translation', weight: 35, description: 'Applying academic theory to software.' },
        { criterion: 'Reflective Clarity', weight: 25, description: 'Thoughtful explanation.' }
      ]
    });
  });

  // Filter out any candidate questions already asked in this session
  for (const item of candidatePool) {
    const sig = createQuestionSignature(item.question);
    if (!excludeSet.has(sig)) {
      return {
        id: `res_q_${Date.now()}_q${opts.questionNumber}_${Math.random().toString(36).slice(2, 7)}`,
        category: item.category,
        difficulty: opts.difficulty,
        question: item.question,
        contextHint: item.contextHint,
        expectedKeywords: item.expectedKeywords,
        modelAnswer: item.modelAnswer,
        source: 'ai_generated',
        isFollowUp: false,
        resumeEvidence: item.resumeEvidence,
        testCases: [],
        rubricCriteria: item.rubricCriteria
      };
    }
  }

  return null;
}

// ─── Main Generator Engine ─────────────────────────────────────────────────────

export const roleQuestionEngine = {
  /**
   * Generates a single question guaranteed to be tailored to the role & experience,
   * addressing the candidate by name, and strictly non-repeating.
   */
  generateQuestion(opts: GenerateRoleQuestionOptions): Question {
    const pastAsked = storageService.getAskedQuestionsHistory();
    const excludeSet = new Set([
      ...pastAsked.map(q => createQuestionSignature(q)),
      ...(opts.excludeSignatures || [])
    ]);

    // Priority 1: If resume data is provided, generate dynamically grounded in that resume
    if (opts.resumeData) {
      const resumeQuestion = generateResumeGroundedQuestion(opts, opts.category, excludeSet);
      if (resumeQuestion) {
        return resumeQuestion;
      }
    }

    // Match role blueprints or fall back to dynamic synthesis
    let rolePool: QuestionBlueprint[] = [];
    // Normalize role string comparison
    const matchedKey = Object.keys(ROLE_BLUEPRINTS).find(
      k => k.toLowerCase() === opts.role.toLowerCase() ||
           opts.role.toLowerCase().includes(k.toLowerCase()) ||
           k.toLowerCase().includes(opts.role.toLowerCase())
    );

    if (matchedKey) {
      rolePool = ROLE_BLUEPRINTS[matchedKey];
    }

    // Determine target category based on interview type
    let effectiveCategory = opts.category;
    if (opts.category === 'placement_mixed') {
      const qNum = opts.questionNumber;
      if (qNum === 1) effectiveCategory = 'hr';
      else if (qNum === 2) effectiveCategory = 'technical';
      else if (qNum === 3) effectiveCategory = 'coding';
      else if (qNum === 4) effectiveCategory = 'aptitude';
      else effectiveCategory = 'technical';
    }

    // Filter available blueprints for this category and experience level
    let candidates = rolePool.filter(
      bp => bp.category === effectiveCategory && bp.experienceLevels.includes(opts.experienceLevel)
    );

    // If empty for this category in role, check behavioral/aptitude/communication pools
    if (candidates.length === 0) {
      if (effectiveCategory === 'hr') candidates = BEHAVIORAL_BLUEPRINTS;
      else if (effectiveCategory === 'aptitude') candidates = APTITUDE_BLUEPRINTS;
      else if (effectiveCategory === 'communication') candidates = COMMUNICATION_BLUEPRINTS;
      else {
        // Any technical blueprint in role pool
        candidates = rolePool.filter(bp => bp.category === 'technical');
      }
    }

    // Shuffle scenarios & constraints to maximize variation
    const scenario = SCENARIOS[(opts.questionNumber + Math.floor(Math.random() * SCENARIOS.length)) % SCENARIOS.length];
    const constraint = CONSTRAINTS[(opts.questionNumber + Math.floor(Math.random() * CONSTRAINTS.length)) % CONSTRAINTS.length];

    // Find candidate blueprint that has not been asked before
    let selectedBlueprint: QuestionBlueprint | null = null;
    let finalQuestionText = '';

    for (const bp of [...candidates].sort(() => 0.5 - Math.random())) {
      const opener = getInterviewerOpener(opts.candidateName, opts.questionNumber, opts.totalQuestions, opts.role, opts.experienceLevel);
      const coreText = bp.coreQuestionTemplate({
        name: opts.candidateName,
        role: opts.role,
        exp: opts.experienceLevel,
        scenario,
        constraint
      });
      const candidateFullText = `${opener} ${coreText}`;
      const sig = createQuestionSignature(candidateFullText);

      if (!excludeSet.has(sig)) {
        selectedBlueprint = bp;
        finalQuestionText = candidateFullText;
        break;
      }
    }

    // If all predefined blueprints were exhausted or custom role was provided, generate dynamically
    if (!selectedBlueprint || !finalQuestionText) {
      return generateDynamicCustomRoleQuestion(opts, effectiveCategory);
    }

    const questionObj: Question = {
      id: `role_${Date.now()}_q${opts.questionNumber}_${Math.random().toString(36).slice(2, 7)}`,
      category: selectedBlueprint.category,
      difficulty: opts.difficulty,
      question: finalQuestionText,
      contextHint: selectedBlueprint.contextHint,
      expectedKeywords: selectedBlueprint.expectedKeywords,
      modelAnswer: selectedBlueprint.modelAnswer,
      source: 'ai_generated',
      isFollowUp: false,
      testCases: selectedBlueprint.testCases || [],
      rubricCriteria: selectedBlueprint.rubricCriteria
    };

    return questionObj;
  },

  /**
   * Generates a complete set of initial questions for an entire interview session.
   * Every question is guaranteed to be tailored to the candidate's name, role,
   * and experience level, and checked for cross-session deduplication.
   */
  generateSessionQuestions(params: {
    candidateName: string;
    role: string;
    experienceLevel: ExperienceLevel;
    category: InterviewType;
    difficulty: QuestionDifficulty;
    questionCount: number;
    resumeData?: ExtractedResumeData | null;
    jobDescription?: string;
    interviewFocus?: InterviewFocus;
  }): Question[] {
    const questions: Question[] = [];
    const usedSignatures: string[] = [];

    for (let i = 1; i <= params.questionCount; i++) {
      const q = this.generateQuestion({
        candidateName: params.candidateName,
        role: params.role,
        experienceLevel: params.experienceLevel,
        category: params.category,
        difficulty: params.difficulty,
        questionNumber: i,
        totalQuestions: params.questionCount,
        excludeSignatures: usedSignatures,
        resumeData: params.resumeData,
        jobDescription: params.jobDescription,
        interviewFocus: params.interviewFocus
      });

      questions.push(q);
      usedSignatures.push(createQuestionSignature(q.question));
    }

    // Persist all generated question texts into global storage history to prevent ever repeating
    storageService.recordAskedQuestions(questions.map(q => q.question));

    return questions;
  }
};
