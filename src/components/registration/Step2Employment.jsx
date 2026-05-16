// PATH: /src/components/registration/Step2Employment.jsx
// Replaces: #step-2 panel in SP/html/form1.html
// Props: fields, setFields, children (NavRow)

'use client';

export default function Step2Employment({ fields, setFields, children }) {

  const set = (key) => (e) =>
    setFields((prev) => ({ ...prev, [key]: e.target.value }));

  // ── Employment status toggle (mirrors SP.toggleStatus) ────────
  function handleStatusChange(val) {
    setFields((prev) => ({
      ...prev,
      employment_status:   val,
      // Reset opposite sub-fields to keep DB clean
      employment_type:     val === 'Unemployed' ? 'Not Applicable' : prev.employment_type,
      self_employed_spec:  val === 'Unemployed' ? '' : prev.self_employed_spec,
      unemployment_reason: val === 'Employed'   ? 'Not Applicable' : prev.unemployment_reason,
    }));
  }

  // ── Employment type toggle (mirrors SP.toggleSelfSpec) ────────
  function handleTypeChange(val) {
    setFields((prev) => ({
      ...prev,
      employment_type:    val,
      // Clear spec if switching away from Self Employed
      self_employed_spec: val === 'Self Employed' ? prev.self_employed_spec : '',
    }));
  }

  const isEmployed   = fields.employment_status === 'Employed';
  const isUnemployed = fields.employment_status === 'Unemployed';
  const isSelf       = fields.employment_type   === 'Self Employed';

  // ── education ENUM values (match employment_details schema) ──
  const EDUCATION_OPTIONS = [
    'No Formal Education',
    'Elementary Undergraduate',
    'Elementary Graduate',
    'High School Undergraduate',
    'High School Graduate',
    'Vocational/Technical',
    'College Undergraduate',
    'College Graduate',
    'Post Graduate',
  ];

  // ── unemployment_reason values (match schema CHECK constraint) ─
  const UNEMPLOYMENT_REASONS = [
    'New Entrant/Fresh Graduate',
    'Finished Contract',
    'Resigned',
    'Retired',
    'Terminated/Laid Off due to Calamity',
    'Terminated/Laid Off (Local)',
    'Terminated/Laid Off (Abroad)',
  ];

  // ── self_employed_spec values (match employment_details schema) ─
  const SELF_SPECS = ['Kasambahay', 'Electrician', 'Carpenter', 'Nanny', 'Other'];

  return (
    <div className="page-container step-panel" id="step-2">

      {/* ── EMPLOYMENT STATUS ── */}
      <div className="section-header"><strong>EMPLOYMENT STATUS</strong></div>

      <div className="input-row">

        {/* Employed column */}
        <div className="field-group flex-1">
          <div className="checkbox-group-1line">
            <label>
              <input
                type="radio"
                name="employment_status"
                value="Employed"
                checked={isEmployed}
                onChange={() => handleStatusChange('Employed')}
                style={{ accentColor: '#0504AA' }}
              />
              {' '}<strong>Employed</strong>
            </label>
          </div>

          {isEmployed && (
            <div className="sub-panel">
              <p className="sub-panel-label">Type of Employment</p>
              {/* employment_details.employment_type ENUM('Wage Employed','Self Employed','Not Applicable') */}
              <div className="grid-checkbox-1line">
                <label>
                  <input
                    type="radio"
                    name="employment_type"
                    value="Wage Employed"
                    checked={fields.employment_type === 'Wage Employed'}
                    onChange={() => handleTypeChange('Wage Employed')}
                    style={{ accentColor: '#0504AA' }}
                  />{' '}Wage Employed
                </label>
                <label>
                  <input
                    type="radio"
                    name="employment_type"
                    value="Self Employed"
                    checked={fields.employment_type === 'Self Employed'}
                    onChange={() => handleTypeChange('Self Employed')}
                    style={{ accentColor: '#0504AA' }}
                  />{' '}Self Employed
                </label>
              </div>

              {isSelf && (
                <div className="grid-checkbox-tab" style={{ marginTop: 8 }}>
                  {/* employment_details.self_employed_spec VARCHAR(100) */}
                  {SELF_SPECS.map((v) => (
                    <label key={v}>
                      <input
                        type="radio"
                        name="self_employed_spec"
                        value={v}
                        checked={fields.self_employed_spec === v}
                        onChange={set('self_employed_spec')}
                        style={{ accentColor: '#0504AA' }}
                      />{' '}{v}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Unemployed column */}
        <div className="field-group flex-1">
          <div className="checkbox-group-1line">
            <label>
              <input
                type="radio"
                name="employment_status"
                value="Unemployed"
                checked={isUnemployed}
                onChange={() => handleStatusChange('Unemployed')}
                style={{ accentColor: '#0504AA' }}
              />
              {' '}<strong>Unemployed</strong>
            </label>
          </div>

          {isUnemployed && (
            <div className="sub-panel">
              <p className="sub-panel-label">Reason for Unemployment</p>
              {/* employment_details.unemployment_reason TEXT NOT NULL DEFAULT 'Not Applicable' */}
              <div className="grid-checkbox-1line">
                {UNEMPLOYMENT_REASONS.map((v) => (
                  <label key={v}>
                    <input
                      type="radio"
                      name="unemployment_reason"
                      value={v}
                      checked={fields.unemployment_reason === v}
                      onChange={set('unemployment_reason')}
                      style={{ accentColor: '#0504AA' }}
                    />{' '}{v}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── EDUCATIONAL BACKGROUND ── */}
      <div className="section-header" style={{ marginTop: 20 }}>
        <strong>EDUCATIONAL BACKGROUND</strong>
      </div>

      <div className="input-row">
        <div className="field-group flex-1">
          <label className="label-name">HIGHEST EDUCATIONAL ATTAINMENT</label>
          {/* employment_details.highest_education TEXT */}
          <select
            className="table-input select-styled"
            value={fields.highest_education}
            onChange={set('highest_education')}
          >
            <option value="">— Select —</option>
            {EDUCATION_OPTIONS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div className="field-group flex-1">
          <label className="label-name">YEAR GRADUATED / LAST ATTENDED</label>
          {/* employment_details.year_graduated VARCHAR(4) — schema uses VARCHAR not INT */}
          <input
            type="number"
            className="table-input"
            placeholder="e.g. 2018"
            min={1950}
            max={2099}
            value={fields.year_graduated}
            onChange={set('year_graduated')}
          />
        </div>
      </div>

      <div className="input-row">
        <div className="field-group flex-1">
          <label className="label-name">SCHOOL LAST ATTENDED</label>
          {/* employment_details.school_last_attended VARCHAR(150) */}
          <input
            type="text"
            className="table-input"
            placeholder="Name of school or institution"
            value={fields.school_last_attended}
            onChange={set('school_last_attended')}
          />
        </div>
        <div className="field-group flex-1">
          <label className="label-name">COURSE / STRAND COMPLETED</label>
          {/* employment_details.course_completed VARCHAR(150) */}
          <input
            type="text"
            className="table-input"
            placeholder="e.g. BSIT, TESDA NC II"
            value={fields.course_completed}
            onChange={set('course_completed')}
          />
        </div>
      </div>

      {/* ── EMPLOYMENT HISTORY ── */}
      <div className="section-header" style={{ marginTop: 20 }}>
        <strong>EMPLOYMENT HISTORY</strong>
      </div>

      <div className="field-group" style={{ marginBottom: 16 }}>
        <label className="label-name">
          Briefly describe your previous work experience
        </label>
        {/* employment_details.employment_history TEXT */}
        <textarea
          className="table-input textarea-styled"
          rows={5}
          placeholder="e.g. Worked as an electrician in Barangay Poblacion for 3 years..."
          value={fields.employment_history}
          onChange={set('employment_history')}
        />
      </div>

      {children}
    </div>
  );
}