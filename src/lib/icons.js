// PATH: /src/lib/icons.js
// Icon manifest — the single list of every UI icon in the app.
//
// Each entry maps an icon name (used as <Icon name="…" />) to the file in
// /public/assets/icons/. The shipped files are simple line-art placeholders.
// To swap in a Flaticon asset: download it, save it under the same file
// name, done. If Flaticon gives you a PNG instead of an SVG, change `file`
// below (e.g. 'search.png') — nothing else needs to change.
//
// `flaticon` is a suggested search term for finding a matching icon.

export const ICON_BASE_PATH = '/assets/icons';

export const ICONS = {
  // ── Navigation & actions ─────────────────────────────────────────────
  'arrow-left':     { file: 'arrow-left.svg',     flaticon: 'left arrow' },
  'arrow-right':    { file: 'arrow-right.svg',    flaticon: 'right arrow' },
  'chevron-left':   { file: 'chevron-left.svg',   flaticon: 'chevron left' },
  'chevron-right':  { file: 'chevron-right.svg',  flaticon: 'chevron right' },
  'close':          { file: 'close.svg',          flaticon: 'close' },
  'check':          { file: 'check.svg',          flaticon: 'check mark' },
  'check-circle':   { file: 'check-circle.svg',   flaticon: 'check circle' },
  'search':         { file: 'search.svg',         flaticon: 'magnifying glass' },
  'share':          { file: 'share.svg',          flaticon: 'share' },
  'external-link':  { file: 'external-link.svg',  flaticon: 'external link' },
  'refresh':        { file: 'refresh.svg',        flaticon: 'refresh' },
  'edit':           { file: 'edit.svg',           flaticon: 'pencil edit' },
  'eye':            { file: 'eye.svg',            flaticon: 'eye view' },
  'eye-off':        { file: 'eye-off.svg',        flaticon: 'hide eye' },
  'logout':         { file: 'logout.svg',         flaticon: 'logout' },
  'settings':       { file: 'settings.svg',       flaticon: 'settings gear' },

  // ── Status & feedback ────────────────────────────────────────────────
  'warning':        { file: 'warning.svg',        flaticon: 'warning' },
  'help':           { file: 'help.svg',           flaticon: 'question mark' },
  'hourglass':      { file: 'hourglass.svg',      flaticon: 'hourglass' },
  'clock':          { file: 'clock.svg',          flaticon: 'clock' },
  'shield-check':   { file: 'shield-check.svg',   flaticon: 'verified shield' },
  'star':           { file: 'star.svg',           flaticon: 'star filled' },

  // ── Content & objects ────────────────────────────────────────────────
  'dashboard':      { file: 'dashboard.svg',      flaticon: 'dashboard' },
  'home':           { file: 'home.svg',           flaticon: 'home' },
  'user':           { file: 'user.svg',           flaticon: 'user' },
  'users':          { file: 'users.svg',          flaticon: 'group users' },
  'map-pin':        { file: 'map-pin.svg',        flaticon: 'location pin' },
  'calendar':       { file: 'calendar.svg',       flaticon: 'calendar' },
  'message':        { file: 'message.svg',        flaticon: 'chat bubble' },
  'mail':           { file: 'mail.svg',           flaticon: 'email' },
  'phone':          { file: 'phone.svg',          flaticon: 'phone' },
  'inbox':          { file: 'inbox.svg',          flaticon: 'inbox' },
  'clipboard':      { file: 'clipboard.svg',      flaticon: 'clipboard list' },
  'file':           { file: 'file.svg',           flaticon: 'document' },
  'certificate':    { file: 'certificate.svg',    flaticon: 'certificate' },
  'image':          { file: 'image.svg',          flaticon: 'image gallery' },
  'camera':         { file: 'camera.svg',         flaticon: 'camera' },
  'id-card':        { file: 'id-card.svg',        flaticon: 'id card' },
  'briefcase':      { file: 'briefcase.svg',      flaticon: 'briefcase' },
  'toolbox':        { file: 'toolbox.svg',        flaticon: 'toolbox' },
  'wrench':         { file: 'wrench.svg',         flaticon: 'wrench' },

  // ── Trades (BR-05) ───────────────────────────────────────────────────
  'bolt':           { file: 'bolt.svg',           flaticon: 'electrician lightning' },
  'hammer':         { file: 'hammer.svg',         flaticon: 'carpenter hammer' },
  'broom':          { file: 'broom.svg',          flaticon: 'housekeeping broom' },
  'hard-hat':       { file: 'hard-hat.svg',       flaticon: 'worker helmet' },

  // ── Socio-economic flags (registration Step 1) ───────────────────────
  'accessibility':  { file: 'accessibility.svg',  flaticon: 'disability' },
  'senior':         { file: 'senior.svg',         flaticon: 'elderly' },
  'family':         { file: 'family.svg',         flaticon: 'single parent' },
};

/** Public URL for an icon name. Unknown names fall back to `<name>.svg`. */
export function iconSrc(name) {
  const file = ICONS[name]?.file ?? `${name}.svg`;
  return `${ICON_BASE_PATH}/${file}`;
}
