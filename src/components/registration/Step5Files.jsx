// PATH: /src/components/registration/Step5Files.jsx
// Replaces: #step-5 panel in SP/html/form1.html
// Props: fields, setFields, files, setFiles, children (NavRow with submit button)
// Schema: provider_files.file_type ENUM('national_id','national_id_back','photo','secondary_id','certificate')

'use client';

import { useState } from 'react';

// ── Upload zone config — keys match provider_files.file_type exactly ──
const UPLOAD_ZONES = [
  {
    key:      'file_national_id',         // FormData key → registerProvider extracts this
    fileType: 'national_id',              // provider_files.file_type value
    icon:     '🪪',
    title:    'National ID (Front)',
    hint:     'PhilSys / PSA — front side',
    required: true,
    accept:   '.jpg,.jpeg,.png,.pdf',
  },
  {
    key:      'file_national_id_back',
    fileType: 'national_id_back',
    icon:     '🪪',
    title:    'National ID (Back)',
    hint:     'Clear photo of the back side',
    required: true,
    accept:   '.jpg,.jpeg,.png,.pdf',
  },
  {
    key:      'file_photo',
    fileType: 'photo',
    icon:     '📷',
    title:    '2×2 ID Photo',
    hint:     'Recent photo, white background',
    required: true,
    accept:   '.jpg,.jpeg,.png',
  },
  {
    key:      'file_certificate',
    fileType: 'certificate',
    icon:     '📜',
    title:    'Trade Certificate / TESDA NC',
    hint:     'TESDA NC or any trade qualification (optional)',
    required: false,
    accept:   '.jpg,.jpeg,.png,.pdf',
  },
];

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB — mirrors register_sp.php MAX_FILE_BYTES

export default function Step5Files({ fields, setFields, files, setFiles, children }) {

  // Per-zone feedback: { key: { text, isOk, isError } }
  const [previews, setPreviews] = useState({});

  function handleFileChange(zoneKey, e) {
    const file = e.target.files?.[0] ?? null;

    if (!file) {
      setFiles((prev) => ({ ...prev, [zoneKey]: null }));
      setPreviews((prev) => ({ ...prev, [zoneKey]: null }));
      return;
    }

    // ── Client-side size guard (mirrors register_sp.php processUpload) ──
    if (file.size > MAX_BYTES) {
      setFiles((prev) => ({ ...prev, [zoneKey]: null }));
      setPreviews((prev) => ({
        ...prev,
        [zoneKey]: { text: '✗ File too large (max 5 MB)', isError: true, isOk: false },
      }));
      e.target.value = ''; // reset input
      return;
    }

    setFiles((prev) => ({ ...prev, [zoneKey]: file }));

    const sizeKB = (file.size / 1024).toFixed(0);

    // ── Image thumbnail preview (mirrors sp_steps.js fileChosen) ──
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviews((prev) => ({
          ...prev,
          [zoneKey]: { imgSrc: ev.target.result, text: `✓ ${file.name} (${sizeKB} KB)`, isOk: true },
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setPreviews((prev) => ({
        ...prev,
        [zoneKey]: { text: `✓ ${file.name} (${sizeKB} KB)`, isOk: true },
      }));
    }
  }

  return (
    <div className="page-container step-panel" id="step-5">

      <div className="section-header"><strong>FILE ATTACHMENT</strong></div>
      <p className="step-intro-text">
        Upload clear, legible copies of your IDs and credentials.
        Accepted: <strong>JPG, PNG, PDF</strong>. Max: <strong>5 MB per file</strong>.
      </p>

      <div className="upload-grid">
        {UPLOAD_ZONES.map(({ key, icon, title, hint, required, accept }) => {
          const preview  = previews[key];
          const hasFile  = !!files[key];
          const zoneClass = `upload-zone${hasFile ? ' file-ok' : ''}`;

          return (
            <div key={key} className={zoneClass} id={`zone-${key}`}>
              <span className="upload-zone-icon">{icon}</span>
              <p className="upload-zone-title">
                {title} {required && <span className="req">*</span>}
              </p>
              <p className="upload-zone-hint">{hint}</p>

              <label className="btn-file-choose">
                Choose File
                <input
                  type="file"
                  name={key}
                  accept={accept}
                  hidden
                  onChange={(e) => handleFileChange(key, e)}
                />
              </label>

              {/* Feedback: thumbnail or filename */}
              {preview?.imgSrc ? (
                <img
                  src={preview.imgSrc}
                  alt="preview"
                  style={{
                    maxHeight: 52,
                    maxWidth: '100%',
                    borderRadius: 4,
                    marginTop: 4,
                    border: '1px solid #ccc',
                  }}
                />
              ) : (
                <p
                  className="upload-prev-name"
                  style={{ color: preview?.isError ? 'var(--sp-red)' : 'var(--sp-teal)' }}
                >
                  {preview?.text ?? ''}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Certification checkbox ── */}
      <div className="terms-block">
        <label className="terms-check-label">
          <input
            type="checkbox"
            id="terms_agreed"
            checked={!!fields.terms_agreed}
            onChange={(e) =>
              setFields((prev) => ({ ...prev, terms_agreed: e.target.checked }))
            }
            style={{ accentColor: '#0504AA' }}
          />
          I certify that all information I have provided is true and accurate.
          I understand that false information may result in disqualification
          and permanent removal from the CommuniServe registry.
        </label>
      </div>

      {/* NavRow (with submit button) injected by page.js */}
      {children}

      {/* Success state — page.js conditionally renders SuccessBanner instead */}
      <div id="submitSuccess" style={{ display: 'none' }} />
    </div>
  );
}