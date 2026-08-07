// App.jsx — Root component of our React application
//
// Right now this component does one simple thing:
//   1. When the page first loads (useEffect), it calls GET /api/health
//      on our Express backend.
//   2. It stores the response in state and displays it on screen.
//
// This is a classic pattern for testing that the frontend can
// successfully communicate with the backend before building real features.

import { useState, useEffect } from 'react';
import api from './api';        // Our pre-configured axios instance
import './App.css';             // Default Vite styles (unchanged for now)

function App() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  // `status` holds the message we get back from the backend.
  // It starts as null so we can show a "loading…" message while waiting.
  const [status, setStatus] = useState(null);

  // `error` holds any error message if the request fails
  // (e.g., the backend isn't running yet).
  const [error, setError] = useState(null);

  // ---------------------------------------------------------------------------
  // Side Effect: fetch backend health on mount
  // ---------------------------------------------------------------------------
  // useEffect with an empty dependency array [] runs exactly ONCE,
  // right after the component first appears on screen — similar to
  // componentDidMount in class components.
  useEffect(() => {
    // Define an async function inside useEffect.
    // (We can't make the useEffect callback itself async directly,
    // so this is the standard workaround.)
    async function checkHealth() {
      try {
        // api.get('/health') sends GET http://localhost:5000/api/health
        // The backend should respond with something like { message: "Server is running" }
        const response = await api.get('/health');

        // response.data is the JSON body sent by Express (res.json({...}))
        // We store the whole object and display the `message` field.
        setStatus(response.data);
      } catch (err) {
        // If the request fails (network error, backend down, etc.),
        // store a friendly error message so the user understands what happened.
        setError(
          err.response
            ? `Server error: ${err.response.status} — ${err.response.statusText}`
            : `Could not reach backend. Is it running at http://localhost:5000?`
        );
      }
    }

    // Call the function we just defined
    checkHealth();
  }, []); // Empty array = run once on mount, never again

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Blockchain Certificate System</h1>

      <h2>Backend Connection Test</h2>

      {/* Show a loading indicator while the request is in flight */}
      {!status && !error && <p>⏳ Checking backend status…</p>}

      {/* If the request succeeded, display the message from the backend */}
      {status && (
        <p style={{ color: 'green' }}>
          ✅ Backend status: <strong>{status.message}</strong>
        </p>
      )}

      {/* If the request failed, display the error in red */}
      {error && (
        <p style={{ color: 'red' }}>
          ❌ {error}
        </p>
      )}

      {/* Show the full response object for debugging — remove later */}
      {status && (
        <details>
          <summary>Full response from /api/health</summary>
          <pre>{JSON.stringify(status, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}

export default App;
