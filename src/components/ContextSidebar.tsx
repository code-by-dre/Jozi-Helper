import { ShieldCheck, MapPin, Search } from 'lucide-react';
import {
  CATEGORY_LABELS,
  JOZI_SUBURBS,
  type CommunityCategory,
} from '../data/joziTopics';
import { type LiveSearchMode } from '../utils/groundingPolicy';
import { type ActiveView } from './TopBar';

interface ContextSidebarProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  suburb: string;
  onChangeSuburb: (suburb: string) => void;
  category: CommunityCategory;
  onChangeCategory: (category: CommunityCategory) => void;
  budgetFocus: string;
  onChangeBudgetFocus: (value: string) => void;
  budgetHasPii: boolean;
  liveSearchMode: LiveSearchMode;
  onChangeLiveSearchMode: (mode: LiveSearchMode) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const CATEGORIES: CommunityCategory[] = [
  'all',
  'utilities',
  'civic',
  'transit',
  'budgeting',
];

export function ContextSidebar({
  activeView,
  onSelectView,
  suburb,
  onChangeSuburb,
  category,
  onChangeCategory,
  budgetFocus,
  onChangeBudgetFocus,
  budgetHasPii,
  liveSearchMode,
  onChangeLiveSearchMode,
  isOpenMobile,
  onCloseMobile,
}: ContextSidebarProps) {
  const selectedSuburbObj = JOZI_SUBURBS.find((s) => s.label === suburb) ?? JOZI_SUBURBS[0];

  const mobileNavItems: Array<{ id: ActiveView; label: string }> = [
    { id: 'assistant', label: 'Assistant' },
    { id: 'transit', label: 'Transit Guide' },
    { id: 'services', label: 'Local Services' },
    { id: 'popia', label: 'POPIA Notice' },
  ];

  const panelContent = (
    <div className="flex flex-col h-full p-5 gap-6 overflow-y-auto">
      <div className="sm:hidden border-b border-[#E4E1D8] pb-4">
        <p className="text-xs font-semibold text-[#52525B] mb-2">Views</p>
        <div className="flex flex-col gap-1" role="navigation" aria-label="Mobile navigation">
          {mobileNavItems.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectView(item.id);
                  onCloseMobile();
                }}
                aria-current={active ? 'page' : undefined}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  active
                    ? 'bg-[#18181B] text-[#FFFFFF] font-medium'
                    : 'text-[#3F3F46] hover:bg-[#EFECE4]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-[#A16207]" aria-hidden="true" />
          <label
            htmlFor="suburb-select"
            className="text-sm font-semibold text-[#18181B]"
          >
            General Suburb or Area
          </label>
        </div>
        <select
          id="suburb-select"
          value={suburb}
          onChange={(e) => onChangeSuburb(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-[#FFFFFF] border border-[#D4D0C5] rounded-lg text-[#18181B] focus:outline-none focus:border-[#A16207]"
        >
          {JOZI_SUBURBS.map((item) => (
            <option key={item.id} value={item.label}>
              {item.label}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-[#52525B]">
          {selectedSuburbObj.region} · General area only, never street address
        </p>
      </div>

      <div className="border-t border-[#E4E1D8] pt-5">
        <p className="text-sm font-semibold text-[#18181B] mb-2.5">
          Topic Focus
        </p>
        <div className="flex flex-col gap-1" role="group" aria-label="Topic focus">
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  onChangeCategory(cat);
                  onCloseMobile();
                }}
                aria-pressed={active}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors whitespace-nowrap truncate focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A16207] ${
                  active
                    ? 'bg-[#18181B] text-[#FFFFFF] font-medium'
                    : 'text-[#3F3F46] hover:bg-[#EFECE4]'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[#E4E1D8] pt-5">
        <label
          htmlFor="budget-focus-input"
          className="block text-sm font-semibold text-[#18181B] mb-1.5"
        >
          Goal or Budget Note
        </label>
        <input
          id="budget-focus-input"
          type="text"
          value={budgetFocus}
          onChange={(e) => onChangeBudgetFocus(e.target.value)}
          maxLength={80}
          placeholder="e.g. R1,500 food or clinic trip"
          className="w-full px-3 py-2 text-sm bg-[#FFFFFF] border border-[#D4D0C5] rounded-lg text-[#18181B] placeholder:text-[#71717A] focus:outline-none focus:border-[#A16207]"
        />
        {budgetHasPii ? (
          <p className="mt-1.5 text-xs text-[#B91C1C]" role="alert">
            Please remove personal identifiers (ID, phone, or address) from this field.
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-[#52525B]">
            Optional context helps skip extra clarifying questions.
          </p>
        )}
      </div>

      <div className="border-t border-[#E4E1D8] pt-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-[#A16207]" aria-hidden="true" />
            <span className="text-xs font-semibold text-[#18181B]">
              Live Search:{' '}
              {liveSearchMode === 'auto'
                ? 'Auto'
                : liveSearchMode === 'always'
                  ? 'Always'
                  : 'Off'}
            </span>
          </div>
        </div>
        <div
          className="grid grid-cols-3 gap-1 p-1 bg-[#E6E2D8] rounded-lg"
          role="group"
          aria-label="Live Search mode"
        >
          {(
            [
              { id: 'auto', label: 'Auto' },
              { id: 'always', label: 'Always' },
              { id: 'off', label: 'Off' },
            ] as const
          ).map((opt) => {
            const active = liveSearchMode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeLiveSearchMode(opt.id)}
                aria-pressed={active}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#FFFFFF] text-[#18181B] shadow-xs'
                    : 'text-[#52525B] hover:text-[#18181B]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[11px] text-[#52525B] leading-relaxed">
          Auto attaches search only for hours, schedules, prices, or local services.
        </p>
      </div>

      <div className="mt-auto border-t border-[#E4E1D8] pt-4">
        <div className="flex items-start gap-2.5 text-xs text-[#52525B] leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold text-[#18181B] mb-0.5">POPIA Privacy Active</p>
            <p>
              Do not enter ID numbers, full names, street addresses, phone numbers, or bank details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside
        aria-label="Area and topic context"
        className="hidden lg:block w-[272px] shrink-0 bg-[#F2EFE8] border-r border-[#E4E1D8]"
      >
        {panelContent}
      </aside>

      {/* Mobile slide-over drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside
            aria-label="Area and topic context"
            className="relative z-10 w-72 max-w-[85vw] bg-[#F2EFE8] border-r border-[#E4E1D8] h-full shadow-lg"
          >
            {panelContent}
          </aside>
        </div>
      )}
    </>
  );
}
