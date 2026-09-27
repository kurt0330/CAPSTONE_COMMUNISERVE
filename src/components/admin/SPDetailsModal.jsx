// PATH: /src/components/admin/SPDetailsModal.jsx
// Renders full provider profile along with calculated skill assessment metrics.

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Icon from '@/components/ui/Icon';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SPDetailsModal({
  provider,
  onClose,
  onApprove,
  onReject,
  actionState,
  readOnly = false,
}) {
  const [assessment, setAssessment] = useState(null);
  const [loadingAssessment, setLoadingAssessment] = useState(false);

  useEffect(() => {
    if (!provider?.provider_id) {
      setAssessment(null);
      return;
    }
    
    async function fetchScore() {
      setLoadingAssessment(true);
      
      // Fixed: Removed 'responses' because it does not exist in your SQL schema table
      const { data, error } = await supabase
        .from('assessment_attempts')
        .select('score_raw, score_pct, passed')
        .eq('provider_id', provider.provider_id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setAssessment(data);
      } else {
        if (error) console.error("Error fetching assessment database rows:", error.message);
        setAssessment(null);
      }
      setLoadingAssessment(false);
    }

    fetchScore();
  }, [provider?.provider_id]);

  if (!provider) return null;

  const isBusy = actionState === 'approving' || actionState === 'rejecting';

  // ── Field definitions — mappings matching your dashboard dataset ──
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

  // ── ALGORITHM: Mathematically Calculate Exam Denominator from raw & pct ──
  let totalItems = 0;
  let displayPercentage = 0;

  if (assessment) {
    if (assessment.score_pct > 0 && assessment.score_raw > 0) {
      totalItems = Math.round((assessment.score_raw / (assessment.score_pct / 100)));
    }
    displayPercentage = assessment.score_pct ? Math.round(assessment.score_pct) : 0;
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(17,24,39,0.45)',
        zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16,
          width: '100%', maxWidth: 760,
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: 'var(--cs-shadow-lg)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Modal Header */}
        <div style={{
          background: 'var(--cs-primary)', color: '#fff',
          padding: '16px 22px',
          borderRadius: '12px 12px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="user" size="md" /> {provider.full_name}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
              {provider.trade || 'Service Provider'} · Applicant Review
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none',
              color: '#fff', borderRadius: 10,
              padding: '4px 10px', cursor: 'pointer', fontSize: 16,
            }}
            aria-label="Close"
          >
            <Icon name="close" size="sm" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div style={{ padding: '22px 24px', background: 'var(--cs-bg)', flex: 1 }}>

          {provider.photo && (
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <img
                src={provider.photo}
                alt="Profile"
                style={{
                  width: 100, height: 100, borderRadius: '50%',
                  objectFit: 'cover', border: '3px solid var(--cs-primary)',
                }}
              />
            </div>
          )}

          {socioFields.length > 0 && (
            <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {socioFields.map(({ label }) => (
                <span key={label} style={{
                  background: 'var(--cs-primary-tint)', color: 'var(--cs-primary)',
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                }}>
                  {label}
                </span>
              ))}
            </div>
          )}

          <SectionLabel>Personal Information</SectionLabel>
          <InfoGrid fields={personalFields} />

          <SectionLabel>Professional Profile</SectionLabel>
          <InfoGrid fields={professionalFields} />

          {/* 📂 Uploaded Documents Section */}
          <SectionLabel>Uploaded Documents</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <DocSlot label="National ID — Front" url={provider.national_id_front} fileName={provider.national_id_front_name} />
            <DocSlot label="National ID — Back" url={provider.national_id_back} fileName={provider.national_id_back_name} />
            <DocSlot label="Supporting Doc (NCII, etc.)" url={provider.certificate} fileName={null} />
          </div>

          {/* 📊 Skill Competency Score Display Section */}
          <SectionLabel>Skill Competency Assessment</SectionLabel>
          {loadingAssessment ? (
            <p style={{ fontSize: 13, color: 'var(--cs-text-soft)', margin: 0 }}>Loading test data analytics...</p>
          ) : assessment ? (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '10px 20px', marginBottom: 6,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--cs-text-muted)' }}>
                  Exam Score (Raw / Total Items)
                </span>
                <span style={{ fontSize: 16, color: 'var(--cs-primary)', fontWeight: 700 }}>
                  {Math.round(assessment.score_raw)} / {totalItems || '—'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--cs-text-muted)' }}>
                  Passing Percentage
                </span>
                <span style={{ fontSize: 16, color: 'var(--cs-primary)', fontWeight: 700 }}>
                  {displayPercentage}%
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, gridColumn: '1 / -1' }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--cs-text-muted)' }}>
                  Assessment Status
                </span>
                <span style={{ 
                  display: 'inline-flex', padding: '4px 12px', borderRadius: 20,
                  fontSize: 12, fontWeight: 700, width: 'max-content',
                  background: assessment.passed ? 'var(--cs-success-tint)' : 'var(--cs-danger-tint)',
                  color: assessment.passed ? 'var(--cs-success)' : 'var(--cs-danger)',
                  marginTop: 2
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Icon name={assessment.passed ? 'check' : 'close'} size="xs" />
                    {assessment.passed ? 'PASSED ASSESSMENT' : 'FAILED ASSESSMENT'}
                  </span>
                </span>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--cs-text-muted)', backgroundColor: 'var(--cs-warning-tint)', padding: '10px', borderRadius: '10px', border: '1px solid var(--cs-warning-tint)', margin: 0 }}>
              <Icon name="warning" size="sm" style={{ color: 'var(--cs-warning)', marginRight: 6 }} />
              No test scores found in database mapping to Provider ID: <strong>{provider.provider_id}</strong>.
            </p>
          )}

        </div>

        {/* Action Buttons Footer */}
        {!readOnly && (
          <div style={{
            padding: '14px 22px', borderTop: '1px solid var(--cs-border)',
            display: 'flex', justifyContent: 'flex-end', gap: 10,
            background: '#fff', borderRadius: '0 0 12px 12px', flexShrink: 0,
          }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 18px', borderRadius: 10, background: 'transparent', border: '2px solid var(--cs-border-strong)', fontWeight: 600, fontSize: 13, color: 'var(--cs-text-muted)', cursor: 'pointer' }}>
              Close
            </button>
            <button type="button" onClick={onReject} disabled={isBusy} style={{ padding: '8px 18px', borderRadius: 10, background: 'var(--cs-danger)', border: 'none', color: '#fff', fontWeight: 600, fontSize: 13, opacity: isBusy ? 0.6 : 1, cursor: 'pointer' }}>
              {actionState === 'rejecting' ? 'Rejecting…' : <><Icon name="close" size="xs" style={{ marginRight: 6 }} />Reject</>}
            </button>
            <button type="button" onClick={onApprove} disabled={isBusy} style={{ padding: '8px 18px', borderRadius: 10, background: 'var(--cs-success)', border: 'none', color: '#fff', fontWeight: 600, fontSize: 13, opacity: isBusy ? 0.6 : 1, cursor: 'pointer' }}>
              {actionState === 'approving' ? 'Approving…' : <><Icon name="check" size="xs" style={{ marginRight: 6 }} />Approve</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--cs-primary)', borderBottom: '2px solid var(--cs-border)', paddingBottom: 6, marginBottom: 14, marginTop: 20 }}>
      {children}
    </p>
  );
}

function InfoGrid({ fields }) {
  const visible = fields.filter((f) => f.value !== null && f.value !== undefined && String(f.value).trim() !== '');
  if (!visible.length) return <p style={{ fontSize: 13, color: 'var(--cs-text-soft)' }}>No data on record.</p>;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', marginBottom: 6 }}>
      {visible.map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--cs-text-muted)' }}>{label}</span>
          <span style={{ fontSize: 14, color: 'var(--cs-text)', fontWeight: 500 }}>{String(value)}</span>
        </div>
      ))}
    </div>
  );
}

function DocSlot({ label, url, fileName }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--cs-text-muted)' }}>{label}</span>
      <div style={{ border: '2px dashed var(--cs-border-strong)', borderRadius: 8, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cs-bg)', overflow: 'hidden' }}>
        {url ? (
          <>
            <img 
              src={url} 
              alt={label} 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <Icon name="file" size="xl" style={{ color: 'var(--cs-text-muted)' }} />
              <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--cs-primary)', fontWeight: 600, textAlign: 'center' }}>
                Open Document
              </a>
            </div>
          </>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--cs-text-soft)' }}>Not uploaded</span>
        )}
      </div>
      {url && (
        <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--cs-primary)', textDecoration: 'none', fontWeight: 600, alignSelf: 'center' }}>
          <Icon name="external-link" size="xs" style={{ marginRight: 4 }} />Open full size
        </a>
      )}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return isNaN(d) ? dateStr : d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}