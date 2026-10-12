export interface CodeExample {
  id: string;
  title: string;
  category: 'Loops' | 'Sorting' | 'Searching' | 'Patterns' | 'Recursion';
  code: string;
  stdin: string;
  description: string;
}

export const CODE_EXAMPLES: CodeExample[] = [
  {
    id: 'array-loop-unit',
    title: 'Array Loop (i++)',
    category: 'Loops',
    description: 'Linear traversal across elements with unit increment i++',
    stdin: '',
    code: `#include <iostream>

int main() {
    int arr[6] = {7, 2, 9, 4, 6, 1};
    int total = 0;
    
    // Visit each element linearly
    for (int i = 0; i < 6; i++) {
        total += arr[i];
        std::cout << "Element: " << arr[i] << ", Running Total: " << total << std::endl;
    }
    
    return 0;
}
`,
  },
  {
    id: 'array-loop-stride',
    title: 'Loop with Stride (i += 2)',
    category: 'Loops',
    description: 'Traversal advancing by 2 each step. Shows halved step count with same O(N) asymptotic order.',
    stdin: '',
    code: `#include <iostream>

int main() {
    int arr[6] = {7, 2, 9, 4, 6, 1};
    int total = 0;
    
    // Advance by 2 each iteration
    for (int i = 0; i < 6; i += 2) {
        total += arr[i];
        std::cout << "Element: " << arr[i] << ", Running Total: " << total << std::endl;
    }
    
    return 0;
}
`,
  },
  {
    id: 'bubble-sort',
    title: 'Bubble Sort (Triangular Nested)',
    category: 'Sorting',
    description: 'Quadratic O(N^2) sorting with adjacent comparisons and element swaps',
    stdin: '',
    code: `#include <iostream>

void swap(int &a, int &b) {
    int temp = a;
    a = b;
    b = temp;
}

int main() {
    int arr[5] = {5, 2, 8, 1, 9};
    int n = 5;
    
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
            }
        }
    }
    
    return 0;
}
`,
  },
  {
    id: 'two-pointers',
    title: 'Two Pointers (Target Sum)',
    category: 'Patterns',
    description: 'Linear O(N) scan using left and right converging pointers',
    stdin: '',
    code: `#include <iostream>

int main() {
    int arr[7] = {1, 2, 4, 6, 8, 9, 11};
    int target = 13;
    int left = 0;
    int right = 6;
    int found = 0;
    
    while (left < right) {
        int currentSum = arr[left] + arr[right];
        if (currentSum == target) {
            found = 1;
            break;
        } else if (currentSum < target) {
            left++;
        } else {
            right--;
        }
    }
    
    return 0;
}
`,
  },
  {
    id: 'binary-search',
    title: 'Binary Search (Logarithmic)',
    category: 'Searching',
    description: 'Divide and conquer search halving search space every iteration: O(log N)',
    stdin: '',
    code: `#include <iostream>

int main() {
    int arr[8] = {2, 5, 8, 12, 16, 23, 38, 56};
    int target = 23;
    int low = 0;
    int high = 7;
    int mid = -1;
    
    while (low <= high) {
        mid = low + (high - low) / 2;
        if (arr[mid] == target) {
            break;
        } else if (arr[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    
    return 0;
}
`,
  },
  {
    id: 'factorial-recursion',
    title: 'Factorial (Recursion Stack)',
    category: 'Recursion',
    description: 'Call-stack frame push and pop depth tracking: O(N) auxiliary stack',
    stdin: '',
    code: `#include <iostream>

int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

int main() {
    int n = 4;
    int result = factorial(n);
    std::cout << "Result: " << result << std::endl;
    return 0;
}
`,
  },
];
