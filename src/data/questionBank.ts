import { Question, InterviewType, InterviewCategoryMeta } from '../types/interview';

export const INTERVIEW_CATEGORIES: InterviewCategoryMeta[] = [
  {
    id: 'placement_mixed',
    title: 'Campus & Corporate Placement',
    description: 'Comprehensive multi-stage placement interview simulation featuring HR, technical depth, and analytical thinking.',
    icon: 'Briefcase',
    badge: 'Popular',
    recommendedDuration: 20,
    skillsCovered: ['Role Readiness', 'Tech Stack', 'STAR Behavioral', 'Problem Solving'],
    gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent'
  },
  {
    id: 'technical',
    title: 'Technical Depth',
    description: 'Deep dive into computer science fundamentals, system design, architectural patterns, and framework internals.',
    icon: 'Cpu',
    badge: 'Core',
    recommendedDuration: 25,
    skillsCovered: ['Algorithms', 'System Design', 'APIs', 'Database Optimization', 'Debugging'],
    gradient: 'from-violet-500/20 via-indigo-500/10 to-transparent'
  },
  {
    id: 'coding',
    title: 'Coding & Algorithmic Logic',
    description: 'Explain algorithmic solutions, edge case handling, time & space complexities, and clean code principles.',
    icon: 'Code2',
    badge: 'Hands-on',
    recommendedDuration: 20,
    skillsCovered: ['Big-O Analysis', 'Data Structures', 'Edge Cases', 'Refactoring'],
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent'
  },
  {
    id: 'hr',
    title: 'HR & Behavioral',
    description: 'Master cultural fit, conflict resolution, leadership scenarios, work ethics, and salary & growth expectations.',
    icon: 'Users',
    badge: 'Essential',
    recommendedDuration: 15,
    skillsCovered: ['STAR Method', 'Conflict Resolution', 'Emotional Intelligence', 'Career Vision'],
    gradient: 'from-purple-500/20 via-pink-500/10 to-transparent'
  },
  {
    id: 'aptitude',
    title: 'Aptitude & Logical Reasoning',
    description: 'Placement aptitude testing including quantitative math, logical deduction, patterns, and probability puzzles.',
    icon: 'BrainCircuit',
    badge: 'Placement Exam',
    recommendedDuration: 15,
    skillsCovered: ['Quantitative Aptitude', 'Probability', 'Analytical Deduction', 'Speed Calculation'],
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent'
  },
  {
    id: 'communication',
    title: 'Communication & Soft Skills',
    description: 'Hone executive presence, clarity of thought, articulating complex ideas to non-technical stakeholders, and confidence.',
    icon: 'MessageSquareQuote',
    badge: 'Career Booster',
    recommendedDuration: 15,
    skillsCovered: ['Articulation', 'Stakeholder Communication', 'Active Listening', 'Voice Tone'],
    gradient: 'from-blue-500/20 via-cyan-500/10 to-transparent'
  }
];

export const QUESTION_BANK: Question[] = [
  // --- HR / Behavioral ---
  {
    id: 'hr-1',
    category: 'hr',
    difficulty: 'beginner',
    question: 'Tell me about yourself, your educational background, and why you are interested in this role.',
    contextHint: 'Keep it within 2 minutes. Structure with Past, Present, and Future. Highlight your core technical passion and how it aligns with the role.',
    expectedKeywords: ['education', 'skills', 'experience', 'projects', 'passion', 'growth', 'impact', 'role'],
    modelAnswer: 'I have a strong academic foundation in Computer Science and engineering with hands-on experience building full-stack applications. In my recent work, I developed practical solutions using modern web technologies and cloud services. I am passionate about solving complex real-world problems and building scalable software. This role excites me because of the team’s focus on high-impact products and the opportunity to contribute clean code, collaborate with experienced engineers, and continuously elevate my engineering skills.',
    rubricCriteria: [
      { criterion: 'Structure & Flow', weight: 30, description: 'Clear progression from academic background to projects and future intent.' },
      { criterion: 'Relevance to Role', weight: 40, description: 'Aligning past experience and interests with target position.' },
      { criterion: 'Clarity and Articulation', weight: 30, description: 'Clear voice, confident delivery, and absence of filler phrases.' }
    ]
  },
  {
    id: 'hr-2',
    category: 'hr',
    difficulty: 'intermediate',
    question: 'Describe a situation where you had a disagreement with a teammate or project lead. How did you handle it and what was the outcome?',
    contextHint: 'Use the STAR format: Situation, Task, Action, Result. Focus on professional communication, objective evaluation, and common goals.',
    expectedKeywords: ['situation', 'disagreement', 'discussion', 'objective', 'data', 'compromise', 'resolution', 'outcome', 'collaboration'],
    modelAnswer: 'During a team capstone project, our frontend and backend developers disagreed on whether to use GraphQL or standard REST endpoints for our real-time tracking feature. Recognizing the deadlock, I scheduled a brief technical sync where we drafted an objective matrix comparing delivery timeline, payload size, and team familiarity. The data demonstrated that REST with optimistic UI updates would meet our latency SLA while saving two weeks of development. The team agreed on this pragmatic path, and we delivered the sprint three days ahead of schedule.',
    rubricCriteria: [
      { criterion: 'STAR Methodology', weight: 40, description: 'Clear Situation, Task, Action, and quantifiable Result.' },
      { criterion: 'Emotional Maturity', weight: 35, description: 'Focus on constructive resolution rather than pointing blame.' },
      { criterion: 'Outcome Orientation', weight: 25, description: 'Demonstrating how the resolution benefited the project.' }
    ]
  },
  {
    id: 'hr-3',
    category: 'hr',
    difficulty: 'intermediate',
    question: 'What is your greatest professional or technical weakness, and what concrete steps are you taking to overcome it?',
    contextHint: 'Avoid humblebrags like "I work too hard". Pick a genuine skill gap and detail your active remediation process.',
    expectedKeywords: ['weakness', 'improvement', 'learning', 'feedback', 'practice', 'progress', 'self-awareness'],
    modelAnswer: 'Earlier in my projects, I had a tendency to dive directly into code implementation before documenting edge cases or getting early feedback on system design. This occasionally caused rework during sprint reviews. To address this, I adopted a disciplined pre-coding routine: I now write lightweight Request For Comments (RFC) docs or architecture sketches before coding complex modules. This has significantly reduced regression bugs and improved peer review velocity.',
    rubricCriteria: [
      { criterion: 'Authenticity', weight: 35, description: 'Identifying a realistic developmental area.' },
      { criterion: 'Actionable Improvement', weight: 45, description: 'Demonstrating proactive steps taken to mitigate the weakness.' },
      { criterion: 'Self-Awareness', weight: 20, description: 'Reflecting on personal growth mindset.' }
    ]
  },
  {
    id: 'hr-4',
    category: 'hr',
    difficulty: 'advanced',
    question: 'Where do you see yourself in 3 to 5 years, and how does joining our organization fit into that trajectory?',
    contextHint: 'Balance ambition with commitment. Mention technical mastery, mentorship, and driving higher-level impact.',
    expectedKeywords: ['growth', 'mentorship', 'architecture', 'impact', 'leadership', 'skills', 'long-term', 'value'],
    modelAnswer: 'In three to five years, I envision myself as a seasoned engineer with deep domain expertise in distributed systems and cloud architecture. Beyond delivering mission-critical modules, I want to mentor incoming developers, participate in code governance, and help shape technical roadmaps. Joining your team aligns with this goal because your culture emphasizes engineering excellence and offers avenues to tackle challenging scalability problems.',
    rubricCriteria: [
      { criterion: 'Realistic Ambition', weight: 40, description: 'Balanced goals showing dedication to engineering craft.' },
      { criterion: 'Organizational Alignment', weight: 40, description: 'Connecting personal trajectory to company growth.' },
      { criterion: 'Leadership Potential', weight: 20, description: 'Expressing interest in mentorship and collaborative growth.' }
    ]
  },

  // --- Technical ---
  {
    id: 'tech-1',
    category: 'technical',
    difficulty: 'beginner',
    question: 'Explain how the JavaScript Event Loop works, including the roles of the Call Stack, Web APIs, Microtask Queue, and Callback Queue.',
    contextHint: 'Walk through how asynchronous tasks like Promises and setTimeout are prioritized and executed.',
    expectedKeywords: ['call stack', 'event loop', 'microtask', 'macrotask', 'callback queue', 'web apis', 'promise', 'settimeout', 'single-threaded'],
    modelAnswer: 'JavaScript is single-threaded, meaning it has one call stack executing synchronous code. When an asynchronous operation like setTimeout or fetch is encountered, it is delegated to the browser Web APIs. Once finished, their callbacks are sent to queues: Promises and queueMicrotask go to the high-priority Microtask Queue, while timer events like setTimeout go to the Macrotask/Callback Queue. The Event Loop continuously checks if the Call Stack is empty; as soon as it is clear, it drains all tasks in the Microtask Queue first before processing the next macrotask in the queue.',
    rubricCriteria: [
      { criterion: 'Accuracy of Queues', weight: 40, description: 'Distinguishing microtasks (Promises) vs macrotasks (timers).' },
      { criterion: 'Execution Sequence', weight: 40, description: 'Explaining call stack clearing and synchronous vs asynchronous flow.' },
      { criterion: 'Technical Terminology', weight: 20, description: 'Proper usage of event loop concepts.' }
    ]
  },
  {
    id: 'tech-2',
    category: 'technical',
    difficulty: 'intermediate',
    question: 'What is the Virtual DOM in React, how does the reconciliation algorithm (Diffing) work, and why are keys important in lists?',
    contextHint: 'Contrast direct DOM manipulation costs with in-memory Virtual DOM diffing. Explain key stability.',
    expectedKeywords: ['virtual dom', 'reconciliation', 'diffing', 'fiber', 'keys', 'rendering', 'performance', 'real dom', 'state'],
    modelAnswer: 'The Virtual DOM is a lightweight JavaScript object representation of the actual DOM stored in memory. Direct DOM manipulation is slow due to layout repaints and reflows. When state changes, React creates a new Virtual DOM tree and runs a diffing algorithm (Reconciliation) to compute the minimal set of changes required. Keys provide stable identifiers for sibling elements in dynamic lists; without unique keys, React might re-render or incorrectly reconcile elements, leading to performance degradation and state mutation bugs.',
    rubricCriteria: [
      { criterion: 'Concept Clarity', weight: 35, description: 'Clear explanation of Virtual DOM vs Real DOM.' },
      { criterion: 'Reconciliation Mechanism', weight: 35, description: 'Diffing heuristics and tree comparison.' },
      { criterion: 'Role of Keys', weight: 30, description: 'Explanation of why stable keys prevent UI rendering errors.' }
    ]
  },
  {
    id: 'tech-3',
    category: 'technical',
    difficulty: 'intermediate',
    question: 'Explain the ACID properties of relational databases and how indexing improves query read performance at the expense of writes.',
    contextHint: 'Break down Atomicity, Consistency, Isolation, Durability with examples. Then explain B-Tree index overhead.',
    expectedKeywords: ['atomicity', 'consistency', 'isolation', 'durability', 'acid', 'transactions', 'index', 'b-tree', 'write overhead', 'queries'],
    modelAnswer: 'ACID guarantees transaction reliability: Atomicity ensures all operations succeed or all rollback (all-or-nothing). Consistency ensures data transitions from one valid state to another abiding by constraints. Isolation prevents concurrent transactions from interfering with each other. Durability guarantees that committed data persists even during system crashes. Database indexes (often B-Trees) speed up read queries from O(N) full table scans to O(log N) tree lookups. However, every INSERT, UPDATE, or DELETE requires the database to update the index structures, creating write latency overhead and disk storage usage.',
    rubricCriteria: [
      { criterion: 'ACID Breakdown', weight: 50, description: 'Correct definition and example for each ACID property.' },
      { criterion: 'Index Mechanism', weight: 30, description: 'Explaining B-Tree lookups vs full table scans.' },
      { criterion: 'Trade-off Analysis', weight: 20, description: 'Highlighting read speed benefits vs write latency overhead.' }
    ]
  },
  {
    id: 'tech-4',
    category: 'technical',
    difficulty: 'advanced',
    question: 'How would you design a distributed caching layer using Redis for a high-traffic e-commerce application? Explain cache invalidation, cache stampede, and cache penetration prevention.',
    contextHint: 'Address strategies like Cache-Aside, Write-Through, Bloom filters, and TTL jitter.',
    expectedKeywords: ['redis', 'cache-aside', 'cache stampede', 'cache penetration', 'ttl', 'bloom filter', 'mutex lock', 'invalidation'],
    modelAnswer: 'I would implement a Cache-Aside pattern where the application first reads from Redis; on a cache miss, it reads from the primary database and populates Redis with an expiration TTL. To prevent cache stampede (where an expired hot key causes thousands of simultaneous DB hits), I would use distributed locks (mutex) so only one worker queries the DB, along with probabilistic early expiration (XFetch) or random TTL jitter. To mitigate cache penetration (queries for non-existent items hitting the DB), I would use a Bloom filter in front of the cache or cache null values with a short TTL.',
    rubricCriteria: [
      { criterion: 'Architecture Pattern', weight: 35, description: 'Accurate description of caching topology and Cache-Aside.' },
      { criterion: 'Resilience Strategies', weight: 40, description: 'Handling stampede, penetration, and invalidation.' },
      { criterion: 'System Scalability', weight: 25, description: 'Considering high-load scenarios and memory management.' }
    ]
  },

  // --- Coding & Algorithmic Logic ---
  {
    id: 'code-1',
    category: 'coding',
    difficulty: 'beginner',
    question: 'How would you find two numbers in an array that add up to a specific target sum? Walk through both a brute-force and an optimal solution with time/space complexities.',
    contextHint: 'Discuss the O(N^2) nested loop vs O(N) Hash Map approach. Mention one-pass vs two-pass hash map.',
    expectedKeywords: ['hash map', 'complement', 'target', 'time complexity', 'space complexity', 'o(n)', 'o(n^2)', 'lookup'],
    modelAnswer: 'A brute-force approach uses two nested loops checking every pair of numbers, which requires O(N^2) time and O(1) space. The optimal solution uses a Hash Map (or Set). In a single pass over the array, for each number x, we compute its complement: complement = target - x. We check if complement already exists in our map; if so, we have found the two indices in O(1) lookup time. If not, we store the current number x with its index into the map. This achieves an optimal O(N) time complexity and O(N) space complexity.',
    rubricCriteria: [
      { criterion: 'Algorithmic Efficiency', weight: 45, description: 'Transitioning from O(N^2) to O(N) hash map solution.' },
      { criterion: 'Complexity Analysis', weight: 35, description: 'Accurate time and space complexity explanations.' },
      { criterion: 'Edge Case Consideration', weight: 20, description: 'Handling duplicate numbers or negative values.' }
    ]
  },
  {
    id: 'code-2',
    category: 'coding',
    difficulty: 'intermediate',
    question: 'How do you detect a cycle in a singly linked list? Explain Floyd’s Cycle Detection algorithm (Tortoise and Hare) and why it uses O(1) auxiliary space.',
    contextHint: 'Explain slow and fast pointers, mathematical intuition of distance closing by 1 step per cycle, and edge cases.',
    expectedKeywords: ['floyd', 'tortoise and hare', 'slow pointer', 'fast pointer', 'cycle', 'linked list', 'o(1) space', 'o(n) time'],
    modelAnswer: 'Floyd’s Cycle-Finding Algorithm uses two pointers: a slow pointer that advances by one node at a time, and a fast pointer that advances by two nodes. If there is no cycle, the fast pointer will eventually reach null, and we return false in O(N) time. If a cycle exists, both pointers will eventually enter the loop. Inside the loop, with each step, the distance between the fast pointer and the slow pointer decreases by exactly 1 node. Hence, they are guaranteed to meet. Because we only maintain two pointer references without extra data structures, the auxiliary space is strictly O(1).',
    rubricCriteria: [
      { criterion: 'Algorithm Explanation', weight: 40, description: 'Step-by-step logic of slow and fast pointers.' },
      { criterion: 'Mathematical Proof', weight: 35, description: 'Explaining why distance decreases by 1 in the cycle.' },
      { criterion: 'Space Complexity', weight: 25, description: 'Justifying O(1) memory requirement.' }
    ]
  },
  {
    id: 'code-3',
    category: 'coding',
    difficulty: 'advanced',
    question: 'Describe how you would implement a sliding window algorithm to find the longest substring without repeating characters. What is the time complexity?',
    contextHint: 'Explain left and right window pointers, character frequency tracking / last seen index, and contraction logic.',
    expectedKeywords: ['sliding window', 'two pointers', 'hash set', 'last seen index', 'substring', 'o(n)', 'left pointer', 'right pointer'],
    modelAnswer: 'We maintain a sliding window defined by two pointers, left and right, initialized at 0, alongside a hash map storing the last observed index of each character. As the right pointer traverses the string from 0 to N-1, if the current character is already in the map and its recorded index is >= left, we shift our left pointer to (recorded index + 1) to eliminate the duplicate from our window. We update the map with the current character’s new index and compute max_length = max(max_length, right - left + 1). Each character is visited at most twice, yielding O(N) time complexity and O(min(N, alphabet_size)) space.',
    rubricCriteria: [
      { criterion: 'Window Mechanics', weight: 40, description: 'Clear manipulation of left and right pointers.' },
      { criterion: 'Optimized Jumping', weight: 35, description: 'Using last seen index to jump left pointer efficiently.' },
      { criterion: 'Complexity Precision', weight: 25, description: 'Accurate time and space complexity bounds.' }
    ]
  },

  // --- Aptitude & Logical Reasoning ---
  {
    id: 'apt-1',
    category: 'aptitude',
    difficulty: 'beginner',
    question: 'Two trains of length 150m and 100m are moving towards each other on parallel tracks at 54 km/h and 36 km/h respectively. How many seconds will they take to completely cross each other?',
    contextHint: 'Add lengths for total distance. Add relative speeds when moving in opposite directions. Convert km/h to m/s multiplying by 5/18.',
    expectedKeywords: ['relative speed', 'distance', 'conversion', '5/18', 'seconds', 'opposite direction', '10 seconds'],
    modelAnswer: '1. Total distance to cross = sum of lengths = 150m + 100m = 250m. 2. Since trains move towards each other, relative speed = 54 km/h + 36 km/h = 90 km/h. 3. Convert relative speed to m/s: 90 * (5/18) = 25 m/s. 4. Time taken = Total Distance / Relative Speed = 250 / 25 = 10 seconds. Therefore, the trains cross each other in exactly 10 seconds.',
    rubricCriteria: [
      { criterion: 'Relative Speed Concept', weight: 35, description: 'Correctly adding speeds for opposing directions.' },
      { criterion: 'Unit Conversion', weight: 35, description: 'Multiplying by 5/18 to convert km/h to m/s.' },
      { criterion: 'Final Numerical Answer', weight: 30, description: 'Arriving at 10 seconds with clear steps.' }
    ]
  },
  {
    id: 'apt-2',
    category: 'aptitude',
    difficulty: 'intermediate',
    question: 'A box contains 5 red balls, 4 blue balls, and 3 green balls. If 2 balls are drawn at random without replacement, what is the probability that both balls are of different colors?',
    contextHint: 'Compute 1 minus the probability that both balls are of the same color, or sum distinct pairs (R-B, R-G, B-G). Total balls = 12.',
    expectedKeywords: ['probability', 'combination', 'without replacement', 'complement', 'same color', 'different colors', '47/66'],
    modelAnswer: 'Total balls = 5 + 4 + 3 = 12. Total ways to choose 2 balls from 12 = 12C2 = (12 * 11) / 2 = 66. It is simpler to use the complementary event: P(both different) = 1 - P(both same color). Ways to pick 2 of same color: Both red = 5C2 = 10; Both blue = 4C2 = 6; Both green = 3C2 = 3. Total same color ways = 10 + 6 + 3 = 19. P(same color) = 19 / 66. Therefore, P(different colors) = 1 - (19 / 66) = 47 / 66 (approximately 71.2%).',
    rubricCriteria: [
      { criterion: 'Combinatorial Counting', weight: 40, description: 'Correct calculation of sample space 12C2 = 66.' },
      { criterion: 'Method Choice', weight: 35, description: 'Effective use of complementary probability or pairwise sums.' },
      { criterion: 'Accuracy', weight: 25, description: 'Arriving at 47/66 with clean intermediate arithmetic.' }
    ]
  },
  {
    id: 'apt-3',
    category: 'aptitude',
    difficulty: 'intermediate',
    question: 'Solve this logical deduction: All developers are problem solvers. Some problem solvers are chess players. No chess players are careless. Can we conclude that no developers are careless? Explain your reasoning.',
    contextHint: 'Evaluate syllogisms using Venn diagrams or set theory intersection rules. Watch out for invalid quantifier jumps.',
    expectedKeywords: ['syllogism', 'conclusion', 'invalid', 'venn diagram', 'subset', 'overlap', 'fallacy', 'cannot conclude'],
    modelAnswer: 'No, we cannot validly conclude that "no developers are careless". Let D = Developers, P = Problem Solvers, C = Chess Players, and X = Careless people. We know: D is a subset of P. Some P overlap with C. C has zero intersection with X. However, the premises do not state that Developers (D) must be part of the subset of Problem Solvers that play chess (C). A developer could be a problem solver who does not play chess, and that person could be careless. Therefore, the conclusion does not logically follow.',
    rubricCriteria: [
      { criterion: 'Logical Validity Verdict', weight: 40, description: 'Correctly identifying that the conclusion cannot be drawn.' },
      { criterion: 'Formal Set / Venn Logic', weight: 40, description: 'Explaining non-overlapping subsets and quantifier limitations.' },
      { criterion: 'Clarity of Proof', weight: 20, description: 'Articulating counterexample scenario clearly.' }
    ]
  },

  // --- Communication & Soft Skills ---
  {
    id: 'comm-1',
    category: 'communication',
    difficulty: 'beginner',
    question: 'How would you explain the concept of Cloud Computing and APIs to a business client who has no technical background?',
    contextHint: 'Use relatable real-world analogies like electricity utility grid, restaurants and waiters, or leasing vs buying.',
    expectedKeywords: ['analogy', 'restaurant', 'electricity', 'utility', 'waiter', 'menu', 'cost efficiency', 'on-demand'],
    modelAnswer: 'I like using familiar analogies: Think of Cloud Computing like household electricity. Instead of building your own private power plant in your backyard (which requires huge upfront costs and maintenance), you simply plug into the electrical grid and pay only for the power you consume. An API is like a restaurant waiter: You (the client) sit at a table looking at the menu, and the kitchen has the food. You can’t go directly into the kitchen, so you tell the waiter what you want. The waiter carries your order to the kitchen and delivers your food back to you. An API safely delivers requests and data between systems.',
    rubricCriteria: [
      { criterion: 'Analogy Effectiveness', weight: 45, description: 'Selecting relatable, everyday comparisons.' },
      { criterion: 'Jargon Elimination', weight: 35, description: 'Avoiding intimidating acronyms and technical vernacular.' },
      { criterion: 'Business Value Connection', weight: 20, description: 'Connecting explanation to cost and operational efficiency.' }
    ]
  },
  {
    id: 'comm-2',
    category: 'communication',
    difficulty: 'intermediate',
    question: 'You realize that a critical feature promised to a customer cannot be delivered before the promised Friday deadline. How do you communicate this to your manager and the client?',
    contextHint: 'Early proactive notice, root cause without excuses, phased delivery option, and revised committed milestone.',
    expectedKeywords: ['proactive', 'early communication', 'phased delivery', 'transparency', 'solution', 'options', 'revised timeline'],
    modelAnswer: 'First, I notify my manager immediately upon discovering the risk, presenting the blocker along with two recovery solutions. Once aligned, we contact the client transparently before the deadline—never on the day of delivery. I would say: "During integration testing, we identified a critical data sync latency that would compromise security if launched Friday. To ensure a seamless experience, we can deliver Phase 1 (the core dashboard) on Friday as scheduled, followed by the automated sync on Tuesday after completing regression verification. We apologize for the delay and are committing all our focus to this updated milestone." This preserves trust through honesty and actionable alternatives.',
    rubricCriteria: [
      { criterion: 'Proactive Transparency', weight: 40, description: 'Reaching out early rather than waiting until the deadline.' },
      { criterion: 'Solution-First Communication', weight: 40, description: 'Offering phased options and concrete recovery plan.' },
      { criterion: 'Professional Empathy', weight: 20, description: 'Acknowledging impact and reassuring the client.' }
    ]
  }
];

export const TARGET_ROLES = [
  'Full Stack Software Engineer',
  'Frontend Developer (React / TypeScript)',
  'Backend Engineer (Node.js / Python / Java)',
  'Campus Placement Fresher (All Disciplines)',
  'Data Analyst & Business Intelligence',
  'Cloud & DevOps Engineer',
  'Product Manager / Associate PM',
  'Quality Assurance & Automation Engineer'
];

export const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (United States)', flag: '🇺🇸', accent: 'Standard' },
  { code: 'en-IN', name: 'English (India)', flag: '🇮🇳', accent: 'Indian Neutral' },
  { code: 'en-GB', name: 'English (United Kingdom)', flag: '🇬🇧', accent: 'British' },
  { code: 'hi-IN', name: 'Hindi / Hinglish', flag: '🇮🇳', accent: 'Bilingual Tech' },
  { code: 'es-ES', name: 'Spanish', flag: '🇪🇸', accent: 'European Spanish' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷', accent: 'Standard French' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪', accent: 'Standard German' }
];
