// PATH: /src/lib/uploads.js
// Browser-side helpers for profile uploads. Files go straight from the
// browser to Supabase Storage (the storage policies only let a user write
// inside the folder named after their own auth uid); a server action then
// records the result. The buckets enforce the same size and type limits.

export const AVATAR_BUCKET   = 'avatars';             // public
export const DOCUMENT_BUCKET = 'provider-documents';  // private, signed URLs
export const GALLERY_BUCKET  = 'provider-gallery';    // public work photos

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;      // 5 MB
export const IMAGE_TYPES    = ['image/jpeg', 'image/png', 'image/webp'];
export const DOCUMENT_TYPES = ['application/pdf', ...IMAGE_TYPES];

export const NICKNAME_MAX = 40;
export const BIO_MAX      = 500;
export const STREET_MAX   = 160;
export const CAPTION_MAX  = 120;
export const SKILL_NAME_MAX = 100;
export const SKILL_DESC_MAX = 255;

const EXTENSIONS = {
  'application/pdf': 'pdf',
  'image/jpeg':      'jpg',
  'image/png':       'png',
  'image/webp':      'webp',
};

/** Returns an error message, or '' when the file is acceptable. */
export function checkUpload(file, allowedTypes) {
  if (!file) return 'No file chosen.';
  if (!allowedTypes.includes(file.type)) {
    return allowedTypes.includes('application/pdf')
      ? 'Please choose a PDF or an image (JPG, PNG or WebP).'
      : 'Please choose an image (JPG, PNG or WebP).';
  }
  if (file.size > MAX_UPLOAD_BYTES) return 'That file is larger than 5 MB.';
  return '';
}

/** `<auth uid>/<prefix>-<timestamp>.<ext>` — the folder is what RLS checks. */
export function storagePath(authId, prefix, mimeType) {
  return `${authId}/${prefix}-${Date.now()}.${EXTENSIONS[mimeType] ?? 'bin'}`;
}

export const isImageName = (name = '') => /\.(jpe?g|png|webp)$/i.test(name);

/**
 * Re-encodes a photo as a JPEG before it is uploaded.
 *   square: true  → centred square crop (avatars, shown at 36–104px)
 *   square: false → keeps the shape, longest side capped at maxSide (gallery)
 * A phone photo is several megabytes; this keeps uploads and every later
 * page load light on mobile data.
 */
export async function compressJpeg(file, { maxSide = 512, square = false, quality = 0.85 } = {}) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('That image could not be read.'));
      el.src = url;
    });

    const w = img.naturalWidth, h = img.naturalHeight;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (square) {
      const side = Math.min(w, h);
      canvas.width = canvas.height = Math.min(maxSide, side);
      ctx.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
    } else {
      const scale = Math.min(1, maxSide / Math.max(w, h));
      canvas.width  = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      // JPEG has no transparency: paint white first so PNG cut-outs don't go black.
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) throw new Error('That image could not be processed.');
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Browser → Storage upload under the caller's own folder. Throws on failure. */
export async function uploadToBucket(supabase, bucket, path, body, contentType) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, body, { contentType, cacheControl: '31536000', upsert: false });
  if (error) throw new Error(error.message);
  return path;
}
