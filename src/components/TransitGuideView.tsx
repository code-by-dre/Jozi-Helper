import { useState } from 'react';
import {
  ArrowRight,
  Bus,
  ExternalLink,
  Search,
  TrainFront,
  ShieldCheck,
} from 'lucide-react';
import {
  JOZI_TRANSIT_OPERATORS,
  TRANSIT_VERIFICATION_STEPS,
  type TransitModeFilter,
} from '../data/joziTransit';

interface TransitGuideViewProps {
  suburb: string;
  onVerifyTransit: (prompt: string) => void;
}

const MODE_TABS: Array<{ id: TransitModeFilter; label: string }> = [
  { id: 'all', label: 'All Modes' },
  { id: 'bus', label: 'Buses' },
  { id: 'rail', label: 'Rail & Gautrain' },
];

export function TransitGuideView({ suburb, onVerifyTransit }: TransitGuideViewProps) {
  const [modeFilter, setModeFilter] = useState<TransitModeFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const operators = JOZI_TRANSIT_OPERATORS.filter((op) => {
    const matchesMode = modeFilter === 'all' || op.mode === modeFilter;
    const q = searchTerm.trim().toLowerCase();
    const matchesQuery =
      !q ||
      op.name.toLowerCase().includes(q) ||
      op.coverageSummary.toLowerCase().includes(q) ||
      op.majorRoutes.some((r) => r.toLowerCase().includes(q));
    return matchesMode && matchesQuery;
  });

  const suburbContext =
    suburb && suburb !== 'Not specified (ask me first)'
      ? ` (Starting area: ${suburb})`
      : '';

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs font-medium text-[#A16207] mb-1.5">
          Johannesburg Public Transportation Guide ·{' '}
          {suburb && suburb !== 'Not specified (ask me first)'
            ? `Active Area: ${suburb}`
            : 'All Johannesburg'}
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#18181B] text-balance mb-2">
          Buses, Metrorail & Gautrain Corridors
        </h1>
        <p className="text-sm text-[#52525B] max-w-2xl mb-6">
          Overview of major Johannesburg bus routes, commuter train lines, and Gautrain corridors.
          Fares and departure schedules change frequently—always verify live times through official
          transport authority websites or JoziHelper live search before travelling.
        </p>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          <div
            className="flex items-center gap-1 p-1 bg-[#EFECE4] rounded-lg overflow-x-auto"
            role="group"
            aria-label="Filter transit modes"
          >
            {MODE_TABS.map((tab) => {
              const active = modeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setModeFilter(tab.id)}
                  aria-pressed={active}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#FFFFFF] text-[#18181B] shadow-xs'
                      : 'text-[#52525B] hover:text-[#18181B]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-64">
            <label htmlFor="transit-search" className="sr-only">
              Search Johannesburg transit routes or operators
            </label>
            <Search
              className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              id="transit-search"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search routes, stations..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#FFFFFF] border border-[#D4D0C5] rounded-lg text-[#18181B] placeholder:text-[#71717A] focus:outline-none focus:border-[#A16207]"
            />
          </div>
        </div>

        {/* Transit Operator Cards */}
        {operators.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-[#E4E1D8] rounded-xl p-8 text-center mb-8">
            <p className="text-sm font-medium text-[#18181B] mb-1">
              No matching transit routes found
            </p>
            <p className="text-xs text-[#52525B] mb-4">
              Reset your search filter or ask JoziHelper directly for suburb-to-suburb options.
            </p>
            <button
              type="button"
              onClick={() => {
                setModeFilter('all');
                setSearchTerm('');
              }}
              className="px-4 py-2 text-xs font-medium bg-[#18181B] text-[#FFFFFF] rounded-lg hover:bg-[#27272A]"
            >
              Show All Transit Modes
            </button>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {operators.map((op) => {
              const Icon = op.mode === 'bus' ? Bus : TrainFront;
              return (
                <article
                  key={op.id}
                  data-testid={`transit-card-${op.id}`}
                  className="bg-[#FFFFFF] border border-[#E4E1D8] rounded-xl p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#EFECE4]">
                    <div>
                      <p className="text-xs text-[#52525B] mb-1">
                        {op.modeLabel} · {op.authority}
                      </p>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-[#A16207] shrink-0" aria-hidden="true" />
                        <h2 className="font-display text-lg font-semibold text-[#18181B]">
                          {op.name}
                        </h2>
                      </div>
                    </div>

                    <a
                      href={op.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#18181B] bg-[#F7F6F2] border border-[#E4E1D8] px-3 py-1.5 rounded-lg hover:border-[#A16207] transition-colors whitespace-nowrap shrink-0 self-start"
                    >
                      <span>Official site: {op.officialSiteLabel}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#52525B]" aria-hidden="true" />
                    </a>
                  </div>

                  <p className="text-sm text-[#52525B] leading-relaxed mt-3 mb-3">
                    {op.coverageSummary}
                  </p>

                  <div className="mb-3">
                    <h3 className="text-xs font-semibold text-[#18181B] mb-1.5">
                      Major Routes & Corridors
                    </h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-[#27272A]">
                      {op.majorRoutes.map((route) => (
                        <li key={route}>{route}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-[#F7F6F2] border border-[#E4E1D8] rounded-lg p-3 mb-4">
                    <p className="text-xs font-semibold text-[#18181B] mb-0.5">
                      Cards, Tickets & Fare Notes
                    </p>
                    <p className="text-xs text-[#52525B] leading-relaxed">
                      {op.paymentAndFares}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    <span className="text-xs text-[#71717A]">
                      Verify exact Rand fares & departure times before travelling
                    </span>
                    <button
                      type="button"
                      onClick={() => onVerifyTransit(`${op.verifyPrompt}${suburbContext}`)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#A16207] hover:text-[#854D0E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A16207] rounded self-start sm:self-auto"
                    >
                      <span>Verify Live Schedule & Fares</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* How to verify updated schedules & fares */}
        <section
          aria-label="How to verify updated schedules and fares"
          className="bg-[#FFFFFF] border border-[#E4E1D8] rounded-xl p-5 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-[#15803D]" aria-hidden="true" />
            <h2 className="font-display text-lg font-semibold text-[#18181B]">
              How to Find Updated Schedules & Fare Information
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TRANSIT_VERIFICATION_STEPS.map((step) => (
              <div key={step.title} className="bg-[#F7F6F2] border border-[#E4E1D8] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-[#18181B] mb-1.5">{step.title}</h3>
                <p className="text-xs text-[#52525B] leading-relaxed">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
