import { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Check,
  Copy,
  ExternalLink,
  RotateCcw,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { STARTER_TOPICS, type CommunityCategory } from '../data/joziTopics';
import { type GroundingSource } from '../utils/grounding';
import { type ConfidenceLevel } from '../utils/groundingPolicy';
import { detectAndRedactPii, type PiiScanResult } from '../utils/popia';
import { FormattedMessage } from './FormattedMessage';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  summary?: string;
  actionSteps?: string[];
  confidenceLevel?: ConfidenceLevel;
  searchModeUsed?: 'grounded' | 'fallback' | 'direct';
  timestamp: string;
  sources?: GroundingSource[];
  piiRedacted?: boolean;
  suburbLabel?: string;
}

interface ChatWorkspaceProps {
  messages: ChatMessage[];
  suburb: string;
  category: CommunityCategory;
  isLoading: boolean;
  errorMessage: string | null;
  draftInput: string;
  onChangeDraft: (value: string) => void;
  onSendMessage: (text: string) => void;
  onRetryLast: () => void;
  onDismissError: () => void;
}

export function ChatWorkspace({
  messages,
  suburb,
  category,
  isLoading,
  errorMessage,
  draftInput,
  onChangeDraft,
  onSendMessage,
  onRetryLast,
  onDismissError,
}: ChatWorkspaceProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [piiPrompt, setPiiPrompt] = useState<PiiScanResult | null>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isLoading]);

  const liveScan = detectAndRedactPii(draftInput);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1800);
    } catch {
      // Clipboard may be unavailable in restricted contexts; ignore quietly
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = draftInput.trim();
    if (!trimmed || isLoading) return;

    const scan = detectAndRedactPii(trimmed);
    if (scan.hasPii) {
      setPiiPrompt(scan);
      return;
    }

    setPiiPrompt(null);
    onSendMessage(trimmed);
  };

  const handleSendRedacted = () => {
    if (!piiPrompt || isLoading) return;
    const safeText = piiPrompt.redactedText.trim();
    setPiiPrompt(null);
    onSendMessage(safeText);
  };

  const handleEditInstead = () => {
    setPiiPrompt(null);
    textareaRef.current?.focus();
  };

  const filteredStarters =
    category === 'all'
      ? STARTER_TOPICS
      : STARTER_TOPICS.filter((item) => item.category === category);

  const displayStarters = filteredStarters.length > 0 ? filteredStarters : STARTER_TOPICS;

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* Main scrollable conversation area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <section aria-label="Welcome to JoziHelper" className="py-4 sm:py-8">
              <p className="text-xs font-medium text-[#A16207] mb-2">
                Johannesburg Community Assistant · Live Search Grounded
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#18181B] text-balance mb-3">
                Practical local guidance for Johannesburg residents.
              </h1>
              <p className="text-[15px] text-[#52525B] leading-relaxed max-w-2xl mb-8">
                Ask about City Power or Joburg Water outages, public clinic or Home Affairs hours,
                Rea Vaya and Gautrain fares, or household budgeting. Select your general area in
                the sidebar or start with a question below.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {displayStarters.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => onSendMessage(topic.prompt)}
                    className="group text-left p-4 bg-[#FFFFFF] border border-[#E4E1D8] rounded-xl hover:border-[#A16207] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A16207]"
                  >
                    <p className="text-xs text-[#52525B] mb-1.5">{topic.categoryLabel}</p>
                    <h2 className="font-display text-[15px] font-semibold text-[#18181B] group-hover:text-[#A16207] transition-colors mb-1">
                      {topic.title}
                    </h2>
                    <p className="text-xs text-[#52525B] leading-relaxed">{topic.summary}</p>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <div className="space-y-6 pb-4" aria-live="polite">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <article
                    key={msg.id}
                    data-testid={isUser ? 'user-message' : 'assistant-message'}
                    className={
                      isUser
                        ? 'ml-auto max-w-[85%] sm:max-w-[78%] bg-[#18181B] text-[#FFFFFF] px-4 py-3 rounded-xl'
                        : 'bg-[#FFFFFF] border border-[#E4E1D8] rounded-xl p-5'
                    }
                  >
                    {isUser ? (
                      <div>
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                          {msg.text}
                        </p>
                        <p className="mt-1.5 text-[11px] text-[#D4D4D8] tabular-nums">
                          You · {msg.timestamp}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-[#EFECE4]">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#52525B] tabular-nums">
                            <span className="font-semibold text-[#18181B]">JoziHelper</span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {msg.suburbLabel ??
                                (suburb === 'Not specified (ask me first)'
                                  ? 'Johannesburg'
                                  : suburb)}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{msg.timestamp}</span>
                            {msg.confidenceLevel && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span
                                  data-testid="confidence-level"
                                  className={
                                    msg.confidenceLevel === 'HIGH'
                                      ? 'font-medium text-[#15803D]'
                                      : msg.confidenceLevel === 'LOW'
                                        ? 'font-medium text-[#B45309]'
                                        : 'font-medium text-[#52525B]'
                                  }
                                >
                                  Confidence: {msg.confidenceLevel}
                                </span>
                              </>
                            )}
                            {msg.searchModeUsed && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>
                                  {msg.searchModeUsed === 'grounded'
                                    ? 'Live Search'
                                    : msg.searchModeUsed === 'fallback'
                                      ? 'Fallback Mode'
                                      : 'Direct Guidance'}
                                </span>
                              </>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.text)}
                            aria-label="Copy response"
                            className="inline-flex items-center gap-1.5 text-xs text-[#52525B] hover:text-[#18181B] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A16207] rounded px-1.5 py-0.5"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#15803D]" aria-hidden="true" />
                                <span className="text-[#15803D]">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        {msg.piiRedacted && (
                          <div
                            role="status"
                            className="mb-3 px-3 py-2 text-xs bg-[#FEF3C7] text-[#78350F] rounded-lg border border-[#FDE68A]"
                          >
                            Personal details were removed before sending to protect your privacy under POPIA.
                          </div>
                        )}

                        {msg.searchModeUsed === 'fallback' && (
                          <div
                            role="status"
                            data-testid="fallback-notice"
                            className="mb-3 px-3 py-2 text-xs bg-[#F7F6F2] text-[#52525B] rounded-lg border border-[#E4E1D8]"
                          >
                            Fallback guidance active — live search was temporarily unavailable, so
                            confidence is set to LOW and no live sources are attached.
                          </div>
                        )}

                        {msg.summary ? (
                          <div className="space-y-3">
                            <FormattedMessage content={msg.summary} />
                            {msg.actionSteps && msg.actionSteps.length > 0 && (
                              <ul className="list-disc pl-5 space-y-1.5 text-[15px] leading-relaxed text-[#27272A]">
                                {msg.actionSteps.map((step, idx) => (
                                  <li key={idx} className="pl-0.5">
                                    <FormattedMessage content={step} />
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          <FormattedMessage content={msg.text} />
                        )}

                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-[#EFECE4]">
                            <p className="text-xs font-semibold text-[#18181B] mb-2">
                              Verified Live Sources ({msg.sources.length})
                            </p>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {msg.sources.map((src) => (
                                <li key={src.uri}>
                                  <a
                                    href={src.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between gap-2 px-3 py-2 text-xs bg-[#F7F6F2] border border-[#E4E1D8] rounded-lg hover:border-[#A16207] transition-colors text-[#18181B]"
                                  >
                                    <span className="truncate">
                                      <span className="font-medium">{src.title}</span>
                                      {src.domain && (
                                        <span className="text-[#52525B]"> · {src.domain}</span>
                                      )}
                                    </span>
                                    <ExternalLink
                                      className="w-3.5 h-3.5 text-[#52525B] shrink-0"
                                      aria-hidden="true"
                                    />
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}

              {isLoading && (
                <div
                  role="status"
                  aria-label="Searching live Johannesburg sources"
                  className="bg-[#FFFFFF] border border-[#E4E1D8] rounded-xl p-5"
                >
                  <div className="flex items-center gap-2.5 text-sm text-[#52525B]">
                    <Search className="w-4 h-4 text-[#A16207] animate-spin" aria-hidden="true" />
                    <span>Checking live Johannesburg sources and preparing steps...</span>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div
                  role="alert"
                  className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <p className="text-sm text-[#991B1B]">{errorMessage}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={onRetryLast}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#991B1B] text-[#FFFFFF] rounded-lg hover:bg-[#7F1D1D] transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Retry</span>
                    </button>
                    <button
                      type="button"
                      onClick={onDismissError}
                      className="px-2.5 py-1.5 text-xs font-medium text-[#991B1B] hover:underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              <div ref={threadEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Composer footer */}
      <div className="border-t border-[#E4E1D8] bg-[#FFFFFF] px-4 sm:px-8 py-3.5">
        <div className="max-w-3xl mx-auto">
          {(piiPrompt || liveScan.hasPii) && (
            <div
              role="alert"
              data-testid="popia-warning"
              className="mb-3 p-3.5 bg-[#FEF3C7] border border-[#F59E0B] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-2.5 text-xs text-[#78350F]">
                <ShieldAlert className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-[#78350F]">
                    POPIA Privacy Guardrail: {(piiPrompt ?? liveScan).summary}
                  </p>
                  <p className="mt-0.5">
                    Please do not share ID numbers, street addresses, phone numbers, or bank details.
                    Use only your general suburb.
                  </p>
                </div>
              </div>
              {piiPrompt && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleSendRedacted}
                    className="px-3 py-1.5 text-xs font-medium bg-[#18181B] text-[#FFFFFF] rounded-lg hover:bg-[#27272A] transition-colors whitespace-nowrap"
                  >
                    Remove Sensitive Info & Send
                  </button>
                  <button
                    type="button"
                    onClick={handleEditInstead}
                    className="px-3 py-1.5 text-xs font-medium bg-[#FFFFFF] border border-[#D4D0C5] text-[#18181B] rounded-lg hover:bg-[#F7F6F2] transition-colors whitespace-nowrap"
                  >
                    Edit Message
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-end gap-2.5">
            <div className="flex-1">
              <label htmlFor="jozi-composer" className="sr-only">
                Ask JoziHelper about Johannesburg community services, transit, utilities, or budgeting
              </label>
              <textarea
                id="jozi-composer"
                ref={textareaRef}
                rows={2}
                value={draftInput}
                onChange={(e) => {
                  onChangeDraft(e.target.value);
                  if (piiPrompt) setPiiPrompt(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                maxLength={2000}
                placeholder="Ask about a Joburg suburb, clinic, City Power, or transit..."
                className="w-full min-h-[54px] resize-none px-3.5 py-2.5 text-sm leading-snug bg-[#F7F6F2] border border-[#D4D0C5] rounded-xl text-[#18181B] placeholder:text-[#71717A] focus:outline-none focus:bg-[#FFFFFF] focus:border-[#A16207]"
              />
            </div>
            <button
              type="submit"
              disabled={!draftInput.trim() || isLoading}
              aria-label="Send message"
              className="inline-flex items-center justify-center gap-1.5 h-[44px] px-4 text-sm font-medium rounded-xl bg-[#A16207] text-[#FFFFFF] hover:bg-[#854D0E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18181B]"
            >
              <span>Send</span>
              <ArrowUp className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>

          <p className="mt-2 text-[11px] text-[#71717A]">
            General suburb only · Live-checked via Google Search · Never share ID, address, phone, or bank info
          </p>
        </div>
      </div>
    </div>
  );
}
