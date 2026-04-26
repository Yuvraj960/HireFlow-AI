/**
 * HireFlow AI — Database Seed Script
 *
 * Populates the Question collection with a curated set of interview questions.
 * Each question is embedded using text-embedding-004 (768 dimensions) for vector search.
 *
 * Embedding is done in batches of 10 with 1s pauses to respect API rate limits.
 *
 * Run with:  npm run seed
 *
 * After seeding:
 * 1. Go to MongoDB Atlas UI
 * 2. Create a Vector Search index on the `questions` collection:
 *    Index name: vector_index
 *    Field:      embedding
 *    Dimensions: 768
 *    Similarity: cosine
 */
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import Question from './models/Question.js'
import { embedInBatches } from './services/embedding.service.js'

dotenv.config()

// ── Seed Data ─────────────────────────────────────────────────────────────────
const seedQuestions = [
  // ── Arrays & Hashing ──────────────────────────────────────────────────────
  {
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution.',
    company: ['Amazon', 'Google', 'Meta', 'Microsoft'],
    role: ['SDE-1', 'SDE-2', 'Software Engineer'],
    stage: ['OA', 'Round1'],
    topic: 'Arrays',
    pattern: 'Hash Map',
    difficulty: 'Easy',
    externalLink: 'https://leetcode.com/problems/two-sum/',
    isInternal: false,
    frequency: 95,
    tags: ['hash-map', 'array', 'warm-up'],
  },
  {
    title: 'Subarray Sum Equals K',
    description: 'Given an array of integers nums and an integer k, return the total number of subarrays whose sum equals k.',
    company: ['Amazon', 'Google', 'Bloomberg'],
    role: ['SDE-1', 'SDE-2'],
    stage: ['Round1'],
    topic: 'Arrays',
    pattern: 'Prefix Sum + Hash Map',
    difficulty: 'Medium',
    externalLink: 'https://leetcode.com/problems/subarray-sum-equals-k/',
    isInternal: false,
    frequency: 78,
    tags: ['prefix-sum', 'hash-map'],
  },
  {
    title: 'Trapping Rain Water',
    description: 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
    company: ['Amazon', 'Google', 'Microsoft'],
    role: ['SDE-2'],
    stage: ['Round1', 'Round2'],
    topic: 'Arrays',
    pattern: 'Two Pointers',
    difficulty: 'Hard',
    externalLink: 'https://leetcode.com/problems/trapping-rain-water/',
    isInternal: false,
    frequency: 68,
    tags: ['two-pointers', 'hard'],
  },
  {
    title: 'Rotate Array',
    description: 'Given an integer array nums, rotate the array to the right by k steps, where k is non-negative.',
    company: ['TCS', 'Infosys', 'Cognizant'],
    role: ['SDE-1'],
    stage: ['OA'],
    topic: 'Arrays',
    pattern: 'In-place Reversal',
    difficulty: 'Easy',
    externalLink: 'https://leetcode.com/problems/rotate-array/',
    isInternal: false,
    frequency: 55,
    tags: ['in-place', 'reversal'],
  },

  // ── Strings ───────────────────────────────────────────────────────────────
  {
    title: 'Longest Substring Without Repeating Characters',
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    company: ['Amazon', 'Adobe', 'Google', 'Cisco'],
    role: ['SDE-1', 'SDE-2'],
    stage: ['OA', 'Round1'],
    topic: 'Strings',
    pattern: 'Sliding Window',
    difficulty: 'Medium',
    externalLink: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
    isInternal: false,
    frequency: 82,
    tags: ['sliding-window', 'string'],
  },
  {
    title: 'Valid Anagram',
    description: 'Given two strings s and t, return true if t is an anagram of s, and false otherwise.',
    company: ['Amazon', 'Flipkart', 'Zoho'],
    role: ['SDE-1'],
    stage: ['OA'],
    topic: 'Strings',
    pattern: 'Frequency Count',
    difficulty: 'Easy',
    externalLink: 'https://leetcode.com/problems/valid-anagram/',
    isInternal: false,
    frequency: 60,
    tags: ['anagram', 'hash-map', 'warm-up'],
  },
  {
    title: 'Minimum Window Substring',
    description: 'Given two strings s and t of lengths m and n, return the minimum window substring of s such that every character in t (including duplicates) is included in the window.',
    company: ['Google', 'Meta', 'Microsoft'],
    role: ['SDE-2', 'SDE-3'],
    stage: ['Round2'],
    topic: 'Strings',
    pattern: 'Sliding Window',
    difficulty: 'Hard',
    externalLink: 'https://leetcode.com/problems/minimum-window-substring/',
    isInternal: false,
    frequency: 62,
    tags: ['sliding-window', 'hard'],
  },

  // ── Graphs ────────────────────────────────────────────────────────────────
  {
    title: 'Number of Islands',
    description: 'Given an m x n 2D binary grid representing a map of 1s (land) and 0s (water), return the number of islands.',
    company: ['Google', 'Amazon', 'Uber', 'Zomato'],
    role: ['SDE-1', 'SDE-2'],
    stage: ['OA', 'Round1'],
    topic: 'Graph',
    pattern: 'BFS/DFS',
    difficulty: 'Medium',
    externalLink: 'https://leetcode.com/problems/number-of-islands/',
    isInternal: false,
    frequency: 88,
    tags: ['bfs', 'dfs', 'grid'],
  },
  {
    title: 'Course Schedule',
    description: 'There are numCourses courses you have to take. You are given prerequisites as a list of pairs. Determine if you can finish all courses (detect cycle in directed graph).',
    company: ['Google', 'Amazon', 'Microsoft', 'Uber'],
    role: ['SDE-2'],
    stage: ['Round1', 'Round2'],
    topic: 'Graph',
    pattern: 'Topological Sort',
    difficulty: 'Medium',
    externalLink: 'https://leetcode.com/problems/course-schedule/',
    isInternal: false,
    frequency: 72,
    tags: ['topological-sort', 'cycle-detection'],
  },
  {
    title: 'Word Ladder',
    description: 'Given two words beginWord and endWord, and a dictionary wordList, return the number of words in the shortest transformation sequence from beginWord to endWord.',
    company: ['Google', 'Amazon'],
    role: ['SDE-2', 'SDE-3'],
    stage: ['Round2'],
    topic: 'Graph',
    pattern: 'BFS',
    difficulty: 'Hard',
    externalLink: 'https://leetcode.com/problems/word-ladder/',
    isInternal: false,
    frequency: 50,
    tags: ['bfs', 'shortest-path', 'hard'],
  },

  // ── Trees ─────────────────────────────────────────────────────────────────
  {
    title: 'Binary Tree Level Order Traversal',
    description: 'Given the root of a binary tree, return the level order traversal of its nodes values (i.e., from left to right, level by level).',
    company: ['Amazon', 'Wipro', 'TCS', 'Infosys'],
    role: ['SDE-1'],
    stage: ['Round1'],
    topic: 'Trees',
    pattern: 'BFS',
    difficulty: 'Medium',
    externalLink: 'https://leetcode.com/problems/binary-tree-level-order-traversal/',
    isInternal: false,
    frequency: 70,
    tags: ['bfs', 'tree'],
  },
  {
    title: 'Binary Tree Maximum Path Sum',
    description: 'A path in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge. Given the root of a binary tree, return the maximum path sum.',
    company: ['Google', 'Meta', 'Amazon'],
    role: ['SDE-2', 'SDE-3'],
    stage: ['Round2'],
    topic: 'Trees',
    pattern: 'DFS + Post-order',
    difficulty: 'Hard',
    externalLink: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/',
    isInternal: false,
    frequency: 58,
    tags: ['dfs', 'post-order', 'hard'],
  },
  {
    title: 'Serialize and Deserialize Binary Tree',
    description: 'Design an algorithm to serialize and deserialize a binary tree. Serialization is converting a data structure into a sequence of bits for storage. Ensure accurate reconstruction of the tree.',
    company: ['Google', 'Meta', 'LinkedIn'],
    role: ['SDE-2', 'SDE-3'],
    stage: ['Round2'],
    topic: 'Trees',
    pattern: 'BFS / DFS Serialization',
    difficulty: 'Hard',
    externalLink: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/',
    isInternal: false,
    frequency: 55,
    tags: ['tree', 'serialization', 'hard'],
  },

  // ── Dynamic Programming ───────────────────────────────────────────────────
  {
    title: 'Coin Change',
    description: 'You are given an integer array coins representing coins of various denominations and an integer amount. Return the fewest number of coins that you need to make up that amount.',
    company: ['Amazon', 'Flipkart', 'Paytm', 'PhonePe'],
    role: ['SDE-1', 'SDE-2'],
    stage: ['OA', 'Round1'],
    topic: 'DP',
    pattern: 'Bottom-Up DP',
    difficulty: 'Medium',
    externalLink: 'https://leetcode.com/problems/coin-change/',
    isInternal: false,
    frequency: 72,
    tags: ['dp', 'unbounded-knapsack'],
  },
  {
    title: 'Longest Common Subsequence',
    description: 'Given two strings text1 and text2, return the length of their longest common subsequence. A subsequence is a sequence derived from a string by deleting some or no elements.',
    company: ['Amazon', 'Google', 'Microsoft'],
    role: ['SDE-1', 'SDE-2'],
    stage: ['Round1'],
    topic: 'DP',
    pattern: '2D DP',
    difficulty: 'Medium',
    externalLink: 'https://leetcode.com/problems/longest-common-subsequence/',
    isInternal: false,
    frequency: 65,
    tags: ['dp', 'string-dp', '2d-dp'],
  },
  {
    title: 'Partition Equal Subset Sum',
    description: 'Given an integer array nums, return true if you can partition the array into two subsets such that the sum of the elements in both subsets is equal.',
    company: ['Amazon', 'Goldman Sachs', 'Samsung'],
    role: ['SDE-2'],
    stage: ['Round1', 'Round2'],
    topic: 'DP',
    pattern: '0/1 Knapsack',
    difficulty: 'Medium',
    externalLink: 'https://leetcode.com/problems/partition-equal-subset-sum/',
    isInternal: false,
    frequency: 60,
    tags: ['dp', 'knapsack', 'subset'],
  },

  // ── Linked Lists ──────────────────────────────────────────────────────────
  {
    title: 'LRU Cache',
    description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache — O(1) get and O(1) put operations.',
    company: ['Amazon', 'Microsoft', 'Flipkart', 'Ola'],
    role: ['SDE-2', 'SDE-3'],
    stage: ['Round1', 'Round2'],
    topic: 'Linked Lists',
    pattern: 'HashMap + Doubly Linked List',
    difficulty: 'Medium',
    externalLink: 'https://leetcode.com/problems/lru-cache/',
    isInternal: false,
    frequency: 76,
    tags: ['design', 'linked-list', 'hash-map'],
  },
  {
    title: 'Merge K Sorted Lists',
    description: 'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.',
    company: ['Amazon', 'Google', 'Meta', 'Uber'],
    role: ['SDE-2', 'SDE-3'],
    stage: ['Round2'],
    topic: 'Linked Lists',
    pattern: 'Min Heap',
    difficulty: 'Hard',
    externalLink: 'https://leetcode.com/problems/merge-k-sorted-lists/',
    isInternal: false,
    frequency: 65,
    tags: ['heap', 'linked-list', 'hard'],
  },

  // ── Design ────────────────────────────────────────────────────────────────
  {
    title: 'Design URL Shortener (System Design)',
    description: 'Design a URL shortening service like bit.ly. Consider scalability, read/write ratio, database design, hashing strategy, analytics, and cache layer.',
    company: ['Amazon', 'Google', 'Uber', 'Swiggy', 'Zomato'],
    role: ['SDE-2', 'SDE-3'],
    stage: ['Round2', 'HR'],
    topic: 'System Design',
    pattern: 'Distributed Systems',
    difficulty: 'Medium',
    isInternal: true,
    frequency: 80,
    tags: ['system-design', 'scalability', 'hashing'],
  },
  {
    title: 'Design Notification System (System Design)',
    description: 'Design a scalable push notification system that supports millions of users with SMS, email, and push notifications. Handle retries, throttling, and delivery guarantees.',
    company: ['Amazon', 'Meta', 'Swiggy', 'Flipkart'],
    role: ['SDE-2', 'SDE-3'],
    stage: ['Round2'],
    topic: 'System Design',
    pattern: 'Message Queue / Event-Driven',
    difficulty: 'Hard',
    isInternal: true,
    frequency: 58,
    tags: ['system-design', 'message-queue', 'reliability'],
  },

  // ── Behavioral / HR ───────────────────────────────────────────────────────
  {
    title: 'Leadership Principle: Customer Obsession (Amazon)',
    description: 'Describe a situation where you made a decision that prioritized the customer even when it was difficult. Use the STAR method.',
    company: ['Amazon'],
    role: ['SDE-1', 'SDE-2', 'SDE-3'],
    stage: ['HR'],
    topic: 'Behavioral',
    pattern: 'STAR Method',
    difficulty: 'Medium',
    isInternal: true,
    frequency: 90,
    tags: ['behavioral', 'amazon-lp', 'hr'],
  },
  {
    title: 'Conflict Resolution (Behavioral)',
    description: 'Tell me about a time you had a conflict with a team member or manager and how you resolved it. Follow the STAR framework.',
    company: ['Amazon', 'Google', 'Microsoft', 'Meta'],
    role: ['SDE-1', 'SDE-2', 'SDE-3'],
    stage: ['HR'],
    topic: 'Behavioral',
    pattern: 'STAR Method',
    difficulty: 'Medium',
    isInternal: true,
    frequency: 75,
    tags: ['behavioral', 'hr', 'soft-skills'],
  },
]

// ── Seed Function ─────────────────────────────────────────────────────────────
const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Connected to MongoDB')

    // Clear existing questions
    await Question.deleteMany({})
    console.log('🗑️  Cleared existing questions\n')

    // Insert without embeddings first (fail-safe)
    const inserted = await Question.insertMany(
      seedQuestions.map((q) => ({ ...q, embedding: undefined }))
    )
    console.log(`📝 Inserted ${inserted.length} questions (without embeddings)`)

    // Check if GEMINI_API_KEY is set before trying to embed
    if (!process.env.GEMINI_API_KEY) {
      console.warn('\n⚠️  GEMINI_API_KEY not set — skipping embedding generation.')
      console.warn('   Set GEMINI_API_KEY in .env and re-run `npm run seed` to add embeddings.\n')
    } else {
      console.log('\n🔮 Generating embeddings in batches of 10...')
      // Use embedInBatches — processes 10 at a time with 1s pause between batches
      await embedInBatches(inserted, 10)
    }

    console.log('\n✅ Seeding complete!')
    console.log('─'.repeat(50))
    console.log('📌 NEXT STEP: Create a Vector Search Index in MongoDB Atlas UI:')
    console.log('   Collection: questions')
    console.log('   Index Name: vector_index')
    console.log('   Field:      embedding')
    console.log('   Dimensions: 768')
    console.log('   Similarity: cosine')
    console.log('─'.repeat(50))

  } catch (error) {
    console.error('❌ Seed error:', error.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

seed()
