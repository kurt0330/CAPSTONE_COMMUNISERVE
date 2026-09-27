// PATH: /src/lib/negotiation.js
// Pure helpers for reading a Custom Service negotiation from a job row
// returned by get_customer_jobs() / get_provider_jobs().
// The database (respond_to_job_offer) is the authority on whose turn it
// is — these only decide what to show.

/**
 * @param job     row with request_type, job_status, offers[]
 * @param viewer  'customer' | 'provider'
 * @returns {{ isCustom, isOpen, latest, myTurn, waitingOn, offers }}
 */
export function negotiationState(job, viewer) {
  const offers = Array.isArray(job?.offers) ? job.offers : [];
  const latest = offers[offers.length - 1] ?? null;
  const isCustom = job?.request_type === 'custom';
  const isOpen = isCustom && job?.job_status === 'Pending' && !!latest;

  // Whoever did NOT make the latest offer is the one who must respond.
  const waitingOn = isOpen ? (latest.offered_by === 'customer' ? 'provider' : 'customer') : null;

  return {
    isCustom,
    isOpen,
    latest,
    myTurn: isOpen && waitingOn === viewer,
    waitingOn,
    offers,
  };
}

/** The price to show on a card: agreed price, else the latest offer. */
export function displayPrice(job) {
  if (job?.agreed_price != null) return Number(job.agreed_price);
  const offers = Array.isArray(job?.offers) ? job.offers : [];
  const latest = offers[offers.length - 1];
  return latest ? Number(latest.amount) : null;
}
