// PATH: /src/components/registration/Step4Assessment.jsx
// Replaces: #step-4 panel in SP/html/form1.html
// No form fields — admin-managed assessment placeholder.
// Props: onStartTest (function from page.js → goToStep(5)), children (NavRow)

'use client';

export default function Step4Assessment({ onStartTest, children }) {
  return (
    <div className="page-container step-panel" id="step-4">

      <div className="section-header"><strong>COMPETENCY ASSESSMENT</strong></div>

      <div className="assessment-block">
        <div className="assessment-icon">📋</div>
        <h2 className="assessment-title">LGU-Managed Assessment</h2>
        <p className="assessment-body">
          Your skills assessment is managed by the LGU Admin (PESO Office).
          Click <strong>"Start Test"</strong> to proceed to the evaluation.
          You will be contacted by the PESO Office for scheduling once your
          registration has been reviewed.
        </p>

        <div className="assessment-info-strip">
          <div className="ainfo-item">
            <span className="ainfo-icon">🏛</span>
            <div>
              <strong>Administered by</strong>
              <small>PESO Office — Anini-y LGU</small>
            </div>
          </div>
          <div className="ainfo-item">
            <span className="ainfo-icon">📅</span>
            <div>
              <strong>Scheduling</strong>
              <small>Set by Admin after form review</small>
            </div>
          </div>
          <div className="ainfo-item">
            <span className="ainfo-icon">✅</span>
            <div>
              <strong>Result Recorded As</strong>
              <small>Passed / Failed / Pending</small>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn-start-test"
          onClick={onStartTest}
        >
          Start Test ›
        </button>
      </div>

      {/* NavRow back button only — Next is replaced by Start Test above */}
      {children}
    </div>
  );
}