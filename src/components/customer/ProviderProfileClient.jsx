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
import GalleryGrid            from '@/components/shared/GalleryGrid';
import StarRating             from '@/components/shared/StarRating';
import EmptyState             from '@/components/shared/EmptyState';
import ServiceCard            from '@/components/shared/ServiceCard';
import BookingSheet           from '@/components/customer/BookingSheet';
import Icon                   from '@/components/ui/Icon';

import { TRADE_ICONS } from '@/lib/constants';
import { initialsOf, formatDate } from '@/lib/format';

const TABS = [
  { key: 'services', label: 'Services' },
  { key: 'about',    label: 'About'    },
  { key: 'skills',   label: 'Skills'   },
  { key: 'gallery',  label: 'Gallery'  },
  { key: 'reviews',  label: 'Reviews'  },
];

export default function ProviderProfileClient({ provider, services = [], skills, files, reviews }) {
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

          <TabNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

          <TabPanel>

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
                </div>

                <div>
                  <p className="tab-panel-heading">Service Provider</p>
                  <ListCard
                    thumb={initialsOf(provider.full_name)}
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

            {activeTab === 'gallery' && (
              <>
                <p className="tab-panel-heading">
                  Credentials <span className="tab-panel-count">({files.length})</span>
                </p>
                <GalleryGrid files={files} />
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
                          {initialsOf(review.reviewer_name)}
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
