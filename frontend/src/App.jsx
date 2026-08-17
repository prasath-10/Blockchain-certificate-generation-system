// App.jsx — Main Application Component with React Router Navigation
//
// LOGIC OVERVIEW:
// 1. Uses BrowserRouter from `react-router-dom` to handle client-side routing.
// 2. Renders a unified top Masthead Navigation Bar with tabs for "Issue Certificate" and "Verify Certificate".
// 3. Configures routes:
//    - `/` or `/issue` -> IssueCertificate component
//    - `/verify`      -> VerifyCertificate component

import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import IssueCertificate from './components/IssueCertificate';
import VerifyCertificate from './components/VerifyCertificate';

function Navigation() {
  return (
    <header className="bg-[var(--color-parchment-paper)] border-b-2 border-[var(--color-brass-border)] shadow-sm sticky top-0 z-50 font-['Cinzel']">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between py-3 gap-3">
        
        {/* Registry Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-oxblood)] bg-[var(--color-oxblood)] text-white flex items-center justify-center text-[10px] font-bold tracking-tighter">
            REG
          </div>
          <div>
            <div className="text-xs font-bold tracking-widest text-[var(--color-ink-primary)] uppercase">
              Republic Certificate Registry
            </div>
            <div className="text-[10px] font-['JetBrains_Mono'] text-[var(--color-ink-muted)]">
              Cryptographic Ledger Authority
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2 border border-[var(--color-brass-border)] bg-[var(--color-brass-light)] p-1 rounded-sm">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-4 py-1.5 text-xs font-bold tracking-wider uppercase transition-colors duration-150 rounded-xs ${
                isActive
                  ? 'bg-[var(--color-oxblood)] text-white shadow-xs'
                  : 'text-[var(--color-ink-primary)] hover:text-[var(--color-oxblood)] hover:bg-white/50'
              }`
            }
          >
            📜 Issue Certificate
          </NavLink>

          <NavLink
            to="/verify"
            className={({ isActive }) =>
              `px-4 py-1.5 text-xs font-bold tracking-wider uppercase transition-colors duration-150 rounded-xs ${
                isActive
                  ? 'bg-[var(--color-oxblood)] text-white shadow-xs'
                  : 'text-[var(--color-ink-primary)] hover:text-[var(--color-oxblood)] hover:bg-white/50'
              }`
            }
          >
            🔍 Verify Certificate
          </NavLink>
        </nav>

      </div>
    </header>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[var(--color-parchment-bg)] flex flex-col">
        <Navigation />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<IssueCertificate />} />
            <Route path="/issue" element={<Navigate to="/" replace />} />
            <Route path="/verify" element={<VerifyCertificate />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
