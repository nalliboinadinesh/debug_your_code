/**
 * Comprehensive 5-Level Data Structures Taxonomy and Sanitization Utilities
 */

export interface DataStructureCategory {
  level: number;
  levelTitle: string;
  typeName: string;
  color: string;
  badgeBg: string;
  borderColor: string;
}

export const DS_TAXONOMY: Record<string, DataStructureCategory> = {
  // Level 1: Basic data structures
  array: {
    level: 1,
    levelTitle: 'Level 1: Basic Data Structures',
    typeName: 'Array',
    color: '#38bdf8', // Sky
    badgeBg: 'bg-sky-500/15 text-sky-300',
    borderColor: 'border-sky-500/30',
  },
  vector: {
    level: 1,
    levelTitle: 'Level 1: Basic Data Structures',
    typeName: 'Vector (std::vector)',
    color: '#06b6d4', // Cyan
    badgeBg: 'bg-cyan-500/15 text-cyan-300',
    borderColor: 'border-cyan-500/30',
  },
  string: {
    level: 1,
    levelTitle: 'Level 1: Basic Data Structures',
    typeName: 'String (std::string)',
    color: '#38bdf8',
    badgeBg: 'bg-sky-500/15 text-sky-300',
    borderColor: 'border-sky-500/30',
  },
  pair: {
    level: 1,
    levelTitle: 'Level 1: Basic Data Structures',
    typeName: 'Pair (std::pair)',
    color: '#a855f7', // Purple
    badgeBg: 'bg-purple-500/15 text-purple-300',
    borderColor: 'border-purple-500/30',
  },
  matrix: {
    level: 1,
    levelTitle: 'Level 1: Basic Data Structures',
    typeName: 'Matrix (2D Array / Vector)',
    color: '#0ea5e9',
    badgeBg: 'bg-sky-600/15 text-sky-200',
    borderColor: 'border-sky-600/30',
  },

  // Level 2: Linear data structures
  linked_list: {
    level: 2,
    levelTitle: 'Level 2: Linear Data Structures',
    typeName: 'Linked List (Singly / Doubly)',
    color: '#10b981', // Emerald
    badgeBg: 'bg-emerald-500/15 text-emerald-300',
    borderColor: 'border-emerald-500/30',
  },
  stack: {
    level: 2,
    levelTitle: 'Level 2: Linear Data Structures',
    typeName: 'Stack (std::stack / LIFO)',
    color: '#14b8a6', // Teal
    badgeBg: 'bg-teal-500/15 text-teal-300',
    borderColor: 'border-teal-500/30',
  },
  queue: {
    level: 2,
    levelTitle: 'Level 2: Linear Data Structures',
    typeName: 'Queue (std::queue / FIFO)',
    color: '#2dd4bf',
    badgeBg: 'bg-teal-400/15 text-teal-200',
    borderColor: 'border-teal-400/30',
  },
  deque: {
    level: 2,
    levelTitle: 'Level 2: Linear Data Structures',
    typeName: 'Deque (std::deque / Double-Ended)',
    color: '#0d9488',
    badgeBg: 'bg-teal-600/15 text-teal-200',
    borderColor: 'border-teal-600/30',
  },
  circular_queue: {
    level: 2,
    levelTitle: 'Level 2: Linear Data Structures',
    typeName: 'Circular Queue',
    color: '#14b8a6',
    badgeBg: 'bg-teal-500/15 text-teal-300',
    borderColor: 'border-teal-500/30',
  },

  // Level 3: Associative and hashing structures
  map: {
    level: 3,
    levelTitle: 'Level 3: Associative & Hashing Structures',
    typeName: 'Map (std::map / Red-Black Tree)',
    color: '#f59e0b', // Amber
    badgeBg: 'bg-amber-500/15 text-amber-300',
    borderColor: 'border-amber-500/30',
  },
  multimap: {
    level: 3,
    levelTitle: 'Level 3: Associative & Hashing Structures',
    typeName: 'Multimap (std::multimap)',
    color: '#f59e0b',
    badgeBg: 'bg-amber-500/15 text-amber-300',
    borderColor: 'border-amber-500/30',
  },
  set: {
    level: 3,
    levelTitle: 'Level 3: Associative & Hashing Structures',
    typeName: 'Set (std::set / Balanced BST)',
    color: '#eab308', // Yellow
    badgeBg: 'bg-yellow-500/15 text-yellow-300',
    borderColor: 'border-yellow-500/30',
  },
  multiset: {
    level: 3,
    levelTitle: 'Level 3: Associative & Hashing Structures',
    typeName: 'Multiset (std::multiset)',
    color: '#eab308',
    badgeBg: 'bg-yellow-500/15 text-yellow-300',
    borderColor: 'border-yellow-500/30',
  },
  unordered_map: {
    level: 3,
    levelTitle: 'Level 3: Associative & Hashing Structures',
    typeName: 'Unordered Map (std::unordered_map / Hash Table)',
    color: '#f97316', // Orange
    badgeBg: 'bg-orange-500/15 text-orange-300',
    borderColor: 'border-orange-500/30',
  },
  unordered_set: {
    level: 3,
    levelTitle: 'Level 3: Associative & Hashing Structures',
    typeName: 'Unordered Set (std::unordered_set / Hash Table)',
    color: '#fb923c',
    badgeBg: 'bg-orange-400/15 text-orange-200',
    borderColor: 'border-orange-400/30',
  },
  unordered_multimap: {
    level: 3,
    levelTitle: 'Level 3: Associative & Hashing Structures',
    typeName: 'Unordered Multimap',
    color: '#f97316',
    badgeBg: 'bg-orange-500/15 text-orange-300',
    borderColor: 'border-orange-500/30',
  },
  unordered_multiset: {
    level: 3,
    levelTitle: 'Level 3: Associative & Hashing Structures',
    typeName: 'Unordered Multiset',
    color: '#fb923c',
    badgeBg: 'bg-orange-400/15 text-orange-200',
    borderColor: 'border-orange-400/30',
  },

  // Level 4: Non-linear data structures
  tree: {
    level: 4,
    levelTitle: 'Level 4: Non-linear Data Structures',
    typeName: 'Binary Tree / Tree',
    color: '#8b5cf6', // Violet
    badgeBg: 'bg-violet-500/15 text-violet-300',
    borderColor: 'border-violet-500/30',
  },
  bst: {
    level: 4,
    levelTitle: 'Level 4: Non-linear Data Structures',
    typeName: 'Binary Search Tree (BST)',
    color: '#a78bfa',
    badgeBg: 'bg-violet-400/15 text-violet-200',
    borderColor: 'border-violet-400/30',
  },
  heap: {
    level: 4,
    levelTitle: 'Level 4: Non-linear Data Structures',
    typeName: 'Heap / Priority Queue (std::priority_queue)',
    color: '#ec4899', // Pink
    badgeBg: 'bg-pink-500/15 text-pink-300',
    borderColor: 'border-pink-500/30',
  },
  trie: {
    level: 4,
    levelTitle: 'Level 4: Non-linear Data Structures',
    typeName: 'Trie (Prefix Tree)',
    color: '#d946ef', // Fuchsia
    badgeBg: 'bg-fuchsia-500/15 text-fuchsia-300',
    borderColor: 'border-fuchsia-500/30',
  },
  graph: {
    level: 4,
    levelTitle: 'Level 4: Non-linear Data Structures',
    typeName: 'Graph (Adjacency List / Matrix)',
    color: '#6366f1', // Indigo
    badgeBg: 'bg-indigo-500/15 text-indigo-300',
    borderColor: 'border-indigo-500/30',
  },

  // Level 5: Advanced data structures
  segment_tree: {
    level: 5,
    levelTitle: 'Level 5: Advanced Data Structures',
    typeName: 'Segment Tree',
    color: '#ef4444', // Red
    badgeBg: 'bg-red-500/15 text-red-300',
    borderColor: 'border-red-500/30',
  },
  fenwick_tree: {
    level: 5,
    levelTitle: 'Level 5: Advanced Data Structures',
    typeName: 'Fenwick Tree (Binary Indexed Tree / BIT)',
    color: '#f43f5e', // Rose
    badgeBg: 'bg-rose-500/15 text-rose-300',
    borderColor: 'border-rose-500/30',
  },
  dsu: {
    level: 5,
    levelTitle: 'Level 5: Advanced Data Structures',
    typeName: 'Disjoint Set Union (DSU / Union-Find)',
    color: '#fb7185',
    badgeBg: 'bg-rose-400/15 text-rose-200',
    borderColor: 'border-rose-400/30',
  },
  sparse_table: {
    level: 5,
    levelTitle: 'Level 5: Advanced Data Structures',
    typeName: 'Sparse Table (Static RMQ)',
    color: '#f43f5e',
    badgeBg: 'bg-rose-500/15 text-rose-300',
    borderColor: 'border-rose-500/30',
  },
  monotonic_stack: {
    level: 5,
    levelTitle: 'Level 5: Advanced Data Structures',
    typeName: 'Monotonic Stack',
    color: '#e11d48',
    badgeBg: 'bg-rose-600/15 text-rose-200',
    borderColor: 'border-rose-600/30',
  },
  monotonic_queue: {
    level: 5,
    levelTitle: 'Level 5: Advanced Data Structures',
    typeName: 'Monotonic Queue',
    color: '#e11d48',
    badgeBg: 'bg-rose-600/15 text-rose-200',
    borderColor: 'border-rose-600/30',
  },
  order_statistic_tree: {
    level: 5,
    levelTitle: 'Level 5: Advanced Data Structures',
    typeName: 'Order Statistic Tree (Policy Based DS)',
    color: '#be123c',
    badgeBg: 'bg-rose-700/15 text-rose-200',
    borderColor: 'border-rose-700/30',
  },
};

/**
 * Checks whether a value represents uninitialized memory or stack garbage.
 */
export function isGarbageValue(val: any): boolean {
  if (val === null || val === undefined) return false;
  
  // String checks
  if (typeof val === 'string') {
    const s = val.trim();
    if (s.startsWith('@0x') || s.startsWith('0x') && s.length > 8) return true;
    if (s.includes('<error') || s.includes('uninitialized')) return true;
    if (s === '?' || s === '...') return false;
  }
  
  // Numeric checks: common uninitialized memory sentinel values in GDB/C++
  if (typeof val === 'number') {
    // Uninitialized memory in GCC / GDB stack frames
    if (val === 21845 || val === 1431654560 || val === -858993460 || val === 32767) return true;
    if (Math.abs(val) > 1000000000 && val !== 1000000007 && val !== 2147483647 && val !== -2147483648) {
      return true;
    }
  }

  return false;
}

/**
 * Sanitizes and formats a display value for visualizer boxes.
 * Suppresses garbage values completely so they never overlap adjacent boxes.
 */
export function formatDisplayValue(val: any, fallbackPlaceholder: string = ''): string {
  if (isGarbageValue(val)) {
    return fallbackPlaceholder;
  }
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    if (val.__isPair) {
      return `${val.first}, ${val.second}`;
    }
    return JSON.stringify(val);
  }
  return String(val);
}

/**
 * Classifies a variable name, value, and context into its exact 5-level category.
 */
export function classifyDataStructure(
  name: string,
  value: any,
  detectedList: string[] = []
): DataStructureCategory {
  const lowerName = name.toLowerCase();

  // 1. Check runtime object hints
  if (value && typeof value === 'object') {
    if (value.__isMap) {
      return value.type === 'unordered_map' ? DS_TAXONOMY.unordered_map : DS_TAXONOMY.map;
    }
    if (value.__isPair) {
      return DS_TAXONOMY.pair;
    }
    if (value.__isLinear) {
      if (value.type === 'stack') return DS_TAXONOMY.stack;
      if (value.type === 'queue') return DS_TAXONOMY.queue;
      if (value.type === 'deque') return DS_TAXONOMY.deque;
    }
  }

  // 2. Pair detection by name or structure
  if (lowerName === 'it' || lowerName.includes('pair') || (Array.isArray(value) && value.length === 2 && typeof value[0] === 'string' && value[0].includes('first ='))) {
    return DS_TAXONOMY.pair;
  }

  // 3. Name-based or content-based detection
  if (lowerName.includes('unorder') && lowerName.includes('map')) return DS_TAXONOMY.unordered_map;
  if (lowerName.includes('unorder') && lowerName.includes('set')) return DS_TAXONOMY.unordered_set;
  if (lowerName.includes('map') || lowerName.includes('freq') || lowerName.includes('count')) return DS_TAXONOMY.map;
  if (lowerName.includes('set') || lowerName.includes('seen') || lowerName.includes('visited')) return DS_TAXONOMY.set;
  if (lowerName.includes('stack') || lowerName === 'st') return DS_TAXONOMY.stack;
  if (lowerName.includes('queue') || lowerName === 'q') return DS_TAXONOMY.queue;
  if (lowerName.includes('deque') || lowerName === 'dq') return DS_TAXONOMY.deque;
  if (lowerName.includes('heap') || lowerName.includes('pq') || lowerName.includes('priority')) return DS_TAXONOMY.heap;
  if (lowerName.includes('tree') || lowerName.includes('root') || lowerName.includes('node')) return DS_TAXONOMY.tree;
  if (lowerName.includes('adj') || lowerName.includes('graph')) return DS_TAXONOMY.graph;
  if (lowerName.includes('dsu') || lowerName.includes('parent')) return DS_TAXONOMY.dsu;
  if (lowerName.includes('seg') || lowerName.includes('tree4')) return DS_TAXONOMY.segment_tree;
  if (lowerName.includes('bit') || lowerName.includes('fenwick')) return DS_TAXONOMY.fenwick_tree;

  // 4. Matrix (2D array/vector)
  if (Array.isArray(value) && value.length > 0 && Array.isArray(value[0])) {
    return DS_TAXONOMY.matrix;
  }

  // 5. Default vector or array
  if (detectedList.includes('vector')) return DS_TAXONOMY.vector;
  return DS_TAXONOMY.array;
}
