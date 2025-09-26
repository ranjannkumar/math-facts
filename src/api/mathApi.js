// src/api/mathApi.js

const API_BASE_URL = 'http://localhost:8080/api';

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

export const quizPrepare = async (level, beltOrDegree, pin) => {
  return callApi('/quiz/prepare', 'POST', { level, beltOrDegree, operation: 'add' }, pin);
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

export const userGetDailyStats = async (pin) => {
  return callApi('/user/daily', 'GET', null, pin);
};

export const userGetProgress = async (pin) => {
  return callApi('/user/progress', 'GET', null, pin);
};

/**
 * Maps a backend question object (from GeneratedQuestion model) to the frontend format.
 */
export function mapQuestionToFrontend(backendQuestion) {
  if (!backendQuestion) return null;
  const a = backendQuestion.params?.a ?? '';
  const b = backendQuestion.params?.b ?? '';
  const questionString = backendQuestion.operation === 'add' ? `${a} + ${b}` : `${a}`;
  
  return {
    id: backendQuestion._id,
    question: questionString,
    correctAnswer: backendQuestion.correctAnswer,
    answers: backendQuestion.choices,
  };
}