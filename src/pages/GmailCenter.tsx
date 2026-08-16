import React, { useState, useEffect } from "react";
import {
  Mail,
  Send,
  Inbox,
  Star,
  Trash2,
  RefreshCw,
  Search,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  User,
  Paperclip,
  Reply,
  AlertCircle,
  FileText,
  Calendar,
  CheckSquare,
  Copy,
  ExternalLink,
  ChevronRight,
  Filter,
  LogOut,
} from "lucide-react";
import {
  GmailMessageSummary,
  GmailFullMessage,
  StudentProfile,
  Task,
  CalendarEvent,
} from "../types";
import {
  listGmailMessages,
  getGmailMessageDetails,
  sendGmailMessage,
  modifyGmailMessageLabels,
  trashGmailMessage,
  getGmailUserProfile,
  ACADEMIC_EMAIL_TEMPLATES,
} from "../utils/googleGmail";
import {
  signInWithGoogle,
  signOutGoogle,
  initGoogleAuth,
  getGoogleAccessToken,
} from "../utils/googleCalendar";
import { User as FirebaseUser } from "firebase/auth";

interface GmailCenterProps {
  activeStudent?: StudentProfile | null;
  onAddTask?: (task: Omit<Task, "id" | "createdAt">) => void;
  onAddCalendarEvent?: (event: Omit<CalendarEvent, "id" | "createdAt">) => void;
  onNavigateAbya?: () => void;
  onBack?: () => void;
}

type MailFolder = "INBOX" | "STARRED" | "SENT" | "TRASH";

export const GmailCenter: React.FC<GmailCenterProps> = ({
  activeStudent,
  onAddTask,
  onAddCalendarEvent,
  onNavigateAbya,
  onBack,
}) => {
  // Auth state
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Mailbox state
  const [folder, setFolder] = useState<MailFolder>("INBOX");
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [userProfile, setUserProfile] = useState<{
    emailAddress: string;
    messagesTotal: number;
  } | null>(null);

  // Active message detail view
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<GmailFullMessage | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [inReplyToId, setInReplyToId] = useState<string | undefined>(undefined);
  const [replyThreadId, setReplyThreadId] = useState<string | undefined>(undefined);

  // Confirmation Modals
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Initialize Auth
  useEffect(() => {
    setIsAuthChecking(true);
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
        setIsAuthChecking(false);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
        setIsAuthChecking(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Fetch User Profile and Messages when token changes or folder changes
  const fetchMessages = async (token: string, currentFolder: MailFolder, query: string = "") => {
    setIsLoadingMessages(true);
    try {
      let q = query;
      const labelIds: string[] = [];

      if (currentFolder === "INBOX") {
        labelIds.push("INBOX");
      } else if (currentFolder === "STARRED") {
        labelIds.push("STARRED");
      } else if (currentFolder === "SENT") {
        labelIds.push("SENT");
      } else if (currentFolder === "TRASH") {
        labelIds.push("TRASH");
      }

      const result = await listGmailMessages(token, {
        maxResults: 25,
        labelIds: labelIds.length > 0 ? labelIds : undefined,
        q: q || undefined,
      });

      setMessages(result.messages);

      // Fetch user profile info
      try {
        const profile = await getGmailUserProfile(token);
        setUserProfile(profile);
      } catch (e) {
        // non-blocking
      }
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      showToast(error?.message || "Failed to load emails. Please re-authenticate.");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchMessages(accessToken, folder, activeQuery);
    }
  }, [accessToken, folder, activeQuery]);

  // Handle Login
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await signInWithGoogle();
      if (res) {
        setGoogleUser(res.user);
        setAccessToken(res.accessToken);
        showToast("Connected to Gmail successfully!");
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      showToast(err.message || "Failed to sign in with Google.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleGoogleLogout = async () => {
    await signOutGoogle();
    setGoogleUser(null);
    setAccessToken(null);
    setMessages([]);
    setSelectedMessage(null);
    setSelectedMessageId(null);
    setUserProfile(null);
    showToast("Signed out of Google Workspace.");
  };

  // Load message detail
  const handleSelectMessage = async (msgSummary: GmailMessageSummary) => {
    if (!accessToken) return;
    setSelectedMessageId(msgSummary.id);
    setIsLoadingDetails(true);
    try {
      const details = await getGmailMessageDetails(accessToken, msgSummary.id);
      setSelectedMessage(details);

      // If unread, mark as read
      if (details.isUnread) {
        await modifyGmailMessageLabels(accessToken, msgSummary.id, [], ["UNREAD"]);
        setMessages((prev) =>
          prev.map((m) => (m.id === msgSummary.id ? { ...m, isUnread: false } : m))
        );
      }
    } catch (err: any) {
      console.error("Error loading message details:", err);
      showToast(err?.message || "Failed to load email details.");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Toggle Star
  const handleToggleStar = async (e: React.MouseEvent, msgId: string, currentStarred: boolean) => {
    e.stopPropagation();
    if (!accessToken) return;

    try {
      if (currentStarred) {
        await modifyGmailMessageLabels(accessToken, msgId, [], ["STARRED"]);
      } else {
        await modifyGmailMessageLabels(accessToken, msgId, ["STARRED"], []);
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, isStarred: !currentStarred } : m))
      );

      if (selectedMessage?.id === msgId) {
        setSelectedMessage((prev) =>
          prev ? { ...prev, isStarred: !currentStarred } : null
        );
      }
      showToast(currentStarred ? "Star removed" : "Email starred");
    } catch (e: any) {
      showToast("Failed to update star status");
    }
  };

  // Trash Message with Confirmation
  const handleConfirmTrash = async () => {
    if (!accessToken || !deleteConfirmTarget) return;
    setIsDeleting(true);
    try {
      await trashGmailMessage(accessToken, deleteConfirmTarget);
      setMessages((prev) => prev.filter((m) => m.id !== deleteConfirmTarget));
      if (selectedMessage?.id === deleteConfirmTarget) {
        setSelectedMessage(null);
        setSelectedMessageId(null);
      }
      showToast("Email moved to Trash");
      setDeleteConfirmTarget(null);
    } catch (err: any) {
      showToast(err?.message || "Failed to move email to Trash");
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Compose with Template
  const handleApplyTemplate = (template: typeof ACADEMIC_EMAIL_TEMPLATES[0]) => {
    let customizedBody = template.body;
    let customizedSubject = template.subject;

    if (activeStudent) {
      customizedBody = customizedBody
        .replace(/\[Student Name\]/g, activeStudent.name || "Student")
        .replace(/\[Class & Section\]/g, `${activeStudent.classLevel || "Class 12"} ${activeStudent.stream || ""}`)
        .replace(/\[Class & Stream\]/g, `${activeStudent.classLevel || "Class 12"} ${activeStudent.stream || ""}`)
        .replace(/\[Your Name\]/g, activeStudent.name || "Student");

      customizedSubject = customizedSubject
        .replace(/\[Student Name\]/g, activeStudent.name || "Student")
        .replace(/\[Class & Section\]/g, `${activeStudent.classLevel || "Class 12"}`);
    }

    setComposeSubject(customizedSubject);
    setComposeBody(customizedBody);
  };

  // Open Reply Compose
  const handleOpenReply = () => {
    if (!selectedMessage) return;
    setComposeTo(selectedMessage.from);
    setComposeSubject(
      selectedMessage.subject.startsWith("Re:")
        ? selectedMessage.subject
        : `Re: ${selectedMessage.subject}`
    );
    setComposeBody(
      `\n\n--- On ${selectedMessage.date}, ${selectedMessage.from} wrote ---\n> ${selectedMessage.bodyText.slice(0, 300)}...`
    );
    setInReplyToId(selectedMessage.id);
    setReplyThreadId(selectedMessage.threadId);
    setIsComposeOpen(true);
  };

  // Send Email Handler
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      showToast("Please sign in with Google to send emails");
      return;
    }
    if (!composeTo.trim()) {
      showToast("Please specify a recipient email");
      return;
    }
    if (!composeSubject.trim()) {
      showToast("Please enter an email subject");
      return;
    }

    setIsSending(true);
    try {
      await sendGmailMessage(accessToken, {
        to: composeTo,
        subject: composeSubject,
        body: composeBody,
        cc: showCc && composeCc ? composeCc : undefined,
        inReplyTo: inReplyToId,
        threadId: replyThreadId,
      });

      showToast("✉️ Email sent successfully!");
      setIsComposeOpen(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      setComposeCc("");
      setInReplyToId(undefined);
      setReplyThreadId(undefined);

      // Refresh if in sent folder
      if (folder === "SENT") {
        fetchMessages(accessToken, "SENT", activeQuery);
      }
    } catch (err: any) {
      console.error("Send email error:", err);
      showToast(err?.message || "Failed to send email. Please verify recipient address.");
    } finally {
      setIsSending(false);
    }
  };

  // Convert Email to Task in Garia OS
  const handleConvertEmailToTask = (msg: GmailFullMessage | GmailMessageSummary) => {
    if (!onAddTask) return;
    const today = new Date().toISOString().split("T")[0];
    onAddTask({
      title: `Email Task: ${msg.subject.replace(/^(Re|Fwd):\s*/i, "")}`,
      description: `From: ${msg.from}\nDate: ${msg.date}\n\nSnippet: ${msg.snippet}`,
      date: today,
      priority: "high",
      category: "study",
      completed: false,
    });
    showToast("✅ Created new Garia Task from this email!");
  };

  // Convert Email to Calendar Event
  const handleConvertEmailToCalendar = (msg: GmailFullMessage | GmailMessageSummary) => {
    if (!onAddCalendarEvent) return;
    const today = new Date().toISOString().split("T")[0];
    onAddCalendarEvent({
      title: `Academic Notice: ${msg.subject.replace(/^(Re|Fwd):\s*/i, "")}`,
      description: `Sender: ${msg.from}\nReceived: ${msg.date}\n\n${msg.snippet}`,
      date: today,
      category: "event",
    });
    showToast("📅 Added email reminder to Calendar!");
  };

  const handleBack = () => {
    if (selectedMessageId || selectedMessage) {
      setSelectedMessageId(null);
      setSelectedMessage(null);
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900/95 border border-amber-500/40 text-amber-300 text-sm font-semibold shadow-2xl shadow-amber-500/20 backdrop-blur-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden bg-gradient-to-br from-red-500/10 via-slate-900/40 to-transparent">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-3">
            {(onBack || selectedMessageId) && (
              <button
                onClick={handleBack}
                id="gmail-back-btn"
                aria-label="Go Back"
                className="mt-1 p-2 sm:px-3.5 sm:py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shrink-0 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 text-red-400" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Google Workspace</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  Gmail API Connected
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
                Student Gmail Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Read teacher notifications, send leave applications, clarify subject doubts, and organize academic emails right inside Garia OS.
              </p>
            </div>
          </div>

          {/* Auth Status / Action Button */}
          <div className="flex items-center gap-3">
            {googleUser ? (
              <div className="flex items-center gap-3 bg-slate-950/80 p-2 sm:p-2.5 rounded-2xl border border-white/10">
                {googleUser.photoURL ? (
                  <img
                    src={googleUser.photoURL}
                    alt="Google avatar"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full border border-red-500/40"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-sm font-bold text-red-300">
                    {googleUser.email ? googleUser.email[0].toUpperCase() : "G"}
                  </div>
                )}
                <div className="pr-2">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{googleUser.displayName || "Google Account"}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate max-w-[160px]">
                    {googleUser.email}
                  </div>
                </div>
                <button
                  onClick={handleGoogleLogout}
                  title="Disconnect Google Account"
                  className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm shadow-xl hover:scale-105 transition-all flex items-center gap-3"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isLoggingIn ? "Signing in..." : "Sign in with Google"}</span>
              </button>
            )}

            {googleUser && (
              <button
                onClick={() => {
                  setComposeTo("");
                  setComposeSubject("");
                  setComposeBody("");
                  setInReplyToId(undefined);
                  setReplyThreadId(undefined);
                  setIsComposeOpen(true);
                }}
                className="px-4 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-500/20 transition-all flex items-center gap-2 hover:scale-105 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Compose</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Mailbox Workspace */}
      {!googleUser ? (
        <div className="glass-card p-12 rounded-3xl border border-white/10 text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto shadow-2xl shadow-red-500/20">
            <Mail className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
              Connect Your Google Account
            </h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Sign in with your Google account to access your inbox, drafts, academic communications, and send verified letters directly from Garia OS.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-xl transition-all inline-flex items-center gap-3 hover:scale-105"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isLoggingIn ? "Authorizing with Google..." : "Authorize Gmail Access"}</span>
            </button>
          </div>

          <div className="pt-6 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
              <div className="text-xs font-bold text-amber-400">📝 Academic Templates</div>
              <div className="text-[11px] text-slate-400">
                1-click Leave applications, Doubt clarification, and LOR requests.
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
              <div className="text-xs font-bold text-cyan-400">⚡ Convert to Tasks</div>
              <div className="text-[11px] text-slate-400">
                Turn teacher assignments and project emails directly into Garia study tasks.
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
              <div className="text-xs font-bold text-emerald-400">🔒 Secure & Direct</div>
              <div className="text-[11px] text-slate-400">
                Client-side token authentication with zero external third-party storage.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Folders & Search (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Search Bar */}
            <div className="glass-card p-3 rounded-2xl border border-white/10 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
              <input
                type="text"
                placeholder="Search mail (e.g. from:teacher, exam)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setActiveQuery(searchQuery.trim());
                  }
                }}
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveQuery("");
                  }}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
              <button
                onClick={() => setActiveQuery(searchQuery.trim())}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
              >
                Search
              </button>
            </div>

            {/* Folders Navigation */}
            <div className="glass-card p-3 rounded-2xl border border-white/10 space-y-1">
              <button
                onClick={() => {
                  setFolder("INBOX");
                  setSelectedMessage(null);
                  setSelectedMessageId(null);
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                  folder === "INBOX"
                    ? "bg-red-500/20 text-red-300 border border-red-500/30 shadow-md shadow-red-500/10"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Inbox className="w-4 h-4" />
                  <span>Inbox</span>
                </div>
                {userProfile?.messagesTotal !== undefined && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 font-mono">
                    {userProfile.messagesTotal}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setFolder("STARRED");
                  setSelectedMessage(null);
                  setSelectedMessageId(null);
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                  folder === "STARRED"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-500/10"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Star className="w-4 h-4" />
                  <span>Starred</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setFolder("SENT");
                  setSelectedMessage(null);
                  setSelectedMessageId(null);
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                  folder === "SENT"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-500/10"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Send className="w-4 h-4" />
                  <span>Sent</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setFolder("TRASH");
                  setSelectedMessage(null);
                  setSelectedMessageId(null);
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                  folder === "TRASH"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-md shadow-rose-500/10"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Trash2 className="w-4 h-4" />
                  <span>Trash</span>
                </div>
              </button>
            </div>

            {/* Academic Templates Quick Picker */}
            <div className="glass-card p-4 rounded-2xl border border-white/10 space-y-3 bg-gradient-to-br from-amber-500/5 to-transparent">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Academic Templates</span>
                </span>
                <span className="text-[10px] text-slate-400">Quick Compose</span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {ACADEMIC_EMAIL_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      handleApplyTemplate(tmpl);
                      setIsComposeOpen(true);
                    }}
                    className="w-full p-2 rounded-xl bg-white/5 hover:bg-amber-500/10 hover:border-amber-500/30 border border-white/5 text-left transition-all group"
                  >
                    <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                      {tmpl.title}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {tmpl.subject}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Mail List or Message Viewer (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {selectedMessage ? (
              /* Message Detail View */
              <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-6 animate-in fade-in duration-200">
                {/* Back and Action Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <button
                    onClick={() => {
                      setSelectedMessage(null);
                      setSelectedMessageId(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to List</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) =>
                        handleToggleStar(e, selectedMessage.id, selectedMessage.isStarred)
                      }
                      className={`p-2 rounded-xl border transition-colors ${
                        selectedMessage.isStarred
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                      }`}
                      title={selectedMessage.isStarred ? "Unstar" : "Star"}
                    >
                      <Star className={`w-4 h-4 ${selectedMessage.isStarred ? "fill-amber-400" : ""}`} />
                    </button>

                    <button
                      onClick={() => handleConvertEmailToTask(selectedMessage)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="Add this email to your Garia tasks"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Add to Tasks</span>
                    </button>

                    <button
                      onClick={() => handleConvertEmailToCalendar(selectedMessage)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="Add this email event to Calendar"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Add to Calendar</span>
                    </button>

                    <button
                      onClick={handleOpenReply}
                      className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>

                    <button
                      onClick={() => setDeleteConfirmTarget(selectedMessage.id)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                      title="Move to Trash"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Email Subject & Meta */}
                <div className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
                    {selectedMessage.subject}
                  </h2>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/60 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-500/40 to-orange-500/40 text-white font-bold flex items-center justify-center text-sm border border-white/10">
                        {selectedMessage.from[0]?.toUpperCase() || "M"}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          {selectedMessage.from}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          To: {selectedMessage.to || "me"}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 font-mono">
                      {selectedMessage.date}
                    </div>
                  </div>
                </div>

                {/* Email Content Body */}
                <div className="p-5 rounded-2xl bg-slate-950/40 border border-white/5 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans min-h-[220px]">
                  {selectedMessage.bodyText || selectedMessage.snippet}
                </div>

                {/* Bottom Reply Bar */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="text-xs text-slate-400">
                    Need help drafting a response? Use{" "}
                    <button
                      onClick={onNavigateAbya}
                      className="text-amber-400 hover:underline font-semibold"
                    >
                      Abya AI
                    </button>
                  </div>
                  <button
                    onClick={handleOpenReply}
                    className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-105"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>Reply to {selectedMessage.from.split("<")[0].trim()}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Message List View */
              <div className="glass-card p-4 sm:p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-heading text-white">
                      {folder === "INBOX" && "Inbox"}
                      {folder === "STARRED" && "Starred Emails"}
                      {folder === "SENT" && "Sent Messages"}
                      {folder === "TRASH" && "Trash"}
                    </span>
                    {activeQuery && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-amber-300 font-mono">
                        query: "{activeQuery}"
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (accessToken) fetchMessages(accessToken, folder, activeQuery);
                    }}
                    disabled={isLoadingMessages}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isLoadingMessages ? "animate-spin text-red-400" : ""}`}
                    />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>

                {isLoadingMessages ? (
                  <div className="py-20 text-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-red-400 animate-spin mx-auto" />
                    <p className="text-xs text-slate-400">Loading messages from Gmail API...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-white">No messages found</div>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      {activeQuery
                        ? "No emails matched your search term."
                        : `Your ${folder.toLowerCase()} folder is empty.`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => handleSelectMessage(msg)}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                          msg.isUnread
                            ? "bg-slate-900/90 border-red-500/30 hover:border-red-500/60 shadow-sm"
                            : "bg-slate-950/40 border-white/5 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Star Toggle */}
                          <button
                            onClick={(e) => handleToggleStar(e, msg.id, msg.isStarred)}
                            className="p-1 rounded-lg text-slate-500 hover:text-amber-400 transition-colors shrink-0"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                msg.isStarred ? "text-amber-400 fill-amber-400" : ""
                              }`}
                            />
                          </button>

                          {/* Sender & Subject Preview */}
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs truncate ${
                                  msg.isUnread
                                    ? "font-bold text-white"
                                    : "font-semibold text-slate-300"
                                }`}
                              >
                                {msg.from.split("<")[0].trim()}
                              </span>
                              {msg.isUnread && (
                                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                              )}
                            </div>
                            <div
                              className={`text-xs truncate ${
                                msg.isUnread ? "font-bold text-slate-100" : "text-slate-300"
                              }`}
                            >
                              {msg.subject}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {msg.snippet}
                            </div>
                          </div>
                        </div>

                        {/* Date & Quick Action */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                            {msg.date.split(" ")[0] || msg.date}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConvertEmailToTask(msg);
                            }}
                            title="Turn into Task"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmTarget(msg.id);
                            }}
                            title="Move to Trash"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compose Email Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-2xl p-6 rounded-3xl border border-red-500/30 bg-slate-950/95 shadow-2xl shadow-red-500/10 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-white">
                    {inReplyToId ? "Reply to Email" : "New Email"}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Sending as: {googleUser?.email || "Authenticated Account"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Template Selector in Compose */}
            {!inReplyToId && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                  Apply Academic Preset Template:
                </div>
                <div className="flex flex-wrap gap-2">
                  {ACADEMIC_EMAIL_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-amber-500/20 text-[11px] font-medium text-slate-300 hover:text-amber-300 border border-white/5 transition-colors"
                    >
                      {tmpl.title.split(" ")[0]} {tmpl.title.split(" ")[1]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSendEmail} className="space-y-4">
              {/* Recipient */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">To:</label>
                  {!showCc && (
                    <button
                      type="button"
                      onClick={() => setShowCc(true)}
                      className="text-[10px] text-cyan-400 hover:underline"
                    >
                      + Add Cc / Bcc
                    </button>
                  )}
                </div>
                <input
                  type="email"
                  placeholder="teacher@school.edu or admissions@college.ac.in"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* CC */}
              {showCc && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Cc:</label>
                  <input
                    type="text"
                    placeholder="parent@example.com, principal@school.edu"
                    value={composeCc}
                    onChange={(e) => setComposeCc(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              )}

              {/* Subject */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Subject:</label>
                <input
                  type="text"
                  placeholder="Subject title..."
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-red-500 font-medium"
                />
              </div>

              {/* Body */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Message Body:</label>
                <textarea
                  rows={9}
                  placeholder="Write your email here..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-red-500 font-sans leading-relaxed resize-y"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Discard
                </button>

                <button
                  type="submit"
                  disabled={isSending}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSending ? "Sending..." : "Send Email"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete/Trash Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-md p-6 rounded-3xl border border-rose-500/40 bg-slate-950/95 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold font-heading text-white">
                Move Email to Trash?
              </h3>
              <p className="text-xs text-slate-300">
                This will move the message to your Gmail Trash folder. You can recover it within 30 days from Gmail.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                disabled={isDeleting}
                className="w-1/2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTrash}
                disabled={isDeleting}
                className="w-1/2 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? "Moving..." : "Confirm Trash"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
