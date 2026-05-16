// PATH: /src/components/registration/Step1Personal.jsx
// Replaces: #step-1 panel in SP/html/form1.html
// Props: fields, setFields, children (NavRow injected by page.js)

'use client';

import Image from 'next/image';
import { useAddressSync } from '@/hooks/useAddressSync';

export default function Step1Personal({ fields, setFields, children }) {

  // ── Helpers ───────────────────────────────────────────────────
  const set = (key) => (e) =>
    setFields((prev) => ({ ...prev, [key]: e.target.value }));

  const setCheck = (key) => (e) =>
    setFields((prev) => ({ ...prev, [key]: e.target.checked }));

  // ── Age auto-compute (mirrors sp_steps.js initAgeCompute) ────
  function handleDOBChange(e) {
    const val = e.target.value;
    setFields((prev) => ({ ...prev, date_of_birth: val }));
    if (!val) return;
    const dob   = new Date(val);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    setFields((prev) => ({ ...prev, age: age >= 0 ? String(age) : '' }));
  }

  // ── Address sync (mirrors form1.js) ──────────────────────────
  const { handleSameAddress, syncOnChange } = useAddressSync(
    {
      pres_street:   fields.pres_street,
      pres_barangay: fields.pres_barangay,
      pres_city:     fields.pres_city,
      pres_province: fields.pres_province,
    },
    (permObj) => setFields((prev) => ({ ...prev, ...permObj }))
  );

  function handlePresChange(key) {
    return (e) => {
      const val = e.target.value;
      setFields((prev) => ({ ...prev, [key]: val }));
      syncOnChange(key, val, fields.same_as_permanent);
    };
  }

  function handleSameCheck(e) {
    const checked = e.target.checked;
    setFields((prev) => ({ ...prev, same_as_permanent: checked }));
    handleSameAddress(checked);
  }

  // ── Socio-economic cards config ───────────────────────────────
  const SOCIO = [
    { key: 'is_4ps_beneficiary', icon: '🏠', label: '4Ps Beneficiary',       sub: 'Pantawid Pamilyang Pilipino Program' },
    { key: 'is_indigent',        icon: '📋', label: 'Indigent',               sub: 'Registered indigent household' },
    { key: 'is_pwd',             icon: '♿', label: 'Person with Disability', sub: 'PWD card holder' },
    { key: 'is_senior_citizen',  icon: '👴', label: 'Senior Citizen',         sub: '60 years old and above' },
    { key: 'is_solo_parent',     icon: '👨‍👧', label: 'Solo Parent',           sub: 'Solo parent card holder' },
  ];

  return (
    <div className="page-container step-panel" id="step-1">

      {/* ── Form Header ── */}
      <div className="cell-nsrp"><strong>DOLE Form 1</strong></div>
      <Image
        src="/images/LOGO.png"
        alt="Anini-y LGU Seal"
        width={100}
        height={100}
        className="form-logo"
      />
      <div className="cell-header">
        <p>
          Republic of the Philippines<br />
          Department of Labor and Employment<br />
          <strong>DOLE REGISTRATION FORM</strong>
        </p>
      </div>
      <div className="form-instructions">
        <p>
          <strong>INSTRUCTIONS:</strong> Please fill out the form legibly.
          Check appropriate boxes. Do not leave any items unanswered.
          Indicate "NA" if not applicable.
        </p>
      </div>

      {/* ── PERSONAL INFORMATION ── */}
      <div className="section-header"><strong>PERSONAL INFORMATION</strong></div>

      {/* Name block */}
      <div className="input-container">
        <div className="side left-side">
          <div className="field-group">
            <label className="label-name">
              LAST NAME <span className="req">*</span>
            </label>
            <input
              type="text"
              className="table-input"
              placeholder="e.g. dela Cruz"
              value={fields.last_name}
              onChange={set('last_name')}
            />
          </div>
          <div className="field-group">
            <label className="label-name">MIDDLE NAME</label>
            <input
              type="text"
              className="table-input"
              placeholder="e.g. Santos"
              value={fields.middle_name}
              onChange={set('middle_name')}
            />
          </div>
        </div>
        <div className="side right-side">
          <div className="field-group">
            <label className="label-name">
              FIRST NAME <span className="req">*</span>
            </label>
            <input
              type="text"
              className="table-input"
              placeholder="e.g. Juan"
              value={fields.first_name}
              onChange={set('first_name')}
            />
          </div>
          <div className="field-group">
            <label className="label-name">SUFFIX (Sr., Jr., III, etc.)</label>
            <input
              type="text"
              className="table-input"
              placeholder="e.g. Jr."
              value={fields.suffix}
              onChange={set('suffix')}
            />
          </div>
        </div>
      </div>

      {/* DOB + Age */}
      <div className="input-row">
        <div className="field-group flex-1">
          <label className="label-name">
            DATE OF BIRTH <small>(mm/dd/yyyy)</small> <span className="req">*</span>
          </label>
          <input
            type="date"
            className="table-input"
            value={fields.date_of_birth}
            onChange={handleDOBChange}
          />
        </div>
        <div className="field-group flex-1">
          <label className="label-name">AGE</label>
          {/* nsrp_details.age SMALLINT — auto-computed, read-only */}
          <input
            type="number"
            className="table-input"
            placeholder="Auto-computed"
            value={fields.age}
            readOnly
          />
        </div>
      </div>

      {/* Sex + Present Address */}
      <div className="input-row">
        <div className="field-group flex-1">
          <label className="label-name">
            SEX <span className="req">*</span>
          </label>
          {/* nsrp_details.sex ENUM('Male','Female') */}
          <div className="checkbox-group">
            {['Male', 'Female'].map((v) => (
              <label key={v}>
                <input
                  type="radio"
                  name="sex"
                  value={v}
                  checked={fields.sex === v}
                  onChange={set('sex')}
                  style={{ accentColor: '#0504AA' }}
                />{' '}{v}
              </label>
            ))}
          </div>
        </div>
        <div className="field-group flex-1">
          <label className="label-name">
            PRESENT ADDRESS <span className="req">*</span>
          </label>
          {/* nsrp_details.pres_street / pres_barangay / pres_city / pres_province */}
          <input type="text" className="table-input" placeholder="House No. / Street / Village"
            value={fields.pres_street}   onChange={handlePresChange('pres_street')} />
          <input type="text" className="table-input" placeholder="Barangay"
            value={fields.pres_barangay} onChange={handlePresChange('pres_barangay')} />
          <input type="text" className="table-input" placeholder="Municipality / City"
            value={fields.pres_city}     onChange={handlePresChange('pres_city')} />
          <input type="text" className="table-input" placeholder="Province"
            value={fields.pres_province} onChange={handlePresChange('pres_province')} />
        </div>
      </div>

      {/* Civil Status + Permanent Address */}
      <div className="input-row">
        <div className="field-group flex-1">
          <label className="label-name">
            CIVIL STATUS <span className="req">*</span>
          </label>
          {/* nsrp_details.civil_status ENUM('Single','Married','Widowed','Separated') */}
          <div className="grid-checkbox">
            {['Single', 'Married', 'Widowed', 'Separated'].map((v) => (
              <span key={v}>
                <label>
                  <input
                    type="radio"
                    name="civil_status"
                    value={v}
                    checked={fields.civil_status === v}
                    onChange={set('civil_status')}
                    style={{ accentColor: '#0504AA' }}
                  />{' '}{v}
                </label>
              </span>
            ))}
          </div>
        </div>
        <div className="field-group flex-1">
          <label className="label-name">
            PERMANENT ADDRESS{' '}
            <small>(Check if same as present)</small>{' '}
            <input
              type="checkbox"
              checked={fields.same_as_permanent}
              onChange={handleSameCheck}
              style={{ accentColor: '#0504AA' }}
            />
          </label>
          {/* nsrp_details.perm_street / perm_barangay / perm_city / perm_province */}
          <input type="text" className="table-input" placeholder="House No. / Street / Village"
            value={fields.perm_street}   onChange={set('perm_street')}
            readOnly={fields.same_as_permanent} />
          <input type="text" className="table-input" placeholder="Barangay"
            value={fields.perm_barangay} onChange={set('perm_barangay')}
            readOnly={fields.same_as_permanent} />
          <input type="text" className="table-input" placeholder="Municipality / City"
            value={fields.perm_city}     onChange={set('perm_city')}
            readOnly={fields.same_as_permanent} />
          <input type="text" className="table-input" placeholder="Province"
            value={fields.perm_province} onChange={set('perm_province')}
            readOnly={fields.same_as_permanent} />
        </div>
      </div>

      {/* Contact + Email */}
      <div className="input-row">
        <div className="field-group flex-1">
          <label className="label-name">CONTACT NUMBER</label>
          {/* users.contact_number VARCHAR(15) */}
          <input
            type="tel"
            className="table-input"
            placeholder="09XXXXXXXXX"
            maxLength={11}
            value={fields.contact_number}
            onChange={set('contact_number')}
          />
        </div>
        <div className="field-group flex-1">
          <label className="label-name">
            EMAIL ADDRESS <span className="req">*</span>
          </label>
          {/* users.email VARCHAR(150) */}
          <input
            type="email"
            className="table-input"
            placeholder="yourname@email.com"
            value={fields.email}
            onChange={set('email')}
          />
        </div>
      </div>

      {/* ── PARENT / GUARDIAN ── */}
      <div className="section-header" style={{ marginTop: 20 }}>
        <strong>PARENT / GUARDIAN INFORMATION</strong>
      </div>

      <div className="input-row">
        <div className="field-group flex-1">
          {/* nsrp_details.father_name / father_contact */}
          <label className="label-name">FATHER'S NAME</label>
          <input type="text" className="table-input" placeholder="Full name"
            value={fields.father_name} onChange={set('father_name')} />
          <label className="label-name" style={{ marginTop: 10 }}>CONTACT NUMBER</label>
          <input type="tel" className="table-input" placeholder="09XXXXXXXXX" maxLength={11}
            value={fields.father_contact} onChange={set('father_contact')} />
        </div>
        <div className="field-group flex-1">
          {/* nsrp_details.mother_name / mother_contact */}
          <label className="label-name">MOTHER'S NAME</label>
          <input type="text" className="table-input" placeholder="Full name"
            value={fields.mother_name} onChange={set('mother_name')} />
          <label className="label-name" style={{ marginTop: 10 }}>CONTACT NUMBER</label>
          <input type="tel" className="table-input" placeholder="09XXXXXXXXX" maxLength={11}
            value={fields.mother_contact} onChange={set('mother_contact')} />
        </div>
      </div>

      <div className="input-row">
        <div className="field-group flex-1">
          <label className="label-name">PARENT/S' CIVIL STATUS</label>
          {/* nsrp_details.parents_civil_status ENUM('Living Together','Solo Parent','Separated') */}
          <div className="grid-checkbox-1line">
            {['Living Together', 'Solo Parent', 'Separated'].map((v) => (
              <span key={v}>
                <label>
                  <input
                    type="radio"
                    name="parents_civil_status"
                    value={v}
                    checked={fields.parents_civil_status === v}
                    onChange={set('parents_civil_status')}
                    style={{ accentColor: '#0504AA' }}
                  />{' '}{v}
                </label>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── SOCIO-ECONOMIC ── */}
      <div className="section-header" style={{ marginTop: 20 }}>
        <strong>SOCIO-ECONOMIC INFORMATION</strong>
      </div>
      <p className="socio-note">Check all that apply.</p>

      <div className="socio-grid">
        {SOCIO.map(({ key, icon, label, sub }) => (
          <label
            key={key}
            className="socio-card"
            style={{ cursor: 'pointer' }}
          >
            {/* Hidden checkbox — card is the click target */}
            <input
              type="checkbox"
              style={{ display: 'none' }}
              checked={!!fields[key]}
              onChange={setCheck(key)}
            />
            <div
              className="socio-body"
              style={
                fields[key]
                  ? { background: 'var(--sp-blue-tint)', borderTop: '3px solid var(--sp-blue)' }
                  : { borderTop: '3px solid transparent' }
              }
            >
              <span className="socio-icon">{icon}</span>
              <strong>{label}</strong>
              <small>{sub}</small>
            </div>
          </label>
        ))}
      </div>

      {/* NavRow injected by page.js */}
      {children}
    </div>
  );
}