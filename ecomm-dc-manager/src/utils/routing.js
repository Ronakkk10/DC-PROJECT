// utils/routing.js

const BASE_URL = "http://localhost:8080"; // This is your HAProxy endpoint

export const getAPIUrl = (endpoint) => `${BASE_URL}${endpoint}`;
