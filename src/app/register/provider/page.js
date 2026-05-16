// PATH: /src/app/page.js
// Role: Main registration wizard orchestrator — Provider Registration Module
// Sprint scope: Steps 1 → 2 → 3 → 5 (Step 4 bypassed per Agile strategy)
// Wired to: /src/actions/registerProvider.js (real Supabase submission)

'use client';

import { useState } from 'react';
import MainHeader        from '@/components/ui/MainHeader';
import StepProgressBar   from '@/components/ui/StepProgressBar';
import Step1Personal     from '@/components/registration/Step1Personal';
import Step2Employment   from '@/components/registration/Step2Employment';
import Step3Trade        from '@/components/registration/Step3Trade';
import Step5Files        from '@/components/registration/Step5Files';
import { useStepValidation } from '@/hooks/useStepValidation';

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
  // step 5
  terms_agreed:         false,
};

const INITIAL_FILES = {
  file_national_id:      null,
  file_national_id_back: null,
  file_photo:            null,
  file_certificate:      null,
};

// ── Sprint navigation map (Step 4 bypassed) ──────────────────────────────
// Visual steps shown in progress bar: 1, 2, 3, 4, 5
// Actual routing sequence:           1, 2, 3,    5
// completedSteps tracks which buttons go green — we mark 4 done when passing 3→5
const STEP_SEQUENCE = [1, 2, 3, 5]; // Step 4 intentionally excluded this sprint

export default function ProviderRegistrationPage() {
  const [currentStep,     setCurrentStep]  = useState(1);
  const [completedSteps,  setCompleted]    = useState([]);
  const [toast,           setToast]        = useState({ msg: '', type: 'error' });
  const [isSubmitting,    setSubmitting]   = useState(false);
  const [submitResult,    setSubmitResult] = useState(null); // null | { success, message, errors }
  const [fields,          setFields]       = useState(INITIAL_FIELDS);
  const [files,           setFiles]        = useState(INITIAL_FILES);

  const { validateStep } = useStepValidation();

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
      // When leaving step 3 to go to step 5, validate step 3
      const errors = validateStep(currentStep, fields, files);
      if (errors.length > 0) {
        showToast(errors[0]);
        return;
      }

      // Mark current step complete.
      // When jumping 3→5 also silently mark step 4 as done (bypassed).
      setCompleted((prev) => {
        const next = new Set([...prev, currentStep]);
        if (currentStep === 3 && target === 5) next.add(4); // mark bypassed step green
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

    setSubmitting(true);
    setSubmitResult(null);

    try {
      // Build FormData — registerProvider.js extracts via formData.get()
      const fd = new FormData();

      Object.entries(fields).forEach(([k, v]) => {
        fd.append(k, typeof v === 'boolean' ? (v ? '1' : '0') : (v ?? ''));
      });

      Object.entries(files).forEach(([k, v]) => {
        if (v instanceof File) fd.append(k, v);
      });

      // Dynamically import the server action to avoid client-bundle inclusion
      // This is the correct Next.js 14 pattern for calling 'use server' actions
      // from a 'use client' page without a form element.
      const { registerProvider } = await import('@/actions/registerProvider');
      const result = await registerProvider(fd);

      setSubmitResult(result);

      if (result.success) {
        // Mark all steps done (including the bypassed step 4)
        setCompleted([1, 2, 3, 4, 5]);
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
          {toast.type === 'error' ? '⚠ ' : '✓ '}
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
            {/*
              Step 4 bypassed this sprint.
              "Next" from step 3 jumps directly to step 5.
              The button label makes this transparent to the tester.
            */}
            <NavRow
              onBack={prevStep}
              onNext={nextStep}
              nextLabel="Next: File Attachment ›"
            />
          </Step3Trade>
        )}

        {/* Step 5 — File Attachment + Submit */}
        {currentStep === 5 && !submitResult?.success && (
          <Step5Files {...stepProps}>
            <NavRow
              onBack={prevStep}
              showNext={false}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitLabel={isSubmitting ? 'Submitting…' : 'Submit Registration ✓'}
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
  nextLabel    = 'Next ›',
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
            ‹ Back
          </button>
        )
        : <div />}

      {/* Right slot: Next OR Submit */}
      {showNext && onNext && (
        <button type="button" className="btn-next" onClick={onNext}>
          {nextLabel}
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
        <div className="success-circle">✓</div>
        <h2>Application Submitted!</h2>
        <p>
          Your registration has been received by the PESO Office.
          You will be contacted for scheduling your competency assessment.
          Your profile goes live once the LGU Admin approves your account.
        </p>

        {/* ── DEV helper: shows provider_id returned from Supabase ── */}
        {providerId && (
          <div
            style={{
              marginTop: 16,
              padding: '10px 18px',
              background: 'var(--sp-teal-tint)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--sp-teal)',
              fontFamily: 'monospace',
              display: 'inline-block',
            }}
          >
            ✓ Provider ID: <strong>{providerId}</strong> — record confirmed in Supabase
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
          {/* Placeholder — /auth/login page built in Phase 2 */}
          <a
            href="/auth/login"
            className="btn-next"
            style={{ display: 'inline-block', textDecoration: 'none' }}
          >
            Go to Login ›
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
        width: 850,
        margin: '16px auto 0',
        padding: '16px 20px',
        background: '#fff5f5',
        border: '1.5px solid var(--sp-red)',
        borderRadius: 'var(--sp-radius)',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <p style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--sp-red)', fontSize: 13 }}>
        ⚠ Submission returned errors — check these before re-testing:
      </p>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {errors.map((e, i) => (
          <li key={i} style={{ fontSize: 13, color: '#333', marginBottom: 4 }}>{e}</li>
        ))}
      </ul>
    </div>
  );
}