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
    throw new Error(data.error?.message || `API call failed: ${response.statusText}`);
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
export const quizPrepare = async (level, beltOrDegree, pin, operation = 'add') => { 
  return callApi('/quiz/prepare', 'POST', { level, beltOrDegree, operation }, pin);
};

export const quizStart = async (quizRunId, pin) => {
  return callApi('/quiz/start', 'POST', { quizRunId }, pin);
};

export const quizSubmitAnswer = async (quizRunId, questionId, answer, responseMs, level, beltOrDegree, pin) => {
  // Pass level/beltOrDegree for progression tracking on success in backend
  return callApi(
    '/quiz/answer',
    'POST',
    { quizRunId, questionId, answer, responseMs, level, beltOrDegree },
    pin
  );
};

export const quizHandleInactivity = async (quizRunId, questionId, pin) => {
  return callApi('/quiz/inactivity', 'POST', { quizRunId, questionId }, pin);
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

  // 3) Choices (fallback if API didn’t send them or sent < 4)
  let answers = Array.isArray(backendQuestion.choices)
    ? backendQuestion.choices.filter((n) => typeof n === 'number')
    : [];

  const needToBuild = !answers.length || answers.length < 4;
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

export const getAdminStats = async (adminPin, limit = 10, offset = 0) => {
  return callApi(`/admin/today-stats?limit=${limit}&offset=${offset}`, 'GET', null, adminPin);
};

export const quizForcePass = async (level, beltOrDegree, pin) => {
  return callApi(
    '/quiz/force-pass', 
    'POST',
    { 
      level, 
      beltOrDegree, 
      forcePass: true 
    },
    pin
  );
};
