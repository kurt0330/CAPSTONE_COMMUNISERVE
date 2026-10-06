// PATH: /src/components/provider/SkillsManager.jsx
// The portfolio's "Skills" tab: list, add and remove the provider's skills
// (T-skills). The add form is revealed on demand so the list stays the
// first thing on the screen.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import ListCard, { MetaItem } from '@/components/shared/ListCard';
import EmptyState             from '@/components/shared/EmptyState';
import { useConfirmDialog } from '@/components/shared/ConfirmDialog';
import Icon                   from '@/components/ui/Icon';

import { SKILL_NAME_MAX, SKILL_DESC_MAX } from '@/lib/uploads';
import { addMySkill, removeMySkill } from '@/actions/profileActions';

const EMPTY = { name: '', description: '', years: '' };

export default function SkillsManager({ skills = [] }) {
  const router = useRouter();
  const { confirm, dialog } = useConfirmDialog();

  const [adding, setAdding] = useState(false);
  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy,   setBusy]   = useState('');     // '' | 'add' | `del-<id>`
  const [status, setStatus] = useState(null);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (busy) return;
    setBusy('add'); setStatus(null);
    const result = await addMySkill({ ...form, years: form.years === '' ? NaN : Number(form.years) });
    setBusy('');

    if (result.success) {
      setForm(EMPTY); setErrors({}); setAdding(false);
      setStatus({ tone: 'success', text: 'Skill added.' });
      router.refresh();
    } else {
      setErrors(result.fieldErrors ?? {});
      setStatus({ tone: 'error', text: result.error ?? 'Could not add that skill.' });
    }
  }

  async function handleRemove(skill) {
    const ok = await confirm({
      title: 'Delete this skill?',
      message: `"${skill.skill_name}" will be removed from your profile.`,
    });
    if (!ok) return;
    setBusy(`del-${skill.skill_id}`); setStatus(null);
    const result = await removeMySkill(skill.skill_id);
    setBusy('');
    if (result.success) { setStatus({ tone: 'success', text: 'Skill removed.' }); router.refresh(); }
    else setStatus({ tone: 'error', text: result.error ?? 'Could not remove that skill.' });
  }

  return (
    <div className="manager">
      <div className="manager-head">
        <div>
          <h3 className="manager-title">
            My Skills <span className="tab-panel-count">({skills.length})</span>
          </h3>
          <p className="manager-sub">The specific work you can do, with your years of experience.</p>
        </div>
        {!adding && (
          <button type="button" className="btn-primary-app btn-sm" onClick={() => { setAdding(true); setStatus(null); }}>
            <Icon name="toolbox" size="sm" />
            Add skill
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="inline-form form-stack" noValidate>
          <div>
            <label className="field-label" htmlFor="sk-name">Skill name <span aria-hidden="true">*</span></label>
            <input
              id="sk-name" className="field-input" value={form.name} maxLength={SKILL_NAME_MAX} required
              onChange={(e) => set('name', e.target.value)} disabled={!!busy}
              aria-invalid={!!errors.name} aria-describedby={errors.name ? 'sk-name-error' : undefined}
            />
            {errors.name && <p className="field-error" id="sk-name-error">{errors.name}</p>}
          </div>
          <div>
            <label className="field-label" htmlFor="sk-years">Years of experience <span aria-hidden="true">*</span></label>
            <input
              id="sk-years" className="field-input field-input--short" type="number" inputMode="numeric"
              min="0" max="60" step="1" value={form.years} required
              onChange={(e) => set('years', e.target.value)} disabled={!!busy}
              aria-invalid={!!errors.years} aria-describedby={errors.years ? 'sk-years-error' : undefined}
            />
            {errors.years && <p className="field-error" id="sk-years-error">{errors.years}</p>}
          </div>
          <div>
            <label className="field-label" htmlFor="sk-desc">Short description</label>
            <textarea
              id="sk-desc" className="field-input" rows={3} value={form.description} maxLength={SKILL_DESC_MAX}
              onChange={(e) => set('description', e.target.value)} disabled={!!busy}
              aria-invalid={!!errors.description} aria-describedby={errors.description ? 'sk-desc-error' : 'sk-desc-hint'}
            />
            {errors.description && <p className="field-error" id="sk-desc-error">{errors.description}</p>}
            <p className="field-hint" id="sk-desc-hint">Optional. What you do and any tools you bring.</p>
          </div>
          <div className="form-footer">
            <button type="submit" className="btn-primary-app" disabled={!!busy}>
              {busy === 'add' ? 'Adding…' : 'Save skill'}
            </button>
            <button type="button" className="btn-ghost-app" disabled={!!busy}
                    onClick={() => { setAdding(false); setForm(EMPTY); setErrors({}); setStatus(null); }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <p className={`form-status${status ? ` form-status--${status.tone}` : ''}`} role="status" aria-live="polite">
        {status && <Icon name={status.tone === 'success' ? 'check-circle' : 'warning'} size="sm" />}
        {status?.text ?? ''}
      </p>

      {skills.length === 0 ? (
        !adding && (
          <EmptyState icon="toolbox" title="No skills listed yet"
                      hint="Add the kinds of work you do so residents can find you." />
        )
      ) : (
        skills.map((skill) => (
          <ListCard
            key={skill.skill_id}
            thumb={<Icon name="toolbox" size="lg" />}
            title={skill.skill_name}
            subtitle={skill.description}
            meta={
              <MetaItem icon="clock">
                {skill.years_experience} {Number(skill.years_experience) === 1 ? 'year' : 'years'} of experience
              </MetaItem>
            }
            trailing={
              <button
                type="button"
                className="icon-action-btn"
                onClick={() => handleRemove(skill)}
                disabled={!!busy}
                aria-label={`Remove ${skill.skill_name}`}
                title="Remove skill"
              >
                <Icon name="close" size="sm" />
              </button>
            }
          />
        ))
      )}

      {dialog}
    </div>
  );
}
