// src/utils/pretestUtils.js

export function generateAdditionToFive() {
  // Unique unordered pairs (a,b) with a+b=5
  const pairs = [
    [0, 5],
    [1, 4],
    [2, 3],
    [3, 2],
    [4, 1],
    [5, 0],
  ];
  return pairs.map(([a, b]) => ({
    question: `${a} + ${b}`,
    correctAnswer: a + b,
  }));
}

export function generateEasySubtraction() {
  // Small, non-negative results (unique)
  const pairs = [
    [5, 0],
    [5, 1],
    [4, 1],
    [3, 2],
    [4, 3],
    [2, 1],
  ];
  return pairs.map(([a, b]) => ({
    question: `${a} - ${b}`,
    correctAnswer: a - b,
  }));
}

export function generateEasyMultiplication() {
  const pairs = [
    [0, 3],
    [1, 4],
    [2, 2],
    [2, 3],
    [3, 2],
    [1, 5],
  ];
  return pairs.map(([a, b]) => ({
    question: `${a} × ${b}`,
    correctAnswer: a * b,
  }));
}

export function generateEasyDivision() {
  // Exact divisions only
  const triples = [
    [4, 2],
    [6, 3],
    [8, 4],
    [9, 3],
    [10, 5],
    [12, 4],
  ]; // [a,b] means a ÷ b
  return triples.map(([a, b]) => ({
    question: `${a} ÷ ${b}`,
    correctAnswer: a / b,
  }));
}

export function generatePreTestQuestions(section) {
  switch (section) {
    case 'addition':
      return generateAdditionToFive();
    case 'subtraction':
      return generateEasySubtraction();
    case 'multiplication':
      return generateEasyMultiplication();
    case 'division':
      return generateEasyDivision();
    default:
      return [];
  }
}
