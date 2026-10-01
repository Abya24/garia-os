import type { Note, NoteColorLabel, NoteTemplate, NoteVersion } from "../types.ts";

export const ENCRYPTED_NOTE_PREFIX = "ENCv1:";
export const NOTE_TEMPLATES_STORAGE_KEY = "garia_custom_note_templates_v1";
export const NOTE_LABEL_COLORS_STORAGE_KEY = "garia_custom_note_label_colors_v1";

export interface LabelColorOption {
  id: string;
  label: string;
  hex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
}

export const NOTE_LABEL_COLOR_PALETTE: LabelColorOption[] = [
  {
    id: "cyan",
    label: "Cyan",
    hex: "#06b6d4",
    bgClass: "bg-cyan-500/15",
    textClass: "text-cyan-300",
    borderClass: "border-cyan-500/35",
    dotClass: "bg-cyan-400",
  },
  {
    id: "emerald",
    label: "Emerald",
    hex: "#10b981",
    bgClass: "bg-emerald-500/15",
    textClass: "text-emerald-300",
    borderClass: "border-emerald-500/35",
    dotClass: "bg-emerald-400",
  },
  {
    id: "amber",
    label: "Amber",
    hex: "#f59e0b",
    bgClass: "bg-amber-500/15",
    textClass: "text-amber-300",
    borderClass: "border-amber-500/35",
    dotClass: "bg-amber-400",
  },
  {
    id: "rose",
    label: "Rose",
    hex: "#f43f5e",
    bgClass: "bg-rose-500/15",
    textClass: "text-rose-300",
    borderClass: "border-rose-500/35",
    dotClass: "bg-rose-400",
  },
  {
    id: "violet",
    label: "Violet",
    hex: "#8b5cf6",
    bgClass: "bg-violet-500/15",
    textClass: "text-violet-300",
    borderClass: "border-violet-500/35",
    dotClass: "bg-violet-400",
  },
  {
    id: "blue",
    label: "Blue",
    hex: "#3b82f6",
    bgClass: "bg-blue-500/15",
    textClass: "text-blue-300",
    borderClass: "border-blue-500/35",
    dotClass: "bg-blue-400",
  },
];

export const DEFAULT_LABEL_COLOR_MAP: Record<string, string> = {
  Formula: "emerald",
  Summary: "cyan",
  Important: "rose",
  "Exam Prep": "amber",
  Revision: "violet",
  Doubt: "blue",
};

/**
 * Resolves a color identifier or hex code into a LabelColorOption for rendering.
 */
export function resolveLabelColorOption(color?: string): LabelColorOption {
  if (!color) return NOTE_LABEL_COLOR_PALETTE[0];
  const normalized = color.trim().toLowerCase();
  const byIdOrHex = NOTE_LABEL_COLOR_PALETTE.find(
    (opt) =>
      opt.id.toLowerCase() === normalized ||
      opt.label.toLowerCase() === normalized ||
      opt.hex.toLowerCase() === normalized
  );
  if (byIdOrHex) return byIdOrHex;
  if (normalized === "green") return NOTE_LABEL_COLOR_PALETTE[1];
  if (normalized === "yellow" || normalized === "orange") return NOTE_LABEL_COLOR_PALETTE[2];
  if (normalized === "red" || normalized === "pink") return NOTE_LABEL_COLOR_PALETTE[3];
  if (normalized === "purple" || normalized === "indigo") return NOTE_LABEL_COLOR_PALETTE[4];
  return {
    ...NOTE_LABEL_COLOR_PALETTE[0],
    id: color,
    hex: color.startsWith("#") ? color : NOTE_LABEL_COLOR_PALETTE[0].hex,
  };
}

/**
 * Deterministically assigns a color to a label name if no explicit color was specified.
 */
export function getDefaultColorForLabelName(labelName: string): string {
  const trimmed = (labelName || "").trim();
  if (!trimmed) return "cyan";
  for (const [presetName, presetColor] of Object.entries(DEFAULT_LABEL_COLOR_MAP)) {
    if (presetName.toLowerCase() === trimmed.toLowerCase()) {
      return presetColor;
    }
  }
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = (hash * 31 + trimmed.charCodeAt(i)) >>> 0;
  }
  return NOTE_LABEL_COLOR_PALETTE[hash % NOTE_LABEL_COLOR_PALETTE.length].id;
}

/**
 * Normalizes a note's labels, labelColors map, and colorLabels array.
 */
export function normalizeNoteColorLabels(
  note: Partial<Note>,
  globalColorMap?: Record<string, string>
): {
  labels: string[];
  labelColors: Record<string, string>;
  colorLabels: NoteColorLabel[];
} {
  const rawList: any[] = Array.isArray(note.labels)
    ? note.labels
    : Array.isArray(note.colorLabels)
    ? note.colorLabels
    : Array.isArray(note.tags)
    ? note.tags
    : [];

  const mergedColorMap: Record<string, string> = {
    ...DEFAULT_LABEL_COLOR_MAP,
    ...(globalColorMap || {}),
    ...(note.labelColors && typeof note.labelColors === "object"
      ? note.labelColors
      : {}),
  };

  if (Array.isArray(note.colorLabels)) {
    for (const item of note.colorLabels) {
      if (item && typeof item.name === "string" && item.name.trim() && item.color) {
        mergedColorMap[item.name.trim()] = item.color;
      }
    }
  }

  const seenLower = new Set<string>();
  const labels: string[] = [];
  const labelColors: Record<string, string> = {};
  const colorLabels: NoteColorLabel[] = [];

  for (const entry of rawList) {
    let name = "";
    let explicitColor = "";

    if (typeof entry === "string") {
      name = entry.trim();
    } else if (entry && typeof entry === "object" && typeof entry.name === "string") {
      name = entry.name.trim();
      if (typeof entry.color === "string" && entry.color.trim()) {
        explicitColor = entry.color.trim();
      }
    }

    if (!name) continue;
    const lower = name.toLowerCase();
    if (seenLower.has(lower)) continue;
    seenLower.add(lower);

    const existingKey = Object.keys(mergedColorMap).find(
      (k) => k.toLowerCase() === lower
    );
    const resolvedColor =
      explicitColor ||
      (existingKey ? mergedColorMap[existingKey] : "") ||
      getDefaultColorForLabelName(name);

    labels.push(name);
    labelColors[name] = resolvedColor;
    colorLabels.push({
      id: `lbl-${lower.replace(/[^a-z0-9]+/g, "-")}`,
      name,
      color: resolvedColor,
    });
  }

  return { labels, labelColors, colorLabels };
}

function getLabelColorsStorageKey(profileId?: string): string {
  return profileId
    ? `${profileId}_${NOTE_LABEL_COLORS_STORAGE_KEY}`
    : NOTE_LABEL_COLORS_STORAGE_KEY;
}

/**
 * Loads saved custom label-to-color mappings from localStorage.
 */
export function loadCustomLabelColors(profileId?: string): Record<string, string> {
  try {
    if (typeof localStorage === "undefined") {
      return { ...DEFAULT_LABEL_COLOR_MAP };
    }
    const raw = localStorage.getItem(getLabelColorsStorageKey(profileId));
    if (!raw) return { ...DEFAULT_LABEL_COLOR_MAP };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ...DEFAULT_LABEL_COLOR_MAP };
    }
    return { ...DEFAULT_LABEL_COLOR_MAP, ...parsed };
  } catch {
    return { ...DEFAULT_LABEL_COLOR_MAP };
  }
}

/**
 * Saves or updates a custom color-coded label in localStorage and returns the updated map.
 */
export function saveCustomLabelColor(
  labelName: string,
  color: string,
  profileId?: string
): Record<string, string> {
  const current = loadCustomLabelColors(profileId);
  const cleanName = (labelName || "").trim().replace(/^#/, "");
  if (!cleanName) return current;
  const updated: Record<string, string> = {
    ...current,
    [cleanName]: color || getDefaultColorForLabelName(cleanName),
  };
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(getLabelColorsStorageKey(profileId), JSON.stringify(updated));
    }
  } catch {
    // Ignore storage errors
  }
  return updated;
}

/**
 * Removes a custom label from the saved label color dictionary.
 */
export function removeCustomLabelColor(
  labelName: string,
  profileId?: string
): Record<string, string> {
  const current = loadCustomLabelColors(profileId);
  const cleanName = (labelName || "").trim();
  const next: Record<string, string> = {};
  for (const [k, v] of Object.entries(current)) {
    if (k.toLowerCase() !== cleanName.toLowerCase()) {
      next[k] = v;
    }
  }
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(getLabelColorsStorageKey(profileId), JSON.stringify(next));
    }
  } catch {
    // Ignore storage errors
  }
  return next;
}

export const DEFAULT_NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: "tpl-lecture-summary",
    name: "Lecture Summary",
    description: "Structured template for class lectures, key concepts, formulas, and revision questions.",
    folder: "Study Notes",
    labels: ["Summary", "Lecture"],
    isCustom: false,
    content: [
      "# Lecture Summary",
      "",
      "## Key Concepts Covered",
      "- **Main Topic**: ",
      "- **Core Principle**: ",
      "",
      "## Important Formulas & Definitions",
      "- `Formula / Definition 1`: ",
      "- `Formula / Definition 2`: ",
      "",
      "## Worked Examples & Takeaways",
      "1. Example 1: ",
      "2. Example 2: ",
      "",
      "## Questions for Revision",
      "- [ ] Review related topic in [[General Study Checklist]]",
    ].join("\n"),
  },
  {
    id: "tpl-brainstorming",
    name: "Brainstorming",
    description: "Capture creative ideas, mind-map connections, and action steps for projects or essays.",
    folder: "General",
    labels: ["Brainstorming", "Ideas"],
    isCustom: false,
    content: [
      "# Brainstorming Session",
      "",
      "## Core Objective / Problem Statement",
      "> Define the main question or goal you are exploring.",
      "",
      "## Key Ideas & Angles",
      "- **Idea 1**: ",
      "- **Idea 2**: ",
      "- **Idea 3**: ",
      "",
      "## Connections & Related Notes",
      "- Connects with: ",
      "",
      "## Next Actionable Steps",
      "1. Research: ",
      "2. Draft outline: ",
    ].join("\n"),
  },
  {
    id: "tpl-meeting-notes",
    name: "Meeting Notes",
    description: "Organize study group meetings, mentor check-ins, agenda items, and action owners.",
    folder: "General",
    labels: ["Meeting", "Action Items"],
    isCustom: false,
    content: [
      "# Meeting Notes",
      "",
      "## Meeting Details",
      "- **Participants**: ",
      "- **Goal / Focus**: ",
      "",
      "## Agenda & Discussion Points",
      "- Topic 1: ",
      "- Topic 2: ",
      "",
      "## Decisions & Takeaways",
      "- Key decision: ",
      "",
      "## Action Items",
      "1. **Task 1** — Owner / Due Date: ",
      "2. **Task 2** — Owner / Due Date: ",
    ].join("\n"),
  },
  {
    id: "tpl-exam-revision",
    name: "Exam Revision Sheet",
    description: "High-yield exam revision sheet for formulas, common pitfalls, and practice targets.",
    folder: "Exam Prep",
    labels: ["Exam Prep", "Revision", "Formula"],
    isCustom: false,
    content: [
      "# Exam Revision Sheet",
      "",
      "## High-Weightage Concepts",
      "- **Concept A**: ",
      "- **Concept B**: ",
      "",
      "## Must-Memorize Formulas",
      "- `Formula 1`: ",
      "- `Formula 2`: ",
      "",
      "## Common Exam Pitfalls to Avoid",
      "- Watch out for: ",
    ].join("\n"),
  },
];

function getTemplatesStorageKey(profileId?: string): string {
  return profileId
    ? `${profileId}_${NOTE_TEMPLATES_STORAGE_KEY}`
    : NOTE_TEMPLATES_STORAGE_KEY;
}

/**
 * Loads built-in note templates combined with any user-saved custom templates.
 */
export function loadNoteTemplates(profileId?: string): NoteTemplate[] {
  try {
    if (typeof localStorage === "undefined") {
      return [...DEFAULT_NOTE_TEMPLATES];
    }
    const raw = localStorage.getItem(getTemplatesStorageKey(profileId));
    if (!raw) return [...DEFAULT_NOTE_TEMPLATES];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_NOTE_TEMPLATES];
    const customList: NoteTemplate[] = parsed
      .filter(
        (item: any) =>
          item &&
          typeof item.name === "string" &&
          item.name.trim() &&
          typeof item.content === "string"
      )
      .map((item: any) => ({
        id: String(item.id || `tpl-custom-${Date.now()}`),
        name: item.name.trim(),
        description:
          typeof item.description === "string" && item.description.trim()
            ? item.description.trim()
            : "Custom saved note structure",
        content: item.content,
        folder: typeof item.folder === "string" ? item.folder : "General",
        labels: Array.isArray(item.labels) ? item.labels : [],
        isCustom: true,
      }));
    return [...DEFAULT_NOTE_TEMPLATES, ...customList];
  } catch {
    return [...DEFAULT_NOTE_TEMPLATES];
  }
}

/**
 * Saves a custom note template and returns the updated full list of templates.
 */
export function saveCustomNoteTemplate(
  template: Omit<NoteTemplate, "id"> & { id?: string },
  profileId?: string
): NoteTemplate[] {
  const currentAll = loadNoteTemplates(profileId);
  const currentCustom = currentAll.filter((t) => t.isCustom);
  const cleanName = (template.name || "Custom Template").trim();
  const newTemplate: NoteTemplate = {
    id:
      template.id ||
      `tpl-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: cleanName,
    description:
      template.description?.trim() || "Custom user-defined note template",
    content: template.content ?? "",
    folder: template.folder || "General",
    labels: Array.isArray(template.labels) ? template.labels : [],
    isCustom: true,
  };

  const filteredCustom = currentCustom.filter(
    (t) =>
      t.id !== newTemplate.id &&
      t.name.toLowerCase() !== newTemplate.name.toLowerCase()
  );
  const updatedCustom = [...filteredCustom, newTemplate];

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        getTemplatesStorageKey(profileId),
        JSON.stringify(updatedCustom)
      );
    }
  } catch {
    // Ignore storage quota errors
  }

  return [...DEFAULT_NOTE_TEMPLATES, ...updatedCustom];
}

/**
 * Deletes a custom note template by ID and returns the updated list of templates.
 */
export function deleteCustomNoteTemplate(
  templateId: string,
  profileId?: string
): NoteTemplate[] {
  const currentAll = loadNoteTemplates(profileId);
  const updatedCustom = currentAll.filter(
    (t) => t.isCustom && t.id !== templateId
  );
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        getTemplatesStorageKey(profileId),
        JSON.stringify(updatedCustom)
      );
    }
  } catch {
    // Ignore storage errors
  }
  return [...DEFAULT_NOTE_TEMPLATES, ...updatedCustom];
}

/**
 * Extracts all bidirectional wiki-link references formatted as `[[Note Title]]` from note content.
 */
export function extractNoteWikiLinks(content: string): string[] {
  if (!content || typeof content !== "string") return [];
  const regex = /\[\[([^\[\]\n]+)\]\]/g;
  const seen = new Set<string>();
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const title = match[1].trim();
    if (title && !seen.has(title.toLowerCase())) {
      seen.add(title.toLowerCase());
      matches.push(title);
    }
  }
  return matches;
}

/**
 * Finds a note by its title (case-insensitive match).
 */
export function findNoteByTitle(
  notes: Note[],
  targetTitle: string
): Note | undefined {
  if (!Array.isArray(notes) || !targetTitle || !targetTitle.trim()) {
    return undefined;
  }
  const normalizedTarget = targetTitle.trim().toLowerCase();
  return notes.find(
    (n) => (n.title || "").trim().toLowerCase() === normalizedTarget
  );
}

/**
 * Computes bidirectional links (`outgoingTitles`, `outgoingNotes`, and incoming `backlinks`)
 * for all notes based on `[[Note Title]]` references in their content.
 */
export function computeBidirectionalNoteLinks(
  notes: Note[]
): Record<
  string,
  {
    outgoingTitles: string[];
    outgoingNotes: Note[];
    backlinks: Note[];
  }
> {
  const map: Record<
    string,
    {
      outgoingTitles: string[];
      outgoingNotes: Note[];
      backlinks: Note[];
    }
  > = {};

  if (!Array.isArray(notes)) return map;

  for (const note of notes) {
    map[note.id] = {
      outgoingTitles: [],
      outgoingNotes: [],
      backlinks: [],
    };
  }

  for (const sourceNote of notes) {
    const wikiTitles = extractNoteWikiLinks(sourceNote.content || "");
    map[sourceNote.id].outgoingTitles = wikiTitles;

    for (const refTitle of wikiTitles) {
      const targetNote = findNoteByTitle(notes, refTitle);
      if (targetNote && targetNote.id !== sourceNote.id) {
        if (
          !map[sourceNote.id].outgoingNotes.some((n) => n.id === targetNote.id)
        ) {
          map[sourceNote.id].outgoingNotes.push(targetNote);
        }
        if (
          map[targetNote.id] &&
          !map[targetNote.id].backlinks.some((n) => n.id === sourceNote.id)
        ) {
          map[targetNote.id].backlinks.push(sourceNote);
        }
      }
    }
  }

  return map;
}

/**
 * Strips Markdown formatting and `[[Wiki Links]]` to produce clean plain text for exporting.
 */
export function stripMarkdownToCleanText(markdown: string): string {
  if (!markdown || typeof markdown !== "string") return "";
  return markdown
    .replace(/```[\s\S]*?```/g, (block) =>
      block.replace(/^```[^\n]*\n?/, "").replace(/```$/, "")
    )
    .replace(/\[\[([^\[\]\n]+)\]\]/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/^(#{1,6})\s+/gm, "")
    .replace(/\*\*\*([^*]+)\*\*\*/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/_([^_\n]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^>\s?/gm, "")
    .trim();
}

/**
 * Sanitizes a note title into a safe local filename.
 */
export function sanitizeNoteFilename(title?: string): string {
  const raw = (title || "study-note").trim().toLowerCase();
  const cleaned = raw
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "study-note";
}

/**
 * Formats a note into a clean, well-structured plain text document for `.txt` export.
 */
export function formatNoteAsCleanText(
  note: Partial<Note>,
  overrideContent?: string
): string {
  const title = (note.title || "Untitled Note").trim();
  const folder = (note.folder || "General").trim();
  const labels = Array.isArray(note.labels)
    ? note.labels
    : Array.isArray(note.tags)
    ? note.tags
    : [];
  const rawBody =
    overrideContent !== undefined ? overrideContent : note.content || "";
  const cleanBody = stripMarkdownToCleanText(rawBody);
  const dateStr = note.updatedAt
    ? new Date(note.updatedAt).toLocaleString("en-US")
    : note.createdAt
    ? new Date(note.createdAt).toLocaleString("en-US")
    : new Date().toLocaleString("en-US");

  const headerLines = [
    title.toUpperCase(),
    "=".repeat(Math.max(title.length, 16)),
    `Folder: ${folder}`,
  ];
  if (labels.length > 0) {
    headerLines.push(`Tags: ${labels.map((l) => `#${l}`).join(", ")}`);
  }
  if (note.reminderDate) {
    headerLines.push(`Reminder: ${note.reminderDate}`);
  }
  headerLines.push(`Last Updated: ${dateStr}`);
  headerLines.push("-".repeat(40));
  headerLines.push("");
  headerLines.push(cleanBody || "(No content)");
  headerLines.push("");

  return headerLines.join("\n");
}

function escapePdfString(input: string): string {
  return input
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

/**
 * Generates a valid, self-contained PDF 1.4 document string from a Note object.
 */
export function generateNotePdfContent(
  note: Partial<Note>,
  overrideContent?: string
): string {
  const cleanText = formatNoteAsCleanText(note, overrideContent);
  const rawLines = cleanText.split(/\r?\n/);

  // Wrap lines at ~80 characters so they fit cleanly on an A4/Letter PDF page
  const wrappedLines: string[] = [];
  for (const line of rawLines) {
    if (line.length <= 80) {
      wrappedLines.push(line);
    } else {
      let idx = 0;
      while (idx < line.length) {
        wrappedLines.push(line.slice(idx, idx + 80));
        idx += 80;
      }
    }
  }

  const streamOps: string[] = ["BT", "/F1 11 Tf", "50 750 Td", "14 TL"];
  const maxLines = Math.min(wrappedLines.length, 48);
  for (let i = 0; i < maxLines; i++) {
    const escaped = escapePdfString(wrappedLines[i]);
    if (i === 0) {
      streamOps.push(`(${escaped}) Tj`);
    } else {
      streamOps.push(`T* (${escaped}) Tj`);
    }
  }
  streamOps.push("ET");
  const streamContent = streamOps.join("\n");

  const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  const obj3 =
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n";
  const obj4 = `4 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`;
  const obj5 =
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";

  const header = "%PDF-1.4\n";
  const objects = [obj1, obj2, obj3, obj4, obj5];
  const offsets: number[] = [];
  let body = header;

  for (const obj of objects) {
    offsets.push(body.length);
    body += obj;
  }

  const xrefOffset = body.length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${
    objects.length + 1
  } /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return body + xref + trailer;
}

/**
 * Triggers a local file download in the browser using Blob and an anchor tag.
 */
export function triggerBrowserFileDownload(
  filename: string,
  content: string,
  mimeType: string
): boolean {
  try {
    if (typeof document === "undefined") return false;
    const blob = new Blob([content], { type: mimeType });
    const url =
      typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
        ? URL.createObjectURL(blob)
        : `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.setAttribute("data-testid", "note-download-anchor");
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (
      typeof URL !== "undefined" &&
      typeof URL.revokeObjectURL === "function" &&
      url.startsWith("blob:")
    ) {
      setTimeout(() => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore revoke error
        }
      }, 250);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Exports a note as a clean text (`.txt`) file locally.
 */
export function exportNoteAsTextFile(
  note: Partial<Note>,
  overrideContent?: string
): { filename: string; content: string; mimeType: string; downloaded: boolean } {
  const filename = `${sanitizeNoteFilename(note.title)}.txt`;
  const content = formatNoteAsCleanText(note, overrideContent);
  const mimeType = "text/plain;charset=utf-8";
  const downloaded = triggerBrowserFileDownload(filename, content, mimeType);
  return { filename, content, mimeType, downloaded };
}

/**
 * Formats a note into a comprehensive Markdown (`.md`) document including YAML frontmatter,
 * metadata (folder, labels, labelColors, sharedWith, timestamps), full content, and version history.
 */
export function formatNoteAsMarkdown(
  note: Partial<Note>,
  overrideContent?: string
): string {
  const title = (note.title || "Untitled Note").trim();
  const folder = (note.folder || "General").trim();
  const normalizedLabels = normalizeNoteColorLabels(note);
  const labels = normalizedLabels.labels;
  const labelColors = normalizedLabels.labelColors;
  const versions = normalizeNoteVersions(note.versions);
  const sharedWith = normalizeNoteSharedWith(note.sharedWith);
  const rawBody =
    overrideContent !== undefined ? overrideContent : note.content || "";
  const createdTs = note.createdAt || Date.now();
  const updatedTs = note.updatedAt || createdTs;
  const createdIso = new Date(createdTs).toISOString();
  const updatedIso = new Date(updatedTs).toISOString();

  const frontmatterLines: string[] = [
    "---",
    `id: "${(note.id || "note-export").replace(/"/g, '\\"')}"`,
    `title: "${title.replace(/"/g, '\\"')}"`,
    `folder: "${folder.replace(/"/g, '\\"')}"`,
    `pinned: ${Boolean(note.pinned)}`,
    `archived: ${Boolean(note.archived)}`,
    `labels: ${JSON.stringify(labels)}`,
    `labelColors: ${JSON.stringify(labelColors)}`,
    `sharedWith: ${JSON.stringify(sharedWith)}`,
    ...(note.reminderDate ? [`reminderDate: "${note.reminderDate}"`] : []),
    `createdAt: "${createdIso}"`,
    `updatedAt: "${updatedIso}"`,
    `versionCount: ${versions.length}`,
    "---",
    "",
  ];

  const metadataLines: string[] = [
    `# ${title}`,
    "",
    "## Metadata",
    `- **Folder:** ${folder}`,
    `- **Status:** ${note.pinned ? "Pinned" : "Unpinned"}, ${
      note.archived ? "Archived" : "Active"
    }`,
    `- **Labels:** ${
      labels.length > 0
        ? labels
            .map((lbl) => `#${lbl} (${labelColors[lbl] || "cyan"})`)
            .join(", ")
        : "None"
    }`,
  ];

  if (sharedWith.length > 0) {
    metadataLines.push(`- **Shared With:** ${sharedWith.join(", ")}`);
  }
  if (note.reminderDate) {
    metadataLines.push(`- **Reminder Date:** ${note.reminderDate}`);
  }
  metadataLines.push(`- **Created:** ${new Date(createdTs).toLocaleString("en-US")}`);
  metadataLines.push(
    `- **Last Updated:** ${new Date(updatedTs).toLocaleString("en-US")}`
  );
  metadataLines.push("");
  metadataLines.push("## Content");
  metadataLines.push("");
  metadataLines.push(rawBody.trim() ? rawBody : "_No content_");
  metadataLines.push("");
  metadataLines.push("## Version History");
  metadataLines.push("");

  if (versions.length === 0) {
    metadataLines.push("_No previous versions recorded._");
  } else {
    versions.forEach((ver, idx) => {
      const verDateStr = new Date(
        ver.timestamp || ver.createdAt || createdTs
      ).toLocaleString("en-US");
      metadataLines.push(
        `### Version ${idx + 1} (${ver.id || `v-${idx + 1}`}) — ${verDateStr}`
      );
      metadataLines.push(`- **Snapshot Title:** ${ver.title || title}`);
      if (ver.summary) {
        metadataLines.push(`- **Summary:** ${ver.summary}`);
      }
      metadataLines.push("");
      metadataLines.push("```markdown");
      metadataLines.push(ver.content || "");
      metadataLines.push("```");
      metadataLines.push("");
    });
  }

  return [...frontmatterLines, ...metadataLines].join("\n").trim() + "\n";
}

/**
 * Exports a note as a `.md` Markdown document locally, including content, labels, metadata, and version history.
 */
export function exportNoteAsMarkdownFile(
  note: Partial<Note>,
  overrideContent?: string
): { filename: string; content: string; mimeType: string; downloaded: boolean } {
  const filename = `${sanitizeNoteFilename(note.title)}.md`;
  const content = formatNoteAsMarkdown(note, overrideContent);
  const mimeType = "text/markdown;charset=utf-8";
  const downloaded = triggerBrowserFileDownload(filename, content, mimeType);
  return { filename, content, mimeType, downloaded };
}

/**
 * Exports a note as a `.pdf` document locally.
 */
export function exportNoteAsPdfFile(
  note: Partial<Note>,
  overrideContent?: string
): { filename: string; content: string; mimeType: string; downloaded: boolean } {
  const filename = `${sanitizeNoteFilename(note.title)}.pdf`;
  const content = generateNotePdfContent(note, overrideContent);
  const mimeType = "application/pdf";
  const downloaded = triggerBrowserFileDownload(filename, content, mimeType);
  return { filename, content, mimeType, downloaded };
}

/**
 * Generates a 32-bit FNV-1a hash with round mixing for key derivation and authentication.
 */
function deriveKeyBytes(password: string, salt: string, length: number): number[] {
  const seedInput = `${salt}::garia_note_kdf_v1::${password}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;

  for (let round = 0; round < 256; round++) {
    for (let i = 0; i < seedInput.length; i++) {
      const code = seedInput.charCodeAt(i);
      h1 ^= code + round;
      h1 = Math.imul(h1, 0x01000193) >>> 0;
      h2 ^= (h1 ^ code) + (round << 3);
      h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
    }
  }

  const stream: number[] = [];
  for (let i = 0; i < length; i++) {
    h1 ^= (i + 1) * 0x27d4eb2d;
    h1 = Math.imul(h1 ^ (h1 >>> 15), 0x85ebca6b) >>> 0;
    h2 = Math.imul(h2 ^ (h1 >>> 13), 0xc2b2ae35) >>> 0;
    stream.push((h1 ^ h2) & 0xff);
  }
  return stream;
}

function computeVerifierTag(password: string, salt: string, plainBytes: Uint8Array): string {
  const keyTag = deriveKeyBytes(password, `${salt}::mac`, 16);
  let acc1 = 0x811c9dc5;
  let acc2 = 0x1b873593;
  for (let i = 0; i < plainBytes.length; i++) {
    const b = plainBytes[i] ^ keyTag[i % keyTag.length];
    acc1 = Math.imul(acc1 ^ b, 0x01000193) >>> 0;
    acc2 = Math.imul(acc2 ^ ((b + i) & 0xff), 0x85ebca6b) >>> 0;
  }
  for (let i = 0; i < keyTag.length; i++) {
    acc1 = Math.imul(acc1 ^ keyTag[i], 0x01000193) >>> 0;
    acc2 = Math.imul(acc2 ^ keyTag[i], 0xc2b2ae35) >>> 0;
  }
  return acc1.toString(16).padStart(8, "0") + acc2.toString(16).padStart(8, "0");
}

function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(hex)) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/**
 * Encrypts note plaintext client-side using a user password before saving to state.
 */
export function encryptNoteContent(
  plaintext: string,
  password: string,
  customSalt?: string
): string {
  if (!password) return plaintext;
  const salt =
    customSalt ||
    Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const encoder = new TextEncoder();
  const plainBytes = encoder.encode(plaintext ?? "");
  const keyStream = deriveKeyBytes(password, salt, plainBytes.length);
  const cipherBytes = new Uint8Array(plainBytes.length);

  for (let i = 0; i < plainBytes.length; i++) {
    cipherBytes[i] = plainBytes[i] ^ keyStream[i];
  }

  const verifier = computeVerifierTag(password, salt, plainBytes);
  const cipherHex = bytesToHex(cipherBytes);
  return `${ENCRYPTED_NOTE_PREFIX}${salt}:${verifier}:${cipherHex}`;
}

/**
 * Decrypts client-side encrypted note content with the user's password.
 * Returns the original plaintext if the password is valid, or `null` if the password is incorrect.
 */
export function decryptNoteContent(
  encryptedPayload: string,
  password: string
): string | null {
  if (!encryptedPayload || !password) return null;
  if (!encryptedPayload.startsWith(ENCRYPTED_NOTE_PREFIX)) {
    return encryptedPayload;
  }

  const rawBody = encryptedPayload.slice(ENCRYPTED_NOTE_PREFIX.length);
  const parts = rawBody.split(":");
  if (parts.length !== 3) return null;

  const [salt, expectedVerifier, cipherHex] = parts;
  const cipherBytes = hexToBytes(cipherHex);
  if (!cipherBytes) return null;

  const keyStream = deriveKeyBytes(password, salt, cipherBytes.length);
  const plainBytes = new Uint8Array(cipherBytes.length);

  for (let i = 0; i < cipherBytes.length; i++) {
    plainBytes[i] = cipherBytes[i] ^ keyStream[i];
  }

  const actualVerifier = computeVerifierTag(password, salt, plainBytes);
  if (actualVerifier !== expectedVerifier) {
    return null;
  }

  const decoder = new TextDecoder();
  return decoder.decode(plainBytes);
}

/**
 * Checks whether a note object is password-protected / encrypted.
 */
export function isNoteEncrypted(note: Partial<Note> | null | undefined): boolean {
  if (!note) return false;
  return (
    Boolean(note.isEncrypted) ||
    (typeof note.content === "string" && note.content.startsWith(ENCRYPTED_NOTE_PREFIX)) ||
    (typeof note.encryptedContent === "string" &&
      note.encryptedContent.startsWith(ENCRYPTED_NOTE_PREFIX))
  );
}

/**
 * Determines whether a note is a pinned note with an active/pending reminder.
 */
export function isPinnedNoteWithPendingReminder(
  note: Partial<Note> | null | undefined,
  dismissedIds?: Set<string>
): boolean {
  if (!note || !Boolean(note.pinned) || Boolean(note.archived)) return false;
  if (note.id && dismissedIds?.has(note.id)) return false;
  if (typeof note.reminderDate !== "string" || !note.reminderDate.trim()) {
    return false;
  }
  return true;
}

/**
 * Checks whether a reminderDate string is due now or overdue compared to reference time.
 */
export function isNoteReminderDue(
  reminderDate?: string,
  nowMs: number = Date.now()
): boolean {
  if (!reminderDate || !reminderDate.trim()) return false;
  const trimmed = reminderDate.trim();
  // If YYYY-MM-DD, compare against today's local YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const now = new Date(nowMs);
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}`;
    return trimmed <= todayStr;
  }
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return true;
  return parsed <= nowMs;
}

/**
 * Extracts all pinned notes that have a pending reminder.
 */
export function getPinnedNotesWithPendingReminders(
  notes: Note[],
  dismissedIds?: Set<string>
): Note[] {
  if (!Array.isArray(notes)) return [];
  return notes.filter((n) => isPinnedNoteWithPendingReminder(n, dismissedIds));
}

/**
 * Triggers a browser Notification for a pinned note with a pending reminder if supported.
 */
export function triggerPinnedNoteReminderNotification(note: Note): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  try {
    const NotificationCtor = (window as any).Notification;
    if (!NotificationCtor) return false;
    if (NotificationCtor.permission === "denied") return false;
    new NotificationCtor(`Pinned Note Reminder: ${note.title}`, {
      body: `Reminder scheduled for ${note.reminderDate}`,
      tag: `note-reminder-${note.id}`,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the browser's SpeechRecognition constructor if available.
 */
export function getSpeechRecognitionConstructor(): any {
  const g = globalThis as any;
  if (g.SpeechRecognition) return g.SpeechRecognition;
  if (g.webkitSpeechRecognition) return g.webkitSpeechRecognition;
  if (typeof window !== "undefined") {
    const w = window as any;
    return w.SpeechRecognition || w.webkitSpeechRecognition || null;
  }
  return null;
}

export const MAX_NOTE_VERSIONS = 30;

/**
 * Normalizes an arbitrary versions array into a clean NoteVersion[] list.
 */
export function normalizeNoteVersions(rawVersions: any): NoteVersion[] {
  if (!Array.isArray(rawVersions)) return [];
  const normalized: NoteVersion[] = [];
  for (let i = 0; i < rawVersions.length; i++) {
    const item = rawVersions[i];
    if (!item) continue;
    if (typeof item === "string") {
      normalized.push({
        id: `ver-${Date.now()}-${i}`,
        title: "Snapshot",
        content: item,
        timestamp: Date.now() - i * 1000,
        createdAt: Date.now() - i * 1000,
      });
      continue;
    }
    if (typeof item === "object") {
      const content = typeof item.content === "string" ? item.content : "";
      const title =
        typeof item.title === "string" && item.title.trim()
          ? item.title.trim()
          : "Snapshot";
      const ts =
        typeof item.timestamp === "number" && !Number.isNaN(item.timestamp)
          ? item.timestamp
          : typeof item.createdAt === "number" && !Number.isNaN(item.createdAt)
          ? item.createdAt
          : Date.now();
      const id =
        typeof item.id === "string" && item.id.trim()
          ? item.id.trim()
          : `ver-${ts}-${i}`;
      normalized.push({
        id,
        title,
        content,
        timestamp: ts,
        createdAt: ts,
        ...(typeof item.summary === "string" && item.summary.trim()
          ? { summary: item.summary.trim() }
          : {}),
      });
    }
  }
  return normalized.slice(0, MAX_NOTE_VERSIONS);
}

/**
 * Creates a historical NoteVersion snapshot object.
 */
export function createNoteVersionSnapshot(source: {
  title?: string;
  content?: string;
  timestamp?: number;
  summary?: string;
}): NoteVersion {
  const ts =
    typeof source.timestamp === "number" && !Number.isNaN(source.timestamp)
      ? source.timestamp
      : Date.now();
  return {
    id: `ver-${ts}-${Math.random().toString(36).slice(2, 7)}`,
    title:
      typeof source.title === "string" && source.title.trim()
        ? source.title.trim()
        : "Untitled Note",
    content: typeof source.content === "string" ? source.content : "",
    timestamp: ts,
    createdAt: ts,
    ...(source.summary ? { summary: source.summary } : {}),
  };
}

/**
 * Appends a historical snapshot of `existingNote` to its `versions` array
 * if its content or title changed (or when forced).
 */
export function appendNoteVersionSnapshot(
  existingNote: Partial<Note>,
  nextContent?: string,
  nextTitle?: string,
  forceSnapshot: boolean = false
): NoteVersion[] {
  const currentVersions = normalizeNoteVersions(existingNote.versions);
  const prevContent =
    typeof existingNote.content === "string" ? existingNote.content : "";
  const prevTitle =
    typeof existingNote.title === "string" ? existingNote.title : "";

  const contentChanged =
    nextContent !== undefined && nextContent.trim() !== prevContent.trim();
  const titleChanged =
    nextTitle !== undefined && nextTitle.trim() !== prevTitle.trim();

  if (!forceSnapshot && !contentChanged && !titleChanged) {
    return currentVersions;
  }

  if (!prevContent.trim() && !prevTitle.trim() && !forceSnapshot) {
    return currentVersions;
  }

  const latestSnapshot = currentVersions[0];
  if (
    latestSnapshot &&
    latestSnapshot.content === prevContent &&
    latestSnapshot.title === (prevTitle.trim() || "Untitled Note")
  ) {
    return currentVersions;
  }

  const snapshot = createNoteVersionSnapshot({
    title: prevTitle || nextTitle || "Untitled Note",
    content: prevContent,
    timestamp: existingNote.updatedAt || existingNote.createdAt || Date.now(),
  });

  return [snapshot, ...currentVersions].slice(0, MAX_NOTE_VERSIONS);
}

/**
 * Restores a note's content (and title if present) from a selected version snapshot
 * while saving the current state into `versions` so no work is lost.
 */
export function restoreNoteFromVersion(
  note: Note,
  versionIdOrIndex: string | number
): Note {
  const currentVersions = normalizeNoteVersions(note.versions);
  const targetVersion =
    typeof versionIdOrIndex === "number"
      ? currentVersions[versionIdOrIndex]
      : currentVersions.find((v) => v.id === versionIdOrIndex);

  if (!targetVersion) {
    return note;
  }

  const updatedVersions = appendNoteVersionSnapshot(
    note,
    targetVersion.content,
    targetVersion.title || note.title,
    true
  );

  return {
    ...note,
    title: targetVersion.title || note.title,
    content: targetVersion.content,
    versions: updatedVersions,
    updatedAt: Math.max(Date.now(), (note.updatedAt || 0) + 1),
  };
}

/**
 * Validates whether a string is a valid collaborator email address.
 */
export function isValidCollaboratorEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Normalizes a `sharedWith` array of collaborator emails on a Note object.
 */
export function normalizeNoteSharedWith(rawSharedWith: any): string[] {
  if (!Array.isArray(rawSharedWith)) return [];
  const seen = new Set<string>();
  const emails: string[] = [];
  for (const item of rawSharedWith) {
    const str =
      typeof item === "string"
        ? item.trim().toLowerCase()
        : item && typeof item.email === "string"
        ? item.email.trim().toLowerCase()
        : "";
    if (!str) continue;
    if (!seen.has(str)) {
      seen.add(str);
      emails.push(str);
    }
  }
  return emails;
}

/**
 * Adds one or more comma-separated collaborator emails to a note's `sharedWith` array.
 */
export function addCollaboratorEmailToNote(
  note: Partial<Note>,
  rawEmailInput: string
): string[] {
  const existing = normalizeNoteSharedWith(note.sharedWith);
  if (!rawEmailInput || typeof rawEmailInput !== "string") return existing;
  const candidates = rawEmailInput
    .split(/[,;\s]+/)
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.includes("@") && part.length >= 3);
  return normalizeNoteSharedWith([...existing, ...candidates]);
}

/**
 * Removes a collaborator email from a note's `sharedWith` array.
 */
export function removeCollaboratorEmailFromNote(
  note: Partial<Note>,
  emailToRemove: string
): string[] {
  const target = (emailToRemove || "").trim().toLowerCase();
  return normalizeNoteSharedWith(note.sharedWith).filter(
    (email) => email.toLowerCase() !== target
  );
}

const SMART_TAG_STOPWORDS = new Set([
  "this",
  "that",
  "with",
  "from",
  "have",
  "will",
  "your",
  "they",
  "their",
  "there",
  "what",
  "when",
  "where",
  "which",
  "while",
  "about",
  "into",
  "over",
  "under",
  "between",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "some",
  "such",
  "only",
  "other",
  "more",
  "most",
  "very",
  "also",
  "just",
  "than",
  "then",
  "them",
  "these",
  "those",
  "been",
  "being",
  "were",
  "does",
  "doing",
  "should",
  "would",
  "could",
  "notes",
  "note",
  "study",
  "write",
  "using",
  "used",
  "make",
  "made",
  "each",
  "both",
]);

const ABYA_CURRICULUM_TAG_RULES: Array<{
  tag: string;
  patterns: RegExp[];
}> = [
  {
    tag: "Physics",
    patterns: [
      /\b(physics|kinematics|thermodynamics|electrostatics|optics|mechanics|quantum|force|velocity|acceleration|momentum|gravity|magnetism|circuit|voltage|current|newton|joule|watt|coulomb|gauss|relativity)\b/i,
    ],
  },
  {
    tag: "Chemistry",
    patterns: [
      /\b(chemistry|organic|inorganic|reaction|molecule|atom|electron|periodic|acid|base|ph|molarity|stoichiometry|valency|polymer|alkane|alkene|benzene|catalyst|oxidation|reduction|titration)\b/i,
    ],
  },
  {
    tag: "Biology",
    patterns: [
      /\b(biology|cell|photosynthesis|respiration|chloroplast|mitochondria|dna|rna|genetics|chromosome|evolution|ecology|enzyme|protein|anatomy|botany|zoology|neuron|homeostasis|osmosis)\b/i,
    ],
  },
  {
    tag: "Mathematics",
    patterns: [
      /\b(math|mathematics|calculus|derivative|integral|differentiation|integration|algebra|matrix|determinant|trigonometry|geometry|vector|probability|statistics|theorem|polynomial|logarithm)\b/i,
    ],
  },
  {
    tag: "Computer Science",
    patterns: [
      /\b(computer|algorithm|programming|python|javascript|typescript|react|database|sql|network|binary|compiler|recursion|array|linked list|tree|graph|complexity|software|code)\b/i,
    ],
  },
  {
    tag: "Economics",
    patterns: [
      /\b(economics|microeconomics|macroeconomics|demand|supply|inflation|gdp|fiscal|monetary|market|elasticity|monopoly|utility|budget|tariff|trade)\b/i,
    ],
  },
  {
    tag: "Accountancy",
    patterns: [
      /\b(accountancy|accounting|ledger|journal|balance sheet|depreciation|debenture|partnership|goodwill|ratio analysis|cash flow|dividend|asset|liability|equity)\b/i,
    ],
  },
  {
    tag: "History",
    patterns: [
      /\b(history|empire|revolution|dynasty|civilization|colonial|independence|constitution|treaty|war|medieval|ancient|monarchy|republic)\b/i,
    ],
  },
  {
    tag: "Formula",
    patterns: [
      /\b(formula|formulas|equation|equations|theorem|law|derivation|identity|constant|calculate)\b|[=+\-*/^]{2,}|\b[A-Za-z]\s*=\s*[A-Za-z0-9]/i,
    ],
  },
  {
    tag: "Exam Prep",
    patterns: [
      /\b(exam|test|quiz|midterm|final|board|jee|neet|cuet|pyq|important|vvi|high-yield|marks|syllabus|revision)\b/i,
    ],
  },
  {
    tag: "Summary",
    patterns: [
      /\b(summary|overview|recap|takeaways|key points|outline|synopsis|brief|conclusion)\b/i,
    ],
  },
  {
    tag: "Lecture",
    patterns: [
      /\b(lecture|class|chapter|unit|module|professor|teacher|seminar|session)\b/i,
    ],
  },
  {
    tag: "Assignment",
    patterns: [
      /\b(assignment|homework|project|lab|experiment|report|submission|deadline|todo|task)\b/i,
    ],
  },
];

function toTitleCaseTag(word: string): string {
  const cleaned = word.trim().replace(/^#+/, "");
  if (!cleaned) return "";
  return cleaned
    .split(/[\s_-]+/)
    .map((part) =>
      part.length <= 3 && /^(dna|rna|gdp|pyq|vvi|sql|api|cpu|ram)$/i.test(part)
        ? part.toUpperCase()
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join(" ");
}

/**
 * Uses Abya AI's curriculum & semantic analysis engine to suggest relevant tags/labels
 * based on a note's content and title.
 */
export function suggestSmartTagsFromContent(
  content: string,
  title: string = "",
  existingLabels: string[] = []
): string[] {
  const combined = `${title || ""} \n ${content || ""}`.trim();
  const seen = new Set<string>(existingLabels.map((l) => l.trim().toLowerCase()));
  const suggestions: string[] = [];

  const addCandidate = (rawTag: string) => {
    const formatted = toTitleCaseTag(rawTag);
    if (!formatted || formatted.length < 2 || formatted.length > 28) return;
    const lower = formatted.toLowerCase();
    if (seen.has(lower)) return;
    seen.add(lower);
    suggestions.push(formatted);
  };

  if (!combined) {
    addCandidate("Study Note");
    addCandidate("Revision");
    addCandidate("Important");
    return suggestions;
  }

  // 1. Match Abya AI curriculum & structural rules
  for (const rule of ABYA_CURRICULUM_TAG_RULES) {
    if (rule.patterns.some((re) => re.test(combined))) {
      addCandidate(rule.tag);
    }
  }

  // 2. Check explicit hashtags in content (e.g., #thermodynamics)
  const hashtagMatches = combined.match(/#([a-zA-Z][a-zA-Z0-9_-]{2,20})/g) || [];
  for (const match of hashtagMatches) {
    addCandidate(match.slice(1));
  }

  // 3. Extract salient academic/topic keywords from content & title
  const words = combined
    .replace(/\[\[([^\]]+)\]\]/g, " $1 ")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(
      (w) =>
        w.length >= 4 &&
        w.length <= 20 &&
        !/^\d+$/.test(w) &&
        !SMART_TAG_STOPWORDS.has(w.toLowerCase())
    );

  const freqMap = new Map<string, { word: string; count: number }>();
  for (const word of words) {
    const lower = word.toLowerCase();
    const prev = freqMap.get(lower);
    if (prev) {
      prev.count += 1;
    } else {
      freqMap.set(lower, { word, count: 1 });
    }
  }

  const rankedWords = Array.from(freqMap.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.word.length - a.word.length;
  });

  for (const item of rankedWords.slice(0, 4)) {
    addCandidate(item.word);
    if (suggestions.length >= 5) break;
  }

  // Ensure at least 2 helpful tags are always suggested
  if (suggestions.length === 0) {
    addCandidate("Revision");
    addCandidate("Key Concept");
  } else if (suggestions.length === 1) {
    addCandidate("Revision");
  }

  return suggestions.slice(0, 6);
}

/**
 * Parses a raw response from the Abya AI Smart Tag endpoint or LLM text output into a clean array of tags.
 */
export function parseSmartTagsResponse(rawResponse: any): string[] {
  if (!rawResponse) return [];
  let rawList: string[] = [];

  if (Array.isArray(rawResponse)) {
    rawList = rawResponse.map((item) => String(item || ""));
  } else if (typeof rawResponse === "object") {
    if (Array.isArray(rawResponse.tags)) {
      rawList = rawResponse.tags.map((item: any) => String(item || ""));
    } else if (Array.isArray(rawResponse.labels)) {
      rawList = rawResponse.labels.map((item: any) => String(item || ""));
    } else if (typeof rawResponse.text === "string") {
      return parseSmartTagsResponse(rawResponse.text);
    }
  } else if (typeof rawResponse === "string") {
    const trimmed = rawResponse.trim();
    const jsonMatch = trimmed.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          rawList = parsed.map((item) => String(item || ""));
        }
      } catch {
        // Fallback to delimiter splitting below
      }
    }
    if (rawList.length === 0) {
      rawList = trimmed
        .replace(/^tags\s*:\s*/i, "")
        .split(/[,;\n•]+/)
        .map((s) => s.trim());
    }
  }

  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const item of rawList) {
    const tag = item
      .replace(/^[-*•#\d.)\s]+/, "")
      .replace(/["'`[\]]/g, "")
      .trim();
    if (!tag || tag.length < 2 || tag.length > 28) continue;
    const lower = tag.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    cleaned.push(tag);
  }
  return cleaned.slice(0, 6);
}

/**
 * Requests smart tags from Abya AI (combining the `/api/ai/smart-tags` endpoint when available
 * with the instant local Abya AI curriculum tagger fallback).
 */
export async function requestAbyaSmartTags(
  content: string,
  title: string = "",
  existingLabels: string[] = []
): Promise<{ tags: string[]; source: "online_ai" | "abya_engine" }> {
  const localSuggestions = suggestSmartTagsFromContent(
    content,
    title,
    existingLabels
  );

  if (typeof fetch === "function") {
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller
      ? setTimeout(() => controller.abort(), 3500)
      : null;
    try {
      const res = await fetch("/api/ai/smart-tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          existingLabels,
        }),
        ...(controller ? { signal: controller.signal } : {}),
      });
      if (timeoutId) clearTimeout(timeoutId);
      if (res && res.ok) {
        const data = await res.json();
        const parsed = parseSmartTagsResponse(data);
        if (parsed.length > 0) {
          const merged = Array.from(
            new Set([...parsed, ...localSuggestions])
          ).slice(0, 6);
          return {
            tags: merged,
            source: data?.provider === "online_ai" ? "online_ai" : "abya_engine",
          };
        }
      }
    } catch {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  return {
    tags: localSuggestions,
    source: "abya_engine",
  };
}

