// PATH: /src/components/ui/EmailInput.jsx
// Email field with a built-in @gmail.com shortcut, used on sign-in and on
// both registration forms.
//   • type only the name ("juan") and leave the field → "juan@gmail.com"
//   • or tap one of the domain buttons that appear while there is no @ yet
//   • typing a full address (any domain) is left exactly as typed
//
// It is a plain text input with the email keyboard rather than type="email",
// so the browser does not block "juan" with its own "missing @" bubble before
// the shortcut has had a chance to run. Callers should still pass the value
// through completeEmail() when they submit (covers pressing Enter in the field).
//
// The look of the input itself comes from the caller (className / style), so
// it matches whichever form it sits in.

'use client';

import { completeEmail, needsEmailDomain, DEFAULT_EMAIL_DOMAIN, EMAIL_DOMAIN_CHOICES } from '@/lib/email';

export default function EmailInput({
  id,
  value,
  onValueChange,
  className,
  style,
  placeholder = 'yourname',
  required = false,
  disabled = false,
  hint = true,
}) {
  const typed = String(value ?? '');
  const showChoices = needsEmailDomain(typed);
  const localPart = typed.trim().replace(/@$/, '');

  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        autoComplete="email"
        className={className}
        style={style}
        placeholder={placeholder}
        value={typed}
        required={required}
        disabled={disabled}
        onChange={(e) => onValueChange(e.target.value)}
        onBlur={() => { if (needsEmailDomain(typed)) onValueChange(completeEmail(typed)); }}
        aria-describedby={hint && id ? `${id}-assist` : undefined}
      />

      <div className="email-assist" id={id ? `${id}-assist` : undefined}>
        {showChoices ? (
          <div className="email-assist-choices">
            {EMAIL_DOMAIN_CHOICES.map((domain) => (
              <button
                key={domain}
                type="button"
                className="email-assist-chip"
                // mousedown would blur the input first and auto-complete with
                // the default domain; keep focus so the chosen domain wins.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onValueChange(completeEmail(typed, domain))}
              >
                {localPart}@{domain}
              </button>
            ))}
          </div>
        ) : hint && !typed ? (
          <p className="email-assist-hint">
            Type just your email name — <strong>@{DEFAULT_EMAIL_DOMAIN}</strong> is added for you.
          </p>
        ) : null}
      </div>
    </>
  );
}
