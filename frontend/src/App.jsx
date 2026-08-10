// App.jsx — Root component of our React application
//
// Currently renders the IssueCertificate page.
// The original health-check test is preserved below as a comment
// in case you want to restore it.

import IssueCertificate from './components/IssueCertificate';

// ---------------------------------------------------------------------------
// ORIGINAL HEALTH-CHECK CODE (kept for reference):
// ---------------------------------------------------------------------------
// import { useState, useEffect } from 'react';
// import api from './api';
// import './App.css';
//
// function App() {
//   const [status, setStatus] = useState(null);
//   const [error, setError] = useState(null);
//   useEffect(() => {
//     async function checkHealth() {
//       try {
//         const response = await api.get('/health');
//         setStatus(response.data);
//       } catch (err) {
//         setError(err.response
//           ? `Server error: ${err.response.status} — ${err.response.statusText}`
//           : `Could not reach backend. Is it running at http://localhost:5000?`
//         );
//       }
//     }
//     checkHealth();
//   }, []);
//   return (
//     <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
//       <h1>Blockchain Certificate System</h1>
//       <h2>Backend Connection Test</h2>
//       {!status && !error && <p>⏳ Checking backend status…</p>}
//       {status && <p style={{ color: 'green' }}>✅ Backend status: <strong>{status.message}</strong></p>}
//       {error && <p style={{ color: 'red' }}>❌ {error}</p>}
//       {status && <details><summary>Full response</summary><pre>{JSON.stringify(status, null, 2)}</pre></details>}
//     </div>
//   );
// }
// ---------------------------------------------------------------------------

function App() {
  // Render the IssueCertificate page as the main (and only) page for now.
  // When you add routing later (e.g., react-router-dom), this becomes one
  // route: <Route path="/issue" element={<IssueCertificate />} />
  return <IssueCertificate />;
}

export default App;
