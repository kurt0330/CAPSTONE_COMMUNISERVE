// PATH: /src/components/shared/VerifiedDetails.jsx
// Verified registration data, shown as plain fixed text. These are not form
// fields — nothing here can be focused or typed into — which is what tells
// the user they are not editable. (A greyed-out input reads as "temporarily
// unavailable"; fixed text reads as "this is a fact".)
//
// items = [{ label, value }]

export default function VerifiedDetails({ items = [], note }) {
  return (
    <section className="verified-details" aria-label="Verified registration details">
      <h3 className="verified-details-title">Registration details</h3>
      <dl className="verified-list">
        {items.filter((i) => i.value).map(({ label, value }) => (
          <div className="verified-row" key={label}>
            <dt className="verified-label">{label}</dt>
            <dd className="verified-value">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="verified-note">
        {note ?? 'Verified when you registered. To correct any of these, please visit the PESO office.'}
      </p>
    </section>
  );
}
