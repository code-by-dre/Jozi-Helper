import { useState } from 'react';
import {
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Search,
  Star,
} from 'lucide-react';
import {
  DIRECTORY_FILTER_LABELS,
  LOCAL_SERVICES_DIRECTORY,
  type CommunityCategory,
  type DirectoryFilterCategory,
} from '../data/joziTopics';
import {
  createPopiaSafeReviewNote,
  filterDirectoryItems,
  type ServiceReviewNote,
} from '../utils/directory';

interface LocalServicesViewProps {
  suburb: string;
  onAskAboutService: (prompt: string, category: Exclude<CommunityCategory, 'all'>) => void;
}

const FILTER_TABS: DirectoryFilterCategory[] = [
  'all',
  'plumbing',
  'electrical',
  'handyman',
  'municipal',
];

export function LocalServicesView({ suburb, onAskAboutService }: LocalServicesViewProps) {
  const [filter, setFilter] = useState<DirectoryFilterCategory>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewsByService, setReviewsByService] = useState<Record<string, ServiceReviewNote[]>>({});
  const [openReviewFormId, setOpenReviewFormId] = useState<string | null>(null);
  const [draftRating, setDraftRating] = useState<number>(5);
  const [draftComment, setDraftComment] = useState<string>('');
  const [reviewFormError, setReviewFormError] = useState<string | null>(null);

  const items = filterDirectoryItems(
    LOCAL_SERVICES_DIRECTORY.map((item) => ({
      ...item,
      category: item.directoryCategory,
    })),
    filter,
    searchTerm
  );

  const suburbSuffix =
    suburb && suburb !== 'Not specified (ask me first)'
      ? ` (Area: ${suburb})`
      : '';

  const handleOpenReviewForm = (serviceId: string) => {
    setOpenReviewFormId((prev) => (prev === serviceId ? null : serviceId));
    setDraftRating(5);
    setDraftComment('');
    setReviewFormError(null);
  };

  const handleSubmitReview = (serviceId: string) => {
    try {
      const note = createPopiaSafeReviewNote({
        rating: draftRating,
        suburb,
        comment: draftComment,
      });
      setReviewsByService((prev) => ({
        ...prev,
        [serviceId]: [note, ...(prev[serviceId] ?? [])],
      }));
      setOpenReviewFormId(null);
      setDraftComment('');
      setReviewFormError(null);
    } catch (err) {
      setReviewFormError(err instanceof Error ? err.message : 'Unable to add review note.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs font-medium text-[#A16207] mb-1.5">
          Johannesburg Service Providers & Municipal Directory ·{' '}
          {suburb && suburb !== 'Not specified (ask me first)'
            ? `Active Area: ${suburb}`
            : 'All Johannesburg'}
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#18181B] text-balance mb-2">
          Essential Service Providers & Civic Channels
        </h1>
        <p className="text-sm text-[#52525B] max-w-2xl mb-6">
          Browse Johannesburg trade categories (plumbing, electrical, handyman) and municipal
          services. Contact numbers are never guessed—verify publicly available contacts via official
          registration boards or live search, and review the POPIA-safe community rating slot.
        </p>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          <div
            className="flex items-center gap-1 p-1 bg-[#EFECE4] rounded-lg overflow-x-auto"
            role="group"
            aria-label="Filter local services"
          >
            {FILTER_TABS.map((tab) => {
              const active = filter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  aria-pressed={active}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#FFFFFF] text-[#18181B] shadow-xs'
                      : 'text-[#52525B] hover:text-[#18181B]'
                  }`}
                >
                  {DIRECTORY_FILTER_LABELS[tab]}
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-64">
            <label htmlFor="service-search" className="sr-only">
              Search Johannesburg services
            </label>
            <Search
              className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              id="service-search"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter services..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#FFFFFF] border border-[#D4D0C5] rounded-lg text-[#18181B] placeholder:text-[#71717A] focus:outline-none focus:border-[#A16207]"
            />
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-[#E4E1D8] rounded-xl p-8 text-center">
            <p className="text-sm font-medium text-[#18181B] mb-1">
              No matching service topics found
            </p>
            <p className="text-xs text-[#52525B] mb-4">
              Try clearing your filter or ask JoziHelper directly in the Assistant tab.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilter('all');
                setSearchTerm('');
              }}
              className="px-4 py-2 text-xs font-medium bg-[#18181B] text-[#FFFFFF] rounded-lg hover:bg-[#27272A]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => {
              const serviceReviews = reviewsByService[item.id] ?? [];
              const avgRating =
                serviceReviews.length > 0
                  ? (
                      serviceReviews.reduce((sum, r) => sum + r.rating, 0) /
                      serviceReviews.length
                    ).toFixed(1)
                  : null;
              const isFormOpen = openReviewFormId === item.id;

              return (
                <article
                  key={item.id}
                  data-testid={`service-card-${item.id}`}
                  className="bg-[#FFFFFF] border border-[#E4E1D8] rounded-xl p-5 flex flex-col justify-between gap-4"
                >
                  <div>
                    <p className="text-xs text-[#52525B] mb-1.5">
                      {item.categoryLabel} · {item.scope}
                    </p>
                    <h2 className="font-display text-lg font-semibold text-[#18181B] mb-1.5">
                      {item.name}
                    </h2>
                    <p className="text-sm text-[#52525B] leading-relaxed mb-3">
                      {item.description}
                    </p>

                    {/* Public Contact & Live Verification Block */}
                    <div className="bg-[#F7F6F2] border border-[#E4E1D8] rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold text-[#18181B]">
                          Public Contact & Verification
                        </span>
                        {item.officialRegistryUrl && (
                          <a
                            href={item.officialRegistryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#A16207] hover:text-[#854D0E]"
                          >
                            <span>{item.officialRegistryLabel}</span>
                            <ExternalLink className="w-3 h-3" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-[#52525B] leading-relaxed">
                        {item.contactGuidance}
                      </p>
                    </div>

                    {/* User Reviews & Ratings Placeholder */}
                    {item.supportsReviewsPlaceholder && (
                      <div className="border-t border-[#EFECE4] pt-3">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-[#18181B] tabular-nums min-w-0">
                            <Star
                              className="w-3.5 h-3.5 text-[#A16207] shrink-0"
                              aria-hidden="true"
                            />
                            <span className="font-semibold whitespace-nowrap">
                              {avgRating ? `${avgRating} / 5.0` : 'No ratings yet'}
                            </span>
                            <span className="text-[#52525B] truncate">
                              ·{' '}
                              {serviceReviews.length === 0
                                ? 'Reviews placeholder'
                                : `${serviceReviews.length} session ${
                                    serviceReviews.length === 1 ? 'note' : 'notes'
                                  }`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenReviewForm(item.id)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#52525B] hover:text-[#18181B] whitespace-nowrap shrink-0"
                          >
                            <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{isFormOpen ? 'Close' : 'Add review note'}</span>
                          </button>
                        </div>

                        {serviceReviews.length === 0 && !isFormOpen && (
                          <p className="text-xs text-[#71717A]">
                            Placeholder for verified resident feedback and ratings (general suburb
                            experience only — no personal details stored).
                          </p>
                        )}

                        {serviceReviews.length > 0 && (
                          <ul className="space-y-1.5 mt-2">
                            {serviceReviews.map((rev) => (
                              <li
                                key={rev.id}
                                className="text-xs bg-[#F7F6F2] rounded-md px-2.5 py-2 text-[#27272A]"
                              >
                                <span className="font-semibold text-[#18181B] tabular-nums">
                                  {rev.rating}/5 · {rev.suburb}
                                </span>{' '}
                                — {rev.comment}
                                {rev.piiRedacted && (
                                  <span className="block text-[11px] text-[#B45309] mt-0.5">
                                    Personal details were automatically redacted (POPIA).
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}

                        {isFormOpen && (
                          <div className="mt-2.5 p-3 bg-[#F7F6F2] border border-[#E4E1D8] rounded-lg space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <label
                                htmlFor={`rating-${item.id}`}
                                className="text-xs font-medium text-[#18181B]"
                              >
                                Rating (1–5)
                              </label>
                              <select
                                id={`rating-${item.id}`}
                                value={draftRating}
                                onChange={(e) => setDraftRating(Number(e.target.value))}
                                className="px-2 py-1 text-xs bg-[#FFFFFF] border border-[#D4D0C5] rounded text-[#18181B]"
                              >
                                <option value={5}>5 — Reliable</option>
                                <option value={4}>4 — Good</option>
                                <option value={3}>3 — Fair</option>
                                <option value={2}>2 — Slow</option>
                                <option value={1}>1 — Poor</option>
                              </select>
                            </div>
                            <div>
                              <label htmlFor={`comment-${item.id}`} className="sr-only">
                                Review note (general suburb feedback only)
                              </label>
                              <textarea
                                id={`comment-${item.id}`}
                                rows={2}
                                maxLength={280}
                                value={draftComment}
                                onChange={(e) => {
                                  setDraftComment(e.target.value);
                                  if (reviewFormError) setReviewFormError(null);
                                }}
                                placeholder="Share general service experience (no names, phones, or addresses)..."
                                className="w-full px-2.5 py-1.5 text-xs bg-[#FFFFFF] border border-[#D4D0C5] rounded text-[#18181B] placeholder:text-[#71717A]"
                              />
                            </div>
                            {reviewFormError && (
                              <p className="text-xs text-[#B91C1C]" role="alert">
                                {reviewFormError}
                              </p>
                            )}
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] text-[#71717A]">
                                Session preview · POPIA scrubbed
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSubmitReview(item.id)}
                                className="px-3 py-1 text-xs font-medium bg-[#18181B] text-[#FFFFFF] rounded hover:bg-[#27272A]"
                              >
                                Save Preview Note
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-[#EFECE4] flex items-center justify-between gap-2">
                    <span className="text-xs text-[#71717A]">
                      Verify contacts via live search
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onAskAboutService(
                          `${item.promptTemplate}${suburbSuffix}`,
                          item.assistantCategory
                        )
                      }
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#A16207] hover:text-[#854D0E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A16207] rounded whitespace-nowrap"
                    >
                      <span>Verify Contacts & Quotes</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
