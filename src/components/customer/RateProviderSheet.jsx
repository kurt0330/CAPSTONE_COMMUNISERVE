// PATH: /src/components/customer/RateProviderSheet.jsx
// Opened by "Mark Job as Completed" on an In Progress request (M6).
// The customer rates the provider (stars are mandatory, BR-07) and the job
// is closed in the same step — completeJobWithReview() does both or neither.

'use client';

import { useState } from 'react';

import Sheet from '@/components/shared/Sheet';
import Icon  from '@/components/ui/Icon';

import { completeJobWithReview } from '@/actions/jobActions';
import { REVIEW_MAX_LENGTH } from '@/lib/constants';

const STAR_LABELS = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

export default function RateProviderSheet({ job, onClose, onDone }) {
  const [stars,   setStars]   = useState(0);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (sending) return;
    if (!stars) return setError('Please tap a star to rate your provider.');

    setSending(true);
    setError('');
    const result = await completeJobWithReview(job.job_id, stars, comment);
    setSending(false);

    if (result.success) onDone?.();
    else setError(result.error ?? 'Could not complete this job.');
  }

  return (
    <Sheet title="Rate Your Provider" onClose={sending ? undefined : onClose}>
      <form onSubmit={handleSubmit} className="form-stack">

        <p className="rate-sheet-sub">
          How was your experience with {job.provider_name}?
        </p>

        {error && (
          <div className="app-alert" role="alert" style={{ margin: 0 }}>
            <Icon name="warning" size="md" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <div className="rating-input" role="radiogroup" aria-label="Your rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={stars === n}
                aria-label={`${n} ${n === 1 ? 'star' : 'stars'} — ${STAR_LABELS[n - 1]}`}
                className={`rating-star-btn${n <= stars ? ' active' : ''}`}
                onClick={() => { setStars(n); setError(''); }}
                disabled={sending}
              >
                <Icon name="star" size="2xl" />
              </button>
            ))}
          </div>
          <p className="rating-input-label" aria-live="polite">
            {stars ? STAR_LABELS[stars - 1] : 'Tap a star to rate'}
          </p>
        </div>

        <div>
          <label className="field-label" htmlFor={`review-${job.job_id}`}>
            Write a review (Optional)
          </label>
          <textarea
            id={`review-${job.job_id}`}
            className="profile-edit-input"
            rows={4}
            maxLength={REVIEW_MAX_LENGTH}
            placeholder="Write a review (Optional)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={sending}
          />
          <p className="char-count">{comment.length}/{REVIEW_MAX_LENGTH}</p>
        </div>

        <button type="submit" className="btn-primary-app btn-block" disabled={sending}>
          {sending ? 'Submitting…' : 'Submit & Close Job'}
        </button>
      </form>
    </Sheet>
  );
}
