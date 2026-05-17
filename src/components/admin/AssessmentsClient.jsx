// PATH: /src/components/admin/AssessmentsClient.jsx
// Full assessment management UI:
//   - Left panel: list of existing tests per trade
//   - Right panel: dynamic question builder (infinite items)
// Uses the /api/admin/assessments route for all data operations.

'use client';

import { useState, useEffect, useCallback } from 'react';

const TRADES        = ['Carpenter', 'Electrician', 'Kasambahay'];
const QUESTIONS_PER_PAGE = 10; // matches exam pagination batch size

// ── Blank templates ────────────────────────────────────────────────────────
const blankChoice   = () => ({ choice_text: '', is_correct: false });
const blankQuestion = () => ({
  question_text: '',
  points: 1,
  choices: [blankChoice(), blankChoice(), blankChoice(), blankChoice()],
});

export default function AssessmentsClient() {
  const [tests,        setTests]       = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [activeTab,    setActiveTab]   = useState('Carpenter');
  const [mode,         setMode]        = useState('view');   // 'view' | 'create'
  const [saving,       setSaving]      = useState(false);
  const [saveMsg,      setSaveMsg]     = useState(null);     // { text, ok }
  const [previewPage,  setPreviewPage] = useState(0);        // for question list pagination

  // ── Form state ────────────────────────────────────────────
  const [form, setForm] = useState({
    trade_category: 'Carpenter',
    test_title:     '',
    passing_score:  75,
    questions:      [blankQuestion()],
  });

  // ── Fetch all tests ───────────────────────────────────────
  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/assessments');
      const json = await res.json();
      if (json.status === 'success') setTests(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  // ── Derived: active test for current tab ──────────────────
  const activeTest = tests.find(
    (t) => t.trade_category === activeTab && t.is_active
  ) ?? null;

  // ── Question mutations ────────────────────────────────────
  function addQuestion() {
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, blankQuestion()],
    }));
    // Jump preview page to show the new question
    const newTotal = form.questions.length + 1;
    setPreviewPage(Math.floor((newTotal - 1) / QUESTIONS_PER_PAGE));
  }

  function removeQuestion(qIdx) {
    if (form.questions.length === 1) return; // keep at least one
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== qIdx),
    }));
  }

  function setQuestionField(qIdx, field, value) {
    setForm((prev) => {
      const qs = [...prev.questions];
      qs[qIdx] = { ...qs[qIdx], [field]: value };
      return { ...prev, questions: qs };
    });
  }

  function setChoiceField(qIdx, cIdx, field, value) {
    setForm((prev) => {
      const qs = [...prev.questions];
      const cs = [...qs[qIdx].choices];
      cs[cIdx] = { ...cs[cIdx], [field]: value };
      // Enforce single correct answer per question
      if (field === 'is_correct' && value === true) {
        cs.forEach((c, i) => { if (i !== cIdx) cs[i] = { ...cs[i], is_correct: false }; });
      }
      qs[qIdx] = { ...qs[qIdx], choices: cs };
      return { ...prev, questions: qs };
    });
  }

  // ── Submit ────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res  = await fetch('/api/admin/assessments', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const json = await res.json();
      if (json.status === 'success') {
        setSaveMsg({ text: `✓ Test saved! (ID: ${json.test_id})`, ok: true });
        setMode('view');
        await fetchTests();
      } else {
        setSaveMsg({ text: `✗ ${json.message}`, ok: false });
      }
    } catch (err) {
      setSaveMsg({ text: `✗ Network error: ${err.message}`, ok: false });
    } finally {
      setSaving(false);
    }
  }

  // ── Paginated question slice (for the CREATE form) ────────
  const totalPages    = Math.ceil(form.questions.length / QUESTIONS_PER_PAGE);
  const pageStart     = previewPage * QUESTIONS_PER_PAGE;
  const pageEnd       = pageStart + QUESTIONS_PER_PAGE;
  const pageQuestions = form.questions.slice(pageStart, pageEnd);

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0504AA', margin: '0 0 2px' }}>
          Skill Assessments
        </h2>
        <p style={{ fontSize: 13, color: '#777', margin: 0 }}>
          Manage trade-specific competency tests for provider applicants.
        </p>
      </div>

      {/* ── Trade tabs ── */}
      <div style={{
        display: 'flex', gap: 4,
        borderBottom: '2px solid #e8e8e8',
        marginBottom: 24,
      }}>
        {TRADES.map((trade) => (
          <button
            key={trade}
            type="button"
            onClick={() => { setActiveTab(trade); setMode('view'); setSaveMsg(null); }}
            style={{
              padding: '8px 20px', fontSize: 13.5, fontWeight: 600,
              color:  activeTab === trade ? '#0504AA' : '#777',
              background: 'transparent', border: 'none',
              borderBottom: activeTab === trade ? '3px solid #0504AA' : '3px solid transparent',
              cursor: 'pointer',
            }}
          >
            {trade}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          VIEW MODE — shows existing active test
      ══════════════════════════════════════════════════════ */}
      {mode === 'view' && (
        <div>
          {loading && <SkeletonCard />}

          {!loading && !activeTest && (
            <EmptyState
              trade={activeTab}
              onCreate={() => {
                setForm({ trade_category: activeTab, test_title: '', passing_score: 75, questions: [blankQuestion()] });
                setPreviewPage(0);
                setMode('create');
              }}
            />
          )}

          {!loading && activeTest && (
            <TestViewCard
              test={activeTest}
              onReplace={() => {
                setForm({
                  trade_category: activeTab,
                  test_title:     activeTest.test_title + ' (Revised)',
                  passing_score:  activeTest.passing_score,
                  questions:      activeTest.assessment_questions.map((q) => ({
                    question_text: q.question_text,
                    points:        q.points,
                    choices:       q.assessment_choices.map((c) => ({
                      choice_text: c.choice_text,
                      is_correct:  c.is_correct,
                    })),
                  })),
                });
                setPreviewPage(0);
                setMode('create');
              }}
            />
          )}

          {saveMsg && (
            <div style={{
              marginTop: 16, padding: '10px 16px', borderRadius: 8,
              background: saveMsg.ok ? '#e6f7f1' : '#fff5f5',
              color:      saveMsg.ok ? '#1D9E75' : '#E24B4A',
              fontWeight: 600, fontSize: 13,
            }}>
              {saveMsg.text}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          CREATE MODE — dynamic question builder
      ══════════════════════════════════════════════════════ */}
      {mode === 'create' && (
        <div>
          {/* Meta fields */}
          <div style={{
            background: '#fff', borderRadius: 10, padding: '20px 24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 20,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'end' }}>
              <div>
                <label style={labelStyle}>Test Title</label>
                <input
                  type="text"
                  value={form.test_title}
                  onChange={(e) => setForm((p) => ({ ...p, test_title: e.target.value }))}
                  placeholder={`e.g. TESDA ${form.trade_category} NC II — Revised`}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Passing Score (%)</label>
                <input
                  type="number"
                  value={form.passing_score}
                  min={1} max={100}
                  onChange={(e) => setForm((p) => ({ ...p, passing_score: Number(e.target.value) }))}
                  style={{ ...inputStyle, width: 120 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => { setMode('view'); setSaveMsg(null); }}
                  style={btnSecondary}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Saving…' : `Save Test (${form.questions.length} items)`}
                </button>
              </div>
            </div>

            {saveMsg && (
              <div style={{
                marginTop: 14, padding: '10px 14px', borderRadius: 8,
                background: saveMsg.ok ? '#e6f7f1' : '#fff5f5',
                color:      saveMsg.ok ? '#1D9E75' : '#E24B4A',
                fontWeight: 600, fontSize: 13,
              }}>
                {saveMsg.text}
              </div>
            )}
          </div>

          {/* Pagination info bar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 12,
          }}>
            <span style={{ fontSize: 13, color: '#555', fontWeight: 600 }}>
              Questions {pageStart + 1}–{Math.min(pageEnd, form.questions.length)} of {form.questions.length}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={btnPage}
                disabled={previewPage === 0}
                onClick={() => setPreviewPage((p) => p - 1)}
              >‹ Prev</button>
              <span style={{ fontSize: 13, color: '#777', padding: '0 4px' }}>
                Page {previewPage + 1} / {totalPages}
              </span>
              <button type="button" style={btnPage}
                disabled={previewPage >= totalPages - 1}
                onClick={() => setPreviewPage((p) => p + 1)}
              >Next ›</button>
            </div>
          </div>

          {/* Question cards — current page only */}
          {pageQuestions.map((q, localIdx) => {
            const globalIdx = pageStart + localIdx;
            return (
              <QuestionCard
                key={globalIdx}
                index={globalIdx}
                question={q}
                onTextChange={(val)         => setQuestionField(globalIdx, 'question_text', val)}
                onPointsChange={(val)        => setQuestionField(globalIdx, 'points', Number(val))}
                onChoiceTextChange={(ci, v)  => setChoiceField(globalIdx, ci, 'choice_text', v)}
                onCorrectChange={(ci)        => setChoiceField(globalIdx, ci, 'is_correct', true)}
                onRemove={() => removeQuestion(globalIdx)}
                canRemove={form.questions.length > 1}
              />
            );
          })}

          {/* Add question button */}
          <button
            type="button"
            onClick={addQuestion}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              margin: '16px 0',
              padding: '10px 20px',
              background: '#eef0ff', color: '#0504AA',
              border: '2px dashed #c0c4f7', borderRadius: 10,
              fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
              width: '100%', justifyContent: 'center',
            }}
          >
            + Add Question (Item {form.questions.length + 1})
          </button>

          {/* Bottom save */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
            <button type="button" style={btnSecondary} onClick={() => { setMode('view'); setSaveMsg(null); }}>
              Cancel
            </button>
            <button type="button" style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}
              onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : `Save All ${form.questions.length} Questions`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function QuestionCard({
  index, question,
  onTextChange, onPointsChange,
  onChoiceTextChange, onCorrectChange,
  onRemove, canRemove,
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 10,
      padding: '18px 20px', marginBottom: 14,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      borderLeft: '4px solid #0504AA',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>
            Question {index + 1}
          </label>
          <textarea
            rows={2}
            value={question.question_text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Type the question here…"
            style={{
              ...inputStyle,
              resize: 'vertical', minHeight: 56,
              fontFamily: 'Arial, sans-serif',
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <label style={{ ...labelStyle, textAlign: 'center' }}>Pts</label>
          <input
            type="number" min={1} max={10}
            value={question.points}
            onChange={(e) => onPointsChange(e.target.value)}
            style={{ ...inputStyle, width: 54, textAlign: 'center' }}
          />
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            title="Remove question"
            style={{
              background: '#fdeaea', border: 'none', borderRadius: 6,
              color: '#E24B4A', fontSize: 16, cursor: 'pointer',
              padding: '4px 10px', marginTop: 18, fontWeight: 700,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Choices */}
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {question.choices.map((choice, ci) => (
          <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="radio"
              name={`correct-q${index}`}
              checked={choice.is_correct}
              onChange={() => onCorrectChange(ci)}
              title="Mark as correct answer"
              style={{ accentColor: '#1D9E75', flexShrink: 0, width: 16, height: 16 }}
            />
            <input
              type="text"
              value={choice.choice_text}
              onChange={(e) => onChoiceTextChange(ci, e.target.value)}
              placeholder={`Choice ${String.fromCharCode(65 + ci)}`}
              style={{
                ...inputStyle,
                flex: 1,
                background: choice.is_correct ? '#e6f7f1' : '#fff',
                borderColor: choice.is_correct ? '#1D9E75' : '#ddd',
              }}
            />
            {choice.is_correct && (
              <span style={{ fontSize: 11, color: '#1D9E75', fontWeight: 700, whiteSpace: 'nowrap' }}>
                ✓ Correct
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TestViewCard({ test, onReplace }) {
  const [expanded, setExpanded] = useState(false);
  const [viewPage, setViewPage] = useState(0);
  const questions  = test.assessment_questions ?? [];
  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const pageSlice  = questions.slice(viewPage * QUESTIONS_PER_PAGE, (viewPage + 1) * QUESTIONS_PER_PAGE);

  return (
    <div style={{
      background: '#fff', borderRadius: 10,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid #eee',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111' }}>
            {test.test_title}
          </p>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#888' }}>
            {questions.length} questions · Passing: {test.passing_score}% ·{' '}
            <span style={{ color: '#1D9E75', fontWeight: 700 }}>● Active</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" style={btnSecondary}
            onClick={() => { setExpanded((e) => !e); setViewPage(0); }}>
            {expanded ? 'Hide Questions' : 'Preview Questions'}
          </button>
          <button type="button" style={btnPrimary} onClick={onReplace}>
            ✏ Replace / Revise
          </button>
        </div>
      </div>

      {/* Paginated question preview */}
      {expanded && (
        <div style={{ padding: '16px 20px' }}>
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: '#777' }}>
                Showing {viewPage * QUESTIONS_PER_PAGE + 1}–{Math.min((viewPage + 1) * QUESTIONS_PER_PAGE, questions.length)} of {questions.length}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" style={btnPage} disabled={viewPage === 0}
                  onClick={() => setViewPage((p) => p - 1)}>‹ Prev</button>
                <span style={{ fontSize: 12, color: '#777' }}>Page {viewPage + 1}/{totalPages}</span>
                <button type="button" style={btnPage} disabled={viewPage >= totalPages - 1}
                  onClick={() => setViewPage((p) => p + 1)}>Next ›</button>
              </div>
            </div>
          )}

          {pageSlice.map((q, i) => (
            <div key={q.question_id} style={{
              marginBottom: 14, padding: '12px 14px',
              background: '#f8f9fc', borderRadius: 8,
              borderLeft: '3px solid #0504AA',
            }}>
              <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 13 }}>
                {viewPage * QUESTIONS_PER_PAGE + i + 1}. {q.question_text}
                <span style={{ marginLeft: 8, fontSize: 11, color: '#aaa' }}>({q.points} pt{q.points !== 1 ? 's' : ''})</span>
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {q.assessment_choices.map((c) => (
                  <div key={c.choice_id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 10px', borderRadius: 6,
                    background: c.is_correct ? '#e6f7f1' : 'transparent',
                    fontSize: 13,
                  }}>
                    <span style={{ color: c.is_correct ? '#1D9E75' : '#aaa', fontWeight: 700, fontSize: 11 }}>
                      {c.is_correct ? '✓' : '○'}
                    </span>
                    <span style={{ color: c.is_correct ? '#1D9E75' : '#444', fontWeight: c.is_correct ? 700 : 400 }}>
                      {c.choice_text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ trade, onCreate }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 10, padding: '48px 24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#333', margin: '0 0 8px' }}>
        No Active Test for {trade}
      </h3>
      <p style={{ fontSize: 13, color: '#888', margin: '0 0 20px' }}>
        Create the first assessment for this trade category.
      </p>
      <button type="button" style={btnPrimary} onClick={onCreate}>
        + Create Assessment
      </button>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{
      background: '#fff', borderRadius: 10, padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      {[120, 80, 200, 160].map((w, i) => (
        <div key={i} style={{
          height: 14, width: w, borderRadius: 6, marginBottom: 14,
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%', 
          animation: 'shimmer 1.4s linear infinite', /* Added 'linear' here for continuous motion */
        }} />
      ))}
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────────────────
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.5px',
  color: '#555', marginBottom: 5,
};

const inputStyle = {
  width: '100%', padding: '8px 12px',
  border: '1px solid #ddd', borderRadius: 8,
  fontSize: 13, fontFamily: 'Arial, sans-serif',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const btnPrimary = {
  padding: '9px 18px', background: '#0504AA', color: '#fff',
  border: 'none', borderRadius: 8, fontSize: 13,
  fontWeight: 700, cursor: 'pointer', fontFamily: 'Arial, sans-serif',
};

const btnSecondary = {
  padding: '9px 18px', background: 'transparent', color: '#555',
  border: '2px solid #ccc', borderRadius: 8, fontSize: 13,
  fontWeight: 600, cursor: 'pointer', fontFamily: 'Arial, sans-serif',
};

const btnPage = {
  padding: '5px 12px', background: '#eef0ff', color: '#0504AA',
  border: '1px solid #c0c4f7', borderRadius: 6, fontSize: 12,
  fontWeight: 600, cursor: 'pointer', fontFamily: 'Arial, sans-serif',
};