// PATH: /src/components/admin/SPDetailsModal.jsx
// Replaces: #spDetailsModal from admin_dashboard.html + populateModal() from admin_dashboard.js
// Renders full provider profile: personal info grid, professional grid, document previews.

'use client';

export default function SPDetailsModal({
  provider,
  onClose,
  onApprove,
  onReject,
  actionState,
  readOnly = false,
}) {
  if (!provider) return null;

  const isBusy = actionState === 'approving' || actionState === 'rejecting';

  // ── Field definitions — mirrors renderInfoGrid() from admin_dashboard.js ──
  const personalFields = [
    { label: 'Full Name',         value: provider.full_name },
    { label: 'Email',             value: provider.email },
    { label: 'Contact Number',    value: provider.contact_number },
    { label: 'Date of Birth',     value: formatDate(provider.date_of_birth) },
    { label: 'Age',               value: provider.age },
    { label: 'Sex',               value: provider.sex },
    { label: 'Civil Status',      value: provider.civil_status },
    { label: 'Present Address',   value: [provider.pres_street, provider.pres_barangay, provider.pres_city, provider.pres_province].filter(Boolean).join(', ') },
    { label: 'Permanent Address', value: [provider.perm_street, provider.perm_barangay, provider.perm_city, provider.perm_province].filter(Boolean).join(', ') },
    { label: "Father's Name",     value: provider.father_name },
    { label: "Father's Contact",  value: provider.father_contact },
    { label: "Mother's Name",     value: provider.mother_name },
    { label: "Mother's Contact",  value: provider.mother_contact },
  ];

  const professionalFields = [
    { label: 'Trade / Skill',       value: provider.trade },
    { label: 'Barangay',            value: provider.barangay },
    { label: 'Employment Status',   value: provider.employment_status },
    { label: 'Employment Type',     value: provider.employment_type },
    { label: 'Highest Education',   value: provider.highest_education },
    { label: 'School Last Attended',value: provider.school_last_attended },
    { label: 'Course Completed',    value: provider.course_completed },
    { label: 'Year Graduated',      value: provider.year_graduated },
    { label: 'Work History',        value: provider.employment_history },
    { label: 'Date Submitted',      value: formatDate(provider.date_submitted) },
  ];

  const socioFields = [
    { label: '4Ps Beneficiary', value: provider.is_4ps_beneficiary },
    { label: 'Indigent',        value: provider.is_indigent },
    { label: 'PWD',             value: provider.is_pwd },
    { label: 'Senior Citizen',  value: provider.is_senior_citizen },
    { label: 'Solo Parent',     value: provider.is_solo_parent },
  ].filter((f) => f.value === true);

  return (
    // ── Backdrop ──
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      {/* ── Modal Box ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 12,
          width: '100%', maxWidth: 760,
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          background: '#0504AA', color: '#fff',
          padding: '16px 22px',
          borderRadius: '12px 12px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              👤 {provider.full_name}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
              {provider.trade} · Applicant Review
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none',
              color: '#fff', borderRadius: 6,
              padding: '4px 10px', cursor: 'pointer', fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 24px', background: '#fafafa', flex: 1 }}>

          {/* 2x2 Photo */}
          {provider.photo && (
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <img
                src={provider.photo}
                alt="2x2 ID Photo"
                style={{
                  width: 100, height: 100, borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #0504AA',
                  boxShadow: '0 4px 12px rgba(5,4,170,0.2)',
                }}
              />
            </div>
          )}

          {/* Socio-Economic Tags */}
          {socioFields.length > 0 && (
            <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {socioFields.map(({ label }) => (
                <span key={label} style={{
                  background: '#eef0ff', color: '#0504AA',
                  fontSize: 11, fontWeight: 700,
                  padding: '3px 10px', borderRadius: 20,
                }}>
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Personal Information */}
          <SectionLabel>Personal Information</SectionLabel>
          <InfoGrid fields={personalFields} />

          {/* Professional Profile */}
          <SectionLabel>Professional Profile</SectionLabel>
          <InfoGrid fields={professionalFields} />

          {/* Uploaded Documents */}
          <SectionLabel>Uploaded Documents</SectionLabel>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}>
            <DocSlot
              label="National ID — Front"
              url={provider.national_id_front}
              fileName={provider.national_id_front_name}
            />
            <DocSlot
              label="National ID — Back"
              url={provider.national_id_back}
              fileName={provider.national_id_back_name}
            />
            <div style={{ gridColumn: '1 / -1' }}>
              <DocSlot
                label="Trade Certificate / TESDA NC (Optional)"
                url={provider.certificate}
                fileName={null}
                tall
              />
            </div>
          </div>

        </div>

        {/* Footer — action buttons */}
        {!readOnly && (
          <div style={{
            padding: '14px 22px',
            borderTop: '1px solid #eee',
            display: 'flex', justifyContent: 'flex-end', gap: 10,
            background: '#fff',
            borderRadius: '0 0 12px 12px',
            flexShrink: 0,
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 18px', borderRadius: 6, cursor: 'pointer',
                background: 'transparent', border: '2px solid #ccc',
                fontWeight: 600, fontSize: 13, color: '#555',
              }}
            >
              Close
            </button>
            <button
              type="button"
              onClick={onReject}
              disabled={isBusy}
              style={{
                padding: '8px 18px', borderRadius: 6, cursor: isBusy ? 'not-allowed' : 'pointer',
                background: '#E24B4A', border: 'none',
                color: '#fff', fontWeight: 600, fontSize: 13,
                opacity: isBusy ? 0.6 : 1,
              }}
            >
              {actionState === 'rejecting' ? 'Rejecting…' : '✕ Reject'}
            </button>
            <button
              type="button"
              onClick={onApprove}
              disabled={isBusy}
              style={{
                padding: '8px 18px', borderRadius: 6, cursor: isBusy ? 'not-allowed' : 'pointer',
                background: '#1D9E75', border: 'none',
                color: '#fff', fontWeight: 600, fontSize: 13,
                opacity: isBusy ? 0.6 : 1,
              }}
            >
              {actionState === 'approving' ? 'Approving…' : '✓ Approve'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.8px', color: '#0504AA',
      borderBottom: '2px solid #e8e8f5', paddingBottom: 6,
      marginBottom: 14, marginTop: 20,
    }}>
      {children}
    </p>
  );
}

function InfoGrid({ fields }) {
  const visible = fields.filter((f) => f.value !== null && f.value !== undefined && String(f.value).trim() !== '');
  if (!visible.length) return <p style={{ fontSize: 13, color: '#aaa' }}>No data on record.</p>;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      gap: '10px 20px', marginBottom: 6,
    }}>
      {visible.map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{
            fontSize: 10, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.5px', color: '#888',
          }}>
            {label}
          </span>
          <span style={{ fontSize: 14, color: '#222', fontWeight: 500 }}>
            {String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function DocSlot({ label, url, fileName, tall = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{
        fontSize: 11, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555',
      }}>
        {label}
      </span>
      <div style={{
        border: '2px dashed #cdd1e8', borderRadius: 8,
        height: tall ? 200 : 160,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#f4f6ff', overflow: 'hidden', gap: 6,
      }}>
        {url ? (
          <>
            <img
              src={url}
              alt={label}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 28 }}>📄</span>
              <a 
                href={url}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12, color: '#0504AA', fontWeight: 600 }}
              >
                {fileName ?? 'Open Document'}
              </a>
            </div>
          </>
        ) : (
          <>
            <span style={{ fontSize: 28, color: '#ccc' }}>📂</span>
            <span style={{ fontSize: 12, color: '#aaa' }}>Not uploaded</span>
          </>
        )}
      </div>
      {url && fileName && (
        <a 
          href={url}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 11, color: '#0504AA', textDecoration: 'none', fontWeight: 600 }}
        >
          ↗ Open full size
        </a>
      )}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}