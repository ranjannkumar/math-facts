// src/api/stubApi.js
// This file stubs out the email functionality as per the user's request.

export const sendPreTestResults = async (results) => {
  console.log('API call to send pre-test results has been stubbed. Results would have been:', results);
  return { status: 'success', message: 'Pre-test results logged locally, email functionality is a no-op.' };
};