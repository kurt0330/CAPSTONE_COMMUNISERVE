// PATH: /src/app/register/provider/page.js
// Role: Main registration wizard orchestrator — Provider Registration Module
// Wired to: /src/actions/registerProvider.js (real Supabase submission)

'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import MainHeader        from '@/components/ui/MainHeader';
import StepProgressBar   from '@/components/ui/StepProgressBar';
import Step1Personal     from '@/components/registration/Step1Personal';
import Step2Employment   from '@/components/registration/Step2Employment';
import Step3Trade        from '@/components/registration/Step3Trade';
import Step4Assessment   from '@/components/registration/Step4Assessment';
import Step5Files        from '@/components/registration/Step5Files';
import { useStepValidation } from '@/hooks/useStepValidation';
import { completeEmail } from '@/lib/email';

// ── Initial field state — every key maps 1-to-1 with registerProvider.js ──
const INITIAL_FIELDS = {
  // nsrp_details
  last_name:            '',
  first_name:           '',
  middle_name:          '',
  suffix:               '',
  date_of_birth:        '',
  age:                  '',
  sex:                  '',
  civil_status:         '',
  pres_street:          '',
  pres_barangay:        '',
  pres_city:            'Anini-y',
  pres_province:        'Antique',
  perm_street:          '',
  perm_barangay:        '',
  perm_city:            '',
  perm_province:        '',
  same_as_permanent:    false,
  father_name:          '',
  father_contact:       '',
  mother_name:          '',
  mother_contact:       '',
  parents_civil_status: '',
  is_4ps_beneficiary:   false,
  is_indigent:          false,
  is_pwd:               false,
  is_senior_citizen:    false,
  is_solo_parent:       false,
  // users
  contact_number:       '',
  email:                '',
  // employment_details
  employment_status:    '',
  employment_type:      '',
  unemployment_reason:  '',
  self_employed_spec:   '',
  highest_education:    '',
  school_last_attended: '',
  course_completed:     '',
  year_graduated:       '',
  employment_history:   '',
  // providers
  trade_category:       '',
  // step 4 assessment states (Newly Added for Live Tracking)
  assessment_answers:    {},
  assessment_test_id:    null,
  assessment_started_at: null,
  assessment_skipped:    false,
  // step 5
  // provider_identity.national_id_pin — the National ID card number (BR-17)
  national_id_pin:      '',
  terms_agreed:         false,
};

const INITIAL_FILES = {
  file_national_id:      null,   // National ID — front
  file_national_id_back: null,   // National ID — back
  file_photo:            null,
  file_certificate:      null,
};

// The whole submission travels in one request. Vercel caps a request body at
// about 4.5 MB, so stop here with a clear message instead of a network error.
const MAX_TOTAL_UPLOAD_BYTES = 4 * 1024 * 1024;

// ── Full linear navigation map including Step 4 ──────────────────────────────
const STEP_SEQUENCE = [1, 2, 3, 4, 5];

export default function ProviderRegistrationPage() {
  const [currentStep,     setCurrentStep]  = useState(1);
  const [completedSteps,  setCompleted]    = useState([]);
  const [toast,           setToast]        = useState({ msg: '', type: 'error' });
  const [isSubmitting,    setSubmitting]   = useState(false);
  const [submitResult,    setSubmitResult] = useState(null); // null | { success, message, errors }
  const [fields,          setFields]       = useState(INITIAL_FIELDS);
  const [files,           setFiles]        = useState(INITIAL_FILES);

  const { validateStep } = useStepValidation();

  // ── offline persistence: Load/Hydrate data from localStorage on Mount ──
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFields = localStorage.getItem('communiserve_registration_fields');
      if (savedFields) {
        try {
          const parsed = JSON.parse(savedFields);
          // Merge with initial fields to prevent errors if keys change down the line
          setFields((prev) => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('[CommuniServe] Error parsing cached registration fields:', e);
        }
      }
    }
  }, []);

  // ── offline persistence: Synchronize changes to localStorage immediately ──
  useEffect(() => {
    if (typeof window !== 'undefined' && fields !== INITIAL_FIELDS) {
      localStorage.setItem('communiserve_registration_fields', JSON.stringify(fields));
    }
  }, [fields]);

  // ── Toast ─────────────────────────────────────────────────────────────
  function showToast(msg, type = 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'error' }), 4000);
  }

  // ── Navigation ────────────────────────────────────────────────────────
  function goToStep(target) {
    const movingForward = target > currentStep;

    if (movingForward) {
      // Validate the step we're LEAVING
      const errors = validateStep(currentStep, fields, files);
      if (errors.length > 0) {
        showToast(errors[0]);
        return;
      }

      // Mark current step complete.
      setCompleted((prev) => {
        const next = new Set([...prev, currentStep]);
        return [...next];
      });
    }

    setCurrentStep(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Get next/prev step in the SEQUENCE (not just +1/-1) ───────────────
  function nextStep() {
    const idx = STEP_SEQUENCE.indexOf(currentStep);
    if (idx < STEP_SEQUENCE.length - 1) goToStep(STEP_SEQUENCE[idx + 1]);
  }

  function prevStep() {
    const idx = STEP_SEQUENCE.indexOf(currentStep);
    if (idx > 0) goToStep(STEP_SEQUENCE[idx - 1]);
  }

  // ── Submit ────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const errors = validateStep(5, fields, files);
    if (errors.length > 0) {
      showToast(errors[0]);
      return;
    }

    const totalBytes = Object.values(files).reduce((sum, f) => sum + (f instanceof File ? f.size : 0), 0);
    if (totalBytes > MAX_TOTAL_UPLOAD_BYTES) {
      showToast('Your files are too large to send together (over 4 MB). Please choose a smaller certificate file.');
      return;
    }

    setSubmitting(true);
    setSubmitResult(null);

    try {
      // Build FormData — registerProvider.js extracts via formData.get()
      const fd = new FormData();

      Object.entries(fields).forEach(([k, v]) => {
        if (k === 'email') {
          fd.append(k, completeEmail(v));   // "juan" → "juan@gmail.com"
        } else if (k === 'assessment_answers') {
          // Serialize the nested quiz dictionary cleanly into a string payload
          fd.append(k, JSON.stringify(v));
        } else {
          fd.append(k, typeof v === 'boolean' ? (v ? '1' : '0') : (v ?? ''));
        }
      });

      Object.entries(files).forEach(([k, v]) => {
        if (v instanceof File) fd.append(k, v);
      });

      // Dynamically import the server action to avoid client-bundle inclusion
      const { registerProvider } = await import('@/actions/registerProvider');
      const result = await registerProvider(fd);

      setSubmitResult(result);

      if (result.success) {
        setCompleted([1, 2, 3, 4, 5]);
        // ── offline persistence: Clean up browser storage on successful creation ──
        if (typeof window !== 'undefined') {
          localStorage.removeItem('communiserve_registration_fields');
        }
      } else {
        showToast(result.errors?.[0] ?? 'Submission failed. Please try again.');
      }
    } catch (err) {
      console.error('[CommuniServe] Submit error:', err);
      showToast('A network error occurred. Please check your connection and try again.');
      setSubmitResult({ success: false, errors: [err.message] });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Shared props passed to every step component ───────────────────────
  const stepProps = { fields, setFields, files, setFiles };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <>
      <MainHeader />

      {/* ── Toast notification (error or info) ── */}
      {toast.msg && (
        <div
          className="sp-toast"
          style={
            toast.type === 'success'
              ? { backgroundColor: 'var(--sp-teal)' }
              : undefined
          }
        >
          <Icon name={toast.type === 'error' ? 'warning' : 'check'} size="sm" style={{ marginRight: 6 }} />
          {toast.msg}
        </div>
      )}

      <div className="page-background">

        {/* ── Progress Bar ── */}
        {!submitResult?.success && (
          <StepProgressBar
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        )}

        {/* ════════════════════════════════════════════════════
            STEP PANELS — conditional render mirrors original
            hide/show JS in sp_steps.js
        ════════════════════════════════════════════════════ */}

        {/* Step 1 — Personal Information */}
        {currentStep === 1 && !submitResult?.success && (
          <Step1Personal {...stepProps}>
            <NavRow showBack={false} onNext={nextStep} />
          </Step1Personal>
        )}

        {/* Step 2 — Professional Profile */}
        {currentStep === 2 && !submitResult?.success && (
          <Step2Employment {...stepProps}>
            <NavRow onBack={prevStep} onNext={nextStep} />
          </Step2Employment>
        )}

        {/* Step 3 — Service / Trade Selection */}
        {currentStep === 3 && !submitResult?.success && (
          <Step3Trade {...stepProps}>
            <NavRow onBack={prevStep} onNext={nextStep} />
          </Step3Trade>
        )}

        {/* Step 4 — Competency Assessment (Now Live) */}
        {currentStep === 4 && !submitResult?.success && (
          <Step4Assessment 
            {...stepProps} 
            onNext={nextStep} 
            onBack={prevStep} 
          />
        )}

        {/* Step 5 — File Attachment + Submit */}
        {currentStep === 5 && !submitResult?.success && (
          <Step5Files {...stepProps}>
            <NavRow
              onBack={prevStep}
              showNext={false}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitLabel={isSubmitting ? 'Submitting…' : <>Submit Registration <Icon name="check" size="sm" /></>}
            />
          </Step5Files>
        )}

        {/* ── SUCCESS STATE ── */}
        {submitResult?.success && (
          <SuccessBanner providerId={submitResult.provider_id} />
        )}

        {/* ── DEV-ONLY: Error detail panel ── */}
        {submitResult && !submitResult.success && (
          <ErrorDetailPanel errors={submitResult.errors} />
        )}

      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
//  NAV ROW — Back / Next / Submit
//  Mirrors the .nav-row pattern from sp_steps.css exactly
// ═══════════════════════════════════════════════════════════════
function NavRow({
  showBack     = true,
  onBack,
  showNext     = true,
  onNext,
  nextLabel    = 'Next',
  onSubmit,
  submitLabel,
  isSubmitting = false,
}) {
  return (
    <div className="nav-row">
      {/* Left slot: Back button or spacer */}
      {showBack
        ? (
          <button type="button" className="btn-back" onClick={onBack}>
            <Icon name="chevron-left" size="sm" /> Back
          </button>
        )
        : <div />}

      {/* Right slot: Next OR Submit */}
      {showNext && onNext && (
        <button type="button" className="btn-next" onClick={onNext}>
          {nextLabel} <Icon name="chevron-right" size="sm" />
        </button>
      )}
      {onSubmit && (
        <button
          type="button"
          className="btn-submit"
          onClick={onSubmit}
          disabled={isSubmitting}
          style={isSubmitting ? { opacity: 0.7, cursor: 'not-allowed' } : undefined}
        >
          {isSubmitting && (
            <span style={{ marginRight: 8, display: 'inline-block', animation: 'spin 1s linear infinite' }}>
              ⟳
            </span>
          )}
          {submitLabel}
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SUCCESS BANNER — shown after successful registerProvider call
//  Mirrors .submit-success / .success-circle from sp_steps.css
// ═══════════════════════════════════════════════════════════════
function SuccessBanner({ providerId }) {
  return (
    <div className="page-container step-panel">
      <div className="submit-success">
        <div className="success-circle"><Icon name="check" size="xl" /></div>
        <h2>Application Submitted!</h2>
        <p>
          Your registration has been received by the PESO Office.
          Your skills test score answers have been attached to your system profile file records.
          Your profile goes live once the LGU Admin approves your account.
        </p>

        {/* ── User Feedback: Successful application submission notice ── */}
        {providerId && (
          <div
            style={{
              marginTop: 16,
              padding: '10px 18px',
              background: 'var(--sp-teal-tint)',
              borderRadius: 8,
              fontSize: 14,
              color: 'var(--sp-teal)',
              fontFamily: 'monospace',
              display: 'inline-block',
            }}
          >
            <Icon name="check-circle" size="sm" style={{ marginRight: 6 }} />Application successfully submitted! Approval typically takes 1–2 weeks—please watch your email for an official notice of your results.
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <a
            href="/auth/login"
            className="btn-next"
            style={{ display: 'inline-block', textDecoration: 'none' }}
          >
            Go to Login <Icon name="chevron-right" size="sm" />
          </a>
          <button
            type="button"
            className="btn-back"
            onClick={() => window.location.reload()}
          >
            Register Another
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ERROR DETAIL PANEL — dev-only, visible only on failed submit
//  Gives the developer a clear view of what the server returned
// ═══════════════════════════════════════════════════════════════
function ErrorDetailPanel({ errors = [] }) {
  if (!errors.length) return null;
  return (
    <div
      style={{
        // Was a fixed 850px, which pushed the page wider than a phone screen
        // after any failed submit and left the Submit button untappable.
        width: 'min(850px, calc(100% - 32px))',
        boxSizing: 'border-box',
        margin: '16px auto 0',
        padding: '16px 20px',
        background: '#fff5f5',
        border: '1.5px solid var(--sp-red)',
        borderRadius: 'var(--sp-radius)',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <p style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--sp-red)', fontSize: 13 }}>
        <Icon name="warning" size="sm" style={{ marginRight: 6 }} />Submission returned errors — check these before re-testing:
      </p>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {errors.map((e, i) => (
          <li key={i} style={{ fontSize: 13, color: '#333', marginBottom: 4 }}>{e}</li>
        ))}
      </ul>
    </div>
  );
}