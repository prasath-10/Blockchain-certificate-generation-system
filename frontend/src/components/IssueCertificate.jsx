// IssueCertificate.jsx
// React component for issuing blockchain-anchored government certificates.
//
// LOGIC OVERVIEW:
// 1. Manages controlled state for all form fields (certId, certType, holderName, issuerName, certFile).
// 2. Performs client-side validation on submit attempt, setting field-specific error messages.
// 3. Submits data as `multipart/form-data` via axios (`api.js`) to POST /api/certificates/issue.
// 4. Manages async loading state, success response state (receipt), and friendly error handling.

import { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../api';

// Allowed options for Certificate Type dropdown
const CERTIFICATE_TYPES = [
  'Birth Certificate',
  'Degree Certificate',
  'Income Certificate',
  'Caste Certificate',
];

// Helper to convert backend HTTP/network errors into human-readable text
const getFriendlyErrorMessage = (error) => {
  const status = error?.response?.status;
  const data = error?.response?.data;

  if (!status) {
    return 'Unable to establish connection with the central registry server. Please ensure the backend service is active on port 5000.';
  }
  if (status === 409) {
    return 'A record with this Certificate ID already exists in the ledger. Each certificate must possess a unique registration identifier.';
  }
  if (status === 413) {
    return 'The attached PDF file exceeds the maximum allowed file payload size.';
  }
  if (status === 400 && typeof data?.message === 'string') {
    return data.message;
  }
  if (status >= 500) {
    return 'An internal error occurred on the central registry node. Please re-submit in a few moments.';
  }
  return (
    (typeof data?.message === 'string' && data.message) ||
    (typeof data?.error === 'string' && data.error) ||
    `Registration failed (Status code: ${status}).`
  );
};

export default function IssueCertificate() {
  // Form input states
  const [certId, setCertId]         = useState('');
  const [certType, setCertType]     = useState('');
  const [holderName, setHolderName] = useState('');
  const [issuerName, setIssuerName] = useState('');
  const [certFile, setCertFile]     = useState(null);

  // Validation & request states
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading]     = useState(false);
  const [serverError, setServerError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  // Ref to reset the file input element programmatically
  const fileInputRef = useRef(null);
  // Ref for the QR canvas element to enable PNG export
  const qrCanvasRef = useRef(null);

  // Client-side validation function
  const validateForm = () => {
    const errors = {};
    if (!certId.trim())     errors.certId = 'Certificate ID is required for registry indexing.';
    if (!certType)          errors.certType = 'Select an official certificate category.';
    if (!holderName.trim()) errors.holderName = 'Full legal holder name is required.';
    if (!issuerName.trim()) errors.issuerName = 'Authorized issuing agency is required.';
    if (!certFile)          errors.certFile = 'Attach the official PDF document file.';
    else if (certFile.type !== 'application/pdf') {
      errors.certFile = 'Invalid file format. Only official .pdf documents are accepted.';
    }
    return errors;
  };

  // Form submission handler
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
      // Package form data into a multipart payload
      const formData = new FormData();
      formData.append('certificateId', certId.trim());
      formData.append('certificateType', certType);
      formData.append('holderName', holderName.trim());
      formData.append('issuerName', issuerName.trim());
      formData.append('certificate', certFile);

      // Execute POST request to backend API
      const response = await api.post('/certificates/issue', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccessData(response.data);
    } catch (err) {
      setServerError(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form to issue another certificate
  const handleReset = () => {
    setCertId('');
    setCertType('');
    setHolderName('');
    setIssuerName('');
    setCertFile(null);
    setFieldErrors({});
    setServerError(null);
    setSuccessData(null);
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

  // Download QR code canvas as high-resolution PNG image
  const handleDownloadQR = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    const resolvedCertId = successData?.certificateId || successData?.certificate_id || certId || 'CERTIFICATE';
    const imageUri = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = imageUri;
    downloadLink.download = `QR-${resolvedCertId}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Success view (Receipt view styled as an officially stamped & verified ledger entry)
  if (successData) {
    const issuedId = successData.certificateId || successData.certificate_id || certId;

    return (
      <main className="min-h-screen bg-[var(--color-parchment-bg)] py-12 px-4 flex justify-center items-center font-['EB_Garamond']">
        <div className="w-full max-w-2xl bg-[var(--color-parchment-paper)] border-4 border-double border-[var(--color-brass)] p-8 sm:p-12 relative shadow-lg">
          
          {/* Official Registry Header Stamp */}
          <div className="text-center border-b border-[var(--color-brass-border)] pb-6 mb-8">
            <div className="inline-flex items-center gap-2 text-xs font-['Cinzel'] font-bold tracking-[0.2em] text-[var(--color-brass)] uppercase mb-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-verdigris)]"></span>
              National Cryptographic Registry — Verification Receipt
              <span className="w-2 h-2 rounded-full bg-[var(--color-verdigris)]"></span>
            </div>
            <h1 className="font-['Cinzel'] text-2xl sm:text-3xl font-bold text-[var(--color-verdigris)] tracking-wide mb-1">
              Certificate Official Entry Recorded
            </h1>
            <p className="text-sm text-[var(--color-ink-muted)] italic">
              The document payload has been hashed and permanently committed to the blockchain ledger.
            </p>
          </div>

          {/* Receipt Data Ledger */}
          <div className="border border-[var(--color-parchment-border)] bg-[var(--color-brass-light)] p-6 mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--color-parchment-border)] pb-3">
              <span className="font-['Cinzel'] text-xs font-semibold tracking-wider text-[var(--color-ink-muted)] uppercase">
                Certificate Registry ID
              </span>
              <span className="font-['JetBrains_Mono'] text-sm font-semibold text-[var(--color-ink-primary)] mt-1 sm:mt-0">
                {issuedId}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-[var(--color-parchment-border)] pb-3">
              <span className="font-['Cinzel'] text-xs font-semibold tracking-wider text-[var(--color-ink-muted)] uppercase mt-1">
                Document Cryptographic Hash
              </span>
              <span className="font-['JetBrains_Mono'] text-xs font-medium text-[var(--color-ink-primary)] break-all max-w-sm text-right mt-1 sm:mt-0">
                {successData.documentHash || successData.document_hash || '—'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between">
              <span className="font-['Cinzel'] text-xs font-semibold tracking-wider text-[var(--color-verdigris)] uppercase mt-1">
                Blockchain Transaction Hash
              </span>
              <span className="font-['JetBrains_Mono'] text-xs font-semibold text-[var(--color-verdigris)] break-all max-w-sm text-right mt-1 sm:mt-0">
                {successData.txHash || successData.tx_hash || successData.transactionHash || '—'}
              </span>
            </div>
          </div>

          {/* Official QR Code Security Stamp Box */}
          <div className="border border-[var(--color-brass-border)] bg-[var(--color-brass-light)] p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-inner">
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-['Cinzel'] font-bold tracking-wider text-[var(--color-brass)] uppercase mb-1">
                <span>🛡️</span> Official Security QR Stamp
              </div>
              <p className="text-xs text-[var(--color-ink-muted)] max-w-xs mb-4">
                Encodes the official Certificate ID for rapid optical verification on the public verification portal.
              </p>
              <button
                type="button"
                onClick={handleDownloadQR}
                className="inline-flex items-center gap-2 bg-white hover:bg-[var(--color-brass-light)] text-[var(--color-ink-primary)] font-['Cinzel'] text-xs font-bold tracking-wider uppercase px-4 py-2 border border-[var(--color-brass)] shadow-xs transition-colors duration-150 cursor-pointer"
              >
                <span>📥</span> Download QR Code
              </button>
            </div>

            <div className="relative p-3 bg-white border-2 border-[var(--color-brass)] shadow-md flex flex-col items-center">
              <QRCodeCanvas
                ref={qrCanvasRef}
                value={issuedId}
                size={136}
                level="H"
                marginSize={1}
                fgColor="#1C1917"
                bgColor="#FFFFFF"
              />
              <span className="mt-2 text-[10px] font-['JetBrains_Mono'] text-[var(--color-ink-muted)] uppercase tracking-wider font-semibold">
                {issuedId}
              </span>
            </div>
          </div>

          {/* Official Verification Seal Visual Detail */}
          <div className="flex items-center justify-between border-t border-[var(--color-brass-border)] pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-[var(--color-verdigris)] flex items-center justify-center text-[var(--color-verdigris)] font-['Cinzel'] text-xs font-bold bg-[var(--color-verdigris-light)]">
                VERIFIED
              </div>
              <div className="text-xs text-[var(--color-ink-muted)]">
                <p className="font-semibold text-[var(--color-ink-primary)] font-['Cinzel']">Immutable Record</p>
                <p>Status: Active on Ledger</p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="font-['Cinzel'] text-xs font-bold tracking-wider uppercase text-[var(--color-oxblood)] border border-[var(--color-oxblood)] hover:bg-[var(--color-oxblood)] hover:text-white px-5 py-2.5 transition-colors duration-150 cursor-pointer"
            >
              ← Issue Another Certificate
            </button>
          </div>

        </div>
      </main>
    );
  }

  // Primary Certificate Issuance Form View
  return (
    <main className="min-h-screen bg-[var(--color-parchment-bg)] py-10 px-4 flex justify-center items-center font-['EB_Garamond']">
      {/* Official Certificate Form Container */}
      <div className="w-full max-w-2xl bg-[var(--color-parchment-paper)] border-4 border-double border-[var(--color-brass)] p-8 sm:p-12 relative shadow-md">
        
        {/* Certificate Header Banner */}
        <header className="text-center border-b-2 border-[var(--color-ink-primary)] pb-6 mb-8">
          <div className="text-[11px] font-['Cinzel'] font-bold tracking-[0.25em] text-[var(--color-brass)] uppercase mb-2">
            Republic Document Registry · Form CR-2026
          </div>
          <h1 className="font-['Cinzel'] text-2xl sm:text-3xl font-bold text-[var(--color-ink-primary)] tracking-wide mb-2">
            Certificate Registry Entry
          </h1>
          <p className="text-sm text-[var(--color-ink-muted)] italic max-w-md mx-auto">
            Official registration interface for anchoring verified government certificates to the public cryptographic ledger.
          </p>
        </header>

        {/* Server Error Alert Block */}
        {serverError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-[var(--color-oxblood)] text-[var(--color-oxblood)] text-sm font-['Plus_Jakarta_Sans']">
            <div className="font-bold font-['Cinzel'] uppercase tracking-wider text-xs mb-1">
              Registration Error Notice
            </div>
            <p>{serverError}</p>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          
          {/* Certificate ID Field */}
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label htmlFor="certId" className="font-['Cinzel'] text-xs font-bold tracking-wider text-[var(--color-ink-primary)] uppercase">
                Certificate ID <span className="text-[var(--color-oxblood)]">*</span>
              </label>
              <span className="font-['JetBrains_Mono'] text-[11px] text-[var(--color-ink-faint)]">
                [Unique Serial]
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

          {/* Certificate Type Dropdown */}
          <div>
            <label htmlFor="certType" className="block font-['Cinzel'] text-xs font-bold tracking-wider text-[var(--color-ink-primary)] uppercase mb-1">
              Certificate Category <span className="text-[var(--color-oxblood)]">*</span>
            </label>
            <select
              id="certType"
              value={certType}
              onChange={(e) => {
                setCertType(e.target.value);
                if (fieldErrors.certType) setFieldErrors((p) => ({ ...p, certType: undefined }));
              }}
              className={`w-full bg-white border ${
                fieldErrors.certType ? 'border-[var(--color-oxblood)] ring-1 ring-[var(--color-oxblood)]' : 'border-[var(--color-parchment-border)]'
              } focus:border-[var(--color-brass)] focus:ring-1 focus:ring-[var(--color-brass)] px-4 py-2.5 font-['Plus_Jakarta_Sans'] text-sm text-[var(--color-ink-primary)] outline-none transition-all`}
            >
              <option value="" disabled>Select Official Certificate Type…</option>
              {CERTIFICATE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {fieldErrors.certType && (
              <p className="mt-1 text-xs text-[var(--color-oxblood)] font-['Plus_Jakarta_Sans']">
                {fieldErrors.certType}
              </p>
            )}
          </div>

          {/* Holder Name Field */}
          <div>
            <label htmlFor="holderName" className="block font-['Cinzel'] text-xs font-bold tracking-wider text-[var(--color-ink-primary)] uppercase mb-1">
              Holder Full Name <span className="text-[var(--color-oxblood)]">*</span>
            </label>
            <input
              id="holderName"
              type="text"
              value={holderName}
              onChange={(e) => {
                setHolderName(e.target.value);
                if (fieldErrors.holderName) setFieldErrors((p) => ({ ...p, holderName: undefined }));
              }}
              placeholder="Legal full name as specified on official record"
              className={`w-full bg-white border ${
                fieldErrors.holderName ? 'border-[var(--color-oxblood)] ring-1 ring-[var(--color-oxblood)]' : 'border-[var(--color-parchment-border)]'
              } focus:border-[var(--color-brass)] focus:ring-1 focus:ring-[var(--color-brass)] px-4 py-2.5 font-['Plus_Jakarta_Sans'] text-sm text-[var(--color-ink-primary)] placeholder-[var(--color-ink-faint)] outline-none transition-all`}
            />
            {fieldErrors.holderName && (
              <p className="mt-1 text-xs text-[var(--color-oxblood)] font-['Plus_Jakarta_Sans']">
                {fieldErrors.holderName}
              </p>
            )}
          </div>

          {/* Issuer Name Field */}
          <div>
            <label htmlFor="issuerName" className="block font-['Cinzel'] text-xs font-bold tracking-wider text-[var(--color-ink-primary)] uppercase mb-1">
              Issuing Agency / Authority <span className="text-[var(--color-oxblood)]">*</span>
            </label>
            <input
              id="issuerName"
              type="text"
              value={issuerName}
              onChange={(e) => {
                setIssuerName(e.target.value);
                if (fieldErrors.issuerName) setFieldErrors((p) => ({ ...p, issuerName: undefined }));
              }}
              placeholder="e.g. Department of Revenue & Civil Records"
              className={`w-full bg-white border ${
                fieldErrors.issuerName ? 'border-[var(--color-oxblood)] ring-1 ring-[var(--color-oxblood)]' : 'border-[var(--color-parchment-border)]'
              } focus:border-[var(--color-brass)] focus:ring-1 focus:ring-[var(--color-brass)] px-4 py-2.5 font-['Plus_Jakarta_Sans'] text-sm text-[var(--color-ink-primary)] placeholder-[var(--color-ink-faint)] outline-none transition-all`}
            />
            {fieldErrors.issuerName && (
              <p className="mt-1 text-xs text-[var(--color-oxblood)] font-['Plus_Jakarta_Sans']">
                {fieldErrors.issuerName}
              </p>
            )}
          </div>

          {/* Certificate PDF Upload */}
          <div>
            <label htmlFor="certFile" className="block font-['Cinzel'] text-xs font-bold tracking-wider text-[var(--color-ink-primary)] uppercase mb-1">
              Official Document Payload (.pdf) <span className="text-[var(--color-oxblood)]">*</span>
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
                <div className="text-xl">📜</div>
                <div className="font-['Cinzel'] text-xs font-bold text-[var(--color-ink-primary)]">
                  {certFile ? certFile.name : 'Attach Certified PDF Document'}
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
              Official Attestation & Seal
            </span>
          </div>

          {/* Submission Action Area with Signature Visual Detail (Wax Seal Stamp) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            
            {/* Signature Visual Detail: Wax Seal Emblem */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-[var(--color-oxblood)] bg-[var(--color-oxblood)] text-white flex items-center justify-center font-['Cinzel'] text-[10px] font-bold tracking-tighter text-center leading-tight shadow-inner">
                SEAL
              </div>
              <div className="text-xs text-[var(--color-ink-muted)]">
                <p className="font-semibold text-[var(--color-ink-primary)] font-['Cinzel']">Cryptographic Registration</p>
                <p>Immutable Ledger Entry</p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[var(--color-oxblood)] hover:bg-[var(--color-oxblood-hover)] text-white font-['Cinzel'] text-xs font-bold tracking-widest uppercase px-8 py-3.5 border border-amber-900 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && (
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
              )}
              {isLoading ? 'Recording on Ledger…' : 'Issue & Seal Certificate'}
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
