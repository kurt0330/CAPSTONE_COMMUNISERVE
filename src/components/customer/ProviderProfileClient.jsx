// PATH: /src/components/customer/ProviderProfileClient.jsx
// Interactive half of the customer-facing provider profile: tabs, the
// Services list (fixed-price pre-sets + the Custom Service bid) and the
// booking sheet (M4).

'use client';

import { useState } from 'react';
import Link from 'next/link';

import AppTopBar              from '@/components/shared/AppTopBar';
import ProfileHeaderCard      from '@/components/shared/ProfileHeaderCard';
import StatRow                from '@/components/shared/StatRow';
import TabNav, { TabPanel }   from '@/components/shared/TabNav';
import ListCard, { MetaItem } from '@/components/shared/ListCard';
import StarRating             from '@/components/shared/StarRating';
import EmptyState             from '@/components/shared/EmptyState';
import ServiceCard            from '@/components/shared/ServiceCard';
import BookingSheet           from '@/components/customer/BookingSheet';
import Avatar                 from '@/components/shared/Avatar';
import Icon                   from '@/components/ui/Icon';

import { TRADE_ICONS } from '@/lib/constants';
import { initialsOf, formatDate } from '@/lib/format';
import { isImageName } from '@/lib/uploads';

const TABS = [
  { key: 'services', label: 'Services' },
  { key: 'about',    label: 'About'    },
  { key: 'skills',   label: 'Skills'   },
  { key: 'credentials', label: 'Credentials' },
  { key: 'gallery',  label: 'Gallery'  },
  { key: 'reviews',  label: 'Reviews'  },
];

export default function ProviderProfileClient({ provider, services = [], skills, files, gallery = [], reviews }) {
  const [activeTab, setActiveTab] = useState('services');
  // undefined = sheet closed · null = Custom Service · object = fixed service
  const [booking,   setBooking]   = useState(undefined);
  const [sentType,  setSentType]  = useState(null);

  const headerProvider = {
    ...provider,
    avatar_initials: initialsOf(provider.full_name),
  };

  const stats = [
    { icon: 'star',    value: Number(provider.average_rating ?? 0).toFixed(1), label: 'Rating'  },
    { icon: 'message', value: provider.review_count ?? 0,                      label: 'Reviews' },
    { icon: 'toolbox', value: services.length,                                 label: 'Services' },
    { icon: 'id-card', value: provider.id_verified ? 'Yes' : 'Pending',        label: 'ID Verified' },
  ];

  // Résumé + every skill certificate the provider has uploaded.
  const credentialCount = files.length + (provider.resume ? 1 : 0);

  const isPanday = provider.trade_category === 'Carpenter';
  const tradeIcon = TRADE_ICONS[provider.trade_category] ?? 'toolbox';

  return (
    <div className="app-page">

      <AppTopBar title="Service Provider" backHref="/customer/search" />

      <div className="profile-layout">

        <div className="profile-layout-aside">
          <ProfileHeaderCard provider={headerProvider} />
          <StatRow stats={stats} />
        </div>

        <div>
          {sentType && (
            <div style={{ marginBottom: 16 }}>
              <EmptyState
                icon="check-circle"
                tone="success"
                className="empty-state--success"
                title={sentType === 'custom' ? 'Offer sent' : 'Request sent'}
                hint={sentType === 'custom'
                  ? `${provider.full_name} can accept, decline or counter your offer. Follow it under My Requests.`
                  : `${provider.full_name} has been notified. Track it under My Requests.`}
              />
              <Link href="/customer/requests" className="link-row">
                <span className="icon-badge icon-badge--sm"><Icon name="clipboard" size="sm" /></span>
                <span className="link-row-label">Go to My Requests</span>
                <Icon name="chevron-right" size="md" />
              </Link>
            </div>
          )}

          {/* Informational only — the customer can still book or send an offer. */}
          {provider.occupied && (
            <div className="info-banner" role="status">
              <Icon name="info" size="md" />
              <div>
                <p className="info-banner-title">
                  This provider is currently handling another request.
                </p>
                <p className="info-banner-text">
                  You can still send a custom request, but please expect a slight waiting time.
                </p>
              </div>
            </div>
          )}

          <TabNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} scroll />

          <TabPanel stable>

            {activeTab === 'services' && (
              <>
                <p className="tab-panel-heading">
                  Services <span className="tab-panel-count">({services.length + 1})</span>
                </p>
                <div className="service-list">
                  {services.map((svc) => (
                    <ServiceCard
                      key={svc.provider_service_id}
                      icon={tradeIcon}
                      name={svc.service_name}
                      description={svc.description}
                      price={svc.price}
                      unit={svc.price_unit}
                      action={
                        <button type="button" className="btn-primary-app btn-sm" onClick={() => setBooking(svc)}>
                          Book
                        </button>
                      }
                    />
                  ))}

                  {/* Every provider ends with the negotiable Custom Service */}
                  <ServiceCard
                    custom
                    name="Custom Service"
                    description={isPanday
                      ? 'Describe the job and propose a daily rate (Arawan) or a whole-project price (Pakyawan).'
                      : 'Need something not listed? Describe it and propose your price.'}
                    priceNote="Price is negotiated"
                    action={
                      <button type="button" className="btn-ghost-app btn-sm" onClick={() => setBooking(null)}>
                        Request
                      </button>
                    }
                  />
                </div>
              </>
            )}

            {activeTab === 'about' && (
              <div className="about-split">
                <div>
                  <p className="tab-panel-heading">About</p>
                  <p className="tab-panel-text">
                    {provider.bio || 'This provider has not added a bio yet.'}
                  </p>
                  {credentialCount > 0 && (
                    <button
                      type="button"
                      className="btn-ghost-app btn-sm"
                      style={{ marginTop: 12 }}
                      onClick={() => setActiveTab('credentials')}
                    >
                      <Icon name="certificate" size="sm" />
                      View credentials ({credentialCount})
                    </button>
                  )}
                </div>

                <div>
                  <p className="tab-panel-heading">Service Provider</p>
                  <ListCard
                    thumb={<Avatar src={provider.avatar_url} name={provider.full_name} />}
                    title={provider.full_name}
                    subtitle={provider.trade_category}
                    meta={<MetaItem icon="map-pin">{provider.barangay}, Anini-y</MetaItem>}
                  />
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <>
                <p className="tab-panel-heading">
                  Skills <span className="tab-panel-count">({skills.length})</span>
                </p>
                {skills.length === 0 ? (
                  <EmptyState icon="toolbox" title="No skills listed yet" />
                ) : (
                  skills.map((skill) => (
                    <ListCard
                      key={skill.skill_id}
                      thumb={<Icon name="toolbox" size="lg" />}
                      title={skill.skill_name}
                      subtitle={skill.description}
                      meta={
                        <MetaItem icon="clock">
                          {skill.years_experience} {Number(skill.years_experience) === 1 ? 'year' : 'years'} of experience
                        </MetaItem>
                      }
                    />
                  ))
                )}
              </>
            )}

            {activeTab === 'credentials' && (
              <>
                <p className="tab-panel-heading">
                  Credentials <span className="tab-panel-count">({credentialCount})</span>
                </p>
                {credentialCount === 0 ? (
                  <EmptyState
                    icon="certificate"
                    title="No credentials yet"
                    hint="This provider has not uploaded a résumé or certificates."
                  />
                ) : (
                  <div className="doc-list">
                    {provider.resume && (
                      <CredentialRow label="Résumé" name={provider.resume.name} url={provider.resume.url} />
                    )}
                    {files.map((file) => (
                      <CredentialRow
                        key={file.file_id}
                        label="Skill certificate"
                        name={file.original_name}
                        url={file.url}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'gallery' && (
              <>
                <p className="tab-panel-heading">
                  Work photos <span className="tab-panel-count">({gallery.length})</span>
                </p>
                {gallery.length === 0 ? (
                  <EmptyState icon="image" title="No work photos yet" hint="This provider has not added photos of their work." />
                ) : (
                  <div className="gallery-grid">
                    {gallery.map((image) => (
                      <a
                        className="gallery-tile gallery-tile--photo"
                        key={image.image_id}
                        href={image.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open work photo"
                      >
                        <img src={image.url} alt={image.caption || 'Work photo'} className="gallery-tile-img" loading="lazy" />
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'reviews' && (
              <>
                <p className="tab-panel-heading">
                  Reviews <span className="tab-panel-count">({reviews.length})</span>
                </p>
                {reviews.length === 0 ? (
                  <EmptyState
                    icon="message"
                    title="No reviews yet"
                    hint="Reviews appear after a completed job is rated."
                  />
                ) : (
                  reviews.map((review) => (
                    <div className="review-card" key={review.rating_id}>
                      <div className="review-head">
                        <div className="review-avatar">
                          <Avatar src={review.avatar_url} name={review.reviewer_name} />
                        </div>
                        <div>
                          <p className="review-name">{review.reviewer_name}</p>
                          <p className="review-date">{formatDate(review.rated_at)}</p>
                        </div>
                      </div>
                      {review.review_text && (
                        <p className="review-text">{review.review_text}</p>
                      )}
                      <StarRating stars={review.stars} />
                    </div>
                  ))
                )}
              </>
            )}

          </TabPanel>
        </div>

      </div>

      {booking !== undefined && (
        <BookingSheet
          provider={provider}
          service={booking}
          onClose={() => setBooking(undefined)}
          onBooked={(type) => { setBooking(undefined); setSentType(type); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        />
      )}
    </div>
  );
}

/** One credential a customer can open: résumé or skill certificate. */
function CredentialRow({ label, name, url }) {
  return (
    <div className="doc-row">
      <span className="doc-row-thumb">
        {url && isImageName(name)
          ? <img src={url} alt="" className="avatar-img" loading="lazy" width="48" height="48" />
          : <Icon name={label === 'Résumé' ? 'file' : 'certificate'} size="lg" />}
      </span>
      <div className="doc-row-body">
        <p className="doc-row-label">{label}</p>
        <p className="doc-row-name" title={name}>{name}</p>
      </div>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn-ghost-app btn-sm">
          <Icon name="external-link" size="sm" />
          View
        </a>
      ) : (
        <span className="dash-muted">Unavailable</span>
      )}
    </div>
  );
}
