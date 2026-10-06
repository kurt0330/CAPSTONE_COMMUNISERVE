// PATH: /src/components/shared/AvatarUploader.jsx
// The profile photo, in place, as its own upload control. The whole circle
// is the button — tap it (or click / press Enter) to open the photo picker.
// The camera badge is always visible, so touch users are never relying on a
// hover state; on desktop, hover and focus add a "Change photo" veil.
//
// The photo is cropped to a centred square and re-encoded as a small JPEG in
// the browser (`compact` drops the resting hint for tight spots such as the
// portfolio hero card), uploaded to the caller's own folder in the public `avatars`
// bucket, then recorded with setMyAvatar().

'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import Avatar from '@/components/shared/Avatar';
import { useConfirmDialog } from '@/components/shared/ConfirmDialog';
import Icon   from '@/components/ui/Icon';

import { createClient } from '@/lib/supabase/client';
import { AVATAR_BUCKET, IMAGE_TYPES, checkUpload, storagePath, compressJpeg, uploadToBucket } from '@/lib/uploads';
import { setMyAvatar } from '@/actions/profileActions';

export default function AvatarUploader({ authId, avatarUrl, name, size = 'lg', verified = false, compact = false }) {
  const router = useRouter();
  const input = useRef(null);
  const { confirm, dialog } = useConfirmDialog();

  const [preview, setPreview] = useState(null);   // local photo shown while uploading
  const [busy,    setBusy]    = useState(false);
  const [message, setMessage] = useState(null);   // { tone: 'error' | 'success', text }

  const src = preview ?? avatarUrl;

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';                 // allow choosing the same file again
    if (!file) return;

    const problem = checkUpload(file, IMAGE_TYPES);
    if (problem) return setMessage({ tone: 'error', text: problem });

    setBusy(true);
    setMessage(null);
    try {
      const blob = await compressJpeg(file, { maxSide: 512, square: true });
      setPreview(URL.createObjectURL(blob));
      const path = await uploadToBucket(
        createClient(), AVATAR_BUCKET, storagePath(authId, 'avatar', 'image/jpeg'), blob, 'image/jpeg'
      );
      const result = await setMyAvatar(path);
      if (!result.success) throw new Error(result.error);
      setMessage({ tone: 'success', text: 'Photo updated.' });
      router.refresh();
    } catch (err) {
      console.error('[AvatarUploader] Upload failed:', err);
      setPreview(null);
      setMessage({ tone: 'error', text: 'Could not upload that photo. Please try another one.' });
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    const ok = await confirm({
      title: 'Remove your profile photo?',
      message: 'Your initials will be shown instead. You can add a new photo at any time.',
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    setBusy(true);
    setMessage(null);
    setPreview(null);
    const result = await setMyAvatar(null);
    setBusy(false);
    if (result.success) { setMessage({ tone: 'success', text: 'Photo removed.' }); router.refresh(); }
    else setMessage({ tone: 'error', text: result.error ?? 'Could not remove your photo.' });
  }

  return (
    <div className={`avatar-uploader avatar-uploader--${size}${compact ? ' avatar-uploader--compact' : ''}`}>
      <button
        type="button"
        className="avatar-uploader-btn"
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-label={src ? 'Change profile photo' : 'Add a profile photo'}
        aria-describedby="avatar-uploader-status"
      >
        <span className="avatar-uploader-photo">
          <Avatar src={src} name={name} />
        </span>
        <span className="avatar-uploader-veil" aria-hidden="true">
          {busy ? 'Uploading…' : 'Change photo'}
        </span>
        <span className="avatar-uploader-badge" aria-hidden="true">
          <Icon name="camera" size="sm" />
        </span>
        {verified && <span className="profile-avatar-dot" aria-hidden="true" />}
      </button>

      <input
        ref={input}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        onChange={handleFile}
        hidden
        data-testid="avatar-input"
      />

      <p
        id="avatar-uploader-status"
        className={`avatar-uploader-status${message ? ` avatar-uploader-status--${message.tone}` : ''}`}
        role="status"
        aria-live="polite"
      >
        {busy ? 'Uploading photo…' : message?.text ?? (compact ? '' : 'Tap your photo to change it.')}
      </p>

      {avatarUrl && !busy && (
        <button type="button" className="text-link-btn" onClick={handleRemove}>
          Remove photo
        </button>
      )}

      {dialog}
    </div>
  );
}
