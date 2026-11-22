import { ShieldCheck, SearchCheck, ListChecks, Lock } from 'lucide-react';

interface PopiaNoticeViewProps {
  onBackToAssistant: () => void;
}

export function PopiaNoticeView({ onBackToAssistant }: PopiaNoticeViewProps) {
  const pillars = [
    {
      icon: ListChecks,
      title: '01. Clarify First & Step-by-Step Format',
      body: 'When your suburb, route, or budget is missing and needed for accuracy, JoziHelper asks 1–2 brief questions first before giving concise bullet-point steps.',
    },
    {
      icon: SearchCheck,
      title: '02. Live Verification Standard',
      body: 'Factual schedules, clinic or Home Affairs hours, tariffs, and utility channels are checked against live Google Search results. Unconfirmed details are clearly flagged rather than guessed.',
    },
    {
      icon: ShieldCheck,
      title: '03. POPIA Data Minimization',
      body: 'JoziHelper never asks for, collects, or stores ID numbers, full names, home street addresses, phone numbers, or banking details. Both client and server filters scrub accidental identifiers automatically.',
    },
    {
      icon: Lock,
      title: '04. Community Scope & Safety',
      body: 'Assistance is strictly limited to everyday Johannesburg community services, local logistics, municipal utilities, and household budgeting.',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs font-medium text-[#A16207] mb-1.5">
          Privacy & Verification Standards
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#18181B] text-balance mb-2">
          POPIA Compliance & How JoziHelper Verifies Answers
        </h1>
        <p className="text-sm text-[#52525B] leading-relaxed mb-6">
          Your conversations stay in your current browser session only and are never saved to a
          database. Share only your general suburb (for example, Randburg or Soweto) and general
          goal or budget.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <article
                key={pillar.title}
                className="bg-[#FFFFFF] border border-[#E4E1D8] rounded-xl p-5"
              >
                <Icon className="w-5 h-5 text-[#A16207] mb-3" aria-hidden="true" />
                <h2 className="font-display text-base font-semibold text-[#18181B] mb-1.5">
                  {pillar.title}
                </h2>
                <p className="text-sm text-[#52525B] leading-relaxed">{pillar.body}</p>
              </article>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onBackToAssistant}
          className="px-4 py-2 text-sm font-medium bg-[#18181B] text-[#FFFFFF] rounded-lg hover:bg-[#27272A] transition-colors"
        >
          Return to Assistant
        </button>
      </div>
    </div>
  );
}
