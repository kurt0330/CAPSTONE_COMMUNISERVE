// PATH: /src/components/provider/PortfolioClient.jsx
// M3 — the provider's own profile, in editable form. Mirrors the layout of
// the customer-facing profile so providers recognise their public page.

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import ProfileHeaderCard      from '@/components/shared/ProfileHeaderCard';
import StatRow                from '@/components/shared/StatRow';
import TabNav, { TabPanel }   from '@/components/shared/TabNav';
import ListCard, { MetaItem } from '@/components/shared/ListCard';
import GalleryGrid            from '@/components/shared/GalleryGrid';
import StarRating             from '@/components/shared/StarRating';
import EmptyState             from '@/components/shared/EmptyState';
import Icon                   from '@/components/ui/Icon';
import ServicesPricingEditor  from '@/components/provider/ServicesPricingEditor';

import { initialsOf, formatDate } from '@/lib/format';
import { updateProviderBio } from '@/actions/providerActions';

const TABS = [
  { key: 'services', label: 'Services & Pricing' },
  { key: 'about',   label: 'About'   },
  { key: 'skills',  label: 'Skills'  },
  { key: 'gallery', label: 'Gallery' },
  { key: 'reviews', label: 'Reviews' },
];

export default function PortfolioClient({ provider, skills, files, reviews, catalog = [], myServices = [] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [activeTab,  setActiveTab]  = useState('services');
  const [editingBio, setEditingBio] = useState(false);
  const [bio,        setBio]        = useState(provider.bio ?? '');
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  const headerProvider = {
    ...provider,
    avatar_initials: initialsOf(provider.full_name),
  };

  const stats = [
    { icon: 'star',        value: Number(provider.average_rating ?? 0).toFixed(1), label: 'Rating'  },
    { icon: 'message',     value: reviews.length,                                  label: 'Reviews' },
    { icon: 'toolbox',     value: skills.length,                                   label: 'Skills'  },
    { icon: 'certificate', value: files.length,                                    label: 'Files'   },
  ];

  async function saveBio() {
    setSaving(true);
    setError('');

    const result = await updateProviderBio(provider.provider_id, bio);

    setSaving(false);

    if (result.success) {
      setEditingBio(false);
      startTransition(() => router.refresh());
    } else {
      setError(result.error ?? 'Could not save your bio.');
    }
  }

  return (
    <div className="app-page">

      <div className="app-page-head">
        <div>
          <h2 className="app-page-title">My Portfolio</h2>
          <p className="app-page-sub">
            This is how residents see your profile when they search.
          </p>
        </div>
        <a
          href={`/customer/providers/${provider.provider_id}`}
          className="btn-ghost-app"
        >
          <Icon name="eye" size="sm" />
          View public page
        </a>
      </div>

      <div className="profile-layout">

        <div className="profile-layout-aside">
          <ProfileHeaderCard provider={headerProvider} />
          <StatRow stats={stats} />
        </div>

        <div>
          <TabNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

          <TabPanel>

            {activeTab === 'services' && (
              <ServicesPricingEditor
                providerId={provider.provider_id}
                tradeCategory={provider.trade_category}
                catalog={catalog}
                myServices={myServices}
              />
            )}

            {activeTab === 'about' && (
              <>
                <p className="tab-panel-heading">About Me</p>

                {error && (
                  <div className="app-alert" role="alert">
                    <Icon name="warning" size="md" />
                    <span>{error}</span>
                  </div>
                )}

                {editingBio ? (
                  <div className="form-stack">
                    <textarea
                      className="profile-edit-input"
                      rows={6}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      aria-label="Bio"
                      placeholder="Describe your experience and the work you take on."
                    />
                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn-primary-app"
                        onClick={saveBio}
                        disabled={saving}
                      >
                        <Icon name="check" size="sm" />
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        type="button"
                        className="btn-ghost-app"
                        onClick={() => { setBio(provider.bio ?? ''); setEditingBio(false); }}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="tab-panel-text">
                      {provider.bio || 'You have not added a bio yet. Residents are more likely to hire providers who describe their experience.'}
                    </p>
                    <button
                      type="button"
                      className="btn-ghost-app"
                      onClick={() => setEditingBio(true)}
                    >
                      <Icon name="edit" size="sm" />
                      Edit bio
                    </button>
                  </>
                )}
              </>
            )}

            {activeTab === 'skills' && (
              <>
                <p className="tab-panel-heading">
                  My Skills <span className="tab-panel-count">({skills.length})</span>
                </p>
                {skills.length === 0 ? (
                  <EmptyState
                    icon="toolbox"
                    title="No skills listed yet"
                    hint="Skills captured during your application appear here."
                  />
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
                  My Credentials <span className="tab-panel-count">({files.length})</span>
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
                    hint="Residents rate you after each completed job."
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
    </div>
  );
}
