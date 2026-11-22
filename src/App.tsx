import { useState } from 'react';
import { TopBar, type ActiveView } from './components/TopBar';
import { ContextSidebar } from './components/ContextSidebar';
import { ChatWorkspace, type ChatMessage } from './components/ChatWorkspace';
import { TransitGuideView } from './components/TransitGuideView';
import { LocalServicesView } from './components/LocalServicesView';
import { PopiaNoticeView } from './components/PopiaNoticeView';
import { JOZI_SUBURBS, type CommunityCategory } from './data/joziTopics';
import { detectAndRedactPii } from './utils/popia';
import { type LiveSearchMode } from './utils/groundingPolicy';
import { askJoziHelper } from './services/geminiService';

function formatNow(): string {
  return new Date().toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('assistant');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [suburb, setSuburb] = useState<string>(JOZI_SUBURBS[0].label);
  const [category, setCategory] = useState<CommunityCategory>('all');
  const [budgetFocus, setBudgetFocus] = useState<string>('');
  const [liveSearchMode, setLiveSearchMode] = useState<LiveSearchMode>('auto');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draftInput, setDraftInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const budgetScan = detectAndRedactPii(budgetFocus);

  const sendConversation = async (historyToSend: ChatMessage[]) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await askJoziHelper(
        historyToSend.map((m) => ({
          role: m.role,
          text: m.text,
        })),
        {
          suburb,
          category,
          budgetFocus: budgetScan.redactedText,
          liveSearchMode,
        }
      );

      const summary = data.summary.trim();
      const actionSteps = Array.isArray(data.action_steps) ? data.action_steps : [];
      if (!summary && actionSteps.length === 0) {
        throw new Error('Assistant returned an empty response.');
      }

      const plainText = [summary, ...actionSteps.map((s) => `- ${s}`)]
        .filter(Boolean)
        .join('\n');

      const assistantMsg: ChatMessage = {
        id: makeId(),
        role: 'model',
        text: plainText,
        summary,
        actionSteps,
        confidenceLevel: data.confidence_level ?? 'MEDIUM',
        searchModeUsed: data.searchModeUsed ?? 'direct',
        timestamp: formatNow(),
        sources: Array.isArray(data.verified_sources) ? data.verified_sources : [],
        piiRedacted: Boolean(data.piiRedacted),
        suburbLabel:
          suburb === 'Not specified (ask me first)' ? 'Johannesburg' : suburb,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error while reaching JoziHelper. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: makeId(),
      role: 'user',
      text: trimmed,
      timestamp: formatNow(),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setDraftInput('');
    setActiveView('assistant');
    void sendConversation(nextHistory);
  };

  const handleRetryLast = () => {
    if (messages.length === 0 || isLoading) return;
    void sendConversation(messages);
  };

  const handleNewChat = () => {
    setMessages([]);
    setDraftInput('');
    setErrorMessage(null);
    setActiveView('assistant');
    setMobileSidebarOpen(false);
  };

  const handleAskAboutService = (
    prompt: string,
    serviceCategory: Exclude<CommunityCategory, 'all'>
  ) => {
    setCategory(serviceCategory);
    setActiveView('assistant');
    handleSendMessage(prompt);
  };

  const handleVerifyTransit = (prompt: string) => {
    setCategory('transit');
    setActiveView('assistant');
    handleSendMessage(prompt);
  };

  return (
    <div className="h-screen flex flex-col bg-[#F7F6F2] text-[#18181B]">
      <TopBar
        activeView={activeView}
        onSelectView={(view) => {
          setActiveView(view);
          setMobileSidebarOpen(false);
        }}
        onNewChat={handleNewChat}
        mobileSidebarOpen={mobileSidebarOpen}
        onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <ContextSidebar
          activeView={activeView}
          onSelectView={(view) => {
            setActiveView(view);
            setMobileSidebarOpen(false);
          }}
          suburb={suburb}
          onChangeSuburb={setSuburb}
          category={category}
          onChangeCategory={setCategory}
          budgetFocus={budgetFocus}
          onChangeBudgetFocus={setBudgetFocus}
          budgetHasPii={budgetScan.hasPii}
          liveSearchMode={liveSearchMode}
          onChangeLiveSearchMode={setLiveSearchMode}
          isOpenMobile={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        <main className="flex-1 flex flex-col min-w-0 min-h-0">
          {activeView === 'assistant' && (
            <ChatWorkspace
              messages={messages}
              suburb={suburb}
              category={category}
              isLoading={isLoading}
              errorMessage={errorMessage}
              draftInput={draftInput}
              onChangeDraft={setDraftInput}
              onSendMessage={handleSendMessage}
              onRetryLast={handleRetryLast}
              onDismissError={() => setErrorMessage(null)}
            />
          )}

          {activeView === 'transit' && (
            <TransitGuideView
              suburb={suburb}
              onVerifyTransit={handleVerifyTransit}
            />
          )}

          {activeView === 'services' && (
            <LocalServicesView
              suburb={suburb}
              onAskAboutService={handleAskAboutService}
            />
          )}

          {activeView === 'popia' && (
            <PopiaNoticeView onBackToAssistant={() => setActiveView('assistant')} />
          )}
        </main>
      </div>
    </div>
  );
}
