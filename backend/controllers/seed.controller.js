import Question from '../models/Question.js'
import Experience from '../models/Experience.js'
import { sendSuccess } from '../utils/helpers.js'


/**
 * Drops any bad compound indexes that cause "parallel arrays" errors.
 * Safe to call every time — ignores errors if index doesn't exist.
 */
const dropBadIndexes = async () => {
  try {
    await Question.collection.dropIndex('company_1_role_1_stage_1')
    console.log('[Seed] Dropped bad compound index company_1_role_1_stage_1')
  } catch { /* index didn't exist — that's fine */ }
  try {
    await Question.collection.dropIndex('company_1_role_1')
    console.log('[Seed] Dropped bad compound index company_1_role_1')
  } catch { /* fine */ }
  try {
    await Experience.collection.dropIndex('company_1_role_1')
    console.log('[Seed] Dropped bad Experience compound index')
  } catch { /* fine */ }
}

/**
 * POST /api/seed/questions
 */
export const seedQuestions = async (req, res, next) => {
  try {
    await dropBadIndexes()

    const existingCount = await Question.countDocuments()
    if (existingCount >= 50) {
      return sendSuccess(res, { seeded: 0, existing: existingCount, total: existingCount }, 'Database already populated.')
    }

    const questions = [
      { title: 'Two Sum', difficulty: 'Easy', tags: ['Arrays', 'Hash Map'], pattern: 'Hash Map', company: ['Google', 'Amazon'], stage: ['OA'], description: 'Given an array of integers and a target, return indices of the two numbers that add up to the target.', externalLink: 'https://leetcode.com/problems/two-sum/', frequency: 95 },
      { title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', tags: ['Sliding Window', 'Hash Map'], pattern: 'Sliding Window', company: ['Amazon', 'Google'], stage: ['Round1', 'OA'], description: 'Find the length of the longest substring without repeating characters.', externalLink: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', frequency: 88 },
      { title: 'Merge Intervals', difficulty: 'Medium', tags: ['Arrays', 'Sorting'], pattern: 'Intervals', company: ['Google', 'Meta'], stage: ['Round1'], description: 'Given an array of intervals, merge all overlapping intervals.', externalLink: 'https://leetcode.com/problems/merge-intervals/', frequency: 80 },
      { title: 'LRU Cache', difficulty: 'Medium', tags: ['Design', 'Hash Map', 'Linked List'], pattern: 'Design', company: ['Amazon', 'Microsoft'], stage: ['Round2'], description: 'Design a data structure following the LRU cache eviction policy.', externalLink: 'https://leetcode.com/problems/lru-cache/', frequency: 85 },
      { title: 'Maximum Subarray', difficulty: 'Easy', tags: ['Dynamic Programming', 'Arrays'], pattern: 'Dynamic Programming', company: ['Microsoft', 'Adobe'], stage: ['OA'], description: "Find the contiguous subarray which has the largest sum (Kadane's Algorithm).", externalLink: 'https://leetcode.com/problems/maximum-subarray/', frequency: 90 },
      { title: 'Binary Search', difficulty: 'Easy', tags: ['Binary Search'], pattern: 'Binary Search', company: ['Flipkart', 'Infosys'], stage: ['OA'], description: 'Implement binary search on a sorted integer array.', externalLink: 'https://leetcode.com/problems/binary-search/', frequency: 75 },
      { title: 'Number of Islands', difficulty: 'Medium', tags: ['Graphs', 'BFS', 'DFS'], pattern: 'BFS/DFS', company: ['Google', 'Amazon', 'Microsoft'], stage: ['Round1'], description: 'Count the number of connected islands in a 2D binary grid.', externalLink: 'https://leetcode.com/problems/number-of-islands/', frequency: 92 },
      { title: 'Course Schedule', difficulty: 'Medium', tags: ['Graphs', 'Topological Sort'], pattern: 'Topological Sort', company: ['Meta', 'Amazon'], stage: ['Round1'], description: 'Determine if it is possible to finish all courses given prerequisites.', externalLink: 'https://leetcode.com/problems/course-schedule/', frequency: 78 },
      { title: 'Trapping Rain Water', difficulty: 'Hard', tags: ['Arrays', 'Two Pointers', 'Stack'], pattern: 'Two Pointers', company: ['Google', 'Amazon', 'Microsoft'], stage: ['Round2'], description: 'Compute how much water can be trapped between elevation bars after rain.', externalLink: 'https://leetcode.com/problems/trapping-rain-water/', frequency: 88 },
      { title: 'Coin Change', difficulty: 'Medium', tags: ['Dynamic Programming'], pattern: 'Dynamic Programming', company: ['Paytm', 'Amazon'], stage: ['Round1'], description: 'Find the minimum number of coins to make up a given amount.', externalLink: 'https://leetcode.com/problems/coin-change/', frequency: 82 },
      { title: 'Valid Parentheses', difficulty: 'Easy', tags: ['Stack', 'String'], pattern: 'Stack', company: ['Wipro', 'Cognizant'], stage: ['OA'], description: 'Determine if the input string of brackets is valid.', externalLink: 'https://leetcode.com/problems/valid-parentheses/', frequency: 68 },
      { title: 'Reverse Linked List', difficulty: 'Easy', tags: ['Linked List'], pattern: 'Linked List', company: ['TCS', 'Wipro'], stage: ['OA'], description: 'Reverse a singly linked list iteratively or recursively.', externalLink: 'https://leetcode.com/problems/reverse-linked-list/', frequency: 72 },
      { title: 'Linked List Cycle', difficulty: 'Easy', tags: ['Linked List', 'Two Pointers'], pattern: 'Fast & Slow Pointers', company: ['Infosys'], stage: ['Round1'], description: "Detect if a linked list has a cycle using Floyd's algorithm.", externalLink: 'https://leetcode.com/problems/linked-list-cycle/', frequency: 74 },
      { title: 'Kth Largest Element in Array', difficulty: 'Medium', tags: ['Sorting', 'Heap'], pattern: 'Heap', company: ['Amazon', 'Google'], stage: ['Round1'], description: 'Find the kth largest element in an unsorted array.', externalLink: 'https://leetcode.com/problems/kth-largest-element-in-an-array/', frequency: 84 },
      { title: 'Top K Frequent Elements', difficulty: 'Medium', tags: ['Hash Map', 'Heap'], pattern: 'Heap', company: ['Flipkart', 'Google'], stage: ['Round1'], description: 'Return the k most frequent elements from an array.', externalLink: 'https://leetcode.com/problems/top-k-frequent-elements/', frequency: 80 },
      { title: 'Product of Array Except Self', difficulty: 'Medium', tags: ['Arrays', 'Prefix Sum'], pattern: 'Prefix Sum', company: ['Microsoft', 'Amazon'], stage: ['Round1'], description: 'Return an output array where each element is the product of all others without division.', externalLink: 'https://leetcode.com/problems/product-of-array-except-self/', frequency: 83 },
      { title: 'Binary Tree Level Order Traversal', difficulty: 'Medium', tags: ['BFS', 'Trees'], pattern: 'BFS', company: ['Google', 'Amazon'], stage: ['Round1'], description: 'Return level-by-level traversal of a binary tree.', externalLink: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', frequency: 86 },
      { title: 'Lowest Common Ancestor of BST', difficulty: 'Easy', tags: ['Trees', 'BST'], pattern: 'Trees', company: ['Amazon', 'Meta'], stage: ['Round1'], description: 'Find the lowest common ancestor of two nodes in a BST.', externalLink: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/', frequency: 76 },
      { title: 'Word Ladder', difficulty: 'Hard', tags: ['BFS', 'Graphs'], pattern: 'BFS', company: ['Amazon', 'Google'], stage: ['Round2'], description: 'Find the shortest transformation sequence from beginWord to endWord.', externalLink: 'https://leetcode.com/problems/word-ladder/', frequency: 65 },
      { title: 'Climbing Stairs', difficulty: 'Easy', tags: ['Dynamic Programming'], pattern: 'Dynamic Programming', company: ['Infosys', 'TCS'], stage: ['OA'], description: 'Count distinct ways to climb n stairs, taking 1 or 2 steps.', externalLink: 'https://leetcode.com/problems/climbing-stairs/', frequency: 70 },
      // System Design
      { title: 'Design a URL Shortener', difficulty: 'Medium', tags: ['System Design', 'Database', 'Caching'], pattern: 'System Design', company: ['Google', 'Amazon'], stage: ['Round2'], description: 'Design bit.ly — cover hashing, DB schema, read/write scalability, CDN, and analytics.', externalLink: '', frequency: 88 },
      { title: 'Design Twitter Feed', difficulty: 'Hard', tags: ['System Design', 'Database', 'Caching'], pattern: 'System Design', company: ['Meta', 'Twitter'], stage: ['Round2'], description: 'Design a scalable Twitter feed with fanout-on-write vs fanout-on-read strategies.', externalLink: '', frequency: 85 },
      { title: 'Design a Rate Limiter', difficulty: 'Medium', tags: ['System Design', 'Distributed Systems'], pattern: 'System Design', company: ['Amazon', 'Stripe'], stage: ['Round2'], description: 'Cover token bucket, sliding window log, sliding window counter, distributed Redis rate limiting.', externalLink: '', frequency: 80 },
      { title: 'Design WhatsApp', difficulty: 'Hard', tags: ['System Design', 'Real-time'], pattern: 'System Design', company: ['Microsoft', 'Meta'], stage: ['Round2'], description: 'Design a real-time chat app with delivery receipts, group messaging, and media sharing.', externalLink: '', frequency: 82 },
      { title: 'Design a Distributed Cache', difficulty: 'Hard', tags: ['System Design', 'Distributed Systems'], pattern: 'System Design', company: ['Netflix', 'Google'], stage: ['Round2'], description: 'Design a distributed cache with consistent hashing, eviction policies, and replication.', externalLink: '', frequency: 78 },
      { title: 'Design Search Autocomplete', difficulty: 'Medium', tags: ['System Design', 'Trie', 'Caching'], pattern: 'System Design', company: ['Google', 'Amazon'], stage: ['Round2'], description: 'Design a type-ahead suggestion system with Trie, ranking, and low-latency requirements.', externalLink: '', frequency: 75 },
      // SQL
      { title: 'Employees Earning More Than Managers', difficulty: 'Easy', tags: ['SQL', 'Joins'], pattern: 'SQL Joins', company: ['TCS', 'Infosys'], stage: ['OA'], description: 'Use self-join to find employees with salary greater than their manager.', externalLink: 'https://leetcode.com/problems/employees-earning-more-than-their-managers/', frequency: 72 },
      { title: 'Dense Rank Scores', difficulty: 'Medium', tags: ['SQL', 'Window Functions'], pattern: 'SQL Window Functions', company: ['Oracle', 'SAP'], stage: ['Round1'], description: 'Rank scores without gaps using DENSE_RANK() window function.', externalLink: 'https://leetcode.com/problems/rank-scores/', frequency: 68 },
      { title: 'Second Highest Salary', difficulty: 'Easy', tags: ['SQL', 'Subquery'], pattern: 'SQL Subquery', company: ['Infosys', 'Wipro'], stage: ['OA'], description: 'Return the second highest salary, NULL if it does not exist.', externalLink: 'https://leetcode.com/problems/second-highest-salary/', frequency: 70 },
      // OS
      { title: 'Deadlock — Conditions and Prevention', difficulty: 'Medium', tags: ['Operating Systems', 'Concurrency'], pattern: 'Theory', company: ['Microsoft', 'Google'], stage: ['Round1'], description: 'Explain the 4 Coffman conditions and prevention/avoidance/detection strategies.', externalLink: '', frequency: 74 },
      { title: 'Mutex vs Semaphore', difficulty: 'Easy', tags: ['Operating Systems', 'Concurrency'], pattern: 'Theory', company: ['Amazon', 'Microsoft'], stage: ['Round1'], description: 'Explain differences with code-level examples and real-world use cases.', externalLink: '', frequency: 70 },
      { title: 'Process vs Thread vs Coroutine', difficulty: 'Easy', tags: ['Operating Systems'], pattern: 'Theory', company: ['TCS', 'Infosys'], stage: ['OA'], description: 'Explain memory model differences, context-switching cost, and when to prefer each.', externalLink: '', frequency: 68 },
      // Behavioral
      { title: 'Tell me about a time you resolved a conflict', difficulty: 'Easy', tags: ['Behavioral', 'Leadership'], pattern: 'STAR Method', company: ['Amazon', 'Google'], stage: ['HR'], description: 'STAR method. Show empathy, listening, and collaborative resolution.', externalLink: '', frequency: 95 },
      { title: 'Describe a project where you failed', difficulty: 'Easy', tags: ['Behavioral', 'Growth Mindset'], pattern: 'STAR Method', company: ['Google', 'Microsoft'], stage: ['HR'], description: 'Pick a genuine failure. Focus on learning and change in behavior.', externalLink: '', frequency: 90 },
      { title: 'Why do you want to join this company?', difficulty: 'Easy', tags: ['Behavioral', 'Motivation'], pattern: 'Motivation', company: ['Microsoft', 'Meta'], stage: ['HR'], description: 'Research mission, products, culture. Align with your personal goals specifically.', externalLink: '', frequency: 98 },
      { title: 'Your most impactful project', difficulty: 'Easy', tags: ['Behavioral', 'Technical'], pattern: 'STAR Method', company: ['Amazon', 'Google'], stage: ['HR', 'Round1'], description: 'Quantify impact. Cover your specific role, challenges, decisions made.', externalLink: '', frequency: 96 },
      // Algorithms
      { title: "Dijkstra's Shortest Path", difficulty: 'Medium', tags: ['Graphs', 'Greedy', 'Heap'], pattern: 'Shortest Path', company: ['Google', 'Microsoft'], stage: ['Round2'], description: "Implement Dijkstra's with a min-heap. O((V+E)logV). No negative edges.", externalLink: '', frequency: 78 },
      { title: 'Longest Increasing Subsequence', difficulty: 'Medium', tags: ['Dynamic Programming', 'Binary Search'], pattern: 'Dynamic Programming', company: ['Amazon', 'Google'], stage: ['Round2'], description: 'O(n log n) using patience sorting / binary search.', externalLink: 'https://leetcode.com/problems/longest-increasing-subsequence/', frequency: 80 },
      { title: 'N-Queens Problem', difficulty: 'Hard', tags: ['Backtracking'], pattern: 'Backtracking', company: ['Microsoft', 'Google'], stage: ['Round2'], description: 'Place N queens so no two threaten each other. Classic backtracking.', externalLink: 'https://leetcode.com/problems/n-queens/', frequency: 65 },
      { title: 'Median of Two Sorted Arrays', difficulty: 'Hard', tags: ['Binary Search', 'Arrays'], pattern: 'Binary Search', company: ['Amazon', 'Google'], stage: ['Round2'], description: 'Find median of two sorted arrays in O(log(m+n)) time.', externalLink: 'https://leetcode.com/problems/median-of-two-sorted-arrays/', frequency: 75 },
      // OOP
      { title: 'Design a Parking Lot', difficulty: 'Medium', tags: ['OOP', 'Design'], pattern: 'Object-Oriented Design', company: ['Amazon', 'Microsoft'], stage: ['Round1'], description: 'Model Parking lot with Vehicle hierarchy, Spot types, Ticket, and Payment.', externalLink: '', frequency: 80 },
      { title: 'SOLID Principles with Examples', difficulty: 'Medium', tags: ['OOP', 'Design Patterns'], pattern: 'Theory', company: ['Microsoft', 'Google'], stage: ['Round1'], description: 'Walk through each SOLID principle with a real code scenario.', externalLink: '', frequency: 82 },
      { title: 'Observer Design Pattern', difficulty: 'Medium', tags: ['Design Patterns', 'OOP'], pattern: 'Design Pattern', company: ['Google', 'Amazon'], stage: ['Round1'], description: 'Build a publish-subscribe notification system using the Observer pattern.', externalLink: '', frequency: 70 },
      { title: 'Serialize and Deserialize Binary Tree', difficulty: 'Hard', tags: ['Trees', 'BFS', 'Design'], pattern: 'Trees', company: ['Google', 'Amazon'], stage: ['Round2'], description: 'Design encode/decode for a binary tree handling null nodes.', externalLink: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/', frequency: 72 },
      { title: '0/1 Knapsack Problem', difficulty: 'Medium', tags: ['Dynamic Programming'], pattern: 'Dynamic Programming', company: ['Flipkart', 'Amazon'], stage: ['Round1', 'Round2'], description: 'Maximize value within a weight limit. Classic bottom-up DP.', externalLink: '', frequency: 76 },
    ]

    const existingTitles = new Set(
      (await Question.find({}, 'title').lean()).map(q => q.title)
    )
    const toInsert = questions.filter(q => !existingTitles.has(q.title))

    if (toInsert.length > 0) {
      await Question.insertMany(toInsert, { ordered: false })
    }

    return sendSuccess(res, {
      seeded: toInsert.length,
      existing: existingCount,
      total: existingCount + toInsert.length,
    }, `Seeded ${toInsert.length} questions successfully.`)
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/seed/experiences
 */
export const seedExperiences = async (req, res, next) => {
  try {
    await dropBadIndexes()
    const existing = await Experience.countDocuments({ isPublic: true })
    if (existing >= 8) {
      return sendSuccess(res, { seeded: 0, existing, total: existing }, 'Experiences already seeded.')
    }
    const userId = req.user.id
    const exp = [
      {
        userId, company: 'Google', role: 'SDE-2', package: '42 LPA', yoe: 3,
        location: 'Bangalore', date: 'Jan 2024', totalRounds: 5, difficulty: 'Hard',
        outcome: 'Selected', rating: 5, mode: 'Online', duration: '3 weeks',
        topics: ['Graphs','DP','System Design','Behavioral'],
        isVerified: true, isPublic: true, timeAgo: '2 months ago',
        rawText: 'Applied via referral for Google SDE-2. 5 rounds over 3 weeks. OA on HackerRank had 2 hard DSA problems in 90 mins. Round 1: Number of Islands with follow-up on infinite grid — expected BFS. Round 2: Longest Increasing Path in Matrix — expected DFS+memoization O(m*n). Round 3: System Design — Design YouTube, covering CDN, video encoding pipeline, storage, recommendations. Round 4: Googliness behavioral — 6 STAR questions on ambiguity, failure, conflict. Offer received within 1 week of final round. Overall amazing experience — interviewers gave helpful hints when stuck.',
        rounds: [
          { name: 'OA', type: 'OA', duration: '90 min', platform: 'HackerRank', questions: ['Number of islands variant','Sliding window maximum'], experience: 'Standard hard DSA. No hints provided.' },
          { name: 'Round 1 – DSA', type: 'Technical', duration: '60 min', platform: 'Google Meet + Google Docs', questions: ['Number of Islands (BFS/DFS)','Follow-up: what if grid is infinite?','Time & space complexity for both'], experience: 'Interviewer was very collaborative. Gave hints after 10 mins of struggle.' },
          { name: 'Round 2 – DSA', type: 'Technical', duration: '60 min', platform: 'Google Meet + Google Docs', questions: ['Longest Increasing Path in Matrix','Why memoization over pure DP here?'], experience: 'Expected O(m*n) with memoized DFS. Drawing the recursion tree helped.' },
          { name: 'Round 3 – System Design', type: 'System Design', duration: '60 min', platform: 'Google Meet + Jamboard', questions: ['Design YouTube for 2B users','CDN architecture','Video transcoding pipeline','Recommendation system at scale'], experience: 'Very deep. Started with requirements, then APIs, then data model, then scale.' },
          { name: 'Round 4 – Googliness', type: 'HR', duration: '45 min', platform: 'Google Meet', questions: ['Tell me about a failure that changed you','Most ambiguous project decision','Conflict with a teammate — what happened?'], experience: 'Pure behavioral. STAR method is essential. Be genuine.' },
        ],
        tips: ['Practice coding in Google Docs — no syntax highlighting','Prepare 6-8 STAR stories covering failure, conflict, ambiguity','System design: always start with clarifying requirements','Number of Islands and variants are very common at Google'],
        verdict: 'Highly recommend. Treat it as a learning experience even if rejected.',
      },
      {
        userId, company: 'Amazon', role: 'SDE-1', package: '24 LPA', yoe: 1,
        location: 'Hyderabad', date: 'Feb 2024', totalRounds: 4, difficulty: 'Medium',
        outcome: 'Selected', rating: 4, mode: 'Online', duration: '4 weeks',
        topics: ['Trees','Arrays','Leadership Principles','System Design'],
        isVerified: true, isPublic: true, timeAgo: '1 month ago',
        rawText: 'Amazon SDE-1 campus hiring. OA had 2 coding problems + work simulation (7 LP scenarios). Round 1 coding: Serialize/Deserialize Binary Tree — my BFS approach was accepted. Also asked 2 LP questions interleaved. Round 2: Mini system design of a notification system — expected SQS queues, retry logic, dead letter queue, multi-channel fanout. Bar raiser was 60 mins of pure LP questions, no coding. Got offer in 10 days.',
        rounds: [
          { name: 'OA', type: 'OA', duration: '90 min', platform: 'HackerRank', questions: ['Max profit with k transactions (DP)','Minimum window substring','Work simulation: 7 LP scenarios'], experience: 'Work simulation is about LP alignment. Read all 16 LPs before attempting.' },
          { name: 'Round 1 – Coding + LP', type: 'Technical', duration: '60 min', platform: 'Amazon Chime + CodePair', questions: ['Serialize and Deserialize Binary Tree','Tell me about a time you disagreed with your manager'], experience: 'Amazon ALWAYS interleaves LP questions in coding rounds. Have stories ready.' },
          { name: 'Round 2 – System Design', type: 'System Design', duration: '60 min', platform: 'Amazon Chime', questions: ['Design push notification system for Amazon','Handle retries and failures','Fanout to push/SMS/email channels','Dead letter queue'], experience: 'Expected SQS-based architecture. AWS knowledge is a plus but not required.' },
          { name: 'Bar Raiser', type: 'HR', duration: '60 min', platform: 'Amazon Chime', questions: ['Deliver results with incomplete information','Most complex project — why that decision?','Customer obsession: go above and beyond example'], experience: 'Bar raiser checks culture bar. Must demonstrate LPs with specific data and metrics.' },
        ],
        tips: ['Memorize all 16 Amazon Leadership Principles with concrete stories','Every round has LP — never skip behavioral prep','Customer Obsession and Deliver Results are most tested LPs','Amazon asks for metrics in every story — quantify your impact'],
        verdict: 'Process is long but fair. LP preparation is 50% of the interview.',
      },
      {
        userId, company: 'Microsoft', role: 'SDE-2', package: '38 LPA', yoe: 3,
        location: 'Hyderabad', date: 'Mar 2024', totalRounds: 4, difficulty: 'Medium',
        outcome: 'Selected', rating: 4, mode: 'Online', duration: '2 weeks',
        topics: ['OOP','Linked List','System Design','Behavioral'],
        isVerified: true, isPublic: true, timeAgo: '3 weeks ago',
        rawText: 'Microsoft IDCSET loop. 4 rounds on MS Teams over 2 weeks. Round 1: OOP design — elevator system with state machine, asked about which design patterns used and how to extend. Round 2: DSA — cycle detection in linked list (Floyd algorithm), find entry point, then merge K sorted lists. Round 3: System Design — real-time collaborative editor like Google Docs, covered WebSockets, OT vs CRDT, DB schema for versions. Round 4: As Appropriate (hiring manager fit) — growth mindset, ambiguity. Very collaborative culture, offer in 5 days.',
        rounds: [
          { name: 'Round 1 – OOP Design', type: 'Technical', duration: '60 min', platform: 'MS Teams + VS Live Share', questions: ['Design Elevator System with state machine','Which design patterns did you use?','How would you extend for different building types?','Thread safety for concurrent requests'], experience: 'Focus on extensibility and SOLID principles. Draw class diagram first.' },
          { name: 'Round 2 – DSA', type: 'Technical', duration: '60 min', platform: 'MS Teams + VS Live Share', questions: ['Detect cycle in linked list + find entry point','Merge K sorted linked lists (heap approach)'], experience: 'Clean code emphasized. Always discuss time/space complexity proactively.' },
          { name: 'Round 3 – System Design', type: 'System Design', duration: '60 min', platform: 'MS Teams + Whiteboard', questions: ['Design Google Docs real-time collaboration','OT vs CRDT — which would you choose?','DB schema for document version history','How do you handle conflict resolution?'], experience: 'Deep dive into WebSockets, operational transformation. OT vs CRDT debate is important.' },
          { name: 'Round 4 – As Appropriate', type: 'Managerial', duration: '45 min', platform: 'MS Teams', questions: ['Example of growth mindset','How do you handle technical ambiguity?','Tell me about a difficult team conflict'], experience: 'Growth mindset is Microsoft core value. This round determines hiring level.' },
        ],
        tips: ['Microsoft strongly values growth mindset — have concrete examples','Prepare OOP design questions with actual class diagrams','For system design: focus on real-time protocols (WebSockets, SSE)','As Appropriate round is often the deciding one — treat it seriously'],
        verdict: 'Best interview culture I have experienced. Interviewers genuinely want you to succeed.',
      },
      {
        userId, company: 'Flipkart', role: 'SDE-2', package: '32 LPA', yoe: 3,
        location: 'Bangalore', date: 'Nov 2023', totalRounds: 5, difficulty: 'Hard',
        outcome: 'Selected', rating: 4, mode: 'Online', duration: '5 weeks',
        topics: ['Machine Coding','Graphs','DP','System Design'],
        isVerified: true, isPublic: true, timeAgo: '4 months ago',
        rawText: 'Flipkart SDE-2 via LinkedIn. 5 rounds over 5 weeks. Machine coding round is unique — 2 hours to build a working in-memory key-value store with TTL and LRU eviction, tests run automatically. DSA Round 1: Alien Dictionary (topological sort) and find all paths in DAG with max XOR. DSA Round 2: Burst Balloons (interval DP) and minimum cost to connect ropes. System design: Big Billion Day flash sale — inventory locking, 10x traffic spike, overselling prevention. HM round: ownership and scale stories.',
        rounds: [
          { name: 'Machine Coding', type: 'Technical', duration: '120 min', platform: 'HackerEarth', questions: ['Build in-memory key-value store with TTL, LRU eviction, and thread safety','All test cases run automatically'], experience: 'Working code required. Start with interfaces, then implement. Thread safety is critical.' },
          { name: 'Round 1 – DSA', type: 'Technical', duration: '60 min', platform: 'Video + Shared Doc', questions: ['Alien Dictionary — topological sort from character ordering','Find all paths in DAG with maximum XOR value'], experience: 'Hard graph problems. Think aloud throughout — they evaluate reasoning.' },
          { name: 'Round 2 – DSA', type: 'Technical', duration: '60 min', platform: 'Video + Shared Doc', questions: ['Burst Balloons — interval DP O(n^3)','Minimum cost to connect all ropes (heap/greedy)'], experience: 'Hard DP. Draw the recurrence relation first before coding.' },
          { name: 'Round 3 – System Design', type: 'System Design', duration: '75 min', platform: 'Video call', questions: ['Design Big Billion Day flash sale system','How do you prevent overselling?','Handle 10x traffic spike','Inventory locking strategy'], experience: 'E-commerce domain expertise expected. Redis for rate limiting, DB row locks for inventory.' },
          { name: 'HM Round', type: 'Managerial', duration: '45 min', platform: 'Video call', questions: ['Biggest ownership you took end-to-end','Handled a production outage — what did you do?','Disagreed with a tech decision — outcome?'], experience: 'Ownership and Bias for Action emphasized. Have metrics.' },
        ],
        tips: ['Machine coding is Flipkart-unique — practice building complete modules from scratch','Hard DP and graph problems are common — practice LeetCode hard','Flash sale and e-commerce system design is very commonly asked','OA — study interval DP and topological sort specifically'],
        verdict: 'Rigorous but rewarding. Machine coding round sets Flipkart apart.',
      },
      {
        userId, company: 'Razorpay', role: 'Backend Engineer', package: '30 LPA', yoe: 2,
        location: 'Bangalore', date: 'Jan 2024', totalRounds: 4, difficulty: 'Hard',
        outcome: 'Selected', rating: 5, mode: 'Online', duration: '3 weeks',
        topics: ['System Design','Distributed Systems','DSA','Payments'],
        isVerified: true, isPublic: true, timeAgo: '2 months ago',
        rawText: 'Razorpay backend via referral. Very domain-specific around payments. Round 1 DSA on CoderPad — thread-safe rate limiter and consistent hashing. Round 2 payments system design — idempotency keys, exactly-once delivery, outbox pattern, saga pattern for distributed transactions. Round 3: deep dive on past projects with live code walkthrough. Round 4: culture/values. Payments domain knowledge is absolutely required before interviewing here.',
        rounds: [
          { name: 'Round 1 – DSA', type: 'Technical', duration: '60 min', platform: 'CoderPad', questions: ['Design thread-safe rate limiter (token bucket)','Consistent hashing for payment node routing'], experience: 'Concurrency and distributed concepts tested through DSA problems.' },
          { name: 'Round 2 – Payments System Design', type: 'System Design', duration: '75 min', platform: 'Video + Whiteboard', questions: ['Design end-to-end payment processing system','How do you guarantee exactly-once payment?','Idempotency key implementation','Outbox pattern for reliable event publishing','Saga pattern for rollback on failure'], experience: 'Very domain-specific. Study payment patterns thoroughly before this interview.' },
          { name: 'Round 3 – Project Deep Dive', type: 'Technical', duration: '60 min', platform: 'Video call', questions: ['Walk me through your most complex backend system','How did you handle cascading failures?','Why did you choose this database — alternatives considered?'], experience: 'They may ask to see actual code. Know every part of your projects deeply.' },
          { name: 'Culture Fit', type: 'HR', duration: '30 min', platform: 'Video call', questions: ['Why fintech over FAANG?','Example of extreme ownership','Handling regulatory constraints in product decisions'], experience: 'Values: speed, ownership, customer empathy, moving fast with quality.' },
        ],
        tips: ['Study payment patterns: idempotency, saga, outbox, 2PC before interview','Consistent hashing is commonly tested for backend roles','Know your past projects inside-out — code review is part of the process','Razorpay moves fast — process completed in under 3 weeks'],
        verdict: 'Best fintech interview experience. Very technical and domain-specific.',
      },
      {
        userId, company: 'Goldman Sachs', role: 'Analyst SWE', package: '28 LPA', yoe: 0,
        location: 'Bangalore', date: 'Aug 2023', totalRounds: 4, difficulty: 'Hard',
        outcome: 'Selected', rating: 4, mode: 'Online', duration: '3 weeks',
        topics: ['Graphs','OOP','SQL','Behavioral'],
        isVerified: true, isPublic: true, timeAgo: '6 months ago',
        rawText: 'Goldman Sachs campus hiring. HackerRank OA had 3 hard problems in 90 mins — most candidates struggled. Round 1: Alien dictionary + LRU Cache. Round 2: Design a stock exchange order book (OOP) — very specific to trading domain. Round 3: SQL window functions + threading/deadlock concepts. Round 4: HR on GS values and ethics. Finance domain knowledge is a plus but not required for SWE track.',
        rounds: [
          { name: 'OA', type: 'OA', duration: '90 min', platform: 'HackerRank', questions: ['Alien Dictionary (topological sort from char ordering)','Word Ladder (BFS shortest path)','Implement LRU Cache O(1) operations'], experience: '3 hard problems in 90 mins is brutal. Time management is critical.' },
          { name: 'Round 1 – DSA + OOP', type: 'Technical', duration: '60 min', platform: 'Video + CodePair', questions: ['Serialize and Deserialize Binary Tree','Design stock exchange order book — match buy/sell orders','Bid-ask spread calculation'], experience: 'Order book OOP design: Order class, OrderBook class, match engine with priority queue.' },
          { name: 'Round 2 – SQL + OS', type: 'Technical', duration: '60 min', platform: 'Video call', questions: ['DENSE_RANK on portfolio daily returns','Find traders with consecutive profit days (window functions)','Deadlock in trading systems — prevention','Thread safety in order matching'], experience: 'SQL window functions are essential. OS concepts like deadlock matter here.' },
          { name: 'HR Round', type: 'HR', duration: '30 min', platform: 'Video call', questions: ['Why Goldman Sachs over product companies?','Ethical dilemma you faced in a project','How do you stay updated on markets?'], experience: 'Know GS business divisions. Mention interest in financial markets authentically.' },
        ],
        tips: ['Practice hard LeetCode before GS OA — easy/medium are not enough','Order book OOP design is signature GS question','SQL window functions: ROW_NUMBER, RANK, DENSE_RANK, LEAD, LAG — all tested','Read about trading systems and financial markets before interview'],
        verdict: 'Prestigious and well-paying. Process is intense but structured.',
      },
      {
        userId, company: 'Swiggy', role: 'SDE-1', package: '18 LPA', yoe: 1,
        location: 'Bangalore', date: 'Dec 2023', totalRounds: 3, difficulty: 'Medium',
        outcome: 'Selected', rating: 5, mode: 'Online', duration: '2 weeks',
        topics: ['Arrays','Greedy','System Design','Domain Knowledge'],
        isVerified: true, isPublic: true, timeAgo: '3 months ago',
        rawText: 'Swiggy SDE-1 via employee referral. Only 3 rounds, very fast process. Round 1: interval scheduling for delivery time slots — greedy approach. Also asked sliding window for max orders in time window. Round 2: System design of delivery ETA system — combination of ML model + Google Maps API + real-time traffic. Round 3: brief HR conversation. Got offer in 1 week. Interviewers gave hints freely and were very friendly.',
        rounds: [
          { name: 'Round 1 – DSA', type: 'Technical', duration: '60 min', platform: 'Video + Google Docs', questions: ['Minimum delivery riders for non-overlapping slots (greedy)','Max orders deliverable in any time window of size k (sliding window)','What if riders have different speeds?'], experience: 'Problems are delivery-domain specific but standard DSA underneath.' },
          { name: 'Round 2 – System Design', type: 'System Design', duration: '60 min', platform: 'Video call', questions: ['Design delivery ETA prediction system','How do you integrate ML model with maps API?','Handle peak demand (IPL night, New Year)','Real-time traffic updates'], experience: 'ETA system combines ML, maps, historical data, real-time feeds. Very practical.' },
          { name: 'HR', type: 'HR', duration: '20 min', platform: 'Video call', questions: ['Why Swiggy?','Where do you see yourself in 3 years?'], experience: 'Casual and friendly. Just be yourself.' },
        ],
        tips: ['Delivery domain knowledge gives an edge — think about the actual problem','Interval scheduling and sliding window are common Swiggy DSA patterns','Process is very fast — you can get offer in 1 week','Referrals significantly improve chances at Swiggy'],
        verdict: 'Great culture, fast process, domain-relevant problems.',
      },
      {
        userId, company: 'Infosys', role: 'Systems Engineer', package: '3.6 LPA', yoe: 0,
        location: 'Multiple Cities', date: 'Oct 2023', totalRounds: 3, difficulty: 'Easy',
        outcome: 'Selected', rating: 3, mode: 'Online', duration: '1 week',
        topics: ['Arrays','String','Aptitude','OOP','SQL'],
        isVerified: true, isPublic: true, timeAgo: '5 months ago',
        rawText: 'Infosys campus placement through InfyTQ / on-campus drive. Online test had quantitative aptitude, verbal ability, and 2 easy coding questions. Technical interview covered OOP concepts and SQL basics. HR round was a brief formality. Very straightforward process ideal for freshers. Joining bonus offered for InfyTQ certified students.',
        rounds: [
          { name: 'Online Test', type: 'OA', duration: '90 min', platform: 'InfyTQ / HackerRank', questions: ['Reverse words in a sentence','Find all prime numbers in range using Sieve','Armstrong number check','30 aptitude MCQs (ratio, time-work, probability)','20 verbal ability MCQs'], experience: 'Accuracy in aptitude is more important than coding. Both together determine cutoff.' },
          { name: 'Technical Interview', type: 'Technical', duration: '30 min', platform: 'Video call', questions: ['Explain OOP with real-world examples','Polymorphism vs Abstraction with code','SQL: find 2nd highest salary without subquery','Explain your final year project in 5 minutes'], experience: 'Basic level — know OOP and SQL fundamentals. Explain your project clearly.' },
          { name: 'HR Round', type: 'HR', duration: '15 min', platform: 'Video call', questions: ['Tell me about yourself','Relocation preference?','Strengths and weaknesses'], experience: 'Pure formality. Just be confident and speak clearly.' },
        ],
        tips: ['InfyTQ certification significantly boosts chances and package (3.6 vs 6.5 LPA)','Practice aptitude alongside coding — cutoff is combined','Know OOP with actual code examples not just definitions','SQL: know subqueries, joins, DISTINCT, window functions basics'],
        verdict: 'Good entry point for freshers. Upskill quickly after joining.',
      },
    ]
    const inserted = await Experience.insertMany(exp, { ordered: false })
    return sendSuccess(res, { seeded: inserted.length, existing, total: existing + inserted.length }, `Seeded ${inserted.length} experiences.`)
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/seed/company
 * Returns questions + experience counts for a specific company.
 * If the company has no data yet, informs the user.
 * Body: { company: string }
 */
export const seedByCompany = async (req, res, next) => {
  try {
    await dropBadIndexes()
    const { company } = req.body
    if (!company?.trim()) {
      return res.status(400).json({ success: false, message: 'Company name is required.' })
    }
    const name = company.trim()
    const [qCount, eCount] = await Promise.all([
      Question.countDocuments({ company: { $regex: new RegExp(name, 'i') } }),
      Experience.countDocuments({ company: { $regex: new RegExp(name, 'i') }, isPublic: true }),
    ])
    return sendSuccess(res, {
      company: name,
      questions: qCount,
      experiences: eCount,
      hasData: qCount > 0 || eCount > 0,
      message: qCount > 0 || eCount > 0
        ? `Found ${qCount} questions and ${eCount} experiences for ${name}.`
        : `No data yet for ${name}. Be the first to add experiences!`,
    }, `Company data lookup complete.`)
  } catch (error) {
    next(error)
  }
}
