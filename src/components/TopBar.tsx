import { MessageSquarePlus, Menu, X } from 'lucide-react';

export type ActiveView = 'assistant' | 'transit' | 'services' | 'popia';

interface TopBarProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onNewChat: () => void;
  mobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
}

export function TopBar({
  activeView,
  onSelectView,
  onNewChat,
  mobileSidebarOpen,
  onToggleMobileSidebar,
}: TopBarProps) {
  const navItems: Array<{ id: ActiveView; label: string }> = [
    { id: 'assistant', label: 'Assistant' },
    { id: 'transit', label: 'Transit Guide' },
    { id: 'services', label: 'Local Services' },
    { id: 'popia', label: 'POPIA Notice' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF] border-b border-[#E4E1D8] px-4 sm:px-6 h-14 flex items-center justify-between gap-4 md:gap-8">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label={mobileSidebarOpen ? 'Close area and topic panel' : 'Open area and topic panel'}
          aria-expanded={mobileSidebarOpen}
          className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[#E4E1D8] text-[#18181B] hover:bg-[#F7F6F2] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A16207]"
        >
          {mobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={() => onSelectView('assistant')}
          className="font-display text-xl font-bold tracking-tight text-[#18181B] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A16207] rounded"
        >
          JoziHelper
        </button>
      </div>

      {/* Zone 2: Concise single-line text nav links (hidden on narrow mobile; available in mobile drawer) */}
      <nav
        aria-label="Primary navigation"
        className="hidden sm:flex items-center gap-7 text-sm font-medium"
      >
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A16207] ${
                isActive
                  ? 'border-[#A16207] text-[#18181B] font-semibold'
                  : 'border-transparent text-[#52525B] hover:text-[#18181B] hover:border-[#D4D0C5]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onNewChat}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-lg bg-[#18181B] text-[#FFFFFF] hover:bg-[#27272A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A16207]"
        >
          <MessageSquarePlus className="w-4 h-4" aria-hidden="true" />
          <span>New Chat</span>
        </button>
      </div>
    </header>
  );
}
