// PATH: /src/components/provider/DocumentManager.jsx
// The portfolio's "Files" tab: the provider's résumé and skill certificates.
// PDF or image, up to 5 MB each. Files go to the PRIVATE provider-documents
// bucket (the caller's own folder); the links shown here are short-lived
// signed URLs issued by the server.
//
//   resume       = { name, url } | null
//   certificates = [{ file_id, name, url }]

'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import EmptyState from '@/components/shared/EmptyState';
import { useConfirmDialog } from '@/components/shared/ConfirmDialog';
import Icon       from '@/components/ui/Icon';

import { createClient } from '@/lib/supabase/client';
import { DOCUMENT_BUCKET, DOCUMENT_TYPES, checkUpload, storagePath, uploadToBucket, isImageName } from '@/lib/uploads';
import { setMyResume, addMyCertificate, removeMyCertificate } from '@/actions/profileActions';

export default function DocumentManager({ authId, resume, certificates = [] }) {
  const router = useRouter();
  const resumeInput = useRef(null);
  const certInput   = useRef(null);
  const { confirm, dialog } = useConfirmDialog();

  const [busy,   setBusy]   = useState('');     // '' | 'resume' | 'cert' | `del-<id>`
  const [status, setStatus] = useState(null);   // { tone, text, where: 'resume' | 'cert' }

  function finish(where, result, okText) {
    setBusy('');
    if (result?.success) { setStatus({ where, tone: 'success', text: okText }); router.refresh(); }
    else setStatus({ where, tone: 'error', text: result?.error ?? 'Something went wrong. Please try again.' });
  }

  async function handleFile(e, kind) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const problem = checkUpload(file, DOCUMENT_TYPES);
    if (problem) return setStatus({ where: kind, tone: 'error', text: problem });

    setBusy(kind);
    setStatus(null);
    try {
      const path = await uploadToBucket(
        createClient(), DOCUMENT_BUCKET, storagePath(authId, kind, file.type), file, file.type
      );
      const record = { path, name: file.name };
      finish(
        kind,
        kind === 'resume' ? await setMyResume(record) : await addMyCertificate(record),
        kind === 'resume' ? 'Résumé uploaded.' : 'Certificate added.'
      );
    } catch (err) {
      console.error('[DocumentManager] Upload failed:', err);
      finish(kind, { success: false, error: 'Could not upload that file. Check your connection and try again.' });
    }
  }

  async function removeResume() {
    const ok = await confirm({
      title: 'Delete your résumé?',
      message: `"${resume.name}" will be removed and residents will no longer be able to view it.`,
    });
    if (!ok) return;
    setBusy('resume'); setStatus(null);
    finish('resume', await setMyResume(null), 'Résumé removed.');
  }

  async function removeCertificate(cert) {
    const ok = await confirm({
      title: 'Delete this certificate?',
      message: `"${cert.name}" will be removed from your profile. This cannot be undone.`,
    });
    if (!ok) return;
    setBusy(`del-${cert.file_id}`); setStatus(null);
    finish('cert', await removeMyCertificate(cert.file_id), 'Certificate removed.');
  }

  return (
    <div className="manager">

      {/* ── Résumé ── */}
      <section className="manager-section" aria-labelledby="doc-resume-title">
        <div className="manager-head">
          <div>
            <h3 className="manager-title" id="doc-resume-title">Résumé</h3>
            <p className="manager-sub">One file. Residents can open it from your About tab.</p>
          </div>
          <button
            type="button"
            className="btn-ghost-app btn-sm"
            onClick={() => resumeInput.current?.click()}
            disabled={!!busy}
          >
            <Icon name={resume ? 'refresh' : 'file'} size="sm" />
            {busy === 'resume' ? 'Working…' : resume ? 'Replace' : 'Upload résumé'}
          </button>
        </div>

        {resume ? (
          <DocRow
            name={resume.name}
            url={resume.url}
            busy={busy === 'resume'}
            disabled={!!busy}
            onRemove={removeResume}
          />
        ) : (
          <EmptyState icon="file" title="No résumé yet" hint="Upload a PDF or a clear photo of your résumé." />
        )}
        <Status status={status} where="resume" />
        <input ref={resumeInput} type="file" accept={DOCUMENT_TYPES.join(',')}
               onChange={(e) => handleFile(e, 'resume')} hidden data-testid="resume-input" />
      </section>

      {/* ── Certificates ── */}
      <section className="manager-section" aria-labelledby="doc-cert-title">
        <div className="manager-head">
          <div>
            <h3 className="manager-title" id="doc-cert-title">
              Skill certificates <span className="tab-panel-count">({certificates.length})</span>
            </h3>
            <p className="manager-sub">Training and NC certificates. Shown under Credentials on your public page.</p>
          </div>
          <button
            type="button"
            className="btn-primary-app btn-sm"
            onClick={() => certInput.current?.click()}
            disabled={!!busy}
          >
            <Icon name="certificate" size="sm" />
            {busy === 'cert' ? 'Uploading…' : 'Add certificate'}
          </button>
        </div>

        {certificates.length === 0 ? (
          <EmptyState icon="certificate" title="No certificates yet" hint="Add each certificate as a PDF or a photo." />
        ) : (
          <div className="doc-list">
            {certificates.map((cert) => (
              <DocRow
                key={cert.file_id}
                name={cert.name}
                url={cert.url}
                busy={busy === `del-${cert.file_id}`}
                disabled={!!busy}
                onRemove={() => removeCertificate(cert)}
              />
            ))}
          </div>
        )}
        <Status status={status} where="cert" />
        <input ref={certInput} type="file" accept={DOCUMENT_TYPES.join(',')}
               onChange={(e) => handleFile(e, 'cert')} hidden data-testid="cert-input" />
      </section>

      <p className="field-hint">PDF or image (JPG, PNG, WebP), up to 5 MB each. Your files are stored privately.</p>

      {dialog}
    </div>
  );
}

function Status({ status, where }) {
  const mine = status?.where === where ? status : null;
  return (
    <p className={`form-status${mine ? ` form-status--${mine.tone}` : ''}`} role="status" aria-live="polite">
      {mine && <Icon name={mine.tone === 'success' ? 'check-circle' : 'warning'} size="sm" />}
      {mine?.text ?? ''}
    </p>
  );
}

/** One stored document: preview, name, open/download link and Remove. */
function DocRow({ name, url, busy, disabled, onRemove }) {
  return (
    <div className="doc-row">
      <span className="doc-row-thumb">
        {url && isImageName(name)
          ? <img src={url} alt="" className="avatar-img" loading="lazy" width="48" height="48" />
          : <Icon name="file" size="lg" />}
      </span>
      <div className="doc-row-body">
        <p className="doc-row-name" title={name}>{name}</p>
        <div className="doc-row-actions">
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" download={name} className="text-link-btn">
              View / Download
            </a>
          )}
          <button type="button" className="text-link-btn text-link-btn--danger" onClick={onRemove} disabled={disabled}>
            {busy ? 'Working…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}
