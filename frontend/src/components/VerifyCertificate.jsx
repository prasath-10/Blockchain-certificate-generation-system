// VerifyCertificate.jsx
// React component for verifying blockchain-anchored certificates against ledger state.
//
// LOGIC OVERVIEW:
// 1. Manages controlled inputs for certificate ID and file payload (.pdf).
// 2. Performs client-side validation prior to dispatching requests.
// 3. Submits `multipart/form-data` via axios to POST /api/certificates/verify.
// 4. Manages async verification loading state, authentic result state, and unverified warning state.

import { useState, useRef } from 'react';
import api from '../api';

// Helper to convert backend HTTP/network errors into human-readable text
const getFriendlyErrorMessage = (error) => {
  const status = error?.response?.status;
  const data = error?.response?.data;

  if (!status) {
    return 'Unable to establish connection with the central registry server. Please ensure the backend service is active on port 5000.';
  }
  if (status === 404) {
    return 'The specified Certificate ID was not found in database records or on-chain ledger.';
  }
  if (status === 413) {
    return 'The attached PDF file exceeds the maximum allowed file payload size.';
  }
  if (status === 400 && typeof data?.error === 'string') {
    return data.error;
  }
  if (status >= 500) {
    return 'An internal node query error occurred while reading ledger state. Please try again.';
  }
  return (
    (typeof data?.error === 'string' && data.error) ||
    (typeof data?.message === 'string' && data.message) ||
    `Verification query failed (Status code: ${status}).`
  );
};

export default function VerifyCertificate() {
  // Controlled form input states
  const [certId, setCertId]     = useState('');
  const [certFile, setCertFile] = useState(null);

  // Validation, async loading, server error, and verification response states
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading]     = useState(false);
  const [serverError, setServerError] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);

  // Ref to reset file input element programmatically
  const fileInputRef = useRef(null);

  // Client-side validation function
  const validateForm = () => {
    const errors = {};
    if (!certId.trim()) errors.certId = 'Certificate ID is required for verification query.';
    if (!certFile) {
      errors.certFile = 'Attach the official PDF document file to verify.';
    } else if (certFile.type !== 'application/pdf') {
      errors.certFile = 'Invalid file format. Only official .pdf documents can be verified.';
    }
    return errors;
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setServerError(null);
    setIsLoading(true);

    try {
      // Build multipart/form-data request payload
      const formData = new FormData();
      formData.append('certificateId', certId.trim());
      formData.append('certificate', certFile);

      // Execute POST request to verification endpoint
      const response = await api.post('/certificates/verify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setVerifyResult(response.data);
    } catch (err) {
      setServerError(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Reset verification form and clear results
  const handleReset = () => {
    setCertId('');
    setCertFile(null);
    setFieldErrors({});
    setServerError(null);
    setVerifyResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle PDF file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0] || null;
    setCertFile(selectedFile);
    if (selectedFile) {
      setFieldErrors((prev) => ({ ...prev, certFile: undefined }));
    }
  };

  // Format issue date from metadata or on-chain timestamp
  const getFormattedDate = (result) => {
    if (result?.metadata?.issueDate) {
      return new Date(result.metadata.issueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    if (result?.onChain?.issueTimestamp) {
      const ts = Number(result.onChain.issueTimestamp);
      if (!isNaN(ts) && ts > 0) {
        return new Date(ts * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
    }
    return '—';
  };

  // RESULT VIEW — Rendered after submit when server responds with verification outcome
  if (verifyResult) {
    const isVerified = verifyResult.verified === true;
    const issueDateStr = getFormattedDate(verifyResult);

    return (
      <main className="min-h-screen bg-[var(--color-parchment-bg)] py-12 px-4 flex justify-center items-center font-['EB_Garamond']">
        <div className="w-full max-w-2xl bg-[var(--color-parchment-paper)] border-4 border-double border-[var(--color-brass)] p-8 sm:p-12 relative shadow-lg">
          
          {/* Masthead Header Stamp */}
          <div className="text-center border-b border-[var(--color-brass-border)] pb-6 mb-8">
            <div className="inline-flex items-center gap-2 text-xs font-['Cinzel'] font-bold tracking-[0.2em] uppercase mb-2 text-[var(--color-brass)]">
              <span className={`w-2.5 h-2.5 rounded-full ${isVerified ? 'bg-[var(--color-verdigris)]' : 'bg-[var(--color-oxblood)]'}`}></span>
              National Cryptographic Registry — Attestation Certificate
              <span className={`w-2.5 h-2.5 rounded-full ${isVerified ? 'bg-[var(--color-verdigris)]' : 'bg-[var(--color-oxblood)]'}`}></span>
            </div>
            
            <h1 className={`font-['Cinzel'] text-2xl sm:text-3xl font-bold tracking-wide mb-2 ${isVerified ? 'text-[var(--color-verdigris)]' : 'text-[var(--color-oxblood)]'}`}>
              {isVerified ? 'Official Document Verified Authentic' : 'Official Record Verification Failed'}
            </h1>
            
            <p className="text-sm text-[var(--color-ink-muted)] italic max-w-md mx-auto">
              {isVerified
                ? 'The submitted document payload hash strictly matches the immutable state committed on the public ledger.'
                : 'The document cryptographic payload does not correspond to official ledger records or no active registry entry exists.'}
            </p>
          </div>

          {/* VERIFIED STATE RESULT BOX */}
          {isVerified ? (
            <div className="border border-[var(--color-brass-border)] bg-[var(--color-verdigris-light)] p-6 mb-8 space-y-4 shadow-inner">
              
              {/* Certificate Registry ID */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--color-parchment-border)] pb-3">
                <span className="font-['Cinzel'] text-xs font-semibold tracking-wider text-[var(--color-ink-muted)] uppercase">
                  Certificate ID
                </span>
                <span className="font-['JetBrains_Mono'] text-sm font-bold text-[var(--color-ink-primary)] mt-1 sm:mt-0">
                  {verifyResult.certificateId || certId}
                </span>
              </div>

              {/* Holder Name */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--color-parchment-border)] pb-3">
                <span className="font-['Cinzel'] text-xs font-semibold tracking-wider text-[var(--color-ink-muted)] uppercase">
                  Holder Legal Name
                </span>
                <span className="font-['Plus_Jakarta_Sans'] text-sm font-semibold text-[var(--color-ink-primary)] mt-1 sm:mt-0">
                  {verifyResult.metadata?.holderName || '—'}
                </span>
              </div>

              {/* Certificate Category */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--color-parchment-border)] pb-3">
                <span className="font-['Cinzel'] text-xs font-semibold tracking-wider text-[var(--color-ink-muted)] uppercase">
                  Certificate Category
                </span>
                <span className="font-['Plus_Jakarta_Sans'] text-sm font-medium text-[var(--color-ink-primary)] mt-1 sm:mt-0">
                  {verifyResult.metadata?.certificateType || 'Official Record'}
                </span>
              </div>

              {/* Issuer Authority */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--color-parchment-border)] pb-3">
                <span className="font-['Cinzel'] text-xs font-semibold tracking-wider text-[var(--color-ink-muted)] uppercase">
                  Issuing Authority
                </span>
                <span className="font-['Plus_Jakarta_Sans'] text-sm font-medium text-[var(--color-ink-primary)] mt-1 sm:mt-0">
                  {verifyResult.metadata?.issuerName || verifyResult.onChain?.issuer || 'Authorized Node'}
                </span>
              </div>

              {/* Issue Date */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--color-parchment-border)] pb-3">
                <span className="font-['Cinzel'] text-xs font-semibold tracking-wider text-[var(--color-ink-muted)] uppercase">
                  Registration Date
                </span>
                <span className="font-['Plus_Jakarta_Sans'] text-sm font-medium text-[var(--color-ink-primary)] mt-1 sm:mt-0">
                  {issueDateStr}
                </span>
              </div>

              {/* Matched Cryptographic Hash */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between">
                <span className="font-['Cinzel'] text-xs font-semibold tracking-wider text-[var(--color-verdigris)] uppercase mt-1">
                  Matched Payload Hash
                </span>
                <span className="font-['JetBrains_Mono'] text-xs font-semibold text-[var(--color-verdigris)] break-all max-w-sm text-right mt-1 sm:mt-0 bg-white/70 px-2 py-1 border border-[var(--color-brass-border)]">
                  {verifyResult.documentHash || '—'}
                </span>
              </div>
            </div>
          ) : (
            /* NOT VERIFIED STATE RESULT BOX */
            <div className="border border-[var(--color-oxblood)]/30 bg-[var(--color-parchment-paper)] p-6 mb-8 space-y-4 shadow-inner">
              
              <div className="border-b border-[var(--color-parchment-border)] pb-3">
                <div className="font-['Cinzel'] text-xs font-bold tracking-wider text-[var(--color-oxblood)] uppercase mb-1">
                  Verification Notice
                </div>
                <p className="font-['Plus_Jakarta_Sans'] text-sm text-[var(--color-ink-primary)] leading-relaxed">
                  {verifyResult.message || 'The uploaded file payload does not match official records on the ledger, or no record exists for this Certificate ID.'}
                </p>
              </div>

              {/* Query Certificate ID */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--color-parchment-border)] pb-3">
                <span className="font-['Cinzel'] text-xs font-semibold tracking-wider text-[var(--color-ink-muted)] uppercase">
                  Queried Certificate ID
                </span>
                <span className="font-['JetBrains_Mono'] text-sm font-bold text-[var(--color-oxblood)] mt-1 sm:mt-0">
                  {verifyResult.certificateId || certId}
                </span>
              </div>

              {/* Computed Payload Hash */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between">
                <span className="font-['Cinzel'] text-xs font-semibold tracking-wider text-[var(--color-oxblood)] uppercase mt-1">
                  Computed Document Hash
                </span>
                <span className="font-['JetBrains_Mono'] text-xs font-semibold text-[var(--color-oxblood)] break-all max-w-sm text-right mt-1 sm:mt-0 bg-red-50/60 px-2 py-1 border border-red-200">
                  {verifyResult.documentHash || '—'}
                </span>
              </div>

            </div>
          )}

          {/* Official Verification Seal & Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--color-brass-border)] pt-6">
            
            {/* Visual Seal Stamp */}
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-['Cinzel'] text-[10px] font-bold text-center leading-tight shadow-inner ${
                  isVerified
                    ? 'border-[var(--color-verdigris)] text-[var(--color-verdigris)] bg-[var(--color-verdigris-light)]'
                    : 'border-[var(--color-oxblood)] text-[var(--color-oxblood)] bg-red-50'
                }`}
              >
                {isVerified ? 'VERIFIED' : 'UNMATCHED'}
              </div>
              <div className="text-xs text-[var(--color-ink-muted)]">
                <p className="font-semibold text-[var(--color-ink-primary)] font-['Cinzel']">
                  {isVerified ? 'Cryptographic Proof Confirmed' : 'Ledger Status Mismatch'}
                </p>
                <p>{isVerified ? 'On-Chain Ledger Match' : 'Record Not Authenticated'}</p>
              </div>
            </div>

            {/* Reset / Re-verify Button */}
            <button
              onClick={handleReset}
              className="font-['Cinzel'] text-xs font-bold tracking-wider uppercase text-[var(--color-oxblood)] border border-[var(--color-oxblood)] hover:bg-[var(--color-oxblood)] hover:text-white px-5 py-2.5 transition-colors duration-150 cursor-pointer"
            >
              ← Verify Another Document
            </button>
          </div>

          {/* Bottom Serial */}
          <footer className="mt-8 pt-4 border-t border-[var(--color-parchment-border)] text-center text-[10px] font-['JetBrains_Mono'] text-[var(--color-ink-faint)] uppercase tracking-wider">
            Registry Verification Engine · Node 0x7F81
          </footer>

        </div>
      </main>
    );
  }

  // PRIMARY VERIFICATION FORM VIEW
  return (
    <main className="min-h-screen bg-[var(--color-parchment-bg)] py-10 px-4 flex justify-center items-center font-['EB_Garamond']">
      {/* Official Certificate Verification Form Container */}
      <div className="w-full max-w-2xl bg-[var(--color-parchment-paper)] border-4 border-double border-[var(--color-brass)] p-8 sm:p-12 relative shadow-md">
        
        {/* Certificate Verification Header Banner */}
        <header className="text-center border-b-2 border-[var(--color-ink-primary)] pb-6 mb-8">
          <div className="text-[11px] font-['Cinzel'] font-bold tracking-[0.25em] text-[var(--color-brass)] uppercase mb-2">
            Republic Document Registry · Form VR-2026
          </div>
          <h1 className="font-['Cinzel'] text-2xl sm:text-3xl font-bold text-[var(--color-ink-primary)] tracking-wide mb-2">
            Verify Certificate Authenticity
          </h1>
          <p className="text-sm text-[var(--color-ink-muted)] italic max-w-md mx-auto">
            Official ledger verification interface for validating cryptographic authenticity of registered government certificates.
          </p>
        </header>

        {/* Server Error Alert Block */}
        {serverError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-[var(--color-oxblood)] text-[var(--color-oxblood)] text-sm font-['Plus_Jakarta_Sans']">
            <div className="font-bold font-['Cinzel'] uppercase tracking-wider text-xs mb-1">
              Verification Notice
            </div>
            <p>{serverError}</p>
          </div>
        )}

        {/* Verification Form Body */}
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          
          {/* Certificate ID Field */}
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label htmlFor="certId" className="font-['Cinzel'] text-xs font-bold tracking-wider text-[var(--color-ink-primary)] uppercase">
                Certificate ID <span className="text-[var(--color-oxblood)]">*</span>
              </label>
              <span className="font-['JetBrains_Mono'] text-[11px] text-[var(--color-ink-faint)]">
                [Registration Serial]
              </span>
            </div>
            <input
              id="certId"
              type="text"
              value={certId}
              onChange={(e) => {
                setCertId(e.target.value);
                if (fieldErrors.certId) setFieldErrors((p) => ({ ...p, certId: undefined }));
              }}
              placeholder="e.g. GOV-REG-2026-8849"
              className={`w-full bg-white border ${
                fieldErrors.certId ? 'border-[var(--color-oxblood)] ring-1 ring-[var(--color-oxblood)]' : 'border-[var(--color-parchment-border)]'
              } focus:border-[var(--color-brass)] focus:ring-1 focus:ring-[var(--color-brass)] px-4 py-2.5 font-['JetBrains_Mono'] text-sm text-[var(--color-ink-primary)] placeholder-[var(--color-ink-faint)] outline-none transition-all`}
            />
            {fieldErrors.certId && (
              <p className="mt-1 text-xs text-[var(--color-oxblood)] font-['Plus_Jakarta_Sans']">
                {fieldErrors.certId}
              </p>
            )}
          </div>

          {/* Certificate File Input (.pdf) */}
          <div>
            <label htmlFor="certFile" className="block font-['Cinzel'] text-xs font-bold tracking-wider text-[var(--color-ink-primary)] uppercase mb-1">
              Certificate Document (.pdf) <span className="text-[var(--color-oxblood)]">*</span>
            </label>
            
            <div
              className={`border-2 border-dashed ${
                fieldErrors.certFile ? 'border-[var(--color-oxblood)] bg-red-50/50' : 'border-[var(--color-parchment-border)] bg-[var(--color-brass-light)]'
              } p-5 text-center cursor-pointer relative hover:border-[var(--color-brass)] transition-colors`}
            >
              <input
                ref={fileInputRef}
                id="certFile"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-1">
                <div className="text-xl">🔍</div>
                <div className="font-['Cinzel'] text-xs font-bold text-[var(--color-ink-primary)]">
                  {certFile ? certFile.name : 'Select PDF Document To Verify'}
                </div>
                <div className="font-['Plus_Jakarta_Sans'] text-xs text-[var(--color-ink-muted)]">
                  {certFile ? `Size: ${(certFile.size / 1024).toFixed(1)} KB` : 'Click or drop official .pdf document file here'}
                </div>
              </div>
            </div>

            {fieldErrors.certFile && (
              <p className="mt-1 text-xs text-[var(--color-oxblood)] font-['Plus_Jakarta_Sans']">
                {fieldErrors.certFile}
              </p>
            )}
          </div>

          {/* Ledger Rule Line */}
          <div className="border-t border-b border-[var(--color-brass-border)] py-1 my-6 text-center">
            <span className="font-['Cinzel'] text-[10px] tracking-[0.3em] text-[var(--color-brass)] uppercase">
              Cryptographic Audit & Match
            </span>
          </div>

          {/* Submission Action Area with Seal Detail */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            
            {/* Signature Visual Detail */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-[var(--color-brass)] bg-[var(--color-brass-light)] text-[var(--color-brass)] flex items-center justify-center font-['Cinzel'] text-[10px] font-bold tracking-tighter text-center leading-tight shadow-inner">
                AUDIT
              </div>
              <div className="text-xs text-[var(--color-ink-muted)]">
                <p className="font-semibold text-[var(--color-ink-primary)] font-['Cinzel']">Ledger Cryptographic Query</p>
                <p>SHA-256 On-Chain Match</p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[var(--color-brass)] hover:bg-[#886930] text-white font-['Cinzel'] text-xs font-bold tracking-widest uppercase px-8 py-3.5 border border-amber-900 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && (
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
              )}
              {isLoading ? 'Verifying against ledger…' : 'Verify Certificate'}
            </button>
          </div>

        </form>

        {/* Certificate Bottom Margin Serial */}
        <footer className="mt-8 pt-4 border-t border-[var(--color-parchment-border)] text-center text-[10px] font-['JetBrains_Mono'] text-[var(--color-ink-faint)] uppercase tracking-wider">
          Registry Node: 0x7F81 · State Authority Verification System
        </footer>

      </div>
    </main>
  );
}
