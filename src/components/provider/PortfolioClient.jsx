// PATH: /src/components/provider/PortfolioClient.jsx
// M3 — My Portfolio: the provider's showcase AND their profile editor, on one
// full page. There is no separate "edit profile" screen or popup:
//   hero photo   → tap it to change the profile photo
//   About        → nickname + professional bio, edited inline
//   Skills       → add / remove skills
//   Files        → résumé + skill certificates
//   Gallery      → photos of finished work
// Full name, barangay and primary trade are verified registration data and
// are shown as fixed text.

'use client';

import { useState } from 'react';

import ProfileHeaderCard      from '@/components/shared/ProfileHeaderCard';
import StatRow                from '@/components/shared/StatRow';
import TabNav, { TabPanel }   from '@/components/shared/TabNav';
import StarRating             from '@/components/shared/StarRating';
import EmptyState             from '@/components/shared/EmptyState';
import Avatar                 from '@/components/shared/Avatar';
import AvatarUploader         from '@/components/shared/AvatarUploader';
import ProfileDetailsForm     from '@/components/shared/ProfileDetailsForm';
import VerifiedDetails        from '@/components/shared/VerifiedDetails';
import ServicesPricingEditor  from '@/components/provider/ServicesPricingEditor';
import SkillsManager          from '@/components/provider/SkillsManager';
import DocumentManager        from '@/components/provider/DocumentManager';
import GalleryManager         from '@/components/provider/GalleryManager';

import { initialsOf, formatDate } from '@/lib/format';

const TABS = [
  { key: 'services', label: 'Services & Pricing' },
  { key: 'about',    label: 'About'   },
  { key: 'skills',   label: 'Skills'  },
  { key: 'files',    label: 'Files'   },
  { key: 'gallery',  label: 'Gallery' },
  { key: 'reviews',  label: 'Reviews' },
];

export default function PortfolioClient({
  authId,
  provider,
  skills = [],
  resume = null,
  certificates = [],
  gallery = [],
  reviews = [],
  catalog = [],
  myServices = [],
}) {
  const [activeTab, setActiveTab] = useState('services');

  const headerProvider = {
    ...provider,
    avatar_initials: initialsOf(provider.full_name),
  };

  const stats = [
    { icon: 'star',        value: Number(provider.average_rating ?? 0).toFixed(1), label: 'Rating'  },
    { icon: 'message',     value: reviews.length,                                  label: 'Reviews' },
    { icon: 'toolbox',     value: skills.length,                                   label: 'Skills'  },
    { icon: 'certificate', value: certificates.length + (resume ? 1 : 0),          label: 'Files'   },
  ];

  return (
    <div className="app-page">

      <h1 className="visually-hidden">My Portfolio</h1>

      <div className="profile-layout">

        <div className="profile-layout-aside">
          <ProfileHeaderCard
            provider={headerProvider}
            avatar={
              <AvatarUploader
                authId={authId}
                avatarUrl={provider.avatar_url}
                name={provider.full_name}
                size="md"
                verified={provider.id_verified}
                compact
              />
            }
          />
          <StatRow stats={stats} />
        </div>

        <div>
          <TabNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} scroll />

          <TabPanel stable>

            {activeTab === 'services' && (
              <ServicesPricingEditor
                providerId={provider.provider_id}
                tradeCategory={provider.trade_category}
                catalog={catalog}
                myServices={myServices}
              />
            )}

            {activeTab === 'about' && (
              <div className="manager">
                <section className="manager-section" aria-labelledby="about-edit-title">
                  <div className="manager-head">
                    <div>
                      <h3 className="manager-title" id="about-edit-title">About me</h3>
                      <p className="manager-sub">How you introduce yourself to residents.</p>
                    </div>
                  </div>
                  <ProfileDetailsForm
                    variant="provider"
                    initial={{ nickname: provider.nickname, bio: provider.bio }}
                  />
                </section>

                <VerifiedDetails
                  items={[
                    { label: 'Full name',     value: provider.full_name },
                    { label: 'Location',      value: `${provider.barangay}, Anini-y` },
                    { label: 'Primary trade', value: provider.trade_category },
                  ]}
                />
              </div>
            )}

            {activeTab === 'skills' && <SkillsManager skills={skills} />}

            {activeTab === 'files' && (
              <DocumentManager authId={authId} resume={resume} certificates={certificates} />
            )}

            {activeTab === 'gallery' && <GalleryManager authId={authId} images={gallery} />}

            {activeTab === 'reviews' && (
              <>
                <p className="tab-panel-heading">
                  Reviews <span className="tab-panel-count">({reviews.length})</span>
                </p>
                {reviews.length === 0 ? (
                  <EmptyState
                    icon="message"
                    title="No reviews yet"
                    hint="Residents rate you after each completed job."
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
    </div>
  );
}
