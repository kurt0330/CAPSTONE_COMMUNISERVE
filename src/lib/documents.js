// PATH: /src/lib/documents.js
// Server-side helper for the private `provider-documents` bucket (résumés and
// certificates). Nothing in that bucket has a public URL: pages ask for
// short-lived signed links instead (BR-10).
//
// Pass the session client to sign the caller's OWN files (storage RLS allows
// it), or the service-role client when a page shows an approved provider's
// documents to someone else.

const DOCUMENT_BUCKET = 'provider-documents';
const LINK_TTL_SECONDS = 60 * 60;   // 1 hour

/** @returns {Promise<Record<string, string>>} path → signed URL (missing on failure) */
export async function signDocuments(supabase, paths) {
  const wanted = [...new Set((paths ?? []).filter(Boolean))];
  if (!wanted.length) return {};

  const { data, error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrls(wanted, LINK_TTL_SECONDS);

  if (error) {
    console.error('[documents] Signing failed:', error.message);
    return {};
  }

  const map = {};
  (data ?? []).forEach(({ path, signedUrl }) => { if (signedUrl) map[path] = signedUrl; });
  return map;
}
