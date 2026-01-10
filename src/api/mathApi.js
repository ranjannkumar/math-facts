// src/api/mathApi.js

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';

/**
 * Helper function for authenticated API calls.
 * @param {string} endpoint The API endpoint (e.g., '/auth/login-pin').
 * @param {string} method The HTTP method (e.g., 'POST').
 * @param {object} [body] The request body object.
 * @param {string} [pin] The user's PIN for the x-pin header.
 */
async function callApi(endpoint, method = 'GET', body = null, pin = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (pin) {
    headers['x-pin'] = pin;
  }

  const config = {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  const data = response.status !== 204 ? await response.json() : {};

  if (!response.ok) {
    throw new Error(
  data?.error?.message || data?.error || `API call failed: ${response.status} ${response.statusText}`
);

  }

  return data;
}

export const authLogin = async (pin, name = 'Player') => {
  return callApi('/auth/login-pin', 'POST', { pin, name });
};

export const userUpdateTheme = async (themeKey, pin) => {
  return callApi('/user/theme', 'POST', { themeKey }, pin);
};

// FIX: Ensure quizPrepare receives and passes the pin parameter.
// The useMathGame hook already calls this correctly with the pin.
export const quizPrepare = async (
  level,
  beltOrDegree,
  pin,
  operation = 'add',
  gameMode = false,
  targetCorrect = null,
  gameModeType = null
) => {
  const body = { level, beltOrDegree, operation };

  if (gameMode) {
    body.gameMode = true;
    if (targetCorrect != null) body.targetCorrect = targetCorrect;
    if (gameModeType) body.gameModeType = gameModeType;
  }

  return callApi('/quiz/prepare', 'POST', body, pin);
};

export const quizHandleInactivity = async (quizRunId, pin) => {
  return callApi('/quiz/inactivity', 'POST', { quizRunId }, pin);
};

export const quizSubmitAnswer = async (
  quizRunId,
  questionId,
  answer,
  responseMs,
  pin,
  { level, beltOrDegree, forcePass = false } = {}
) => {
  const body = { quizRunId, questionId, answer, responseMs };
  if (level !== undefined) body.level = level;
  if (beltOrDegree !== undefined) body.beltOrDegree = beltOrDegree;
  if (forcePass) body.forcePass = true;

  return callApi('/quiz/answer', 'POST', body, pin);
};


export const quizStart = async (quizRunId, pin) => {
  return callApi('/quiz/start', 'POST', { quizRunId }, pin);
};

export const quizPracticeAnswer = async (quizRunId, questionId, answer, pin) => {
  return callApi('/quiz/practice/answer', 'POST', { quizRunId, questionId, answer }, pin);
};

export const quizComplete = async (quizRunId, pin) => {
  return callApi('/quiz/complete', 'POST', { quizRunId }, pin);
};

export const userResetProgress = async (pin) => {
  return callApi('/user/reset', 'POST', {}, pin);
};


export const userGetDailyStats = async (pin) => {
  return callApi('/user/daily', 'GET', null, pin);
};

export const userGetProgress = async (pin) => {
  return callApi('/user/progress', 'GET', null, pin);
};

export const submitVideoRating = async (rating, level, beltOrDegree, pin) => {
  return callApi('/user/rate-video', 'POST', { rating, level, beltOrDegree }, pin);
};

/**
 * Maps a backend question object (from GeneratedQuestion model) to the frontend format.
 * Includes FIX for missing 'choices' array (answers) and displays for L1 White Belt (digit identification).
 */

// export function mapQuestionToFrontend(backendQuestion) {
//   if (!backendQuestion) return null;
//   const a = backendQuestion.params?.a ?? '';
//   const b = backendQuestion.params?.b ?? '';
//   let questionString = backendQuestion.question;

//   if (!questionString) { 
//     questionString = `${a} + ${b}`;
//   }
  
//   // FIX 2: Ensure 'answers' array is always present to prevent map() crash
//   const answers = backendQuestion.choices || [] ;
//   console.log('Mapped question:', { questionString, answers });
  
//   return {
//     id: backendQuestion._id || backendQuestion.id, // Use id or _id for consistency
//     question: questionString,
//     correctAnswer: backendQuestion.correctAnswer,
//     answers: answers, // Use the fixed array
//   };
// }

// src/api/mathApi.js  (keep the other exports as-is)

/**
 * Ensure the frontend always gets a complete question object:
 *  - question: "A + B"
 *  - correctAnswer: number
 *  - answers: [four unique numbers incl. correct]
 */
export function mapQuestionToFrontend(backendQuestion) {
  if (!backendQuestion) return null;

  // 1) Build display string
  const a =
    backendQuestion?.params?.a ??
    backendQuestion?.a ??
    (Array.isArray(backendQuestion?.operands) ? backendQuestion.operands[0] : undefined);

  const b =
    backendQuestion?.params?.b ??
    backendQuestion?.b ??
    (Array.isArray(backendQuestion?.operands) ? backendQuestion.operands[1] : undefined);

  let questionString = backendQuestion.question;
  if (!questionString && Number.isFinite(a) && Number.isFinite(b)) {
    // default to addition display — update if you add other ops here
    questionString = `${a} + ${b}`;
  }

  // 2) Correct answer
  const computed = Number.isFinite(a) && Number.isFinite(b) ? a + b : undefined;
  const correct =
    typeof backendQuestion.correctAnswer === 'number'
      ? backendQuestion.correctAnswer
      : computed;

  // 3) Choices
  const choicesProvided = Array.isArray(backendQuestion.choices);
  let answers = choicesProvided
    ? backendQuestion.choices.filter((n) => typeof n === 'number')
    : [];

  // Only auto-generate if the backend didn't send choices at all.
  const needToBuild = !choicesProvided;
  if (needToBuild && Number.isFinite(correct)) {
    const set = new Set(answers);
    set.add(correct);

    // simple pool around the correct answer + some small numbers
    const candidates = [
      correct - 1,
      correct + 1,
      correct + 2,
      correct - 2,
      0,
      1,
      2,
      3,
      4,
      5,
      a ?? 0,
      b ?? 0,
    ];

    for (const c of candidates) {
      if (set.size >= 4) break;
      if (Number.isFinite(c) && c >= 0) set.add(c);
    }

    // if still not 4, jitter around the correct until we reach 4 unique options
    while (set.size < 4) {
      const jitter = Math.floor(Math.random() * 9) - 4; // [-4..4]
      const c = Math.max(0, correct + jitter);
      set.add(c);
    }

    answers = Array.from(set).slice(0, 4);
  }

  // 4) Shuffle
  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [answers[i], answers[j]] = [answers[j], answers[i]];
  }

  return {
    id: backendQuestion._id || backendQuestion.id,
    question: questionString || String(backendQuestion.question || ''),
    correctAnswer: correct,
    answers,
  };
}

/**
 * MOCK FUNCTION: Simulates fetching detailed question stats (encounters, correct, wrong) for a specific user.
 * REPLACE THIS MOCK with the actual callApi when the backend is ready.
 * @param {string} adminPin The admin's PIN for authorization.
 * @param {string} userPin The PIN of the student whose stats are requested.
 */
export const getUserQuestionStats = async (adminPin, userPin) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500)); 
  
  // MOCK DATA STRUCTURE
  const mockStats = [
    { question: '2 + 3', encountered: 50, correct: 45, wrong: 5 },
    { question: '7 + 8', encountered: 35, correct: 20, wrong: 15 },
    { question: '10 + 1', encountered: 25, correct: 25, wrong: 0 },
    { question: '4 + 6', encountered: 20, correct: 18, wrong: 2 },
    { question: '12 + 5', encountered: 15, correct: 10, wrong: 5 },
    { question: '6 + 6', encountered: 10, correct: 5, wrong: 5 },
  ];
  
  // In a real scenario, you'd have:
  // return callApi(`/admin/user-question-stats/${userPin}`, 'GET', null, adminPin);

  // For now, return the mock data.
  return mockStats;
};

export const getAdminStats = async (adminPin, limit = 10, offset = 0) => {
  return callApi(`/admin/today-stats?limit=${limit}&offset=${offset}`, 'GET', null, adminPin);
};


// Analytics API (NEW)

export const analyticsGetSummary = async (pin) => {
  // GET /api/analytics/summary (x-pin required)
  return callApi(`/analytics/summary`, "GET", null, pin);
};

export const analyticsGetFacts = async (
  pin,
  { level = "all", operation = "all", limit = 50, offset = 0 } = {}
) => {
  // GET /api/analytics/facts?level=1&operation=add&limit=50&offset=0
  const params = new URLSearchParams();
  if (level !== "all" && level !== "" && level != null) params.set("level", String(level));
  if (operation !== "all" && operation !== "" && operation != null) params.set("operation", String(operation));
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  return callApi(`/analytics/facts?${params.toString()}`, "GET", null, pin);
};

export const analyticsGetFactDetail = async (
  pin,
  { operation, a, b, limit = 20 } = {}
) => {
  // GET /api/analytics/facts/{operation}/{a}/{b}?limit=20
  if (!operation || a == null || b == null) {
    throw new Error("Missing fact identifiers (operation, a, b)");
  }
  const params = new URLSearchParams();
  params.set("limit", String(limit));

  return callApi(
    `/analytics/facts/${encodeURIComponent(operation)}/${encodeURIComponent(a)}/${encodeURIComponent(b)}?${params.toString()}`,
    "GET",
    null,
    pin
  );
};

export const analyticsGetStruggling = async (
  pin,
  { level = "all", limit = 10 } = {}
) => {
  // GET /api/analytics/struggling?level=1&limit=10
  const params = new URLSearchParams();
  if (level !== "all" && level !== "" && level != null) params.set("level", String(level));
  params.set("limit", String(limit));

  return callApi(`/analytics/struggling?${params.toString()}`, "GET", null, pin);
};


