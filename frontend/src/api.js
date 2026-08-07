// api.js — Central API configuration for the frontend
//
// We create a single "axios instance" here with shared settings
// (like the base URL of our backend). Any file that needs to talk
// to the backend should import `api` from this file instead of
// importing axios directly. That way, if the backend URL ever changes,
// we only update it in ONE place.

import axios from 'axios';

// axios.create() returns a pre-configured axios instance.
// baseURL: every request made through `api` will automatically
//          be prefixed with this URL, so we never have to repeat it.
// timeout: if the backend doesn't respond within 10 seconds,
//          axios will throw an error instead of hanging forever.
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Points to our Express backend
  timeout: 10000,                       // 10-second request timeout
  headers: {
    'Content-Type': 'application/json', // Tell the server we're sending JSON
  },
});

// Export the configured instance so other files can use it like:
//   import api from './api'
//   api.get('/health')
//   api.post('/certificates/issue', { ... })
export default api;
