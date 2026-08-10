import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Trash2,
  Copy,
  Check,
  Key,
  BookOpen,
  Calendar,
  Lightbulb,
  Compass,
  GraduationCap,
  RefreshCw,
  AlertTriangle,
  Flame,
  Target,
  Trophy,
  BarChart3,
  ArrowRight,
  Zap,
  RotateCw,
  Globe,
  X,
  MessageCircle,
} from "lucide-react";
import {
  AbyaMessage,
  UserSettings,
  StudentProfile,
  AbyaInsightCard,
  AbyaQuickActionType,
  ActiveTab,
  AbyaLanguageSetting,
} from "../types";

interface AbyaAIPageProps {
  messages: AbyaMessage[];
  settings: UserSettings;
  activeStudent: StudentProfile;
  insightCards: AbyaInsightCard[];
  abyaLanguage?: AbyaLanguageSetting;
  onUpdateAbyaLanguage?: (lang: AbyaLanguageSetting) => void;
  onSendMessage: (
    prompt: string,
    contextNote?: string,
    actionType?: AbyaQuickActionType
  ) => Promise<void>;
  onClearChat: () => void;
  onUpdateSettings: (s: UserSettings) => void;
  attachedContextNote?: string;
  onClearAttachedContext?: () => void;
  onNavigate?: (tab: ActiveTab) => void;
  onTriggerFallbackAction?: (actionType: AbyaQuickActionType) => void;
  onRetryLastMessage?: () => void;
}

export const AbyaAIPage: React.FC<AbyaAIPageProps> = ({
  messages,
  settings,
  activeStudent,
  insightCards,
  abyaLanguage = "WhatsApp Language",
  onUpdateAbyaLanguage,
  onSendMessage,
  onClearChat,
  onUpdateSettings,
  attachedContextNote,
  onClearAttachedContext,
  onNavigate,
  onTriggerFallbackAction,
  onRetryLastMessage,
}) => {
  const [inputPrompt, setInputPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(settings.customApiKey || "");
  const [activeTabFilter, setActiveTabFilter] = useState<"chat" | "cards">("chat");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // 7 Quick Action Chips for v1.6
  const quickActions: {
    type: AbyaQuickActionType;
    label: string;
    icon: React.ElementType;
    prompt: string;
    bgHover: string;
  }[] = [
    {
      type: "plan_day",
      label: "Plan My Day",
      icon: Calendar,
      prompt: "Plan my day with realistic study blocks, revision, PYQ practice, and breaks based on today's tasks and exam countdown.",
      bgHover: "hover:bg-blue-500/10 hover:border-blue-500/40 text-blue-400",
    },
    {
      type: "explain_topic",
      label: "Explain a Topic",
      icon: GraduationCap,
      prompt: "I need help understanding a concept. Explain it with a simple breakdown, real-world analogy, key points, solved example, and quick check question.",
      bgHover: "hover:bg-purple-500/10 hover:border-purple-500/40 text-purple-400",
    },
    {
      type: "weak_topics",
      label: "My Weak Topics",
      icon: Flame,
      prompt: "Analyze my weak topics and give me a supportive action plan on what to study, practice advice, and revision timing.",
      bgHover: "hover:bg-rose-500/10 hover:border-rose-500/40 text-rose-400",
    },
    {
      type: "revise",
      label: "What Should I Revise?",
      icon: RotateCw,
      prompt: "Check my revision status and give me a prioritized revision queue for my academic subjects.",
      bgHover: "hover:bg-emerald-500/10 hover:border-emerald-500/40 text-emerald-400",
    },
    {
      type: "analyze_tests",
      label: "Analyze My Tests",
      icon: BarChart3,
      prompt: "Analyze my test history, score average, strong areas, and recommended next actions for my board prep.",
      bgHover: "hover:bg-amber-500/10 hover:border-amber-500/40 text-amber-400",
    },
    {
      type: "career_guidance",
      label: "Career Guidance",
      icon: Target,
      prompt: "Give me career guidance aligned with my target career goal and board exam preparation.",
      bgHover: "hover:bg-cyan-500/10 hover:border-cyan-500/40 text-cyan-400",
    },
    {
      type: "exam_coach",
      label: "Exam Coach",
      icon: Trophy,
      prompt: "Act as my Exam Coach: give me my countdown focus, readiness insights, and what to study today for board success.",
      bgHover: "hover:bg-yellow-500/10 hover:border-yellow-500/40 text-yellow-400",
    },
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string, actionType?: AbyaQuickActionType) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isLoading) return;

    setInputPrompt("");
    setIsLoading(true);

    try {
      await onSendMessage(prompt, attachedContextNote, actionType);
      if (onClearAttachedContext) onClearAttachedContext();
    } catch (err) {
      console.error("Error sending message to Abya AI", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveApiKey = () => {
    onUpdateSettings({ ...settings, customApiKey: tempApiKey.trim() });
    setShowApiKeyModal(false);
  };

  const getCardIcon = (type: AbyaInsightCard["type"]) => {
    switch (type) {
      case "priority":
        return Flame;
      case "revision":
        return RotateCw;
      case "test":
        return BarChart3;
      case "exam":
        return Trophy;
      case "career":
        return Target;
      default:
        return Sparkles;
    }
  };

  const getCardColor = (type: AbyaInsightCard["type"]) => {
    switch (type) {
      case "priority":
        return "border-rose-500/30 text-rose-400 bg-rose-500/10";
      case "revision":
        return "border-emerald-500/30 text-emerald-400 bg-emerald-500/10";
      case "test":
        return "border-amber-500/30 text-amber-400 bg-amber-500/10";
      case "exam":
        return "border-yellow-500/30 text-yellow-400 bg-yellow-500/10";
      case "career":
        return "border-cyan-500/30 text-cyan-400 bg-cyan-500/10";
      default:
        return "border-emerald-500/30 text-emerald-400 bg-emerald-500/10";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="glass-card rounded-2xl p-4 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 via-cyan-400 to-indigo-500 p-0.5 flex items-center justify-center font-bold text-slate-900 shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-white font-heading">Abya AI</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                v1.6 Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>Student:</span>
              <span className="text-emerald-300 font-medium">
                {activeStudent.name} ({activeStudent.classLevel} {activeStudent.stream} • {activeStudent.board})
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => setShowLanguageModal(true)}
            className="p-2 px-3 rounded-xl glass-pill text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors text-xs flex items-center gap-1.5 font-bold"
            title="Abya AI Language Setting"
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            <span className="text-xs">{abyaLanguage}</span>
          </button>

          <button
            onClick={() => setShowApiKeyModal(true)}
            className="p-2 rounded-xl glass-pill text-slate-300 hover:text-emerald-300 transition-colors text-xs flex items-center gap-1.5"
            title="Configure Custom API Key"
          >
            <Key className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline font-medium">API Key</span>
          </button>

          <button
            onClick={onClearChat}
            className="p-2 rounded-xl glass-pill text-slate-400 hover:text-rose-400 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Abya Insight Cards Slider */}
      {insightCards.length > 0 && (
        <div className="mb-3 shrink-0">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-xs font-bold text-slate-300 font-heading flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>Abya Insight Cards</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Profile: {activeStudent.name}
            </span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
            {insightCards.map((card) => {
              const Icon = getCardIcon(card.type);
              const colorClasses = getCardColor(card.type);

              return (
                <div
                  key={card.id}
                  className={`min-w-[240px] max-w-[280px] p-3 rounded-2xl glass-card border flex-1 flex flex-col justify-between ${colorClasses}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold font-heading flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5" />
                        <span>{card.title}</span>
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white line-clamp-1 mb-1">
                      {card.recommendation}
                    </p>
                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                      {card.reason}
                    </p>
                  </div>

                  {card.actionText && card.actionTab && onNavigate && (
                    <button
                      onClick={() => onNavigate(card.actionTab!)}
                      className="mt-2.5 pt-2 border-t border-white/10 text-[11px] font-bold text-emerald-300 hover:text-white flex items-center justify-between w-full transition-colors group"
                    >
                      <span>{card.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Context Note Attachment Banner */}
      {attachedContextNote && (
        <div className="glass-pill p-3 rounded-xl border border-cyan-500/30 mb-3 flex items-center justify-between text-xs text-cyan-300 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">Attached Context: "{attachedContextNote}"</span>
          </div>
          <button
            onClick={onClearAttachedContext}
            className="text-slate-400 hover:text-white ml-2 text-xs font-bold"
          >
            Remove
          </button>
        </div>
      )}

      {/* Quick Action Chips Bar */}
      <div className="mb-3 overflow-x-auto pb-1 scrollbar-thin shrink-0">
        <div className="flex items-center gap-2 min-w-max">
          {quickActions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.type}
                onClick={() => handleSend(act.prompt, act.type)}
                disabled={isLoading}
                className={`px-3 py-1.5 rounded-xl glass-pill border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-all ${act.bgHover} disabled:opacity-50`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{act.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {messages.map((msg) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                isUser ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? "bg-slate-700 text-slate-200"
                    : msg.isError
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : "bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-900 font-bold shadow-md shadow-emerald-500/20"
                }`}
              >
                {isUser ? (
                  <User className="w-4 h-4" />
                ) : msg.isError ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[78%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed border space-y-2 relative group ${
                  isUser
                    ? "bg-emerald-600/20 border-emerald-500/30 text-emerald-100 rounded-tr-none"
                    : msg.isError
                    ? "bg-rose-950/40 border-rose-500/30 text-rose-200 rounded-tl-none"
                    : "glass-card border-white/10 text-slate-100 rounded-tl-none"
                }`}
              >
                {msg.isFallback && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono mb-1 font-bold">
                    <Zap className="w-3 h-3" />
                    <span>Local Offline Intelligence</span>
                  </div>
                )}

                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                {/* Error State with Retry & Fallback options */}
                {msg.isError && (
                  <div className="pt-2 mt-2 border-t border-rose-500/20 flex flex-wrap items-center gap-2">
                    {onRetryLastMessage && (
                      <button
                        onClick={onRetryLastMessage}
                        className="px-3 py-1.5 rounded-xl bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-rose-600 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry Request</span>
                      </button>
                    )}

                    {onTriggerFallbackAction && (
                      <button
                        onClick={() => onTriggerFallbackAction("plan_day")}
                        className="px-3 py-1.5 rounded-xl glass-pill text-amber-300 border border-amber-500/30 font-semibold text-xs flex items-center gap-1.5 hover:bg-amber-500/10 transition-colors"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Use Local Intelligence</span>
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 font-mono">
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="opacity-80 hover:opacity-100 text-slate-400 hover:text-white transition-opacity flex items-center gap-1"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing / Loading indicator */}
        {isLoading && (
          <div className="flex items-center gap-3 animate-in fade-in">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-900 flex items-center justify-center shrink-0 font-bold">
              <Bot className="w-4 h-4" />
            </div>
            <div className="glass-card px-4 py-3 rounded-2xl border border-white/10 rounded-tl-none flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce delay-150" />
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-300" />
              <span className="text-xs text-slate-300 font-mono ml-2">
                Abya AI is analyzing {activeStudent.name}'s profile...
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="glass-card p-2 rounded-2xl border border-white/10 flex items-center gap-2 mt-2 shrink-0"
      >
        <input
          type="text"
          placeholder={`Ask Abya AI anything for ${activeStudent.name}...`}
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
        />

        <button
          type="submit"
          disabled={!inputPrompt.trim() || isLoading}
          className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 text-slate-900 font-bold disabled:opacity-40 hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div
            className="w-full max-w-md glass-card rounded-3xl border border-white/10 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-400" />
                <span>Abya AI API Key Config</span>
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              By default, Garia OS v1.6 uses the system's runtime Gemini API Key securely server-side. You can optionally paste your personal Gemini API Key below.
            </p>

            <div>
              <label className="block text-slate-300 font-medium text-xs mb-1">
                Custom Gemini API Key
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white text-xs border border-white/10 focus:outline-none"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowApiKeyModal(false)}
                className="px-4 py-2 rounded-xl glass-pill text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-900 font-bold text-xs"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Language Selector Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div
            className="w-full max-w-md glass-card rounded-3xl border border-emerald-500/30 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold font-heading text-white">Abya AI Language Mode</h3>
              </div>
              <button
                onClick={() => setShowLanguageModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Select response language for active student profile <strong className="text-emerald-300">{activeStudent.name}</strong>. Settings are isolated per profile.
            </p>

            <div className="space-y-2">
              {[
                {
                  id: "WhatsApp Language" as AbyaLanguageSetting,
                  label: "WhatsApp Language",
                  badge: "Default & Natural",
                  desc: "Casual, friendly & adaptive. Automatically matches your style (Roman Hindi, Hinglish, English)."
                },
                {
                  id: "English" as AbyaLanguageSetting,
                  label: "English",
                  badge: "Formal",
                  desc: "Clear, structured English explanations and academic guidance."
                },
                {
                  id: "Hindi" as AbyaLanguageSetting,
                  label: "Hindi",
                  badge: "Devanagari / Hindi",
                  desc: "Conversational Hindi explanations for concepts and questions."
                },
                {
                  id: "Hinglish" as AbyaLanguageSetting,
                  label: "Hinglish",
                  badge: "Mix",
                  desc: "Natural combination of Hindi & English written in Roman script."
                }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (onUpdateAbyaLanguage) onUpdateAbyaLanguage(item.id);
                    setShowLanguageModal(false);
                  }}
                  className={`w-full p-3.5 rounded-2xl text-left border transition-all flex items-start justify-between gap-3 ${
                    abyaLanguage === item.id
                      ? "bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/10"
                      : "glass-pill border-white/10 text-slate-300 hover:border-emerald-500/40"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-heading text-white">{item.label}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-emerald-300 border border-white/10 font-mono">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">{item.desc}</p>
                  </div>
                  {abyaLanguage === item.id && (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
