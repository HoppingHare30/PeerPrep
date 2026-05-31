export interface FallbackQuestion {
  id: string;
  title: string;
  bruteForce: string;
  optimal: string;
  timeComplexity: string;
  spaceComplexity: string;
}

export const COMPANY_FALLBACK_QUESTIONS: Record<string, FallbackQuestion[]> = {
  Netflix: [
    {
      id: "146",
      title: "LRU Cache",
      bruteForce: "Simulate cache using a list or array. Searching takes O(N) time and eviction requires shifting elements.",
      optimal: "Combine a Doubly Linked List (for O(1) node reordering) with a Hash Map (for O(1) node lookup).",
      timeComplexity: "O(1) for both get and put operations",
      spaceComplexity: "O(C) where C is the maximum cache capacity"
    },
    {
      id: "56",
      title: "Merge Intervals",
      bruteForce: "Compare each interval with every other interval in the collection to check for overlaps and merge recursively.",
      optimal: "Sort intervals by start times, then traverse linearly and merge overlapping intervals into the result list.",
      timeComplexity: "O(N log N) dominated by sorting the intervals",
      spaceComplexity: "O(N) to store sorted intervals, or O(log N) auxiliary space for sorting"
    },
    {
      id: "253",
      title: "Meeting Rooms II",
      bruteForce: "Compare every meeting with all other meetings to count overlaps, requiring nested comparisons.",
      optimal: "Sort start and end times separately. Use two pointers or a Min-Heap to track active rooms dynamically as meetings start and end.",
      timeComplexity: "O(N log N) to sort the meeting start and end times",
      spaceComplexity: "O(N) to store elements in the min-heap or sorted arrays"
    },
    {
      id: "49",
      title: "Group Anagrams",
      bruteForce: "Compare each string with every other string by checking if they are anagrams of each other.",
      optimal: "Use a Hash Map where the key is a character frequency array (or sorted string) and the value is a list of anagrams.",
      timeComplexity: "O(N * K) where N is the number of strings and K is the maximum length of a string",
      spaceComplexity: "O(N * K) to store the groups in the hash map"
    },
    {
      id: "41",
      title: "First Missing Positive",
      bruteForce: "Sort the array and scan linearly, or store all numbers in a hash set and query numbers from 1 upwards.",
      optimal: "Apply cycle sort: place each number x at index x-1 if x is in the range [1, N]. Then find the first index where nums[i] !== i + 1.",
      timeComplexity: "O(N) as each number is visited or placed at most twice",
      spaceComplexity: "O(1) auxiliary space by performing in-place swaps"
    }
  ],
  Google: [
    {
      id: "1",
      title: "Two Sum",
      bruteForce: "Double loop checking all pairs of elements to see if their sum matches the target.",
      optimal: "Traverse the array once while storing each visited number and its index in a hash map to look up the complement.",
      timeComplexity: "O(N) time complexity with a single traversal",
      spaceComplexity: "O(N) space complexity to store elements in the hash map"
    },
    {
      id: "3",
      title: "Longest Substring Without Repeating Characters",
      bruteForce: "Check all possible substrings and verify if all characters in each substring are unique.",
      optimal: "Use a sliding window with two pointers. Expand the right pointer and use a hash map/set to track character indices to shrink the left pointer.",
      timeComplexity: "O(N) where N is the length of the string",
      spaceComplexity: "O(min(M, N)) where M is the character set size"
    },
    {
      id: "11",
      title: "Container With Most Water",
      bruteForce: "Evaluate the water capacity for every possible pair of lines and track the maximum capacity.",
      optimal: "Use two pointers, one at each end of the array. Calculate area, then move the pointer pointing to the shorter line inward.",
      timeComplexity: "O(N) with a single pass through the array",
      spaceComplexity: "O(1) auxiliary space"
    },
    {
      id: "34",
      title: "Find First and Last Position of Element in Sorted Array",
      bruteForce: "Scan the array linearly from left to right to find the first and last occurrences of the target.",
      optimal: "Run binary search twice: once to find the leftmost boundary of the target, and once to find the rightmost boundary.",
      timeComplexity: "O(log N) search time",
      spaceComplexity: "O(1) auxiliary space"
    },
    {
      id: "4",
      title: "Median of Two Sorted Arrays",
      bruteForce: "Merge the two sorted arrays into one large sorted array, then return the middle element(s).",
      optimal: "Perform a binary search on the partitions of the smaller array to align elements such that the left half is less than or equal to the right half.",
      timeComplexity: "O(log(min(M, N))) where M and N are array lengths",
      spaceComplexity: "O(1) auxiliary space"
    }
  ],
  Amazon: [
    {
      id: "200",
      title: "Number of Islands",
      bruteForce: "Examine every cell and perform a full search of its neighbors, keeping a global list of visited cells.",
      optimal: "Traverse the grid. For each unvisited '1', trigger DFS or BFS to mark all connected '1's as visited ('0') in-place.",
      timeComplexity: "O(M * N) where M and N are grid dimensions",
      spaceComplexity: "O(M * N) worst-case recursion stack (DFS) or queue (BFS)"
    },
    {
      id: "973",
      title: "K Closest Points to Origin",
      bruteForce: "Calculate distances for all points, sort the array based on distances, and return the first K points.",
      optimal: "Utilize a Max-Heap of size K. Iterate through the points; if the heap exceeds size K, pop the farthest point. Alternatively, use Quickselect.",
      timeComplexity: "O(N log K) using a max-heap, or O(N) average-case using Quickselect",
      spaceComplexity: "O(K) to store the closest points in the heap"
    },
    {
      id: "937",
      title: "Reorder Log Files",
      bruteForce: "Manually extract identifiers, sort letter logs and digit logs separately, then combine.",
      optimal: "Use a custom comparator to sort logs. Separate letter-logs and digit-logs, sort letter-logs lexicographically (ties broken by identifier), and maintain original digit-log order.",
      timeComplexity: "O(M * N log N) where N is the number of logs and M is the maximum length of a log",
      spaceComplexity: "O(M * N) to store partitioned logs"
    },
    {
      id: "1",
      title: "Two Sum",
      bruteForce: "Double loop checking all pairs of elements to see if their sum matches the target.",
      optimal: "Traverse the array once while storing each visited number and its index in a hash map to look up the complement.",
      timeComplexity: "O(N) time complexity with a single traversal",
      spaceComplexity: "O(N) space complexity to store elements in the hash map"
    },
    {
      id: "1481",
      title: "Least Number of Unique Integers after K Removals",
      bruteForce: "Count frequencies, sort frequencies, and repeatedly decrement K by the lowest frequency until K is exhausted.",
      optimal: "Create a frequency map, count frequencies, sort frequencies in ascending order. Remove elements with the lowest frequency first.",
      timeComplexity: "O(N log N) due to sorting frequencies",
      spaceComplexity: "O(N) to store frequencies in a map"
    }
  ],
  Microsoft: [
    {
      id: "1822",
      title: "Sign of the Product of an Array",
      bruteForce: "Multiply all numbers in the array together and determine the sign of the resulting value.",
      optimal: "Iterate through the array and count the number of negative numbers. If any number is 0, return 0. If negatives count is odd, return -1, else 1.",
      timeComplexity: "O(N) with a single traversal",
      spaceComplexity: "O(1) auxiliary space"
    },
    {
      id: "1290",
      title: "Convert Binary Number in a Linked List to Integer",
      bruteForce: "Traverse the list to store binary digits, then convert the binary string to a base-10 integer.",
      optimal: "Traverse the linked list linearly and build the integer using bitwise operations: result = (result << 1) | node.val.",
      timeComplexity: "O(N) time complexity",
      spaceComplexity: "O(1) auxiliary space"
    },
    {
      id: "443",
      title: "String Compression",
      bruteForce: "Iterate through the string, build a new compressed string, and copy it back to the original array.",
      optimal: "Use two pointers: a read pointer to scan and count consecutive duplicates, and a write pointer to modify the array in-place.",
      timeComplexity: "O(N) with a single pass",
      spaceComplexity: "O(1) auxiliary space"
    },
    {
      id: "20",
      title: "Valid Parentheses",
      bruteForce: "Repeatedly replace adjacent matching brackets pairs () [] {} with empty strings until no more can be replaced.",
      optimal: "Use a Stack. Push opening brackets onto the stack. For closing brackets, pop the top of the stack and check if it matches.",
      timeComplexity: "O(N) time complexity",
      spaceComplexity: "O(N) space complexity"
    },
    {
      id: "206",
      title: "Reverse Linked List",
      bruteForce: "Extract all nodes' values into an array, reverse the array, and reconstruct the linked list.",
      optimal: "Iterate through the list, changing each node's next pointer to point to its predecessor (prev) using a temporary variable.",
      timeComplexity: "O(N) time complexity",
      spaceComplexity: "O(1) auxiliary space"
    }
  ],
  Facebook: [
    {
      id: "560",
      title: "Subarray Sum Equals K",
      bruteForce: "Check the sum of every possible subarray using nested loops. O(N^2) time complexity.",
      optimal: "Use a Hash Map to store cumulative sum frequencies. If (cumulative_sum - K) exists in the map, add its frequency to the count.",
      timeComplexity: "O(N) with a single pass through the array",
      spaceComplexity: "O(N) to store cumulative sums in the hash map"
    },
    {
      id: "938",
      title: "Range Sum of BST",
      bruteForce: "Perform a full tree traversal (DFS or BFS) and sum up all node values that fall within the [low, high] range.",
      optimal: "DFS traversal leveraging BST properties. Only traverse left subtree if node.val > low, and right subtree if node.val < high.",
      timeComplexity: "O(N) where N is the number of nodes in the tree",
      spaceComplexity: "O(H) recursion stack where H is the tree height"
    },
    {
      id: "238",
      title: "Product of Array Except Self",
      bruteForce: "Calculate the total product of all elements, then divide by each element. Fails if 0 is present.",
      optimal: "Construct prefix products in the output array, then traverse backwards to accumulate suffix products in a single integer variable.",
      timeComplexity: "O(N) time complexity with two passes",
      spaceComplexity: "O(1) auxiliary space (excluding the output array)"
    },
    {
      id: "314",
      title: "Binary Tree Vertical Order Traversal",
      bruteForce: "Perform DFS, track coordinates, sort all nodes first by column index and then by row index.",
      optimal: "Use BFS with a Queue storing nodes and their column indices. Use a TreeMap or a hash map with column boundaries to group nodes.",
      timeComplexity: "O(N) or O(N log N)",
      spaceComplexity: "O(N) to store nodes in the map and queues"
    },
    {
      id: "1249",
      title: "Minimum Remove to Make Valid Parentheses",
      bruteForce: "Generate all matching combinations or use multiple array copy scans to clean invalid brackets.",
      optimal: "Use a Stack to track indices of open parentheses. Scan string; for invalid close brackets, mark them. Pop remaining indices of open brackets. Rebuild string ignoring marked indices.",
      timeComplexity: "O(N) time complexity",
      spaceComplexity: "O(N) space complexity"
    }
  ],
  Apple: [
    {
      id: "1",
      title: "Two Sum",
      bruteForce: "Double loop checking all pairs of elements to see if their sum matches the target.",
      optimal: "Traverse the array once while storing each visited number and its index in a hash map to look up the complement.",
      timeComplexity: "O(N) time complexity with a single traversal",
      spaceComplexity: "O(N) space complexity to store elements in the hash map"
    },
    {
      id: "7",
      title: "Reverse Integer",
      bruteForce: "Convert the integer to a string, reverse the string, and convert it back to an integer, checking for 32-bit overflow.",
      optimal: "Pop digits from the number and push them onto the result: result = result * 10 + digit. Check for 32-bit integer overflow at each step.",
      timeComplexity: "O(log10(N)) time complexity",
      spaceComplexity: "O(1) auxiliary space"
    },
    {
      id: "15",
      title: "3Sum",
      bruteForce: "Use three nested loops to check every triplet. O(N^3) time complexity.",
      optimal: "Sort the array. Iterate through, fixing one number, and use a two-pointer approach for the remaining numbers, skipping duplicates.",
      timeComplexity: "O(N^2) time complexity",
      spaceComplexity: "O(log N) to O(N) space depending on sorting implementation"
    },
    {
      id: "100",
      title: "Same Tree",
      bruteForce: "Serialize both trees into arrays and compare the arrays.",
      optimal: "Recursively check if roots match, then verify p.left == q.left and p.right == q.right.",
      timeComplexity: "O(N) where N is the number of nodes in the trees",
      spaceComplexity: "O(H) recursion stack where H is the tree height"
    },
    {
      id: "53",
      title: "Maximum Subarray",
      bruteForce: "Calculate the sum of all possible subarrays using nested loops and track the maximum. O(N^2).",
      optimal: "Use Kadane's Algorithm. Keep track of the current subarray sum and the global maximum. Reset current sum to 0 if it goes negative.",
      timeComplexity: "O(N) with a single pass through the array",
      spaceComplexity: "O(1) auxiliary space"
    }
  ],
  Uber: [
    {
      id: "200",
      title: "Number of Islands",
      bruteForce: "Examine every cell and perform a full search of its neighbors, keeping a global list of visited cells.",
      optimal: "Traverse the grid. For each unvisited '1', trigger DFS or BFS to mark all connected '1's as visited ('0') in-place.",
      timeComplexity: "O(M * N) where M and N are grid dimensions",
      spaceComplexity: "O(M * N) worst-case recursion stack (DFS) or queue (BFS)"
    },
    {
      id: "253",
      title: "Meeting Rooms II",
      bruteForce: "Compare every meeting with all other meetings to count overlaps, requiring nested comparisons.",
      optimal: "Sort start and end times separately. Use two pointers or a Min-Heap to track active rooms dynamically as meetings start and end.",
      timeComplexity: "O(N log N) to sort the meeting start and end times",
      spaceComplexity: "O(N) to store elements in the min-heap or sorted arrays"
    },
    {
      id: "692",
      title: "Top K Frequent Words",
      bruteForce: "Count word frequencies, sort all words by frequency descending (and lexicographically on tie), and slice K.",
      optimal: "Use a Hash Map for frequencies, then insert words into a Custom Min-Heap of size K. Maintain frequency ordering and reverse lexicographical order.",
      timeComplexity: "O(N log K) time complexity",
      spaceComplexity: "O(N) to store word frequencies in a hash map"
    },
    {
      id: "10",
      title: "Regular Expression Matching",
      bruteForce: "Use brute-force backtracking to match characters and handle '*' wildcards, causing exponential complexity.",
      optimal: "Use Dynamic Programming (DP) with a 2D boolean grid. Define dp[i][j] as the match result for text[i:] and pattern[j:].",
      timeComplexity: "O(T * P) where T and P are text and pattern lengths",
      spaceComplexity: "O(T * P) space to store the DP table"
    },
    {
      id: "212",
      title: "Word Search II",
      bruteForce: "Perform standard backtracking word search DFS for each query word independently, leading to repeated traversals.",
      optimal: "Insert all search words into a Trie (Prefix Tree). Perform DFS starting from each board cell, matching prefixes in the Trie in-place.",
      timeComplexity: "O(M * N * 4^(L)) where M * N is board size and L is maximum word length",
      spaceComplexity: "O(W * L) to store words in the Trie"
    }
  ],
  Airbnb: [
    {
      id: "251",
      title: "Flatten 2D Vector",
      bruteForce: "Copy all elements of the 2D vector into a flat 1D array during initialization.",
      optimal: "Maintain row and column pointers. Advance the row pointer whenever the column pointer reaches the end of the current row.",
      timeComplexity: "O(1) average time for next() and hasNext()",
      spaceComplexity: "O(1) auxiliary space"
    },
    {
      id: "336",
      title: "Palindrome Pairs",
      bruteForce: "Check every possible concatenation of pairs and verify if it forms a palindrome. O(N^2 * K) time.",
      optimal: "Use a Hash Map of word suffixes/prefixes. For each word, split it into prefix and suffix; if one is a palindrome, look up the reverse of the other in the map.",
      timeComplexity: "O(N * K^2) where N is number of words and K is max word length",
      spaceComplexity: "O(N * K) to store words in the hash map"
    },
    {
      id: "755",
      title: "Pour Water",
      bruteForce: "Scan repeatedly left and right for each droplet to locate the lowest resting position.",
      optimal: "Simulate each droplet. Scan left to find the lowest index where height strictly decreases. If not found, scan right. If found, increment height there; else increment source.",
      timeComplexity: "O(V * N) where V is the volume of water and N is the array length",
      spaceComplexity: "O(1) auxiliary space"
    },
    {
      id: "269",
      title: "Alien Dictionary",
      bruteForce: "Generate all order permutations of characters and check consistency against the sorted word list.",
      optimal: "Build a Directed Graph representing character precedents from adjacent sorted words. Perform topological sort using DFS or Kahn's Algorithm.",
      timeComplexity: "O(C) where C is the total length of all words in the input",
      spaceComplexity: "O(V + E) where V is unique chars and E is relationship constraints"
    },
    {
      id: "526",
      title: "Beautiful Arrangement",
      bruteForce: "Generate all permutations of numbers from 1 to N and verify if each permutation is beautiful.",
      optimal: "Use backtracking. Placed numbers from 1 to N at index `pos`. Only recurse if the current number divides `pos` or `pos` divides the number.",
      timeComplexity: "O(K) where K is the number of beautiful arrangements",
      spaceComplexity: "O(N) recursion stack height"
    }
  ],
  Twitter: [
    {
      id: "635",
      title: "Design Log Storage System",
      bruteForce: "Store logs as a list of raw string values and filter linearly using date parsing for each retrieval.",
      optimal: "Store logs in a sorted map or list. Convert timestamps to clean strings and truncate them based on the requested granularity for range matching.",
      timeComplexity: "O(N) for retrieval and O(1) for put",
      spaceComplexity: "O(N) to store log entries"
    },
    {
      id: "355",
      title: "Design Twitter",
      bruteForce: "Perform linear scans and global sorting of all tweets in the database for each user feed generation.",
      optimal: "Use Hash Maps to track followers and user tweets. Generate feeds by fetching the most recent tweets from followed users, merged using a Priority Queue.",
      timeComplexity: "O(1) for tweet/follow, O(F log T) for getNewsFeed where F is followees and T is tweets per followee",
      spaceComplexity: "O(U + T) where U is users and T is total tweets"
    },
    {
      id: "380",
      title: "Insert Delete GetRandom O(1)",
      bruteForce: "Use a simple array or set. Deletions or random selections take O(N) due to element shifting.",
      optimal: "Combine a dynamic Array/List (for O(1) index-based random lookup) and a Hash Map (mapping value to its array index for O(1) delete/find). Swap deleted elements to the end of the array.",
      timeComplexity: "O(1) average time for insert, delete, and getRandom",
      spaceComplexity: "O(N) to store N elements"
    },
    {
      id: "308",
      title: "Range Sum Query 2D - Mutable",
      bruteForce: "Calculate 2D range sums dynamically by iterating over rows and columns for each query. O(M * N) query.",
      optimal: "Use a 2D Binary Indexed Tree (Fenwick Tree) or Segment Tree to handle updates and region queries efficiently.",
      timeComplexity: "O(log M * log N) for both update and query operations",
      spaceComplexity: "O(M * N) to store the 2D tree structure"
    },
    {
      id: "53",
      title: "Maximum Subarray",
      bruteForce: "Calculate the sum of all possible subarrays using nested loops and track the maximum. O(N^2).",
      optimal: "Use Kadane's Algorithm. Keep track of the current subarray sum and the global maximum. Reset current sum to 0 if it goes negative.",
      timeComplexity: "O(N) with a single pass through the array",
      spaceComplexity: "O(1) auxiliary space"
    }
  ],
  LinkedIn: [
    {
      id: "1000",
      title: "Retain Best Cache",
      bruteForce: "Evict elements arbitrarily or run sorting over all elements' ranks whenever cache capacity is exceeded.",
      optimal: "Maintain elements in a Hash Map. Track rankings using a balanced BST (TreeMap) or Priority Queue to evict the lowest-ranked elements in O(log N).",
      timeComplexity: "O(log N) for inserts/evictions",
      spaceComplexity: "O(Capacity) to store cache entries"
    },
    {
      id: "605",
      title: "Can Place Flowers",
      bruteForce: "Generate combinations or try placing flowers at all permutations of indices.",
      optimal: "Iterate through the flowerbed array. If a cell is empty (0) and both its left and right neighbors are empty (or boundary), place a flower (1) and decrement N.",
      timeComplexity: "O(N) with a single traversal",
      spaceComplexity: "O(1) auxiliary space"
    },
    {
      id: "243",
      title: "Shortest Word Distance",
      bruteForce: "Compare every occurrence of word1 with every occurrence of word2 using nested loops to find the minimum index difference.",
      optimal: "Iterate through the words array once, tracking the most recent indices of word1 and word2. Calculate and update the minimum distance on each match.",
      timeComplexity: "O(N) with a single pass",
      spaceComplexity: "O(1) auxiliary space"
    },
    {
      id: "366",
      title: "Find Leaves of Binary Tree",
      bruteForce: "Repeatedly traverse the tree, locate leaf nodes, add them to a list, and delete them from the tree until it becomes empty.",
      optimal: "DFS traversal calculating the height of each node from the bottom (leaves are height 0). Group nodes of the same height in the output list.",
      timeComplexity: "O(N) where N is the number of nodes in the tree",
      spaceComplexity: "O(N) to store lists and the recursion stack"
    },
    {
      id: "339",
      title: "Nested List Weight Sum",
      bruteForce: "Flatten list elements first and store depth relationships, then iterate to calculate sum.",
      optimal: "Recursively traverse the nested list, passing the current depth as a parameter. Multiply each integer by its depth and sum it up.",
      timeComplexity: "O(N) where N is the total number of nested elements",
      spaceComplexity: "O(D) recursion stack height where D is the maximum depth"
    }
  ]
};
