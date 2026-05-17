// PATH: /src/components/registration/Step4Assessment.jsx
'use client';

import { useState, useEffect } from 'react';

const BATCH_SIZE = 10; // Exactly 10 questions per view page

export default function Step4Assessment({ fields, setFields, onNext, onBack }) {
  const [phase, setPhase] = useState('loading'); // loading | error | ready | taking
  const [test, setTest] = useState(null);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({}); // Local state tracking: { [question_id]: choice_id }
  const [batch, setBatch] = useState(0);
  const [startedAt, setStartedAt] = useState(null);

  const trade = fields.trade_category;

  // Load exam data template for the selected trade
  useEffect(() => {
    if (!trade) return;
    setPhase('loading');
    fetch(`/api/assessments/${trade}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.status === 'success') {
          setTest(json.data);
          setPhase('ready');
        } else {
          setError(json.message);
          setPhase('error');
        }
      })
      .catch((err) => { setError(err.message); setPhase('error'); });
  }, [trade]);

  const questions = test?.assessment_questions ?? [];
  const totalBatches = Math.ceil(questions.length / BATCH_SIZE);
  const batchStart = batch * BATCH_SIZE;
  const batchEnd = batchStart + BATCH_SIZE;
  const batchItems = questions.slice(batchStart, batchEnd);
  const isLastBatch = batch >= totalBatches - 1;
  const answeredInBatch = batchItems.filter((q) => answers[q.question_id]).length;

  function startExam() {
    setAnswers({});
    setBatch(0);
    setStartedAt(new Date().toISOString());
    setPhase('taking');
  }

  function selectAnswer(question_id, choice_id) {
    setAnswers((prev) => ({ ...prev, [question_id]: choice_id }));
  }

  function handleFinish() {
    // Pipe data into the central form wizard state quietly
    setFields((prev) => ({
      ...prev,
      assessment_answers: answers,
      assessment_test_id: test.test_id,
      assessment_started_at: startedAt,
      assessment_skipped: false,
    }));
    onNext();
  }

  function handleSkip() {
    setFields((prev) => ({
      ...prev,
      assessment_skipped: true,
    }));
    onNext();
  }

  if (phase === 'loading') {
    return (
      <div className="page-container step-panel" id="step-4">
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
          <p>Loading {trade} assessment template…</p>
        </div>
        <div className="nav-row">
          <button type="button" className="btn-back" onClick={onBack}>‹ Back</button>
          <div />
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="page-container step-panel" id="step-4">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <p style={{ color: '#E24B4A', fontWeight: 600 }}>{error ?? 'No active test template found.'}</p>
          <p style={{ fontSize: 13, color: '#888' }}>
            The PESO Office has not yet published an assessment workflow configuration for{' '}
            <strong>{trade}</strong>. You may proceed straight to document attachments.
          </p>
          <button
            type="button"
            className="btn-next"
            style={{ marginTop: 16 }}
            onClick={handleSkip}
          >
            Continue to File Submission ›
          </button>
        </div>
        <div className="nav-row">
          <button type="button" className="btn-back" onClick={onBack}>‹ Back</button>
          <div />
        </div>
      </div>
    );
  }

  if (phase === 'ready') {
    return (
      <div className="page-container step-panel" id="step-4">
        <div className="section-header"><strong>COMPETENCY ASSESSMENT</strong></div>
        <div className="assessment-block">
          <div className="assessment-icon">📋</div>
          <h2 className="assessment-title">{test.test_title}</h2>
          <p className="assessment-body">
            This basic competence review runs in parallel with your trade selection as an/a{' '}
            <strong>{trade}</strong>. Your selections will be analyzed securely server-side alongside your submitted document sheets. 
            You need a score of <strong>{test.passing_score}%</strong> to satisfy immediate automated pass standards.
          </p>

          <div className="assessment-info-strip">
            <div className="ainfo-item">
              <span className="ainfo-icon">❓</span>
              <div>
                <strong>Total Items</strong>
                <small>{questions.length} questions</small>
              </div>
            </div>
            <div className="ainfo-item">
              <span className="ainfo-icon">📄</span>
              <div>
                <strong>Layout Engine</strong>
                <small>{BATCH_SIZE} items / page</small>
              </div>
            </div>
            <div className="ainfo-item">
              <span className="ainfo-icon">✅</span>
              <div>
                <strong>Passing Matrix</strong>
                <small>{test.passing_score}% Margin</small>
              </div>
            </div>
          </div>

          <button type="button" className="btn-start-test" onClick={startExam}>
            Start Assessment ›
          </button>
        </div>
        <div className="nav-row">
          <button type="button" className="btn-back" onClick={onBack}>‹ Back</button>
          <div />
        </div>
      </div>
    );
  }

  if (phase === 'taking') {
    return (
      <div className="page-container step-panel" id="step-4">
        <div className="section-header">
          <strong>{test.test_title}</strong>
        </div>

        {/* Dynamic Progress Engine */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#777', marginBottom: 6, fontWeight: 600 }}>
            <span>Questions {batchStart + 1}–{Math.min(batchEnd, questions.length)} of {questions.length}</span>
            <span>Page {batch + 1} of {totalBatches}</span>
          </div>
          <div style={{ height: 6, background: '#eee', borderRadius: 4 }}>
            <div style={{
              height: '100%', borderRadius: 4, background: '#0504AA',
              width: `${((batch + 1) / totalBatches) * 100}%`,
              transition: 'width 0.3s',
            }} />
          </div>
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
            {Object.keys(answers).length} of {questions.length} completed
          </div>
        </div>

        {/* Questions Render Loop */}
        {batchItems.map((q, localIdx) => {
          const globalNum = batchStart + localIdx + 1;
          const isAnswered = !!answers[q.question_id];
          return (
            <div key={q.question_id} style={{
              background: '#fff',
              border: isAnswered ? '1.5px solid #0504AA' : '1.5px solid #e8e8e8',
              borderRadius: 10, padding: '16px 18px', marginBottom: 14, transition: 'border-color 0.2s',
            }}>
              <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 14, color: '#111' }}>
                {globalNum}. {q.question_text}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {q.assessment_choices.map((c) => {
                  const isChosen = answers[q.question_id] === c.choice_id;
                  return (
                    <label key={c.choice_id} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 8, cursor: 'pointer',
                      background: isChosen ? '#eef0ff' : '#f8f9fc',
                      border: isChosen ? '1.5px solid #0504AA' : '1.5px solid transparent',
                      transition: 'all 0.15s',
                    }}>
                      <input
                        type="radio"
                        name={`q-${q.question_id}`}
                        checked={isChosen}
                        onChange={() => selectAnswer(q.question_id, c.choice_id)}
                        style={{ accentColor: '#0504AA' }}
                      />
                      <span style={{ fontSize: 13, color: isChosen ? '#0504AA' : '#333', fontWeight: isChosen ? 600 : 400 }}>
                        {c.choice_text}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Pagination Navigation Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid #eee', marginTop: 8 }}>
          <button
            type="button"
            className="btn-back"
            onClick={() => {
              if (batch === 0) {
                setPhase('ready');
              } else {
                setBatch((b) => b - 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            ‹ Previous
          </button>

          <span style={{ fontSize: 12, color: '#aaa' }}>
            {answeredInBatch}/{batchItems.length} checked on this page
          </span>

          {isLastBatch ? (
            <button type="button" className="btn-next" onClick={handleFinish}>
              Next: Attachments ›
            </button>
          ) : (
            <button
              type="button"
              className="btn-next"
              onClick={() => {
                setBatch((b) => b + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Next Page ›
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}