import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit3,
  Sparkles,
  X,
  Filter,
  Users,
  Link2,
  Copy,
  Check,
  AlignLeft,
  Tag,
  Archive,
  ArchiveRestore,
  Folder,
  FolderPlus,
  Clock,
  Eye,
  Lock,
  Unlock,
  Mic,
  MicOff,
  Bell,
  BellRing,
  Download,
  History,
  RotateCcw,
  Mail,
  UserPlus,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  Note,
  NoteColorLabel,
  NoteTemplate,
  NoteVersion,
  SharedWorkspace,
  WorkspaceMember,
} from "../types";
import {
  encryptNoteContent,
  decryptNoteContent,
  isNoteEncrypted,
  isPinnedNoteWithPendingReminder,
  isNoteReminderDue,
  getPinnedNotesWithPendingReminders,
  triggerPinnedNoteReminderNotification,
  getSpeechRecognitionConstructor,
  DEFAULT_NOTE_TEMPLATES,
  loadNoteTemplates,
  saveCustomNoteTemplate,
  deleteCustomNoteTemplate,
  extractNoteWikiLinks,
  findNoteByTitle,
  computeBidirectionalNoteLinks,
  stripMarkdownToCleanText,
  formatNoteAsCleanText,
  formatNoteAsMarkdown,
  generateNotePdfContent,
  exportNoteAsTextFile,
  exportNoteAsMarkdownFile,
  exportNoteAsPdfFile,
  NOTE_LABEL_COLOR_PALETTE,
  DEFAULT_LABEL_COLOR_MAP,
  resolveLabelColorOption,
  getDefaultColorForLabelName,
  normalizeNoteColorLabels,
  loadCustomLabelColors,
  saveCustomLabelColor,
  removeCustomLabelColor,
  normalizeNoteVersions,
  createNoteVersionSnapshot,
  appendNoteVersionSnapshot,
  restoreNoteFromVersion,
  normalizeNoteSharedWith,
  isValidCollaboratorEmail,
  addCollaboratorEmailToNote,
  removeCollaboratorEmailFromNote,
  suggestSmartTagsFromContent,
  parseSmartTagsResponse,
  requestAbyaSmartTags,
} from "../utils/noteFeatures";

export {
  encryptNoteContent,
  decryptNoteContent,
  isNoteEncrypted,
  isPinnedNoteWithPendingReminder,
  isNoteReminderDue,
  getPinnedNotesWithPendingReminders,
  triggerPinnedNoteReminderNotification,
  getSpeechRecognitionConstructor,
  DEFAULT_NOTE_TEMPLATES,
  loadNoteTemplates,
  saveCustomNoteTemplate,
  deleteCustomNoteTemplate,
  extractNoteWikiLinks,
  findNoteByTitle,
  computeBidirectionalNoteLinks,
  stripMarkdownToCleanText,
  formatNoteAsCleanText,
  formatNoteAsMarkdown,
  generateNotePdfContent,
  exportNoteAsTextFile,
  exportNoteAsMarkdownFile,
  exportNoteAsPdfFile,
  NOTE_LABEL_COLOR_PALETTE,
  DEFAULT_LABEL_COLOR_MAP,
  resolveLabelColorOption,
  getDefaultColorForLabelName,
  normalizeNoteColorLabels,
  loadCustomLabelColors,
  saveCustomLabelColor,
  removeCustomLabelColor,
  normalizeNoteVersions,
  createNoteVersionSnapshot,
  appendNoteVersionSnapshot,
  restoreNoteFromVersion,
  normalizeNoteSharedWith,
  isValidCollaboratorEmail,
  addCollaboratorEmailToNote,
  removeCollaboratorEmailFromNote,
  suggestSmartTagsFromContent,
  parseSmartTagsResponse,
  requestAbyaSmartTags,
};
import { auth } from "../utils/firebase";
import {
  subscribeToUserWorkspaces,
  updateSharedNotesInWorkspace,
} from "../utils/collaborationEngine";
import { CreateSharedWorkspaceModal } from "../components/collaboration/CreateSharedWorkspaceModal";
import { JoinWorkspaceModal } from "../components/collaboration/JoinWorkspaceModal";
import { SharedNotesWorkspaceView } from "../components/collaboration/SharedNotesWorkspaceView";

export const DEFAULT_NOTE_FOLDER = "General";

const SUGGESTED_NOTE_LABELS = [
  "Formula",
  "Summary",
  "Important",
  "Exam Prep",
  "Revision",
  "Doubt",
];

const DEFAULT_NOTE_FOLDERS = [
  "General",
  "Study Notes",
  "Formulas",
  "Exam Prep",
  "Revision",
];

export type NoteSortOption = "updated" | "alphabetical" | "created";

/**
 * Normalizes any sort option label or key into a canonical NoteSortOption.
 */
export function normalizeNoteSortOption(raw?: string): NoteSortOption {
  if (!raw || typeof raw !== "string") return "updated";
  const cleaned = raw.trim().toLowerCase();
  if (
    cleaned === "alphabetical" ||
    cleaned === "alpha" ||
    cleaned === "title" ||
    cleaned.startsWith("alphabetical")
  ) {
    return "alphabetical";
  }
  if (
    cleaned === "created" ||
    cleaned === "created_date" ||
    cleaned === "created-date" ||
    cleaned === "created date" ||
    cleaned.startsWith("created")
  ) {
    return "created";
  }
  return "updated";
}

/**
 * Calculates the real-time word count for note content.
 */
export function calculateNoteWordCount(text: string): number {
  if (!text || typeof text !== "string") return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

/**
 * Calculates the real-time character count for note content.
 */
export function calculateNoteCharacterCount(text: string): number {
  if (!text || typeof text !== "string") return 0;
  return text.length;
}

/**
 * Formats a timestamp (createdAt or updatedAt) into a readable date/time string.
 */
export function formatNoteTimestamp(timestamp?: number): string {
  if (!timestamp || typeof timestamp !== "number" || Number.isNaN(timestamp)) {
    return "Just now";
  }
  const dateObj = new Date(timestamp);
  if (Number.isNaN(dateObj.getTime())) {
    return "Just now";
  }
  return dateObj.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Copies note content to the clipboard with a safe DOM fallback.
 */
export async function copyNoteContentToClipboard(text: string): Promise<boolean> {
  const safeText = text ?? "";
  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(safeText);
      return true;
    }
  } catch {
    // Fallback to textarea copy below
  }

  try {
    if (typeof document !== "undefined") {
      const textarea = document.createElement("textarea");
      textarea.value = safeText;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(textarea);
      return copied;
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Returns normalized labels array for a note (syncing `labels`, `colorLabels`, and legacy `tags`).
 */
export function getNoteLabels(note: Partial<Note>): string[] {
  return normalizeNoteColorLabels(note).labels;
}

/**
 * Returns normalized color-coded labels (`{ name, color }[]`) for a note.
 */
export function getNoteColorLabels(
  note: Partial<Note>,
  globalColorMap?: Record<string, string>
): NoteColorLabel[] {
  return normalizeNoteColorLabels(note, globalColorMap).colorLabels;
}

/**
 * Checks whether a note matches a selected label filter ("all" matches all notes).
 */
export function matchesNoteLabelFilter(
  note: Partial<Note>,
  selectedLabel: string
): boolean {
  if (!selectedLabel || selectedLabel.trim().toLowerCase() === "all") {
    return true;
  }
  const target = selectedLabel.trim().toLowerCase();
  return getNoteLabels(note).some((lbl) => lbl.toLowerCase() === target);
}

/**
 * Returns normalized folder name for a note (defaulting to "General").
 */
export function getNoteFolder(note: Partial<Note>): string {
  if (typeof note.folder === "string" && note.folder.trim()) {
    return note.folder.trim();
  }
  return DEFAULT_NOTE_FOLDER;
}

/**
 * Compares two notes according to the selected sort option:
 * - "updated" ("Recently Updated"): newest updatedAt (or createdAt) first
 * - "alphabetical" ("Alphabetical"): A-Z by title (case-insensitive)
 * - "created" ("Created Date"): newest createdAt first
 */
export function compareNotesBySortOption(
  a: Note,
  b: Note,
  sortBy: NoteSortOption | string = "updated"
): number {
  const mode = normalizeNoteSortOption(sortBy);
  if (mode === "alphabetical") {
    const titleCmp = (a.title || "").localeCompare(b.title || "", undefined, {
      sensitivity: "base",
      numeric: true,
    });
    if (titleCmp !== 0) return titleCmp;
    return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
  }
  if (mode === "created") {
    const createdDiff = (b.createdAt || 0) - (a.createdAt || 0);
    if (createdDiff !== 0) return createdDiff;
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  }
  // Default: "updated" (Recently Updated)
  const updatedDiff =
    (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
  if (updatedDiff !== 0) return updatedDiff;
  return (b.createdAt || 0) - (a.createdAt || 0);
}

/**
 * Normalizes and sorts notes so that pinned notes (`pinned: true`) appear at the top,
 * and notes within each group are ordered by `sortBy` ('Recently Updated', 'Alphabetical', or 'Created Date').
 */
export function sortNotesForDisplay(
  notesList: Note[],
  sortBy: NoteSortOption | string = "updated"
): Note[] {
  if (!Array.isArray(notesList)) return [];
  const mode = normalizeNoteSortOption(sortBy);
  return [...notesList]
    .map((n) => {
      const normalizedColorInfo = normalizeNoteColorLabels(n);
      const cleanFolder = getNoteFolder(n);
      const cleanReminder =
        typeof n.reminderDate === "string" && n.reminderDate.trim()
          ? n.reminderDate.trim()
          : undefined;
      return {
        ...n,
        pinned: Boolean(n.pinned),
        archived: Boolean(n.archived),
        labels: normalizedColorInfo.labels,
        labelColors: normalizedColorInfo.labelColors,
        colorLabels: normalizedColorInfo.colorLabels,
        folder: cleanFolder,
        ...(cleanReminder ? { reminderDate: cleanReminder } : {}),
        isEncrypted: isNoteEncrypted(n),
        versions: normalizeNoteVersions(n.versions),
        sharedWith: normalizeNoteSharedWith(n.sharedWith),
        sharedPermissions: n.sharedPermissions || {},
        tags: normalizedColorInfo.labels,
      };
    })
    .sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) {
        return a.pinned ? -1 : 1;
      }
      return compareNotesBySortOption(a, b, mode);
    });
}

/**
 * Groups an array of notes by their `folder` property while preserving order within each folder.
 */
export function groupNotesByFolder(notesList: Note[]): Record<string, Note[]> {
  const grouped: Record<string, Note[]> = {};
  for (const note of notesList) {
    const folderName = getNoteFolder(note);
    if (!grouped[folderName]) {
      grouped[folderName] = [];
    }
    grouped[folderName].push(note);
  }
  return grouped;
}

/**
 * Matches a note against a real-time search query across both note title and content (plus labels and folder).
 */
export function matchesNoteSearchQuery(note: Note, query: string): boolean {
  if (!query || !query.trim()) return true;
  const normalizedQuery = query.trim().toLowerCase();
  const titleMatches = (note.title || "").toLowerCase().includes(normalizedQuery);
  const contentMatches = (note.content || "").toLowerCase().includes(normalizedQuery);
  const folderMatches = getNoteFolder(note).toLowerCase().includes(normalizedQuery);
  const labelMatches = getNoteLabels(note).some((label) =>
    label.toLowerCase().includes(normalizedQuery)
  );
  return titleMatches || contentMatches || folderMatches || labelMatches;
}

/**
 * Parses inline markdown syntax (bidirectional [[Note Title]] links, bold, italics,
 * bold+italics, inline code, strikethrough, external links) into safe React nodes.
 */
export function renderInlineMarkdown(
  text: string,
  keyPrefix: string = "md",
  onWikiLinkClick?: (linkedTitle: string) => void
): React.ReactNode[] {
  if (!text) return [];

  const tokenRegex =
    /(\[\[[^\[\]\n]+\]\]|`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\*[^*\n]+\*|_[^_\n]+_|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);

  return parts
    .filter((part) => part !== "")
    .map((part, idx) => {
      const key = `${keyPrefix}-${idx}`;

      // Bidirectional Wiki Link: [[Note Title]]
      if (part.startsWith("[[") && part.endsWith("]]") && part.length > 4) {
        const linkedTitle = part.slice(2, -2).trim();
        return (
          <a
            key={key}
            href={`#note-link-${encodeURIComponent(linkedTitle)}`}
            data-testid={`wiki-link-${linkedTitle}`}
            data-linked-title={linkedTitle}
            title={`Open linked note: ${linkedTitle}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onWikiLinkClick?.(linkedTitle);
            }}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 font-semibold text-[11px] underline decoration-emerald-400/60 cursor-pointer transition-colors"
          >
            <Link2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
            <span>{linkedTitle}</span>
          </a>
        );
      }

      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        return (
          <code
            key={key}
            className="px-1.5 py-0.5 rounded bg-slate-800/90 text-emerald-300 font-mono text-[11px] border border-white/10"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      if (part.startsWith("***") && part.endsWith("***") && part.length > 6) {
        return (
          <strong key={key} className="font-bold text-white">
            <em className="italic">{part.slice(3, -3)}</em>
          </strong>
        );
      }

      if (
        (part.startsWith("**") && part.endsWith("**") && part.length > 4) ||
        (part.startsWith("__") && part.endsWith("__") && part.length > 4)
      ) {
        return (
          <strong key={key} className="font-bold text-white">
            {renderInlineMarkdown(part.slice(2, -2), `${key}-b`, onWikiLinkClick)}
          </strong>
        );
      }

      if (part.startsWith("~~") && part.endsWith("~~") && part.length > 4) {
        return (
          <del key={key} className="line-through text-slate-400">
            {renderInlineMarkdown(part.slice(2, -2), `${key}-s`, onWikiLinkClick)}
          </del>
        );
      }

      if (
        (part.startsWith("*") && part.endsWith("*") && part.length > 2) ||
        (part.startsWith("_") && part.endsWith("_") && part.length > 2)
      ) {
        return (
          <em key={key} className="italic text-slate-200">
            {renderInlineMarkdown(part.slice(1, -1), `${key}-i`, onWikiLinkClick)}
          </em>
        );
      }

      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        return (
          <a
            key={key}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-cyan-400 underline hover:text-cyan-300"
          >
            {linkMatch[1]}
          </a>
        );
      }

      return <React.Fragment key={key}>{part}</React.Fragment>;
    });
}

/**
 * Lightweight Markdown Previewer component supporting headings, bold, italics,
 * unordered lists, ordered lists, blockquotes, code blocks, and [[Note Title]] links.
 */
export const NoteMarkdownPreview: React.FC<{
  content: string;
  className?: string;
  testId?: string;
  onWikiLinkClick?: (linkedTitle: string) => void;
}> = ({ content, className = "", testId, onWikiLinkClick }) => {
  const renderedBlocks = useMemo(() => {
    if (!content) return null;
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines with subtle spacing
      if (!trimmed) {
        i++;
        continue;
      }

      // Code block ```
      if (trimmed.startsWith("```")) {
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        elements.push(
          <pre
            key={`code-${i}`}
            className="p-2.5 rounded-xl bg-slate-950/90 border border-white/10 text-[11px] font-mono text-emerald-300 overflow-x-auto my-1.5"
          >
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        continue;
      }

      // Unordered list (-, *, +)
      if (/^[-*+]\s+/.test(trimmed)) {
        const items: string[] = [];
        while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^[-*+]\s+/, ""));
          i++;
        }
        elements.push(
          <ul
            key={`ul-${i}`}
            className="list-disc list-inside space-y-1 my-1 text-slate-200"
          >
            {items.map((item, idx) => (
              <li key={`ul-${i}-li-${idx}`} className="leading-relaxed">
                {renderInlineMarkdown(item, `ul-${i}-${idx}`, onWikiLinkClick)}
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Ordered list (1., 2., etc.)
      if (/^\d+\.\s+/.test(trimmed)) {
        const items: string[] = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
          i++;
        }
        elements.push(
          <ol
            key={`ol-${i}`}
            className="list-decimal list-inside space-y-1 my-1 text-slate-200"
          >
            {items.map((item, idx) => (
              <li key={`ol-${i}-li-${idx}`} className="leading-relaxed">
                {renderInlineMarkdown(item, `ol-${i}-${idx}`, onWikiLinkClick)}
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // Headings (#, ##, ###)
      const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const headingText = headingMatch[2];
        if (level === 1) {
          elements.push(
            <h1 key={`h1-${i}`} className="text-sm font-bold text-white mt-1.5 mb-0.5">
              {renderInlineMarkdown(headingText, `h1-${i}`, onWikiLinkClick)}
            </h1>
          );
        } else if (level === 2) {
          elements.push(
            <h2 key={`h2-${i}`} className="text-xs font-bold text-emerald-300 mt-1 mb-0.5">
              {renderInlineMarkdown(headingText, `h2-${i}`, onWikiLinkClick)}
            </h2>
          );
        } else {
          elements.push(
            <h3 key={`h3-${i}`} className="text-xs font-semibold text-cyan-300 mt-1 mb-0.5">
              {renderInlineMarkdown(headingText, `h3-${i}`, onWikiLinkClick)}
            </h3>
          );
        }
        i++;
        continue;
      }

      // Blockquote (>)
      if (trimmed.startsWith(">")) {
        const quoteText = trimmed.replace(/^>\s*/, "");
        elements.push(
          <blockquote
            key={`quote-${i}`}
            className="border-l-2 border-emerald-500/50 pl-2.5 italic text-slate-300 my-1"
          >
            {renderInlineMarkdown(quoteText, `quote-${i}`, onWikiLinkClick)}
          </blockquote>
        );
        i++;
        continue;
      }

      // Standard paragraph
      elements.push(
        <p key={`p-${i}`} className="leading-relaxed">
          {renderInlineMarkdown(line, `p-${i}`, onWikiLinkClick)}
        </p>
      );
      i++;
    }

    return elements;
  }, [content, onWikiLinkClick]);

  return (
    <div
      data-testid={testId}
      className={`note-markdown-preview text-xs text-slate-300 space-y-1 leading-relaxed ${className}`}
    >
      {renderedBlocks}
    </div>
  );
};

interface NotesPageProps {
  notes: Note[];
  onAddNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onAskAbyaWithContext: (contextText: string) => void;
  onBack?: () => void;
  onFocusModeChange?: (isFocusMode: boolean) => void;
  currentUserId?: string;
  currentUserName?: string;
  currentUserEmail?: string;
}

export const NotesPage: React.FC<NotesPageProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onAskAbyaWithContext,
  onFocusModeChange,
  currentUserId,
  currentUserName,
  currentUserEmail,
}) => {
  const [activeViewMode, setActiveViewMode] = useState<
    "personal" | "archived" | "workspaces"
  >("personal");
  const [selectedWorkspace, setSelectedWorkspace] = useState<SharedWorkspace | null>(null);
  const [sharedWorkspaces, setSharedWorkspaces] = useState<SharedWorkspace[]>([]);
  const [isCreateWsOpen, setIsCreateWsOpen] = useState(false);
  const [isJoinWsOpen, setIsJoinWsOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    | "all"
    | "pinned"
    | "recent"
    | "archived"
    | "Recently Updated"
    | "Alphabetical"
    | "Created Date"
  >("all");
  const [sortBy, setSortBy] = useState<NoteSortOption>("updated");
  const [selectedLabelFilter, setSelectedLabelFilter] = useState<string>("all");
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>("all");
  const [customFolders, setCustomFolders] = useState<string[]>(DEFAULT_NOTE_FOLDERS);
  const [newFolderBarInput, setNewFolderBarInput] = useState("");
  const [isAddingFolderInBar, setIsAddingFolderInBar] = useState(false);

  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [showEditorPreview, setShowEditorPreview] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editorFontSize, setEditorFontSize] = useState<number>(13);
  const [editorRowCount, setEditorRowCount] = useState<number>(6);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [archived, setArchived] = useState(false);
  const [folder, setFolder] = useState<string>(DEFAULT_NOTE_FOLDER);
  const [customFolderInput, setCustomFolderInput] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [labelInput, setLabelInput] = useState("");
  const [selectedLabelColor, setSelectedLabelColor] = useState<string>("cyan");
  const [labelColorsMap, setLabelColorsMap] = useState<Record<string, string>>(() =>
    loadCustomLabelColors(currentUserId)
  );
  const [smartSuggestedTags, setSmartSuggestedTags] = useState<string[]>([]);
  const [isSmartTagging, setIsSmartTagging] = useState<boolean>(false);
  const [smartTagStatus, setSmartTagStatus] = useState<string | null>(null);
  const [editorExportStatus, setEditorExportStatus] = useState<
    "MD" | "TXT" | "PDF" | null
  >(null);
  const [reminderDate, setReminderDate] = useState<string>("");
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
  const [notePassword, setNotePassword] = useState<string>("");
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [sharedWith, setSharedWith] = useState<string[]>([]);
  const [shareEmailInput, setShareEmailInput] = useState<string>("");
  const [shareRole, setShareRole] = useState<"edit" | "view">("edit");
  const [sharedPermissions, setSharedPermissions] = useState<
    Record<string, "view" | "edit">
  >({});

  // SpeechRecognition dictation state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [dictationStatus, setDictationStatus] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Pinned note pending reminder notification tracking
  const [dismissedReminderIds, setDismissedReminderIds] = useState<Set<string>>(
    () => new Set()
  );
  const notifiedReminderIdsRef = useRef<Set<string>>(new Set());

  // Note Templates state (built-in + user-saved custom templates)
  const [templates, setTemplates] = useState<NoteTemplate[]>(() =>
    loadNoteTemplates(currentUserId)
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [customTemplateName, setCustomTemplateName] = useState<string>("");
  const [templateStatusMsg, setTemplateStatusMsg] = useState<string | null>(null);

  // Bidirectional note navigation state
  const [activeLinkedNoteId, setActiveLinkedNoteId] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editorSectionRef = useRef<HTMLDivElement | null>(null);

  // Real-time word count and character count updated as the user types in the note editor
  const editorWordCount = useMemo(() => calculateNoteWordCount(content), [content]);
  const editorCharCount = useMemo(
    () => calculateNoteCharacterCount(content),
    [content]
  );

  const userObj = {
    uid: auth.currentUser?.uid || currentUserId || "garia_student_user",
    displayName: auth.currentUser?.displayName || currentUserName || "Student User",
    email: auth.currentUser?.email || currentUserEmail || "student@garia.os",
  };

  // Subscribe to collaborative notes workspaces
  useEffect(() => {
    const unsubscribe = subscribeToUserWorkspaces(userObj.uid, (workspaces) => {
      const notesWorkspaces = workspaces.filter((w) => w.type === "notes");
      setSharedWorkspaces(notesWorkspaces);

      if (selectedWorkspace) {
        const updatedSelected = notesWorkspaces.find((w) => w.id === selectedWorkspace.id);
        if (updatedSelected) {
          setSelectedWorkspace(updatedSelected);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userObj.uid, selectedWorkspace?.id]);

  // Add one or more comma-separated color-coded tags/labels to the editor state
  const handleAddLabelFromInput = (rawValue?: string, explicitColor?: string) => {
    const target = (rawValue !== undefined ? rawValue : labelInput).trim();
    if (!target) return;

    const candidates = target
      .split(",")
      .map((part) => part.trim().replace(/^#/, ""))
      .filter(Boolean);

    if (candidates.length === 0) return;

    const chosenColor = explicitColor || selectedLabelColor || "cyan";

    setLabels((prev) => {
      const existingLower = new Set(prev.map((l) => l.toLowerCase()));
      const next = [...prev];
      for (const item of candidates) {
        if (!existingLower.has(item.toLowerCase())) {
          existingLower.add(item.toLowerCase());
          next.push(item);
        }
      }
      return next;
    });

    setLabelColorsMap((prev) => {
      let updated = { ...prev };
      for (const item of candidates) {
        updated = saveCustomLabelColor(item, chosenColor, currentUserId);
      }
      return updated;
    });

    if (rawValue === undefined) {
      setLabelInput("");
    }
  };

  const handleCycleLabelColor = (labelName: string) => {
    const currentKey = Object.keys(labelColorsMap).find(
      (k) => k.toLowerCase() === labelName.toLowerCase()
    );
    const currentColor = currentKey
      ? labelColorsMap[currentKey]
      : getDefaultColorForLabelName(labelName);
    const currentIdx = NOTE_LABEL_COLOR_PALETTE.findIndex(
      (opt) => opt.id === currentColor
    );
    const nextColor =
      NOTE_LABEL_COLOR_PALETTE[(currentIdx + 1) % NOTE_LABEL_COLOR_PALETTE.length].id;
    const updated = saveCustomLabelColor(labelName, nextColor, currentUserId);
    setLabelColorsMap(updated);
  };

  const getColorForLabel = (labelName: string, noteColors?: Record<string, string>): string => {
    if (noteColors) {
      const noteMatch = Object.keys(noteColors).find(
        (k) => k.toLowerCase() === labelName.toLowerCase()
      );
      if (noteMatch && noteColors[noteMatch]) return noteColors[noteMatch];
    }
    const globalMatch = Object.keys(labelColorsMap).find(
      (k) => k.toLowerCase() === labelName.toLowerCase()
    );
    if (globalMatch && labelColorsMap[globalMatch]) return labelColorsMap[globalMatch];
    return getDefaultColorForLabelName(labelName);
  };

  const handleToggleSuggestedLabel = (suggested: string) => {
    setLabels((prev) => {
      const exists = prev.some((l) => l.toLowerCase() === suggested.toLowerCase());
      if (exists) {
        return prev.filter((l) => l.toLowerCase() !== suggested.toLowerCase());
      }
      return [...prev, suggested];
    });
    setLabelColorsMap((prev) => {
      const existingKey = Object.keys(prev).find(
        (k) => k.toLowerCase() === suggested.toLowerCase()
      );
      const colorToUse = existingKey
        ? prev[existingKey]
        : getDefaultColorForLabelName(suggested);
      return saveCustomLabelColor(suggested, colorToUse, currentUserId);
    });
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    setLabels((prev) => prev.filter((l) => l !== labelToRemove));
  };

  const handleLabelInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddLabelFromInput();
    }
  };

  // Abya AI Auto-Tagging ('Smart Tag' button handler)
  const handleSmartTag = async () => {
    const immediateTags = suggestSmartTagsFromContent(content, title, []);
    setSmartSuggestedTags(immediateTags);

    // Immediately auto-apply suggested tags to the note's labels & assign palette colors
    setLabels((prev) => {
      const existingLower = new Set(prev.map((l) => l.toLowerCase()));
      const next = [...prev];
      for (const tag of immediateTags) {
        if (!existingLower.has(tag.toLowerCase())) {
          existingLower.add(tag.toLowerCase());
          next.push(tag);
        }
      }
      return next;
    });

    setLabelColorsMap((prev) => {
      let updated = { ...prev };
      for (const tag of immediateTags) {
        const defaultColor = getDefaultColorForLabelName(tag);
        updated = saveCustomLabelColor(tag, defaultColor, currentUserId);
      }
      return updated;
    });

    setSmartTagStatus(
      `Abya AI suggested ${immediateTags.length} relevant ${
        immediateTags.length === 1 ? "tag" : "tags"
      }: ${immediateTags.map((t) => `#${t}`).join(", ")}`
    );

    setIsSmartTagging(true);
    try {
      const result = await requestAbyaSmartTags(content, title, []);
      if (result.tags && result.tags.length > 0) {
        setSmartSuggestedTags(result.tags);
        setLabels((prev) => {
          const existingLower = new Set(prev.map((l) => l.toLowerCase()));
          const next = [...prev];
          for (const tag of result.tags) {
            if (!existingLower.has(tag.toLowerCase())) {
              existingLower.add(tag.toLowerCase());
              next.push(tag);
            }
          }
          return next;
        });
        setLabelColorsMap((prev) => {
          let updated = { ...prev };
          for (const tag of result.tags) {
            const defaultColor = getDefaultColorForLabelName(tag);
            updated = saveCustomLabelColor(tag, defaultColor, currentUserId);
          }
          return updated;
        });
        setSmartTagStatus(
          `Abya AI suggested ${result.tags.length} relevant ${
            result.tags.length === 1 ? "tag" : "tags"
          }: ${result.tags.map((t) => `#${t}`).join(", ")}`
        );
      }
    } finally {
      setIsSmartTagging(false);
    }
  };

  // Distraction-Free Focus Mode toggle & DOM synchronization for navigation sidebars/toolbars
  const handleToggleFocusMode = (nextState?: boolean) => {
    setIsFocusMode((prev) => {
      const target = nextState !== undefined ? nextState : !prev;
      onFocusModeChange?.(target);
      return target;
    });
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.setAttribute(
      "data-note-focus-mode",
      isFocusMode ? "true" : "false"
    );
    document.body.classList.toggle("note-focus-mode-active", isFocusMode);

    const externalNavElements = Array.from(
      document.querySelectorAll(
        'aside, nav, header, [role="navigation"], [role="toolbar"]'
      )
    ).filter(
      (el) => !editorSectionRef.current || !editorSectionRef.current.contains(el)
    ) as HTMLElement[];

    if (isFocusMode) {
      for (const el of externalNavElements) {
        if (!el.hasAttribute("data-prev-display")) {
          el.setAttribute("data-prev-display", el.style.display || "");
        }
        el.setAttribute("data-hidden-by-focus-mode", "true");
        el.hidden = true;
        el.style.display = "none";
      }
    } else {
      const hiddenEls = Array.from(
        document.querySelectorAll('[data-hidden-by-focus-mode="true"]')
      ) as HTMLElement[];
      for (const el of hiddenEls) {
        const prevDisplay = el.getAttribute("data-prev-display") || "";
        el.style.display = prevDisplay;
        el.hidden = false;
        el.removeAttribute("data-hidden-by-focus-mode");
        el.removeAttribute("data-prev-display");
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFocusMode) {
        handleToggleFocusMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFocusMode]);

  useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.body.removeAttribute("data-note-focus-mode");
        document.body.classList.remove("note-focus-mode-active");
        const hiddenEls = Array.from(
          document.querySelectorAll('[data-hidden-by-focus-mode="true"]')
        ) as HTMLElement[];
        for (const el of hiddenEls) {
          const prevDisplay = el.getAttribute("data-prev-display") || "";
          el.style.display = prevDisplay;
          el.hidden = false;
          el.removeAttribute("data-hidden-by-focus-mode");
          el.removeAttribute("data-prev-display");
        }
      }
      onFocusModeChange?.(false);
    };
  }, []);

  // Add one or more collaborator emails to the current note's sharedWith list
  const handleAddCollaboratorFromEditor = (rawValue?: string) => {
    const target = (rawValue !== undefined ? rawValue : shareEmailInput).trim();
    if (!target) return;
    const candidates = target
      .split(/[,;\s]+/)
      .map((part) => part.trim().toLowerCase())
      .filter((part) => part.includes("@") && part.length >= 3);
    if (candidates.length === 0) return;

    setSharedWith((prev) => normalizeNoteSharedWith([...prev, ...candidates]));
    setSharedPermissions((prev) => {
      const next = { ...prev };
      for (const email of candidates) {
        next[email] = shareRole;
      }
      return next;
    });
    if (rawValue === undefined) {
      setShareEmailInput("");
    }
  };

  const handleRemoveCollaboratorFromEditor = (emailToRemove: string) => {
    const target = emailToRemove.trim().toLowerCase();
    setSharedWith((prev) => prev.filter((e) => e.toLowerCase() !== target));
  };

  // Save a manual version snapshot in the Note Editor
  const handleSaveVersionSnapshotInEditor = () => {
    if (!content.trim() && !title.trim()) return;
    const snap = createNoteVersionSnapshot({
      title: title.trim() || "Untitled Note",
      content,
      timestamp: Date.now(),
    });
    const nextVersions = [
      snap,
      ...versions.filter((v) => v.content !== content),
    ].slice(0, 30);
    setVersions(nextVersions);
    if (editingNote) {
      onUpdateNote({
        ...editingNote,
        title: title.trim() || editingNote.title,
        content,
        versions: nextVersions,
        updatedAt: Date.now(),
      });
    }
  };

  // Restore a historical version snapshot inside the Note Editor
  const handleRestoreVersionInEditor = (ver: NoteVersion) => {
    let nextVersions = [...versions];
    if (content.trim() && content.trim() !== ver.content.trim()) {
      const currentSnap = createNoteVersionSnapshot({
        title: title.trim() || "Untitled Note",
        content,
        timestamp: Date.now(),
      });
      nextVersions = [currentSnap, ...nextVersions].slice(0, 30);
    }
    setContent(ver.content);
    if (!title.trim() && ver.title) {
      setTitle(ver.title);
    }
    setVersions(nextVersions);
    if (editingNote) {
      onUpdateNote({
        ...editingNote,
        title: title.trim() || ver.title || editingNote.title,
        content: ver.content,
        versions: nextVersions,
        updatedAt: Date.now(),
      });
    }
  };

  // Add a custom folder from the editor or folder bar
  const handleAddCustomFolder = (rawFolderName?: string) => {
    const candidate = (rawFolderName !== undefined ? rawFolderName : customFolderInput).trim();
    if (!candidate) return;

    setCustomFolders((prev) => {
      const exists = prev.some((f) => f.toLowerCase() === candidate.toLowerCase());
      return exists ? prev : [...prev, candidate];
    });
    setFolder(candidate);
    if (rawFolderName === undefined) {
      setCustomFolderInput("");
    }
  };

  const handleCreateFolderFromBar = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderBarInput.trim();
    if (!trimmed) return;
    handleAddCustomFolder(trimmed);
    setSelectedFolderFilter(trimmed);
    setNewFolderBarInput("");
    setIsAddingFolderInBar(false);
  };

  // Cleanup active SpeechRecognition instance on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore stop error on unmount
        }
      }
    };
  }, []);

  // Toggle voice dictation using browser SpeechRecognition API
  const handleToggleDictation = () => {
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore stop error
      }
      setIsListening(false);
      setDictationStatus("Dictation stopped.");
      return;
    }

    const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionCtor) {
      setDictationStatus("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      let lastProcessedEvent: any = null;
      const handleSpeechResult = (rawEvent: any) => {
        if (rawEvent && rawEvent === lastProcessedEvent) return;
        lastProcessedEvent = rawEvent;
        const event =
          rawEvent?.results !== undefined
            ? rawEvent
            : rawEvent?.detail !== undefined
            ? rawEvent.detail
            : rawEvent;
        const transcripts: string[] = [];
        if (typeof event === "string") {
          transcripts.push(event.trim());
        } else if (typeof event?.transcript === "string") {
          transcripts.push(event.transcript.trim());
        } else if (event?.results) {
          const results = event.results;
          const startIdx = typeof event.resultIndex === "number" ? event.resultIndex : 0;
          const len =
            typeof results.length === "number"
              ? results.length
              : Object.keys(results).length;
          for (let i = startIdx; i < len; i++) {
            const res = results[i];
            const candidate =
              typeof res === "string"
                ? res
                : typeof res?.transcript === "string"
                ? res.transcript
                : typeof res?.[0]?.transcript === "string"
                ? res[0].transcript
                : "";
            if (candidate && candidate.trim()) {
              transcripts.push(candidate.trim());
            }
          }
        }
        if (transcripts.length > 0) {
          const spoken = transcripts.join(" ");
          setContent((prev) => (prev.trim() ? `${prev.trim()} ${spoken}` : spoken));
          setDictationStatus(`Dictated: "${spoken}"`);
        }
      };

      recognition.onresult = handleSpeechResult;
      if (typeof recognition.addEventListener === "function") {
        try {
          recognition.addEventListener("result", handleSpeechResult);
        } catch {
          // ignore
        }
      }

      recognition.onerror = () => {
        setIsListening(false);
        setDictationStatus("Microphone dictation encountered an error.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      setIsListening(true);
      setDictationStatus("Listening... Speak into your microphone.");
      recognition.start();
    } catch {
      setIsListening(false);
      setDictationStatus("Unable to start microphone dictation.");
    }
  };

  const handleOpenAdd = () => {
    setEditingNote(null);
    setTitle("");
    setContent("");
    setPinned(false);
    setArchived(false);
    setFolder(
      selectedFolderFilter !== "all" ? selectedFolderFilter : DEFAULT_NOTE_FOLDER
    );
    setCustomFolderInput("");
    setLabels([]);
    setLabelInput("");
    setReminderDate("");
    setIsEncrypted(false);
    setNotePassword("");
    setVersions([]);
    setSharedWith([]);
    setShareEmailInput("");
    setSharedPermissions({});
    setDictationStatus(null);
    if (activeViewMode === "archived") {
      setActiveViewMode("personal");
      setSelectedFilter("all");
    }
    setIsEditorFocused(true);
    setTimeout(() => {
      editorSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      titleInputRef.current?.focus();
    }, 30);
  };

  const handleOpenEdit = (note: Note, decryptedPlaintext?: string) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(decryptedPlaintext !== undefined ? decryptedPlaintext : note.content);
    setPinned(Boolean(note.pinned));
    setArchived(Boolean(note.archived));
    setFolder(getNoteFolder(note));
    setCustomFolderInput("");
    setLabels(getNoteLabels(note));
    if (note.labelColors) {
      setLabelColorsMap((prev) => ({ ...prev, ...note.labelColors }));
    }
    setLabelInput("");
    setReminderDate(note.reminderDate || "");
    setIsEncrypted(isNoteEncrypted(note));
    setNotePassword("");
    setVersions(normalizeNoteVersions(note.versions));
    setSharedWith(normalizeNoteSharedWith(note.sharedWith));
    setShareEmailInput("");
    setSharedPermissions(note.sharedPermissions || {});
    setDictationStatus(null);
    setIsEditorFocused(true);
    setTimeout(() => {
      editorSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      contentTextareaRef.current?.focus();
    }, 30);
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setTitle("");
    setContent("");
    setPinned(false);
    setArchived(false);
    setFolder(DEFAULT_NOTE_FOLDER);
    setCustomFolderInput("");
    setLabels([]);
    setLabelInput("");
    setReminderDate("");
    setIsEncrypted(false);
    setNotePassword("");
    setVersions([]);
    setSharedWith([]);
    setShareEmailInput("");
    setSharedPermissions({});
    setDictationStatus(null);
    setIsEditorFocused(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Include any pending text in the label input automatically if the user didn't press Enter
    const pendingParts = labelInput
      .split(",")
      .map((part) => part.trim().replace(/^#/, ""))
      .filter(Boolean);
    const mergedLabels = [...labels];
    const seenLower = new Set(mergedLabels.map((l) => l.toLowerCase()));
    const nextLabelColorsMap = { ...labelColorsMap };
    for (const part of pendingParts) {
      if (!seenLower.has(part.toLowerCase())) {
        seenLower.add(part.toLowerCase());
        mergedLabels.push(part);
      }
      nextLabelColorsMap[part] = selectedLabelColor || getColorForLabel(part);
      saveCustomLabelColor(part, nextLabelColorsMap[part], currentUserId);
    }
    setLabelColorsMap(nextLabelColorsMap);

    const resolvedNoteLabelColors: Record<string, string> = {};
    const resolvedColorLabels: NoteColorLabel[] = mergedLabels.map((lbl) => {
      const c = getColorForLabel(lbl, nextLabelColorsMap);
      resolvedNoteLabelColors[lbl] = c;
      return {
        id: `lbl-${lbl.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name: lbl,
        color: c,
      };
    });

    // Resolve folder from either customFolderInput (if typed directly) or selected folder
    const resolvedFolder =
      customFolderInput.trim() || folder.trim() || DEFAULT_NOTE_FOLDER;

    setCustomFolders((prev) => {
      const exists = prev.some((f) => f.toLowerCase() === resolvedFolder.toLowerCase());
      return exists ? prev : [...prev, resolvedFolder];
    });

    // Client-side password encryption if password is provided
    const trimmedPassword = notePassword.trim();
    const shouldEncrypt = (isEncrypted || Boolean(trimmedPassword)) && Boolean(trimmedPassword);
    const rawContent = content.trim();
    const finalContent = shouldEncrypt
      ? encryptNoteContent(rawContent, trimmedPassword)
      : rawContent;
    const finalIsEncrypted = shouldEncrypt || finalContent.startsWith("ENCv1:");
    const cleanReminder = reminderDate.trim() ? reminderDate.trim() : undefined;

    // Include any pending collaborator email typed in shareEmailInput
    const pendingEmails = shareEmailInput
      .split(/[,;\s]+/)
      .map((part) => part.trim().toLowerCase())
      .filter((part) => part.includes("@") && part.length >= 3);
    const mergedSharedWith = normalizeNoteSharedWith([
      ...sharedWith,
      ...pendingEmails,
    ]);
    const nextSharedPermissions: Record<string, "view" | "edit"> = {
      ...sharedPermissions,
    };
    for (const email of pendingEmails) {
      nextSharedPermissions[email] = shareRole;
    }

    if (editingNote) {
      const updatedVersions = appendNoteVersionSnapshot(
        {
          ...editingNote,
          versions:
            versions.length > 0 ? versions : normalizeNoteVersions(editingNote.versions),
        },
        finalContent,
        title.trim()
      );
      onUpdateNote({
        ...editingNote,
        title: title.trim(),
        content: finalContent,
        pinned: Boolean(pinned),
        archived: Boolean(archived),
        folder: resolvedFolder,
        labels: mergedLabels,
        labelColors: resolvedNoteLabelColors,
        colorLabels: resolvedColorLabels,
        tags: mergedLabels,
        reminderDate: cleanReminder,
        isEncrypted: finalIsEncrypted,
        encryptedContent: finalIsEncrypted ? finalContent : undefined,
        versions: updatedVersions,
        sharedWith: mergedSharedWith,
        sharedPermissions: nextSharedPermissions,
        updatedAt: Date.now(),
      });
    } else {
      onAddNote({
        title: title.trim(),
        content: finalContent,
        pinned: Boolean(pinned),
        archived: Boolean(archived),
        folder: resolvedFolder,
        labels: mergedLabels,
        labelColors: resolvedNoteLabelColors,
        colorLabels: resolvedColorLabels,
        tags: mergedLabels,
        reminderDate: cleanReminder,
        isEncrypted: finalIsEncrypted,
        encryptedContent: finalIsEncrypted ? finalContent : undefined,
        versions: normalizeNoteVersions(versions),
        sharedWith: mergedSharedWith,
        sharedPermissions: nextSharedPermissions,
      });
    }

    setEditingNote(null);
    setTitle("");
    setContent("");
    setPinned(false);
    setArchived(false);
    setFolder(DEFAULT_NOTE_FOLDER);
    setCustomFolderInput("");
    setLabels([]);
    setLabelInput("");
    setReminderDate("");
    setIsEncrypted(false);
    setNotePassword("");
    setVersions([]);
    setSharedWith([]);
    setShareEmailInput("");
    setSharedPermissions({});
    setDictationStatus(null);
    setIsEditorFocused(false);
  };

  const handleRestoreNoteVersionFromCard = (
    note: Note,
    versionIdOrIndex: string | number
  ) => {
    const restored = restoreNoteFromVersion(note, versionIdOrIndex);
    onUpdateNote(restored);
    if (editingNote && editingNote.id === note.id) {
      setEditingNote(restored);
      setTitle(restored.title);
      setContent(restored.content);
      setVersions(normalizeNoteVersions(restored.versions));
    }
  };

  const handleUpdateNoteCollaborators = (
    note: Note,
    nextEmails: string[],
    nextPerms?: Record<string, "view" | "edit">
  ) => {
    const cleanEmails = normalizeNoteSharedWith(nextEmails);
    const updatedNote: Note = {
      ...note,
      sharedWith: cleanEmails,
      sharedPermissions: nextPerms || note.sharedPermissions || {},
      updatedAt: Date.now(),
    };
    onUpdateNote(updatedNote);
    if (editingNote && editingNote.id === note.id) {
      setSharedWith(cleanEmails);
      if (nextPerms) setSharedPermissions(nextPerms);
    }
  };

  const handleToggleNotePin = (note: Note) => {
    onUpdateNote({
      ...note,
      pinned: !Boolean(note.pinned),
      archived: Boolean(note.archived),
      folder: getNoteFolder(note),
      labels: getNoteLabels(note),
      tags: getNoteLabels(note),
      updatedAt: Date.now(),
    });
  };

  const handleToggleNoteArchive = (note: Note) => {
    const nextArchived = !Boolean(note.archived);
    onUpdateNote({
      ...note,
      archived: nextArchived,
      pinned: Boolean(note.pinned),
      folder: getNoteFolder(note),
      labels: getNoteLabels(note),
      tags: getNoteLabels(note),
      updatedAt: Date.now(),
    });
  };

  // Share a personal note into a collaborative notes workspace
  const handleShareNoteToWorkspace = async (note: Note, ws: SharedWorkspace) => {
    try {
      const existingContent = ws.noteContent || "";
      const newContent = `${existingContent ? existingContent + "\n\n---\n\n" : ""}# ${note.title}\n\n${note.content}`;
      const updated = await updateSharedNotesInWorkspace(
        ws,
        { noteContent: newContent },
        userObj
      );
      setSelectedWorkspace(updated);
      setActiveViewMode("workspaces");
    } catch (err) {
      console.error("Failed to share note to workspace:", err);
    }
  };

  // Normalize and sort all notes so pinned notes are at the top and ordered by sortBy
  const sortedNotes = useMemo(
    () => sortNotesForDisplay(notes, sortBy),
    [notes, sortBy]
  );

  // Compute bidirectional links (`[[Note Title]]` outgoing references and incoming backlinks)
  const bidirectionalLinksMap = useMemo(
    () => computeBidirectionalNoteLinks(sortedNotes),
    [sortedNotes]
  );

  // Apply a predefined or custom template to the Note Editor
  const handleApplyTemplate = (template: NoteTemplate) => {
    setSelectedTemplateId(template.id);
    setIsEditorFocused(true);
    if (!title.trim()) {
      setTitle(template.name);
    }
    setContent((prev) => {
      const trimmedPrev = prev.trim();
      if (!trimmedPrev) return template.content;
      const isDefaultMatch = templates.some((t) => t.content.trim() === trimmedPrev);
      if (isDefaultMatch) return template.content;
      return `${trimmedPrev}\n\n${template.content}`;
    });
    if (template.folder && (!folder || folder === DEFAULT_NOTE_FOLDER)) {
      setFolder(template.folder);
    }
    if (Array.isArray(template.labels) && template.labels.length > 0) {
      setLabels((prev) => Array.from(new Set([...prev, ...template.labels!])));
    }
    setTemplateStatusMsg(`Inserted template: "${template.name}"`);
  };

  // Save the current Note Editor structure as a reusable custom template
  const handleSaveCurrentAsTemplate = () => {
    const resolvedName =
      customTemplateName.trim() || title.trim() || "Custom Study Template";
    const resolvedContent =
      content.trim() || `# ${resolvedName}\n\n## Key Points\n- `;
    const updatedTemplates = saveCustomNoteTemplate(
      {
        name: resolvedName,
        content: resolvedContent,
        folder: folder || DEFAULT_NOTE_FOLDER,
        labels,
      },
      currentUserId
    );
    setTemplates(updatedTemplates);
    setCustomTemplateName("");
    setTemplateStatusMsg(`Saved template: "${resolvedName}"`);
  };

  const handleDeleteCustomTemplate = (tplId: string) => {
    const updated = deleteCustomNoteTemplate(tplId, currentUserId);
    setTemplates(updated);
    if (selectedTemplateId === tplId) {
      setSelectedTemplateId("");
    }
  };

  // Navigate to a referenced note when clicking a `[[Note Title]]` link or backlink
  const handleNavigateToWikiLink = (targetTitle: string) => {
    const targetNote = findNoteByTitle(sortedNotes, targetTitle);
    if (targetNote) {
      setActiveLinkedNoteId(targetNote.id);
      if (targetNote.archived) {
        setActiveViewMode("archived");
        setSelectedFilter("archived");
      } else {
        setActiveViewMode("personal");
        if (selectedFilter === "archived") {
          setSelectedFilter("all");
        }
      }
      setSelectedFolderFilter("all");
      setSelectedLabelFilter("all");
      setSearchQuery("");
      handleOpenEdit(targetNote);
      setTimeout(() => {
        const cardEl = document.querySelector(
          `[data-testid="note-card-${targetNote.id}"]`
        );
        cardEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 40);
    } else {
      // Pre-fill a new note with the linked title so the user can create it immediately
      handleOpenAdd();
      setTitle(targetTitle);
      setContent(`Linked from [[${title.trim() || "Previous Note"}]]\n\n`);
    }
  };

  // Insert a `[[Note Title]]` reference into the Note Editor content
  const handleInsertWikiLinkReference = (refTitle: string) => {
    if (!refTitle.trim()) return;
    const token = `[[${refTitle.trim()}]]`;
    setContent((prev) => (prev.trim() ? `${prev.trim()} ${token}` : token));
    setIsEditorFocused(true);
  };

  // Separate active (non-archived) notes from archived notes
  const allActiveNotes = useMemo(
    () => sortedNotes.filter((n) => !Boolean(n.archived)),
    [sortedNotes]
  );
  const allArchivedNotes = useMemo(
    () => sortedNotes.filter((n) => Boolean(n.archived)),
    [sortedNotes]
  );

  // Extract pinned notes that have a pending reminder
  const pendingPinnedReminders = useMemo(
    () => getPinnedNotesWithPendingReminders(allActiveNotes, dismissedReminderIds),
    [allActiveNotes, dismissedReminderIds]
  );

  // Trigger browser Notification API alert when a pinned note has a pending reminder
  useEffect(() => {
    for (const reminderNote of pendingPinnedReminders) {
      if (!notifiedReminderIdsRef.current.has(reminderNote.id)) {
        notifiedReminderIdsRef.current.add(reminderNote.id);
        triggerPinnedNoteReminderNotification(reminderNote);
      }
    }
  }, [pendingPinnedReminders]);

  const handleDismissReminderAlert = (noteId: string) => {
    setDismissedReminderIds((prev) => {
      const next = new Set(prev);
      next.add(noteId);
      return next;
    });
  };

  const handleClearNoteReminder = (note: Note) => {
    onUpdateNote({
      ...note,
      reminderDate: undefined,
      updatedAt: Date.now(),
    });
    handleDismissReminderAlert(note.id);
  };

  // Collect all distinct folders from defaults, custom folders, and existing notes
  const allAvailableFolders = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of customFolders) {
      if (f.trim()) map.set(f.trim().toLowerCase(), f.trim());
    }
    for (const note of sortedNotes) {
      const nf = getNoteFolder(note);
      if (nf && !map.has(nf.toLowerCase())) {
        map.set(nf.toLowerCase(), nf);
      }
    }
    if (folder.trim() && !map.has(folder.trim().toLowerCase())) {
      map.set(folder.trim().toLowerCase(), folder.trim());
    }
    return Array.from(map.values());
  }, [customFolders, sortedNotes, folder]);

  // Collect all distinct labels across notes, editor state, and saved/suggested color labels for the filter bar
  const allAvailableLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const note of sortedNotes) {
      for (const lbl of getNoteLabels(note)) {
        if (lbl && !map.has(lbl.toLowerCase())) {
          map.set(lbl.toLowerCase(), lbl);
        }
      }
    }
    for (const lbl of labels) {
      if (lbl && !map.has(lbl.toLowerCase())) {
        map.set(lbl.toLowerCase(), lbl);
      }
    }
    for (const savedKey of Object.keys(labelColorsMap)) {
      if (savedKey && !map.has(savedKey.toLowerCase())) {
        map.set(savedKey.toLowerCase(), savedKey);
      }
    }
    return Array.from(map.values());
  }, [sortedNotes, labels, labelColorsMap]);

  const isArchivedView =
    activeViewMode === "archived" || selectedFilter === "archived";

  // Filter active notes for the main notes list (strictly excludes archived notes)
  const filteredActiveNotes = useMemo(() => {
    return allActiveNotes.filter((n) => {
      if (!matchesNoteSearchQuery(n, searchQuery)) return false;

      if (
        selectedFolderFilter !== "all" &&
        getNoteFolder(n).toLowerCase() !== selectedFolderFilter.toLowerCase()
      ) {
        return false;
      }

      if (
        selectedLabelFilter !== "all" &&
        !getNoteLabels(n).some(
          (l) => l.toLowerCase() === selectedLabelFilter.toLowerCase()
        )
      ) {
        return false;
      }

      if (selectedFilter === "pinned") return Boolean(n.pinned);
      if (selectedFilter === "recent") return Date.now() - n.createdAt <= 86400000 * 7;
      return true;
    });
  }, [
    allActiveNotes,
    searchQuery,
    selectedFilter,
    selectedLabelFilter,
    selectedFolderFilter,
  ]);

  // Filter archived notes for the dedicated archived view
  const filteredArchivedNotes = useMemo(() => {
    return allArchivedNotes.filter((n) => {
      if (!matchesNoteSearchQuery(n, searchQuery)) return false;
      if (
        selectedFolderFilter !== "all" &&
        getNoteFolder(n).toLowerCase() !== selectedFolderFilter.toLowerCase()
      ) {
        return false;
      }
      if (
        selectedLabelFilter !== "all" &&
        !getNoteLabels(n).some(
          (l) => l.toLowerCase() === selectedLabelFilter.toLowerCase()
        )
      ) {
        return false;
      }
      return true;
    });
  }, [allArchivedNotes, searchQuery, selectedLabelFilter, selectedFolderFilter]);

  const pinnedNotes = useMemo(
    () => filteredActiveNotes.filter((n) => Boolean(n.pinned)),
    [filteredActiveNotes]
  );
  const unpinnedNotes = useMemo(
    () => filteredActiveNotes.filter((n) => !Boolean(n.pinned)),
    [filteredActiveNotes]
  );

  // Group unpinned active notes by folder for clean folder-based organization
  const groupedUnpinnedNotes = useMemo(
    () => groupNotesByFolder(unpinnedNotes),
    [unpinnedNotes]
  );

  // Count active notes per folder for the folder navigation bar
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const note of allActiveNotes) {
      const fName = getNoteFolder(note);
      counts[fName] = (counts[fName] || 0) + 1;
    }
    return counts;
  }, [allActiveNotes]);

  // Folders to display in the folder grouping bar (any folder with notes or user-created folders)
  const displayedFolderTabs = useMemo(() => {
    const set = new Set<string>(["General"]);
    for (const note of allActiveNotes) {
      set.add(getNoteFolder(note));
    }
    for (const cf of customFolders) {
      if (!DEFAULT_NOTE_FOLDERS.includes(cf) || folderCounts[cf]) {
        set.add(cf);
      }
    }
    if (selectedFolderFilter !== "all") {
      set.add(selectedFolderFilter);
    }
    return Array.from(set);
  }, [allActiveNotes, customFolders, folderCounts, selectedFolderFilter]);

  // If a specific shared workspace is actively open, render its dedicated collaborative view
  if (selectedWorkspace) {
    return (
      <SharedNotesWorkspaceView
        workspace={selectedWorkspace}
        currentUser={userObj}
        onBack={() => setSelectedWorkspace(null)}
        onWorkspaceUpdated={(updated) => {
          setSelectedWorkspace(updated);
          setSharedWorkspaces((prev) =>
            prev.map((w) => (w.id === updated.id ? updated : w))
          );
        }}
      />
    );
  }

  return (
    <div
      data-testid="notes-page-container"
      data-focus-mode={isFocusMode ? "true" : "false"}
      className={`space-y-6 pb-4 md:pb-0 animate-in fade-in duration-300 w-full ${
        isFocusMode ? "max-w-4xl mx-auto pt-2" : "max-w-6xl mx-auto"
      }`}
    >
      {/* Header (Hidden when Focus Mode is active for distraction-free writing) */}
      {!isFocusMode && (
        <div
          data-testid="notes-page-header"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
                Notes & Docs
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Organize study notes into folders, format with markdown, and pin key revision sheets.
              </p>
            </div>
          </div>

          {/* View Mode Toggle & Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-1 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center gap-1 shadow-inner">
              <button
                type="button"
                data-testid="view-active-notes-btn"
                onClick={() => {
                  setActiveViewMode("personal");
                  if (selectedFilter === "archived") {
                    setSelectedFilter("all");
                  }
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeViewMode === "personal" && selectedFilter !== "archived"
                    ? "bg-emerald-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Personal Notes ({allActiveNotes.length})
              </button>
              <button
                type="button"
                data-testid="view-archived-notes-btn"
                aria-label="Archive view"
                onClick={() => {
                  setActiveViewMode("archived");
                  setSelectedFilter("archived");
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isArchivedView
                    ? "bg-amber-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archive ({allArchivedNotes.length})</span>
              </button>
              <button
                type="button"
                data-testid="view-shared-workspaces-btn"
                onClick={() => setActiveViewMode("workspaces")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeViewMode === "workspaces"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Shared Docs ({sharedWorkspaces.length})</span>
              </button>
            </div>

            {activeViewMode !== "workspaces" ? (
              <button
                type="button"
                data-testid="new-note-btn"
                onClick={handleOpenAdd}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-bold text-xs sm:text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Note</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsJoinWsOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs transition-all cursor-pointer"
                >
                  <Link2 className="w-3.5 h-3.5 text-primary" />
                  <span>Join with Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateWsOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Shared Doc</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SHARED DOCS WORKSPACES TAB CONTENT */}
      {activeViewMode === "workspaces" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white font-heading">
                Shared Collaborative Docs
              </h2>
              <p className="text-xs text-slate-400">
                Live multi-user revision notes, cheat sheets, and study material.
              </p>
            </div>
          </div>

          {sharedWorkspaces.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center border border-white/10 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/20">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white font-heading">
                  No Shared Documents Yet
                </h3>
                <p className="text-slate-400 text-xs max-w-md mx-auto">
                  Create a collaborative document for group study, shared summaries, or formula compilation, or enter a join code from a classmate.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsJoinWsOpen(true)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 transition-colors cursor-pointer"
                >
                  Join with Code / Link
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateWsOpen(true)}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 shadow-sm cursor-pointer"
                >
                  Create Shared Document
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedWorkspaces.map((ws) => {
                const members = Object.values(ws.members || {}) as WorkspaceMember[];
                const isOwner = ws.ownerId === userObj.uid;

                return (
                  <div
                    key={ws.id}
                    onClick={() => setSelectedWorkspace(ws)}
                    className="glass-card p-5 rounded-3xl border border-white/10 hover:border-primary/50 transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                          {ws.joinCode}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            isOwner
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {isOwner ? "Owner" : "Collaborator"}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-white group-hover:text-primary transition-colors line-clamp-1">
                        {ws.title}
                      </h3>
                      {ws.description && (
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {ws.description}
                        </p>
                      )}

                      <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-2xl border border-white/5 line-clamp-3 font-mono">
                        {ws.noteContent
                          ? ws.noteContent.slice(0, 150)
                          : "Empty document... Tap to write collaboratively."}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          {members.length} collaborator{members.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2 overflow-hidden">
                          {members.slice(0, 3).map((m, idx) => (
                            <div
                              key={m.userId || idx}
                              className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 flex items-center justify-center text-[10px] text-white font-bold"
                              style={{ backgroundColor: m.avatarColor || "#3B82F6" }}
                              title={m?.name || "Member"}
                            >
                              {(m?.name || "U").slice(0, 1).toUpperCase()}
                            </div>
                          ))}
                          {members.length > 3 && (
                            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 bg-slate-800 flex items-center justify-center text-[10px] text-slate-300 font-bold">
                              +{members.length - 3}
                            </div>
                          )}
                        </div>

                        <span className="text-xs font-bold text-primary group-hover:underline">
                          Edit Document →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PERSONAL & ARCHIVED NOTES CONTENT */}
      {activeViewMode !== "workspaces" && (
        <>
          {/* Top Search Bar, Sort/Filter Dropdown, Folder Grouping Bar & Color-Coded Label Filter Bar (Hidden in Focus Mode) */}
          {!isFocusMode && (
            <div
              data-testid="notes-top-search-filter-bar"
              className="glass-card p-3.5 rounded-2xl border border-white/10 space-y-3"
            >
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="notes-search-bar"
                  type="text"
                  role="searchbox"
                  aria-label="Search notes by title or content"
                  data-testid="notes-search-input"
                  placeholder="Search notes by title or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-20 py-2.5 rounded-xl glass-pill text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-white/10"
                />
                {searchQuery && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <span
                      data-testid="notes-search-results-count"
                      className="text-[10px] font-mono text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30"
                    >
                      {isArchivedView
                        ? filteredArchivedNotes.length
                        : filteredActiveNotes.length}{" "}
                      found
                    </span>
                    <button
                      type="button"
                      data-testid="clear-notes-search-btn"
                      aria-label="Clear search"
                      onClick={() => setSearchQuery("")}
                      className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800/80 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  data-testid="notes-sort-select"
                  aria-label="Sort notes by"
                  value={sortBy}
                  onChange={(e) => {
                    const nextSort = normalizeNoteSortOption(e.target.value);
                    setSortBy(nextSort);
                  }}
                  className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl glass-pill text-xs font-bold text-cyan-300 border border-white/15 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-slate-900 shadow-sm cursor-pointer"
                >
                  <option value="updated" className="bg-slate-900 text-white">
                    Recently Updated
                  </option>
                  <option value="alphabetical" className="bg-slate-900 text-white">
                    Alphabetical
                  </option>
                  <option value="created" className="bg-slate-900 text-white">
                    Created Date
                  </option>
                </select>

                <select
                  data-testid="notes-filter-select"
                  aria-label="Filter notes"
                  value={isArchivedView ? "archived" : selectedFilter}
                  onChange={(e) => {
                    const rawVal = e.target.value;
                    if (
                      rawVal === "Recently Updated" ||
                      rawVal === "Alphabetical" ||
                      rawVal === "Created Date" ||
                      rawVal === "updated" ||
                      rawVal === "alphabetical" ||
                      rawVal === "created"
                    ) {
                      const nextSort = normalizeNoteSortOption(rawVal);
                      setSortBy(nextSort);
                      setSelectedFilter(
                        rawVal as
                          | "Recently Updated"
                          | "Alphabetical"
                          | "Created Date"
                      );
                      setActiveViewMode("personal");
                      return;
                    }
                    const nextVal = rawVal as
                      | "all"
                      | "pinned"
                      | "recent"
                      | "archived";
                    setSelectedFilter(nextVal);
                    if (nextVal === "archived") {
                      setActiveViewMode("archived");
                    } else {
                      setActiveViewMode("personal");
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl glass-pill text-xs font-bold text-emerald-300 border border-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 bg-slate-900 shadow-sm cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-white">
                    Active Notes ({allActiveNotes.length})
                  </option>
                  <option value="Recently Updated" className="bg-slate-900 text-white">
                    Recently Updated
                  </option>
                  <option value="Alphabetical" className="bg-slate-900 text-white">
                    Alphabetical
                  </option>
                  <option value="Created Date" className="bg-slate-900 text-white">
                    Created Date
                  </option>
                  <option value="pinned" className="bg-slate-900 text-white">
                    Pinned Notes Only ({allActiveNotes.filter((n) => Boolean(n.pinned)).length})
                  </option>
                  <option value="recent" className="bg-slate-900 text-white">
                    Recent Notes (Last 7 Days)
                  </option>
                  <option value="archived" className="bg-slate-900 text-white">
                    Archive ({allArchivedNotes.length})
                  </option>
                </select>
              </div>
            </div>

            {/* Folder-Based Grouping Bar */}
            <div
              data-testid="notes-folder-bar"
              className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-white/5"
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
                  <Folder className="w-3.5 h-3.5 text-amber-400" />
                  <span>Folders:</span>
                </span>
                <button
                  type="button"
                  data-testid="folder-tab-all"
                  onClick={() => setSelectedFolderFilter("all")}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    selectedFolderFilter === "all"
                      ? "bg-amber-500 text-slate-950 shadow-xs"
                      : "bg-slate-900/70 text-slate-300 hover:text-white border border-white/10"
                  }`}
                >
                  All Folders ({allActiveNotes.length})
                </button>
                {displayedFolderTabs.map((folderName) => {
                  const count = folderCounts[folderName] || 0;
                  const isSelected =
                    selectedFolderFilter.toLowerCase() === folderName.toLowerCase();
                  return (
                    <button
                      key={folderName}
                      type="button"
                      data-testid={`folder-tab-${folderName}`}
                      onClick={() =>
                        setSelectedFolderFilter((prev) =>
                          prev.toLowerCase() === folderName.toLowerCase()
                            ? "all"
                            : folderName
                        )
                      }
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                          : "bg-slate-900/70 text-slate-300 hover:text-white border border-white/10"
                      }`}
                    >
                      <Folder className="w-3 h-3" />
                      <span>{folderName}</span>
                      <span className="opacity-75">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Create Folder in Bar & Folder Dropdown */}
              <div className="flex items-center gap-2">
                <select
                  data-testid="notes-folder-filter-select"
                  aria-label="Filter notes by folder"
                  value={selectedFolderFilter}
                  onChange={(e) => setSelectedFolderFilter(e.target.value)}
                  className="classic-select px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer"
                >
                  <option value="all">Folder: All Folders ({allActiveNotes.length})</option>
                  {displayedFolderTabs.map((fName) => (
                    <option key={fName} value={fName}>
                      Folder: {fName} ({folderCounts[fName] || 0})
                    </option>
                  ))}
                </select>

                {isAddingFolderInBar ? (
                <form
                  onSubmit={handleCreateFolderFromBar}
                  className="flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    data-testid="new-folder-bar-input"
                    placeholder="New folder name..."
                    value={newFolderBarInput}
                    onChange={(e) => setNewFolderBarInput(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-amber-500/40 text-xs text-white focus:outline-none w-36"
                    autoFocus
                  />
                  <button
                    type="submit"
                    data-testid="confirm-new-folder-bar-btn"
                    className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-bold cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingFolderInBar(false);
                      setNewFolderBarInput("");
                    }}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                  <button
                    type="button"
                    data-testid="open-new-folder-bar-btn"
                    onClick={() => setIsAddingFolderInBar(true)}
                    className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <FolderPlus className="w-3 h-3" />
                    <span>+ New Folder</span>
                  </button>
                )}
              </div>
            </div>

            {/* Color-Coded Label Filter Bar (Toggle note visibility by label) */}
            <div
              data-testid="notes-label-filter-bar"
              className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-white/5"
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
                  <Tag className="w-3 h-3 text-cyan-400" />
                  <span>Filter by label:</span>
                </span>
                <button
                  type="button"
                  data-testid="filter-label-btn-all"
                  aria-pressed={selectedLabelFilter === "all"}
                  onClick={() => setSelectedLabelFilter("all")}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    selectedLabelFilter === "all"
                      ? "bg-cyan-500 text-slate-950 font-bold"
                      : "bg-slate-900/70 text-slate-400 hover:text-white border border-white/10"
                  }`}
                >
                  All Labels
                </button>
                {allAvailableLabels.map((lbl) => {
                  const colorOpt = resolveLabelColorOption(getColorForLabel(lbl));
                  const isSelected =
                    selectedLabelFilter.toLowerCase() === lbl.toLowerCase();
                  return (
                    <button
                      key={lbl}
                      type="button"
                      data-testid={`filter-label-btn-${lbl}`}
                      data-label-color={colorOpt.id}
                      aria-pressed={isSelected}
                      onClick={() =>
                        setSelectedLabelFilter((prev) =>
                          prev.toLowerCase() === lbl.toLowerCase() ? "all" : lbl
                        )
                      }
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? `${colorOpt.bgClass} ${colorOpt.textClass} ${colorOpt.borderClass} ring-1 ring-white/40 font-bold`
                          : "bg-slate-900/70 text-slate-300 hover:text-white border-white/10"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${colorOpt.dotClass}`}
                        style={{ backgroundColor: colorOpt.hex }}
                      />
                      <span>#{lbl}</span>
                    </button>
                  );
                })}
              </div>

              <select
                data-testid="notes-label-filter-select"
                aria-label="Filter notes by label"
                value={selectedLabelFilter}
                onChange={(e) => setSelectedLabelFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/15 text-[11px] text-cyan-300 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">All Labels ({allAvailableLabels.length})</option>
                {allAvailableLabels.map((lbl) => (
                  <option key={lbl} value={lbl}>
                    #{lbl}
                  </option>
                ))}
              </select>
            </div>
          </div>
          )}

          {/* Pinned Note Pending Reminder Notification Banner (Hidden in Focus Mode) */}
          {!isFocusMode && pendingPinnedReminders.length > 0 && (
            <div
              role="alert"
              aria-live="polite"
              data-testid="pinned-note-reminder-notifications"
              className="glass-card rounded-3xl p-4 sm:p-5 border border-amber-500/40 bg-amber-500/[0.06] space-y-3 shadow-lg shadow-amber-500/5"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                    <BellRing className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold font-heading text-amber-200 flex items-center gap-2">
                      <span>Pinned Note Reminder Alert</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold">
                        {pendingPinnedReminders.length} Pending
                      </span>
                    </h2>
                    <p className="text-[11px] text-amber-300/80">
                      You have pinned notes with active pending reminders scheduled for review.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {pendingPinnedReminders.map((reminderNote) => {
                  const isDue = isNoteReminderDue(reminderNote.reminderDate);
                  return (
                    <div
                      key={reminderNote.id}
                      data-testid={`pinned-reminder-alert-${reminderNote.id}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-slate-950/70 border border-amber-500/25"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                        <Bell className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-xs font-bold text-white truncate">
                          {reminderNote.title}
                        </span>
                        <span
                          data-testid={`pinned-reminder-date-${reminderNote.id}`}
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                            isDue
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                              : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          }`}
                        >
                          {isDue ? "Due / Pending: " : "Reminder: "}
                          {reminderNote.reminderDate}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          data-testid={`open-reminder-note-btn-${reminderNote.id}`}
                          onClick={() => handleOpenEdit(reminderNote)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white text-[11px] font-semibold cursor-pointer"
                        >
                          Review Note
                        </button>
                        <button
                          type="button"
                          data-testid={`clear-note-reminder-btn-${reminderNote.id}`}
                          onClick={() => handleClearNoteReminder(reminderNote)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold cursor-pointer"
                        >
                          Mark Done
                        </button>
                        <button
                          type="button"
                          data-testid={`dismiss-note-reminder-btn-${reminderNote.id}`}
                          aria-label={`Dismiss reminder for ${reminderNote.title}`}
                          onClick={() => handleDismissReminderAlert(reminderNote.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                          title="Dismiss alert"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Note Editor Panel (Always accessible in main view, when editing a note, or in Focus Mode) */}
          {(!isArchivedView || editingNote || isFocusMode) && (
            <div
              ref={editorSectionRef}
              data-testid="note-editor"
              data-focus-mode={isFocusMode ? "true" : "false"}
              className={`glass-card rounded-3xl p-5 sm:p-6 border transition-all ${
                isFocusMode
                  ? "border-amber-500/45 shadow-2xl shadow-amber-500/10 ring-1 ring-amber-500/30 min-h-[75vh]"
                  : editingNote || isEditorFocused
                  ? "border-emerald-500/40 shadow-lg shadow-emerald-500/5"
                  : "border-white/10"
              }`}
            >
              {isFocusMode && (
                <div
                  data-testid="focus-mode-active-banner"
                  className="mb-4 px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 text-xs text-amber-200"
                >
                  <div className="flex items-center gap-2">
                    <Maximize2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-semibold">
                      Distraction-Free Focus Mode Active — UI toolbars and navigation sidebar hidden
                    </span>
                  </div>
                  <button
                    type="button"
                    data-testid="exit-focus-mode-banner-btn"
                    onClick={() => handleToggleFocusMode(false)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[11px] font-bold cursor-pointer shrink-0"
                  >
                    Exit Focus Mode
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <AlignLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold font-heading text-white">
                      {editingNote ? "Edit Note" : "Note Editor"}
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Supports Markdown (**bold**, *italics*, - lists), custom folders, and tags.
                    </p>
                  </div>
                </div>

                {/* Focus Mode Button, Real-Time Word Count Display & Markdown Preview Toggle */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    data-testid="note-focus-mode-btn"
                    aria-pressed={isFocusMode}
                    onClick={() => handleToggleFocusMode()}
                    title={
                      isFocusMode
                        ? "Exit Focus Mode and restore toolbars and navigation sidebar"
                        : "Enter distraction-free Focus Mode (hides UI toolbars and navigation sidebar)"
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isFocusMode
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/45 shadow-xs"
                        : "bg-slate-900/80 text-slate-300 hover:text-white border-white/15 hover:border-emerald-500/40"
                    }`}
                  >
                    {isFocusMode ? (
                      <>
                        <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Exit Focus Mode</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Focus Mode</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    data-testid="toggle-editor-markdown-preview-btn"
                    onClick={() => setShowEditorPreview((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      showEditorPreview
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : "bg-slate-900/80 text-slate-400 hover:text-white border-white/10"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{showEditorPreview ? "Hide Preview" : "Markdown Preview"}</span>
                  </button>

                  <div
                    data-testid="note-editor-word-count"
                    aria-live="polite"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-mono font-bold tabular-nums"
                  >
                    <span>
                      Word Count: {editorWordCount} {editorWordCount === 1 ? "word" : "words"}
                    </span>
                  </div>
                  <span
                    data-testid="note-editor-char-count"
                    aria-live="polite"
                    className="inline-flex items-center px-2.5 py-1 rounded-xl bg-slate-900/80 border border-white/10 text-slate-300 text-[11px] font-mono font-semibold tabular-nums"
                  >
                    {editorCharCount} {editorCharCount === 1 ? "character" : "characters"}
                  </span>
                  {(editingNote || title || content || labels.length > 0) && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="p-1.5 rounded-xl glass-pill text-slate-400 hover:text-white cursor-pointer"
                      title="Clear Editor"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
                {/* Note Template System: Quick-Insert Predefined Structures & Save Custom Template (Hidden in Focus Mode) */}
                {!isFocusMode && (
                <div
                  data-testid="note-templates-section"
                  className="p-3.5 rounded-2xl bg-slate-900/70 border border-white/10 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Note Templates (Quick Insert or Save Structure)</span>
                    </span>

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        data-testid="note-template-select"
                        aria-label="Select Note Template"
                        value={selectedTemplateId}
                        onChange={(e) => {
                          const tpl = templates.find((t) => t.id === e.target.value);
                          if (tpl) {
                            handleApplyTemplate(tpl);
                          } else {
                            setSelectedTemplateId("");
                          }
                        }}
                        className="px-3 py-1 rounded-xl bg-slate-950 border border-white/15 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                      >
                        <option value="">Insert Template...</option>
                        {templates.map((tpl) => (
                          <option key={tpl.id} value={tpl.id}>
                            {tpl.name} {tpl.isCustom ? "(Custom)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Quick-Insert Template Buttons (Lecture Summary, Brainstorming, Meeting Notes, + Custom) */}
                  <div
                    data-testid="note-templates-bar"
                    className="flex items-center gap-1.5 flex-wrap"
                  >
                    {templates.map((tpl) => (
                      <div key={tpl.id} className="inline-flex items-center gap-0.5">
                        <button
                          type="button"
                          data-testid={`insert-template-btn-${tpl.id}`}
                          data-template-name={tpl.name}
                          onClick={() => handleApplyTemplate(tpl)}
                          title={tpl.description || `Insert ${tpl.name} template`}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                            selectedTemplateId === tpl.id
                              ? "bg-emerald-500/25 text-emerald-200 border-emerald-500/50"
                              : "bg-slate-950/80 text-slate-300 hover:text-white border-white/10 hover:border-emerald-500/30"
                          }`}
                        >
                          + {tpl.name}
                        </button>
                        {tpl.isCustom && (
                          <button
                            type="button"
                            data-testid={`delete-template-btn-${tpl.id}`}
                            aria-label={`Delete template ${tpl.name}`}
                            onClick={() => handleDeleteCustomTemplate(tpl.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                            title="Delete custom template"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Save Current Note Structure as a Custom Template */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1.5 border-t border-white/5">
                    <input
                      type="text"
                      data-testid="custom-template-name-input"
                      aria-label="Custom Template Name"
                      placeholder="Save current structure as template (e.g., Lab Report, Case Study)..."
                      value={customTemplateName}
                      onFocus={() => setIsEditorFocused(true)}
                      onChange={(e) => setCustomTemplateName(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                    <button
                      type="button"
                      data-testid="save-as-template-btn"
                      onClick={handleSaveCurrentAsTemplate}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold cursor-pointer shrink-0"
                    >
                      Save as Template
                    </button>
                  </div>

                  {templateStatusMsg && (
                    <div
                      data-testid="template-status-message"
                      aria-live="polite"
                      className="text-[11px] text-emerald-300 flex items-center justify-between"
                    >
                      <span>✓ {templateStatusMsg}</span>
                      <button
                        type="button"
                        onClick={() => setTemplateStatusMsg(null)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label
                      htmlFor="note-editor-title"
                      className="block text-slate-300 font-medium mb-1"
                    >
                      Title *
                    </label>
                    <input
                      id="note-editor-title"
                      ref={titleInputRef}
                      data-testid="note-title-input"
                      type="text"
                      required
                      placeholder="Note Title (e.g., Chapter 4 Ratio Analysis Formulas)"
                      value={title}
                      onFocus={() => setIsEditorFocused(true)}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>

                  {/* Folder Selection & Custom Folder Creation */}
                  <div>
                    <label
                      htmlFor="note-editor-folder-select"
                      className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5"
                    >
                      <Folder className="w-3.5 h-3.5 text-amber-400" />
                      <span>Folder</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <select
                        id="note-editor-folder-select"
                        data-testid="note-folder-select"
                        aria-label="Note Folder"
                        value={folder}
                        onChange={(e) => {
                          setFolder(e.target.value);
                          setCustomFolderInput("");
                        }}
                        className="w-full px-3 py-2.5 rounded-2xl glass-pill text-xs font-bold text-amber-300 border border-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-slate-900"
                      >
                        {allAvailableFolders.map((fName) => (
                          <option
                            key={fName}
                            value={fName}
                            className="bg-slate-900 text-white"
                          >
                            📁 {fName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Custom Folder Quick Input */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <FolderPlus className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <input
                      id="note-editor-folder-input"
                      data-testid="note-folder-input"
                      type="text"
                      aria-label="Custom Folder"
                      placeholder="Or type a custom folder name (e.g., Physics, Organic Chemistry)..."
                      value={customFolderInput}
                      onFocus={() => setIsEditorFocused(true)}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomFolderInput(val);
                        if (val.trim()) {
                          setFolder(val.trim());
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomFolder();
                        }
                      }}
                      className="w-full px-3.5 py-2 rounded-xl glass-pill text-xs text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                  <button
                    type="button"
                    data-testid="add-note-folder-btn"
                    onClick={() => handleAddCustomFolder()}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Set Folder</span>
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                    <label
                      htmlFor="note-editor-content"
                      className="block text-slate-300 font-medium"
                    >
                      Content (Markdown Supported)
                    </label>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="hidden sm:inline text-[11px] text-slate-400 font-mono">
                        **bold** • *italic* • [[Note Title]]
                      </span>

                      {/* Quick Insert Bidirectional [[Note Title]] Reference */}
                      {sortedNotes.length > 0 && (
                        <select
                          data-testid="insert-wiki-link-select"
                          aria-label="Insert bidirectional link to another note"
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleInsertWikiLinkReference(e.target.value);
                              e.target.value = "";
                            }
                          }}
                          className="px-2.5 py-1 rounded-xl bg-slate-900 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300 focus:outline-none cursor-pointer"
                        >
                          <option value="">+ Link [[Note]]...</option>
                          {sortedNotes
                            .filter((n) => !editingNote || n.id !== editingNote.id)
                            .map((n) => (
                              <option key={n.id} value={n.title}>
                                [[{n.title}]]
                              </option>
                            ))}
                        </select>
                      )}

                      {/* Microphone Web Speech API Dictation Button */}
                      <button
                        type="button"
                        data-testid="note-mic-btn"
                        aria-pressed={isListening}
                        aria-label={isListening ? "Stop Dictation" : "Dictate"}
                        title={
                          isListening
                            ? "Stop voice dictation"
                            : "Dictate note directly into content field using microphone"
                        }
                        onClick={handleToggleDictation}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isListening
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                            : "bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border-cyan-500/30"
                        }`}
                      >
                        {isListening ? (
                          <>
                            <MicOff className="w-3.5 h-3.5 text-rose-400" />
                            <span>Stop Dictation</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Dictate</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {dictationStatus && (
                    <div
                      data-testid="note-dictation-status"
                      aria-live="polite"
                      className="mb-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/25 text-[11px] text-cyan-300 flex items-center justify-between gap-2"
                    >
                      <span>🎤 {dictationStatus}</span>
                      <button
                        type="button"
                        onClick={() => setDictationStatus(null)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <motion.div
                    layout
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    data-testid="note-editor-mode-transition"
                    data-editor-mode={showEditorPreview ? "preview" : "edit"}
                    className="space-y-2"
                  >
                    <textarea
                      id="note-editor-content"
                      ref={contentTextareaRef}
                      data-testid="note-content-textarea"
                      rows={isFocusMode ? 12 : editorRowCount}
                      style={{ fontSize: `${editorFontSize}px` }}
                      placeholder="Write or dictate your study notes, formulas, or markdown summary here (e.g., **Key Formula**, *Note*, - Bullet item)..."
                      value={content}
                      onFocus={() => setIsEditorFocused(true)}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono text-xs leading-relaxed"
                    />

                    {/* Classic Editor Typography & Height Sliders */}
                    <div className="flex flex-wrap items-center justify-between gap-4 px-3 py-2 rounded-xl bg-slate-950/60 border border-amber-500/20 text-[11px]">
                      <div className="flex items-center gap-2.5 flex-1 min-w-[180px]">
                        <label
                          htmlFor="note-editor-font-size-slider"
                          className="text-slate-300 font-semibold whitespace-nowrap"
                        >
                          Editor Font Size:
                        </label>
                        <input
                          id="note-editor-font-size-slider"
                          data-testid="note-editor-font-size-slider"
                          type="range"
                          min={11}
                          max={20}
                          step={1}
                          value={editorFontSize}
                          onChange={(e) => setEditorFontSize(Number(e.target.value))}
                          className="classic-slider flex-1"
                        />
                        <span className="font-mono font-bold text-amber-300 min-w-[2.5rem] text-right">
                          {editorFontSize}px
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 flex-1 min-w-[180px]">
                        <label
                          htmlFor="note-editor-rows-slider"
                          className="text-slate-300 font-semibold whitespace-nowrap"
                        >
                          Editor Height:
                        </label>
                        <input
                          id="note-editor-rows-slider"
                          data-testid="note-editor-rows-slider"
                          type="range"
                          min={4}
                          max={16}
                          step={1}
                          value={editorRowCount}
                          onChange={(e) => setEditorRowCount(Number(e.target.value))}
                          className="classic-slider flex-1"
                        />
                        <span className="font-mono font-bold text-amber-300 min-w-[3.5rem] text-right">
                          {editorRowCount} rows
                        </span>
                      </div>
                    </div>

                    {/* Small Status Indicator for Word & Character Count (Assignment Length Tracker) */}
                    <div
                      data-testid="note-editor-status-indicator"
                      role="status"
                      aria-live="polite"
                      className="mt-1.5 flex items-center justify-between gap-2 px-3 py-1 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] font-mono text-slate-300 tabular-nums"
                    >
                      <span className="text-slate-400">Note Length Status:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-300 font-semibold">
                          {editorWordCount} {editorWordCount === 1 ? "word" : "words"}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-cyan-300 font-semibold">
                          {editorCharCount} {editorCharCount === 1 ? "character" : "characters"}
                        </span>
                      </div>
                    </div>

                    {/* Framer Motion Animated Transition between Editing and Markdown Preview Modes */}
                    <AnimatePresence initial={false} mode="wait">
                      {showEditorPreview && (
                        <motion.div
                          key="note-editor-markdown-preview"
                          initial={{ opacity: 0, y: 8, scale: 0.99 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.99 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          data-testid="note-editor-markdown-preview"
                          data-framer-motion="preview-transition"
                          className="mt-2.5 p-4 rounded-2xl bg-slate-950/70 border border-cyan-500/25 space-y-1.5"
                        >
                          <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-1">
                            Markdown Live Preview
                          </div>
                          {content.trim() ? (
                            <NoteMarkdownPreview
                              content={content}
                              onWikiLinkClick={handleNavigateToWikiLink}
                            />
                          ) : (
                            <p className="text-xs text-slate-500 italic">
                              Start typing markdown above to preview formatted output...
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>

                {/* Color-Coded Labels / Tags Categorization Section */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label
                      htmlFor="note-editor-label-input"
                      className="block text-slate-300 font-medium flex items-center gap-1.5"
                    >
                      <Tag className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Color-Coded Tags & Labels</span>
                    </label>

                    {/* Color Swatch Picker & Dropdown for New Labels */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-400">Label color:</span>
                      {NOTE_LABEL_COLOR_PALETTE.map((colorOpt) => {
                        const isSelected = selectedLabelColor === colorOpt.id;
                        return (
                          <button
                            key={colorOpt.id}
                            type="button"
                            data-testid={`label-color-swatch-${colorOpt.id}`}
                            aria-label={`Select ${colorOpt.label} label color`}
                            title={`Color: ${colorOpt.label}`}
                            onClick={() => setSelectedLabelColor(colorOpt.id)}
                            className={`w-5 h-5 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                              isSelected
                                ? "ring-2 ring-white scale-110"
                                : "opacity-75 hover:opacity-100"
                            }`}
                            style={{ backgroundColor: colorOpt.hex }}
                          />
                        );
                      })}
                      <select
                        data-testid="note-label-color-select"
                        aria-label="Label Color"
                        value={selectedLabelColor}
                        onChange={(e) => setSelectedLabelColor(e.target.value)}
                        className="px-2 py-1 rounded-lg bg-slate-900 border border-white/15 text-[11px] text-slate-200 focus:outline-none cursor-pointer"
                      >
                        {NOTE_LABEL_COLOR_PALETTE.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <input
                      id="note-editor-label-input"
                      data-testid="note-label-input"
                      type="text"
                      placeholder="Add color-coded tag or label (e.g., Formula, Chapter 4) and press Enter..."
                      value={labelInput}
                      onFocus={() => setIsEditorFocused(true)}
                      onChange={(e) => setLabelInput(e.target.value)}
                      onKeyDown={handleLabelInputKeyDown}
                      className="flex-1 min-w-0 px-3.5 py-2 rounded-xl glass-pill text-xs text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                    <button
                      type="button"
                      data-testid="add-note-label-btn"
                      onClick={() => handleAddLabelFromInput()}
                      className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Label</span>
                    </button>
                    <button
                      type="button"
                      data-testid="smart-tag-btn"
                      onClick={handleSmartTag}
                      disabled={isSmartTagging}
                      title="Use Abya AI to automatically suggest and apply relevant tags based on note content"
                      className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Smart Tag</span>
                    </button>
                  </div>

                  {/* Abya AI Smart Tag Suggestions Bar */}
                  {(smartSuggestedTags.length > 0 || smartTagStatus) && (
                    <div
                      data-testid="smart-tag-suggestions"
                      className="p-2.5 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/25 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span
                          data-testid="smart-tag-status"
                          className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>
                            {smartTagStatus ||
                              "Abya AI Suggested Tags (click to toggle):"}
                          </span>
                        </span>
                        <button
                          type="button"
                          data-testid="dismiss-smart-tags-btn"
                          onClick={() => {
                            setSmartSuggestedTags([]);
                            setSmartTagStatus(null);
                          }}
                          className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                      {smartSuggestedTags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {smartSuggestedTags.map((suggestedTag) => {
                            const isApplied = labels.some(
                              (l) =>
                                l.toLowerCase() === suggestedTag.toLowerCase()
                            );
                            const colorOpt = resolveLabelColorOption(
                              getColorForLabel(suggestedTag)
                            );
                            return (
                              <button
                                key={suggestedTag}
                                type="button"
                                data-testid={`smart-tag-suggestion-${suggestedTag}`}
                                aria-pressed={isApplied}
                                onClick={() =>
                                  handleToggleSuggestedLabel(suggestedTag)
                                }
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                                  isApplied
                                    ? `${colorOpt.bgClass} ${colorOpt.textClass} ${colorOpt.borderClass}`
                                    : "bg-slate-900/80 text-slate-300 border-white/10 hover:text-white"
                                }`}
                              >
                                <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                                <span>#{suggestedTag}</span>
                                <span>{isApplied ? "✓" : "+"}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick Suggested Color-Coded Labels */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-400 mr-1">Quick labels:</span>
                    {SUGGESTED_NOTE_LABELS.map((suggested) => {
                      const isSelected = labels.some(
                        (l) => l.toLowerCase() === suggested.toLowerCase()
                      );
                      const colorOpt = resolveLabelColorOption(
                        getColorForLabel(suggested)
                      );
                      return (
                        <button
                          key={suggested}
                          type="button"
                          data-testid={`suggested-label-${suggested.toLowerCase().replace(/\s+/g, "-")}`}
                          data-label-color={colorOpt.id}
                          onClick={() => handleToggleSuggestedLabel(suggested)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                            isSelected
                              ? `${colorOpt.bgClass} ${colorOpt.textClass} ${colorOpt.borderClass}`
                              : "bg-slate-900/70 text-slate-400 border-white/10 hover:text-slate-200"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${colorOpt.dotClass}`}
                          />
                          <span>#{suggested}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Color-Coded Labels Added to Note (Framer Motion Entrance Animations) */}
                  {labels.length > 0 && (
                    <motion.div
                      layout
                      data-testid="note-editor-labels-list"
                      className="flex items-center gap-1.5 flex-wrap pt-1"
                    >
                      <AnimatePresence initial={false}>
                        {labels.map((label) => {
                          const colorOpt = resolveLabelColorOption(
                            getColorForLabel(label)
                          );
                          return (
                            <motion.span
                              key={label}
                              layout
                              initial={{ opacity: 0, scale: 0.85, y: 4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8, y: -4 }}
                              transition={{ duration: 0.18, ease: "easeOut" }}
                              data-testid={`editor-label-chip-${label}`}
                              data-label-color={colorOpt.id}
                              data-framer-motion="label-entrance"
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl ${colorOpt.bgClass} ${colorOpt.textClass} border ${colorOpt.borderClass} text-xs font-semibold`}
                            >
                              <button
                                type="button"
                                data-testid={`cycle-label-color-${label}`}
                                title={`Change color for ${label} (current: ${colorOpt.label})`}
                                onClick={() => handleCycleLabelColor(label)}
                                className={`w-2.5 h-2.5 rounded-full ${colorOpt.dotClass} ring-1 ring-white/40 cursor-pointer shrink-0`}
                              />
                              <span>{label}</span>
                              <button
                                type="button"
                                data-testid={`remove-note-label-${label}`}
                                aria-label={`Remove tag ${label}`}
                                onClick={() => handleRemoveLabel(label)}
                                className="p-0.5 rounded-full hover:bg-white/15 transition-colors cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </motion.span>
                          );
                        })}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </div>

                {/* Peer Collaboration (sharedWith Emails) & Version History (versions Snapshots) Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                  {/* Share Note with Peers by Email (sharedWith) */}
                  <div
                    data-testid="note-editor-collaboration-section"
                    className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2.5"
                  >
                    <label
                      htmlFor="note-share-email-input"
                      className="block text-slate-300 font-medium text-xs flex items-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Collaborate — Share Note with Peers (Email)</span>
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                      <input
                        id="note-share-email-input"
                        data-testid="note-share-email-input"
                        type="email"
                        aria-label="Invite peer by email"
                        placeholder="Invite peer email (e.g., peer@school.edu)..."
                        value={shareEmailInput}
                        onFocus={() => setIsEditorFocused(true)}
                        onChange={(e) => setShareEmailInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            handleAddCollaboratorFromEditor();
                          }
                        }}
                        className="flex-1 min-w-0 px-3 py-1.5 rounded-xl glass-pill text-xs text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      />
                      <select
                        data-testid="note-share-role-select"
                        aria-label="Collaborator permission"
                        value={shareRole}
                        onChange={(e) =>
                          setShareRole(e.target.value as "edit" | "view")
                        }
                        className="px-2 py-1.5 rounded-xl bg-slate-950 border border-white/15 text-[11px] text-slate-200 focus:outline-none cursor-pointer"
                      >
                        <option value="edit">Can Edit</option>
                        <option value="view">Can View</option>
                      </select>
                      <button
                        type="button"
                        data-testid="add-note-collaborator-btn"
                        onClick={() => handleAddCollaboratorFromEditor()}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/35 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Mail className="w-3 h-3" />
                        <span>Invite Peer</span>
                      </button>
                    </div>

                    {sharedWith.length > 0 && (
                      <div
                        data-testid="note-editor-shared-with-list"
                        className="flex items-center gap-1.5 flex-wrap pt-1"
                      >
                        <AnimatePresence initial={false}>
                          {sharedWith.map((email) => (
                            <motion.span
                              key={email}
                              layout
                              initial={{ opacity: 0, scale: 0.85 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.15 }}
                              data-testid={`editor-shared-email-${email}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-200 border border-cyan-500/30 text-[11px] font-medium"
                            >
                              <Mail className="w-2.5 h-2.5 text-cyan-400" />
                              <span>{email}</span>
                              <span className="text-[9px] uppercase tracking-wider text-cyan-400/80">
                                ({sharedPermissions[email] || "edit"})
                              </span>
                              <button
                                type="button"
                                data-testid={`remove-shared-email-btn-${email}`}
                                aria-label={`Remove collaborator ${email}`}
                                onClick={() =>
                                  handleRemoveCollaboratorFromEditor(email)
                                }
                                className="p-0.5 rounded-full hover:bg-white/15 text-slate-300 hover:text-white cursor-pointer"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </motion.span>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  {/* Note Version History (versions Snapshots & Restore) */}
                  <div
                    data-testid="note-editor-versions-section"
                    className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-300 font-medium text-xs flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Version History ({versions.length})</span>
                      </span>
                      <button
                        type="button"
                        data-testid="save-version-snapshot-btn"
                        onClick={handleSaveVersionSnapshotInEditor}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        title="Save a snapshot of the current note content"
                      >
                        <History className="w-3 h-3" />
                        <span>Save Snapshot</span>
                      </button>
                    </div>

                    {versions.length === 0 ? (
                      <p className="text-[11px] text-slate-400">
                        Previous snapshots of this note are saved automatically whenever you update its content, or click Save Snapshot above.
                      </p>
                    ) : (
                      <div
                        data-testid="editor-versions-list"
                        className="max-h-28 overflow-y-auto space-y-1.5 pr-1"
                      >
                        {versions.map((ver, idx) => (
                          <div
                            key={ver.id || idx}
                            data-testid={`editor-version-item-${idx}`}
                            className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/70 border border-white/5 text-[11px]"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-slate-300 font-medium truncate">
                                {ver.content || "(Empty content)"}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {formatNoteTimestamp(ver.timestamp)}
                              </div>
                            </div>
                            <button
                              type="button"
                              data-testid={`editor-restore-version-btn-${idx}`}
                              onClick={() => handleRestoreVersionInEditor(ver)}
                              className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                              <span>Restore</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Reminder Date & Client-Side Password Encryption Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                  {/* Reminder Date Field */}
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
                    <label
                      htmlFor="note-editor-reminder-date"
                      className="block text-slate-300 font-medium text-xs flex items-center gap-1.5"
                    >
                      <Bell className="w-3.5 h-3.5 text-amber-400" />
                      <span>Reminder Date (Alerts when pinned)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="note-editor-reminder-date"
                        data-testid="note-reminder-date-input"
                        type="date"
                        aria-label="Reminder Date"
                        value={reminderDate}
                        onFocus={() => setIsEditorFocused(true)}
                        onChange={(e) => setReminderDate(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl glass-pill text-xs text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                      {reminderDate && (
                        <button
                          type="button"
                          data-testid="clear-editor-reminder-btn"
                          onClick={() => setReminderDate("")}
                          className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-[11px] cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Client-Side Note Encryption Field */}
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="note-encrypt-checkbox"
                        className="text-slate-300 font-medium text-xs flex items-center gap-1.5 cursor-pointer select-none"
                      >
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Password-Protect / Encrypt Note</span>
                      </label>
                      <input
                        id="note-encrypt-checkbox"
                        data-testid="note-encrypt-checkbox"
                        type="checkbox"
                        checked={isEncrypted || Boolean(notePassword.trim())}
                        onChange={(e) => {
                          setIsEncrypted(e.target.checked);
                          if (!e.target.checked) {
                            setNotePassword("");
                          }
                        }}
                        className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
                      />
                    </div>
                    <input
                      id="note-password-input"
                      data-testid="note-password-input"
                      type="password"
                      aria-label="Encryption Password"
                      placeholder="Enter password to encrypt note before saving..."
                      value={notePassword}
                      onFocus={() => setIsEditorFocused(true)}
                      onChange={(e) => {
                        setNotePassword(e.target.value);
                        if (e.target.value.trim()) {
                          setIsEncrypted(true);
                        }
                      }}
                      className="w-full px-3 py-1.5 rounded-xl glass-pill text-xs text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-5 flex-wrap">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="pinCheck"
                        data-testid="note-pin-checkbox"
                        checked={pinned}
                        onChange={(e) => setPinned(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
                      />
                      <label
                        htmlFor="pinCheck"
                        className="text-slate-300 cursor-pointer select-none flex items-center gap-1.5"
                      >
                        <Pin
                          className={`w-3.5 h-3.5 ${
                            pinned ? "text-emerald-400 fill-emerald-400" : "text-slate-400"
                          }`}
                        />
                        <span>Pin this note to top</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="archiveCheck"
                        data-testid="note-archive-checkbox"
                        checked={archived}
                        onChange={(e) => setArchived(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 cursor-pointer"
                      />
                      <label
                        htmlFor="archiveCheck"
                        className="text-slate-300 cursor-pointer select-none flex items-center gap-1.5"
                      >
                        <Archive
                          className={`w-3.5 h-3.5 ${
                            archived ? "text-amber-400" : "text-slate-400"
                          }`}
                        />
                        <span>Archive this note</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      data-testid="editor-export-md-btn"
                      onClick={() => {
                        exportNoteAsMarkdownFile(
                          {
                            id: editingNote?.id || "draft-note",
                            title: title.trim() || "Untitled Note",
                            content,
                            pinned,
                            archived,
                            folder,
                            labels,
                            labelColors: labelColorsMap,
                            versions,
                            sharedWith,
                            reminderDate,
                            createdAt: editingNote?.createdAt || Date.now(),
                            updatedAt: Date.now(),
                          },
                          content
                        );
                        setEditorExportStatus("MD");
                        setTimeout(() => setEditorExportStatus(null), 2000);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-violet-300 border border-violet-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      title="Export current note as Markdown (.md) including metadata, labels, and version history"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>
                        {editorExportStatus === "MD"
                          ? "Saved Markdown"
                          : "Export Markdown (.md)"}
                      </span>
                    </button>
                    <button
                      type="button"
                      data-testid="editor-export-txt-btn"
                      onClick={() => {
                        exportNoteAsTextFile(
                          {
                            title: title.trim() || "Untitled Note",
                            content,
                            folder,
                            labels,
                            reminderDate,
                          },
                          content
                        );
                        setEditorExportStatus("TXT");
                        setTimeout(() => setEditorExportStatus(null), 2000);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      title="Export current note as clean text (.txt)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>
                        {editorExportStatus === "TXT" ? "Saved TXT" : "Export TXT"}
                      </span>
                    </button>
                    <button
                      type="button"
                      data-testid="editor-export-pdf-btn"
                      onClick={() => {
                        exportNoteAsPdfFile(
                          {
                            title: title.trim() || "Untitled Note",
                            content,
                            folder,
                            labels,
                            reminderDate,
                          },
                          content
                        );
                        setEditorExportStatus("PDF");
                        setTimeout(() => setEditorExportStatus(null), 2000);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      title="Export current note as PDF (.pdf)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>
                        {editorExportStatus === "PDF" ? "Saved PDF" : "Export PDF"}
                      </span>
                    </button>
                    {editingNote && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-4 py-2 rounded-xl glass-pill text-slate-300 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      data-testid="save-note-btn"
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-bold hover:shadow-md hover:shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      {editingNote ? "Update Note" : "Save Note"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* DEDICATED ARCHIVED NOTES VIEW OR ACTIVE NOTES LIST (Hidden when Focus Mode is active) */}
          {!isFocusMode && (isArchivedView ? (
            <div data-testid="archived-notes-view" className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Archive className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold font-heading text-white">
                      Archived Notes ({filteredArchivedNotes.length})
                    </h2>
                    <p className="text-xs text-slate-400">
                      Archived notes are separated from your main workspace. Restore any note to bring it back to your active list.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  data-testid="back-to-active-notes-btn"
                  onClick={() => {
                    setActiveViewMode("personal");
                    setSelectedFilter("all");
                  }}
                  className="px-3.5 py-1.5 rounded-xl glass-pill text-xs font-bold text-emerald-300 hover:text-white border border-white/10 cursor-pointer"
                >
                  ← Back to Active Notes
                </button>
              </div>

              {filteredArchivedNotes.length === 0 ? (
                <div
                  data-testid="archived-notes-empty-state"
                  className="glass-card rounded-3xl p-12 text-center border border-white/10 my-4"
                >
                  <Archive className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <h3 className="font-bold text-white font-heading text-lg">
                    {searchQuery.trim()
                      ? "No matching archived notes"
                      : "No archived notes"}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    {searchQuery.trim()
                      ? `No archived notes match "${searchQuery}".`
                      : "Notes you archive will appear here safely out of your main notes list."}
                  </p>
                </div>
              ) : (
                <div
                  data-testid="archived-notes-grid"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {filteredArchivedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      sharedWorkspaces={sharedWorkspaces}
                      onEdit={handleOpenEdit}
                      onDelete={onDeleteNote}
                      onTogglePin={handleToggleNotePin}
                      onToggleArchive={handleToggleNoteArchive}
                      onAskAbya={onAskAbyaWithContext}
                      onShareToWorkspace={(ws) => handleShareNoteToWorkspace(note, ws)}
                      onWikiLinkClick={handleNavigateToWikiLink}
                      onRestoreVersion={(verIdOrIdx) =>
                        handleRestoreNoteVersionFromCard(note, verIdOrIdx)
                      }
                      onUpdateCollaborators={(emails, perms) =>
                        handleUpdateNoteCollaborators(note, emails, perms)
                      }
                      backlinks={bidirectionalLinksMap[note.id]?.backlinks || []}
                      isHighlighted={activeLinkedNoteId === note.id}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* MAIN ACTIVE NOTES LIST (Archived notes strictly filtered out; Pinned notes sorted to top; grouped by Folder) */
            <div data-testid="notes-list-container" className="space-y-6">
              {filteredActiveNotes.length === 0 ? (
                <div className="glass-card rounded-3xl p-12 text-center border border-white/10 my-4">
                  <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <h3 className="font-bold text-white font-heading text-lg">
                    {searchQuery.trim() ? "No matching notes found" : "No notes found"}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    {searchQuery.trim()
                      ? `No active notes match "${searchQuery}". Try clearing your search query.`
                      : "Create your first revision note or summary using the Note Editor above."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Pinned Notes Section (Always sorted to the top) */}
                  {pinnedNotes.length > 0 && (
                    <div data-testid="pinned-notes-section" className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 font-heading">
                        <Pin className="w-3.5 h-3.5 fill-emerald-400" />
                        <span>Pinned Notes ({pinnedNotes.length})</span>
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pinnedNotes.map((note) => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            sharedWorkspaces={sharedWorkspaces}
                            onEdit={handleOpenEdit}
                            onDelete={onDeleteNote}
                            onTogglePin={handleToggleNotePin}
                            onToggleArchive={handleToggleNoteArchive}
                            onAskAbya={onAskAbyaWithContext}
                            onShareToWorkspace={(ws) =>
                              handleShareNoteToWorkspace(note, ws)
                            }
                            onWikiLinkClick={handleNavigateToWikiLink}
                            onRestoreVersion={(verIdOrIdx) =>
                              handleRestoreNoteVersionFromCard(note, verIdOrIdx)
                            }
                            onUpdateCollaborators={(emails, perms) =>
                              handleUpdateNoteCollaborators(note, emails, perms)
                            }
                            backlinks={bidirectionalLinksMap[note.id]?.backlinks || []}
                            isHighlighted={activeLinkedNoteId === note.id}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unpinned Active Notes (Sorted by Selected Sort Option & Grouped by Folder) */}
                  {unpinnedNotes.length > 0 && (
                    <div data-testid="unpinned-notes-section" className="space-y-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        {Object.entries(groupedUnpinnedNotes).map(
                          ([folderName, folderNotes]) => (
                            <div
                              key={folderName}
                              data-testid={`folder-group-${folderName}`}
                              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 font-heading"
                            >
                              <Folder className="w-3.5 h-3.5 text-amber-400" />
                              <span>
                                {folderName} ({folderNotes.length})
                              </span>
                            </div>
                          )
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {unpinnedNotes.map((note) => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            sharedWorkspaces={sharedWorkspaces}
                            onEdit={handleOpenEdit}
                            onDelete={onDeleteNote}
                            onTogglePin={handleToggleNotePin}
                            onToggleArchive={handleToggleNoteArchive}
                            onAskAbya={onAskAbyaWithContext}
                            onShareToWorkspace={(ws) =>
                              handleShareNoteToWorkspace(note, ws)
                            }
                            onWikiLinkClick={handleNavigateToWikiLink}
                            onRestoreVersion={(verIdOrIdx) =>
                              handleRestoreNoteVersionFromCard(note, verIdOrIdx)
                            }
                            onUpdateCollaborators={(emails, perms) =>
                              handleUpdateNoteCollaborators(note, emails, perms)
                            }
                            backlinks={bidirectionalLinksMap[note.id]?.backlinks || []}
                            isHighlighted={activeLinkedNoteId === note.id}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </>
      )}

      {/* Create Shared Workspace Modal */}
      <CreateSharedWorkspaceModal
        isOpen={isCreateWsOpen}
        onClose={() => setIsCreateWsOpen(false)}
        defaultType="notes"
        currentUser={userObj}
        onCreated={(newWs) => {
          setSelectedWorkspace(newWs);
          setSharedWorkspaces((prev) => [newWs, ...prev]);
        }}
      />

      {/* Join Shared Workspace Modal */}
      <JoinWorkspaceModal
        isOpen={isJoinWsOpen}
        onClose={() => setIsJoinWsOpen(false)}
        currentUser={userObj}
        onJoined={(joinedWs) => {
          setSelectedWorkspace(joinedWs);
          setSharedWorkspaces((prev) => [
            joinedWs,
            ...prev.filter((w) => w.id !== joinedWs.id),
          ]);
        }}
      />
    </div>
  );
};

// Note rendering component with Lightweight Markdown Previewer, Bidirectional [[Note Title]] Links & Backlinks, PDF/TXT Local Export, Client-Side Encryption Lock/Unlock, Reminder Badge, Timestamp display, Folder badge, Labels, Copy, Pin, and Archive
export const NoteCard: React.FC<{
  note: Note;
  sharedWorkspaces: SharedWorkspace[];
  onEdit: (note: Note, decryptedPlaintext?: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (note: Note) => void;
  onToggleArchive?: (note: Note) => void;
  onAskAbya: (context: string) => void;
  onShareToWorkspace: (ws: SharedWorkspace) => void;
  onWikiLinkClick?: (targetTitle: string) => void;
  onRestoreVersion?: (versionIdOrIndex: string | number) => void;
  onUpdateCollaborators?: (
    emails: string[],
    perms?: Record<string, "view" | "edit">
  ) => void;
  backlinks?: Note[];
  isHighlighted?: boolean;
}> = ({
  note,
  sharedWorkspaces,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleArchive,
  onAskAbya,
  onShareToWorkspace,
  onWikiLinkClick,
  onRestoreVersion,
  onUpdateCollaborators,
  backlinks = [],
  isHighlighted = false,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [exportStatus, setExportStatus] = useState<"PDF" | "TXT" | "MD" | null>(
    null
  );
  const [unlockedPlaintext, setUnlockedPlaintext] = useState<string | null>(null);
  const [unlockPasswordInput, setUnlockPasswordInput] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [showVersionsPanel, setShowVersionsPanel] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [cardShareEmailInput, setCardShareEmailInput] = useState("");
  const [cardShareRole, setCardShareRole] = useState<"edit" | "view">("edit");

  const noteLabels = useMemo(() => getNoteLabels(note), [note]);
  const noteFolder = useMemo(() => getNoteFolder(note), [note]);
  const noteVersions = useMemo(
    () => normalizeNoteVersions(note.versions),
    [note.versions]
  );
  const noteSharedWith = useMemo(
    () => normalizeNoteSharedWith(note.sharedWith),
    [note.sharedWith]
  );
  const encrypted = isNoteEncrypted(note);
  const isLocked = encrypted && unlockedPlaintext === null;
  const visibleContent = encrypted ? unlockedPlaintext ?? "" : note.content;

  useEffect(() => {
    setUnlockedPlaintext(null);
    setUnlockPasswordInput("");
    setUnlockError(null);
  }, [note.content, note.isEncrypted]);

  const createdTimestamp = note.createdAt || Date.now();
  const modifiedTimestamp = note.updatedAt || createdTimestamp;

  const handleUnlockNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const pwd = unlockPasswordInput.trim();
    if (!pwd) {
      setUnlockError("Please enter a password.");
      return;
    }
    const payload = note.content || note.encryptedContent || "";
    const decrypted = decryptNoteContent(payload, pwd);
    if (decrypted === null) {
      setUnlockError("Incorrect password. Unable to decrypt note.");
      return;
    }
    setUnlockedPlaintext(decrypted);
    setUnlockError(null);
    setUnlockPasswordInput("");
  };

  const handleCopyContent = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await copyNoteContentToClipboard(isLocked ? note.content : visibleContent);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const handleExportTxt = (e: React.MouseEvent) => {
    e.stopPropagation();
    exportNoteAsTextFile(note, isLocked ? undefined : visibleContent);
    setExportStatus("TXT");
    setTimeout(() => setExportStatus(null), 2000);
  };

  const handleExportPdf = (e: React.MouseEvent) => {
    e.stopPropagation();
    exportNoteAsPdfFile(note, isLocked ? undefined : visibleContent);
    setExportStatus("PDF");
    setTimeout(() => setExportStatus(null), 2000);
  };

  const handleExportMarkdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    exportNoteAsMarkdownFile(note, isLocked ? undefined : visibleContent);
    setExportStatus("MD");
    setTimeout(() => setExportStatus(null), 2000);
  };

  return (
    <div
      data-testid={`note-card-${note.id}`}
      data-note-id={note.id}
      data-pinned={note.pinned ? "true" : "false"}
      data-archived={note.archived ? "true" : "false"}
      data-encrypted={encrypted ? "true" : "false"}
      data-folder={noteFolder}
      className={`glass-card rounded-2xl p-5 border transition-all flex flex-col justify-between group ${
        isHighlighted
          ? "border-cyan-400 ring-2 ring-cyan-400/30 bg-cyan-500/[0.04]"
          : note.archived
          ? "border-amber-500/30 bg-amber-500/[0.02]"
          : note.pinned
          ? "border-emerald-500/35 bg-emerald-500/[0.03]"
          : "border-white/10 hover:border-emerald-500/30"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <h4 className="font-bold text-base text-white font-heading line-clamp-1">
              {note.title}
            </h4>
            {/* Folder Badge */}
            <span
              data-testid={`note-folder-badge-${note.id}`}
              className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30"
            >
              <Folder className="w-2.5 h-2.5 text-amber-400" />
              <span>{noteFolder}</span>
            </span>
            {encrypted && (
              <span
                data-testid={`note-encrypted-badge-${note.id}`}
                className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30"
              >
                {isLocked ? (
                  <>
                    <Lock className="w-2.5 h-2.5 text-rose-400" />
                    <span>Encrypted</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Unlocked</span>
                  </>
                )}
              </span>
            )}
            {note.reminderDate && (
              <span
                data-testid={`note-reminder-badge-${note.id}`}
                className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30"
              >
                <Bell className="w-2.5 h-2.5 text-amber-400" />
                <span>Reminder: {note.reminderDate}</span>
              </span>
            )}
            {note.pinned && !note.archived && (
              <span
                data-testid={`note-pinned-badge-${note.id}`}
                className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
              >
                Pinned
              </span>
            )}
            {note.archived && (
              <span
                data-testid={`note-archived-badge-${note.id}`}
                className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30"
              >
                Archived
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              data-testid={`pin-note-btn-${note.id}`}
              aria-label={note.pinned ? "Unpin Note" : "Pin Note"}
              onClick={() => onTogglePin(note)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                note.pinned
                  ? "text-emerald-400 bg-emerald-500/15"
                  : "text-slate-500 hover:text-slate-300"
              }`}
              title={note.pinned ? "Unpin Note" : "Pin Note"}
            >
              <Pin className={`w-4 h-4 ${note.pinned ? "fill-emerald-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Created / Last Modified Timestamp Context */}
        <div
          data-testid={`note-timestamp-${note.id}`}
          className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400 mb-3"
        >
          <Clock className="w-3 h-3 text-slate-500 shrink-0" />
          <time
            data-testid={`note-created-at-${note.id}`}
            dateTime={new Date(createdTimestamp).toISOString()}
          >
            Created: {formatNoteTimestamp(createdTimestamp)}
          </time>
          {modifiedTimestamp > createdTimestamp && (
            <>
              <span>•</span>
              <time
                data-testid={`note-updated-at-${note.id}`}
                dateTime={new Date(modifiedTimestamp).toISOString()}
              >
                Last modified: {formatNoteTimestamp(modifiedTimestamp)}
              </time>
            </>
          )}
        </div>

        {/* Encrypted Note Lock Panel OR Lightweight Markdown Previewer */}
        {isLocked ? (
          <div
            data-testid={`note-locked-panel-${note.id}`}
            className="p-3.5 rounded-2xl bg-slate-950/80 border border-rose-500/25 space-y-2.5 my-1"
          >
            <div className="flex items-center gap-2 text-xs text-rose-300 font-semibold">
              <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Password-protected note. Enter password to decrypt:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                data-testid={`unlock-note-password-input-${note.id}`}
                aria-label={`Password to unlock ${note.title}`}
                placeholder="Enter password..."
                value={unlockPasswordInput}
                onChange={(e) => {
                  setUnlockPasswordInput(e.target.value);
                  setUnlockError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleUnlockNote();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <button
                type="button"
                data-testid={`unlock-note-btn-${note.id}`}
                onClick={() => handleUnlockNote()}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:opacity-90 cursor-pointer shrink-0"
              >
                Unlock
              </button>
            </div>
            {unlockError && (
              <p
                data-testid={`unlock-note-error-${note.id}`}
                className="text-[11px] text-rose-400 font-medium"
              >
                {unlockError}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <NoteMarkdownPreview
              content={visibleContent}
              testId={`note-content-${note.id}`}
              className="line-clamp-6"
              onWikiLinkClick={onWikiLinkClick}
            />
            {encrypted && unlockedPlaintext !== null && (
              <button
                type="button"
                data-testid={`relock-note-btn-${note.id}`}
                onClick={() => setUnlockedPlaintext(null)}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white cursor-pointer"
              >
                <Lock className="w-3 h-3" />
                <span>Lock Note</span>
              </button>
            )}
          </div>
        )}

        {/* Bidirectional Backlinks Section (Notes that reference this note via [[Note Title]]) */}
        {backlinks.length > 0 && (
          <div
            data-testid={`note-backlinks-${note.id}`}
            className="mt-3 pt-2.5 border-t border-white/5 flex items-center gap-1.5 flex-wrap"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <Link2 className="w-3 h-3" />
              <span>Linked from:</span>
            </span>
            {backlinks.map((sourceNote) => (
              <a
                key={sourceNote.id}
                href={`#note-backlink-${sourceNote.id}`}
                data-testid={`backlink-from-${sourceNote.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onWikiLinkClick?.(sourceNote.title);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 text-[11px] font-semibold cursor-pointer"
              >
                <span>{sourceNote.title}</span>
              </a>
            ))}
          </div>
        )}

        {/* Note Categorization Color-Coded Labels / Tags */}
        {noteLabels.length > 0 && (
          <div
            data-testid={`note-labels-${note.id}`}
            className="flex items-center gap-1.5 flex-wrap mt-3"
          >
            {noteLabels.map((lbl) => {
              const rawColor =
                note.labelColors?.[lbl] || getDefaultColorForLabelName(lbl);
              const colorOpt = resolveLabelColorOption(rawColor);
              return (
                <span
                  key={lbl}
                  data-testid={`note-label-${note.id}-${lbl}`}
                  data-label-color={colorOpt.id}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg ${colorOpt.bgClass} ${colorOpt.textClass} border ${colorOpt.borderClass} text-[11px] font-semibold`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${colorOpt.dotClass}`}
                    style={{ backgroundColor: colorOpt.hex }}
                  />
                  <span>{lbl}</span>
                </span>
              );
            })}
          </div>
        )}

        {/* Shared With Peers (sharedWith Emails) Display */}
        {noteSharedWith.length > 0 && (
          <div
            data-testid={`note-shared-with-${note.id}`}
            className="mt-2.5 pt-2 border-t border-white/5 flex items-center gap-1.5 flex-wrap"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>Shared with:</span>
            </span>
            {noteSharedWith.map((email) => (
              <span
                key={email}
                data-testid={`note-collaborator-${note.id}-${email}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-200 border border-cyan-500/30 text-[11px] font-medium"
              >
                <Mail className="w-2.5 h-2.5 text-cyan-400" />
                <span>{email}</span>
                {onUpdateCollaborators && (
                  <button
                    type="button"
                    data-testid={`remove-note-collaborator-${note.id}-${email}`}
                    aria-label={`Remove ${email}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateCollaborators(
                        removeCollaboratorEmailFromNote(note, email)
                      );
                    }}
                    className="p-0.5 rounded-full hover:bg-white/15 text-slate-300 hover:text-white cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Inline Invite Peer by Email Panel on NoteCard */}
        {showSharePanel && onUpdateCollaborators && (
          <form
            data-testid={`note-card-share-form-${note.id}`}
            onSubmit={(e) => {
              e.preventDefault();
              if (!cardShareEmailInput.trim()) return;
              const nextEmails = addCollaboratorEmailToNote(
                note,
                cardShareEmailInput
              );
              const nextPerms: Record<string, "view" | "edit"> = {
                ...(note.sharedPermissions || {}),
              };
              for (const em of nextEmails) {
                if (!nextPerms[em]) nextPerms[em] = cardShareRole;
              }
              onUpdateCollaborators(nextEmails, nextPerms);
              setCardShareEmailInput("");
            }}
            className="mt-2.5 p-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex items-center gap-1.5 flex-wrap"
          >
            <input
              type="email"
              data-testid={`card-share-email-input-${note.id}`}
              aria-label={`Invite peer email to ${note.title}`}
              placeholder="Peer email (e.g., classmate@school.edu)..."
              value={cardShareEmailInput}
              onChange={(e) => setCardShareEmailInput(e.target.value)}
              className="flex-1 min-w-0 px-2.5 py-1 rounded-lg bg-slate-900 border border-white/15 text-xs text-white focus:outline-none"
            />
            <select
              data-testid={`card-share-role-select-${note.id}`}
              value={cardShareRole}
              onChange={(e) =>
                setCardShareRole(e.target.value as "edit" | "view")
              }
              className="px-2 py-1 rounded-lg bg-slate-900 border border-white/15 text-[11px] text-slate-200"
            >
              <option value="edit">Edit</option>
              <option value="view">View</option>
            </select>
            <button
              type="submit"
              data-testid={`card-confirm-share-email-btn-${note.id}`}
              className="px-2.5 py-1 rounded-lg bg-cyan-500 text-slate-950 text-[11px] font-bold cursor-pointer"
            >
              Invite
            </button>
          </form>
        )}

        {/* Version History Panel on NoteCard (Always visible when versions exist or toggled) */}
        {noteVersions.length > 0 && (
          <div
            data-testid={`note-versions-panel-${note.id}`}
            className="mt-2.5 pt-2.5 border-t border-white/5 space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <History className="w-3 h-3" />
                <span>Version History ({noteVersions.length})</span>
              </span>
              {noteVersions.length > 1 && (
                <button
                  type="button"
                  data-testid={`note-versions-toggle-${note.id}`}
                  onClick={() => setShowVersionsPanel((prev) => !prev)}
                  className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                >
                  {showVersionsPanel
                    ? "Show latest only"
                    : `Show all ${noteVersions.length} versions`}
                </button>
              )}
            </div>

            <div
              data-testid={`note-versions-list-${note.id}`}
              className="space-y-1"
            >
              {(showVersionsPanel ? noteVersions : noteVersions.slice(0, 2)).map(
                (ver, idx) => (
                  <div
                    key={ver.id || idx}
                    data-testid={`note-version-item-${note.id}-${idx}`}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-slate-950/70 border border-white/5 text-[11px]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-300 truncate font-mono text-[11px]">
                        {ver.content || "(Empty snapshot)"}
                      </p>
                      <span className="text-[10px] text-slate-500">
                        {formatNoteTimestamp(ver.timestamp)}
                      </span>
                    </div>
                    {onRestoreVersion && (
                      <button
                        type="button"
                        data-testid={`restore-note-version-btn-${note.id}-${idx}`}
                        aria-label={`Restore version ${idx + 1} for ${note.title}`}
                        onClick={() => onRestoreVersion(ver.id || idx)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                        title="Restore this previous version"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Restore</span>
                      </button>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 mt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Copy Note Content Button */}
          <button
            type="button"
            data-testid={`copy-note-btn-${note.id}`}
            aria-label={isCopied ? "Copied note content" : "Copy note content"}
            title="Copy note content to clipboard"
            onClick={handleCopyContent}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all text-[11px] font-semibold cursor-pointer ${
              isCopied
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "glass-pill text-slate-300 hover:text-white border-white/10 hover:border-cyan-500/30"
            }`}
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Export as Markdown (.md) Button */}
          <button
            type="button"
            data-testid={`export-md-btn-${note.id}`}
            aria-label={`Export ${note.title} as Markdown file`}
            title="Export note as Markdown (.md) file including metadata, labels, and version history"
            onClick={handleExportMarkdown}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border transition-all text-[11px] font-semibold cursor-pointer ${
              exportStatus === "MD"
                ? "bg-violet-500/20 text-violet-300 border-violet-500/40"
                : "glass-pill text-slate-300 hover:text-violet-300 border-white/10 hover:border-violet-500/30"
            }`}
          >
            <Download className="w-3 h-3 text-violet-400" />
            <span>{exportStatus === "MD" ? "Saved MD" : "Markdown (.md)"}</span>
          </button>

          {/* Export as Clean Text (.txt) Button */}
          <button
            type="button"
            data-testid={`export-txt-btn-${note.id}`}
            aria-label={`Export ${note.title} as text file`}
            title="Export note as clean text (.txt) file"
            onClick={handleExportTxt}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border transition-all text-[11px] font-semibold cursor-pointer ${
              exportStatus === "TXT"
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                : "glass-pill text-slate-300 hover:text-cyan-300 border-white/10 hover:border-cyan-500/30"
            }`}
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>{exportStatus === "TXT" ? "Saved TXT" : "TXT"}</span>
          </button>

          {/* Export as PDF (.pdf) Button */}
          <button
            type="button"
            data-testid={`export-pdf-btn-${note.id}`}
            aria-label={`Export ${note.title} as PDF file`}
            title="Export note as PDF (.pdf) file"
            onClick={handleExportPdf}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border transition-all text-[11px] font-semibold cursor-pointer ${
              exportStatus === "PDF"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "glass-pill text-slate-300 hover:text-emerald-300 border-white/10 hover:border-emerald-500/30"
            }`}
          >
            <Download className="w-3 h-3 text-emerald-400" />
            <span>{exportStatus === "PDF" ? "Saved PDF" : "PDF"}</span>
          </button>

          {/* Share / Invite Peer by Email Button on NoteCard */}
          {onUpdateCollaborators && (
            <button
              type="button"
              data-testid={`share-note-email-btn-${note.id}`}
              aria-label={`Invite peer to ${note.title}`}
              title="Invite peer by email to collaborate on this note"
              onClick={() => setShowSharePanel((prev) => !prev)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border transition-all text-[11px] font-semibold cursor-pointer ${
                showSharePanel || noteSharedWith.length > 0
                  ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/35"
                  : "glass-pill text-slate-300 hover:text-cyan-300 border-white/10 hover:border-cyan-500/30"
              }`}
            >
              <UserPlus className="w-3 h-3 text-cyan-400" />
              <span>
                Share{noteSharedWith.length > 0 ? ` (${noteSharedWith.length})` : ""}
              </span>
            </button>
          )}

          {/* Archive / Unarchive Button */}
          {onToggleArchive && (
            <button
              type="button"
              data-testid={`archive-note-btn-${note.id}`}
              aria-label={note.archived ? "Unarchive Note" : "Archive Note"}
              title={note.archived ? "Restore from Archive" : "Archive Note"}
              onClick={() => onToggleArchive(note)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all text-[11px] font-semibold cursor-pointer ${
                note.archived
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                  : "glass-pill text-slate-300 hover:text-amber-300 border-white/10 hover:border-amber-500/30"
              }`}
            >
              {note.archived ? (
                <>
                  <ArchiveRestore className="w-3.5 h-3.5 text-amber-400" />
                  <span>Unarchive</span>
                </>
              ) : (
                <>
                  <Archive className="w-3.5 h-3.5 text-amber-400" />
                  <span>Archive</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              onAskAbya(`Notes context: "${note.title}"\n${visibleContent}`)
            }
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/25 transition-all text-[11px] font-semibold cursor-pointer"
            title="Send note to Abya AI for explanation or revision quiz"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Ask Abya AI</span>
          </button>

          {sharedWorkspaces.length > 0 && (
            <select
              onChange={(e) => {
                const targetWs = sharedWorkspaces.find((w) => w.id === e.target.value);
                if (targetWs) {
                  onShareToWorkspace(targetWs);
                }
              }}
              defaultValue=""
              className="px-2 py-1 bg-slate-800 border border-white/10 rounded-xl text-[11px] text-slate-300 focus:outline-none cursor-pointer"
              title="Copy to shared doc"
            >
              <option value="" disabled>
                Share to Doc ▾
              </option>
              {sharedWorkspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            data-testid={`edit-note-btn-${note.id}`}
            aria-label="Edit Note"
            title="Edit Note"
            onClick={() => onEdit(note, unlockedPlaintext ?? undefined)}
            className="p-1.5 rounded-lg glass-pill text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            data-testid={`delete-note-btn-${note.id}`}
            aria-label="Delete Note"
            title="Delete Note"
            onClick={() => onDelete(note.id)}
            className="p-1.5 rounded-lg glass-pill text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
