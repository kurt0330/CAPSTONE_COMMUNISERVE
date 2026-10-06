// PATH: /src/components/provider/GalleryManager.jsx
// The portfolio's "Gallery" tab: photos of the provider's finished work
// (T-provider_gallery). Each photo is resized to at most 1280px and
// re-encoded as JPEG in the browser, then uploaded to the caller's own
// folder in the public provider-gallery bucket.
//
//   images = [{ image_id, url, caption }]

'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import EmptyState from '@/components/shared/EmptyState';
import { useConfirmDialog } from '@/components/shared/ConfirmDialog';
import Icon       from '@/components/ui/Icon';

import { createClient } from '@/lib/supabase/client';
import { GALLERY_BUCKET, IMAGE_TYPES, checkUpload, storagePath, compressJpeg, uploadToBucket } from '@/lib/uploads';
import { addMyGalleryImage, removeMyGalleryImage } from '@/actions/profileActions';

export default function GalleryManager({ authId, images = [] }) {
  const router = useRouter();
  const input = useRef(null);
  const { confirm, dialog } = useConfirmDialog();

  const [busy,   setBusy]   = useState('');     // '' | 'add' | `del-<id>`
  const [status, setStatus] = useState(null);

  async function handleFiles(e) {
    const files = [...(e.target.files ?? [])];
    e.target.value = '';
    if (!files.length) return;

    const problem = files.map((f) => checkUpload(f, IMAGE_TYPES)).find(Boolean);
    if (problem) return setStatus({ tone: 'error', text: problem });

    setBusy('add');
    setStatus(null);
    let added = 0;
    try {
      const supabase = createClient();
      for (const file of files) {
        const blob = await compressJpeg(file, { maxSide: 1280, quality: 0.82 });
        const path = await uploadToBucket(
          supabase, GALLERY_BUCKET, storagePath(authId, `work-${added}`, 'image/jpeg'), blob, 'image/jpeg'
        );
        const result = await addMyGalleryImage({ path });
        if (!result.success) throw new Error(result.error);
        added += 1;
      }
      setStatus({ tone: 'success', text: added === 1 ? 'Photo added.' : `${added} photos added.` });
    } catch (err) {
      console.error('[GalleryManager] Upload failed:', err);
      setStatus({
        tone: 'error',
        text: added
          ? `${added} added, then one failed: ${err.message}`
          : (err.message?.includes('up to') ? err.message : 'Could not upload that photo. Please try again.'),
      });
    } finally {
      setBusy('');
      router.refresh();
    }
  }

  async function handleRemove(image) {
    const ok = await confirm({
      title: 'Delete this photo?',
      message: 'It will be removed from your work gallery. This cannot be undone.',
    });
    if (!ok) return;
    setBusy(`del-${image.image_id}`); setStatus(null);
    const result = await removeMyGalleryImage(image.image_id);
    setBusy('');
    if (result.success) { setStatus({ tone: 'success', text: 'Photo removed.' }); router.refresh(); }
    else setStatus({ tone: 'error', text: result.error ?? 'Could not remove that photo.' });
  }

  return (
    <div className="manager">
      <div className="manager-head">
        <div>
          <h3 className="manager-title">
            Work Gallery <span className="tab-panel-count">({images.length})</span>
          </h3>
          <p className="manager-sub">Photos of jobs you have finished. Residents see these on your public page.</p>
        </div>
        <button type="button" className="btn-primary-app btn-sm" onClick={() => input.current?.click()} disabled={!!busy}>
          <Icon name="image" size="sm" />
          {busy === 'add' ? 'Uploading…' : 'Add photos'}
        </button>
      </div>

      <input ref={input} type="file" accept={IMAGE_TYPES.join(',')} multiple
             onChange={handleFiles} hidden data-testid="gallery-input" />

      <p className={`form-status${status ? ` form-status--${status.tone}` : ''}`} role="status" aria-live="polite">
        {status && <Icon name={status.tone === 'success' ? 'check-circle' : 'warning'} size="sm" />}
        {status?.text ?? ''}
      </p>

      {images.length === 0 ? (
        <EmptyState icon="image" title="No work photos yet"
                    hint="Add a few clear photos of finished jobs. They are resized automatically." />
      ) : (
        <div className="gallery-grid">
          {images.map((image) => (
            <div className="gallery-tile gallery-tile--photo" key={image.image_id}>
              <img src={image.url} alt={image.caption || 'Work photo'} className="gallery-tile-img" loading="lazy" />
              <button
                type="button"
                className="gallery-remove-btn"
                onClick={() => handleRemove(image)}
                disabled={!!busy}
                aria-label="Remove this photo"
                title="Remove photo"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="field-hint">JPG, PNG or WebP, up to 5 MB each before resizing.</p>

      {dialog}
    </div>
  );
}
