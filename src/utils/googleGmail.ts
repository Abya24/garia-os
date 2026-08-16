import { GmailMessageSummary, GmailFullMessage, AcademicEmailTemplate } from "../types";

/**
 * Standard Academic Email Templates tailored for Class 10-12 and College Students
 */
export const ACADEMIC_EMAIL_TEMPLATES: AcademicEmailTemplate[] = [
  {
    id: "leave_app_medical",
    title: "🏥 Leave Application (Medical / Health)",
    category: "School & College",
    subject: "Leave Application regarding [Reason, e.g., Viral Fever] - [Student Name], Class [Class & Section]",
    body: `Respected [Teacher's / Principal's Name],

I am writing this email to formally inform you that I am unwell with [Fever / Medical Condition] and have been advised medical rest by my physician from [Start Date] to [End Date].

Therefore, I will be unable to attend classes during this period. I have requested my classmate to share class notes and homework assignments so I do not fall behind in my studies.

I will submit the medical certificate upon resuming classes. I kindly request you to grant me leave for the aforementioned dates.

Thanking you.

Yours obediently,
[Student Name]
Class: [e.g., Class 12 Science - Section A]
Roll No: [Roll Number]
Contact: [Phone Number]`,
  },
  {
    id: "doubt_clarification",
    title: "❓ Subject Doubt / Query Clarification",
    category: "Teacher & Doubt",
    subject: "Subject Doubt Clarification: [Subject Name] - [Chapter / Topic Title] - [Student Name]",
    body: `Dear [Teacher's Name],

I hope this email finds you well.

While revising Chapter [Chapter Number / Name, e.g., Chemical Kinetics], I came across a conceptual question regarding [Specific Concept / Formula / Problem]. 

Could you please clarify [Brief Description of Doubt] or suggest a convenient time during office hours or before class when I can discuss this with you?

I have attached my work and relevant textbook reference for your convenience.

Thank you very much for your guidance and time.

Sincerely,
[Student Name]
Class: [Class & Stream]
Roll No: [Roll Number]`,
  },
  {
    id: "assignment_extension",
    title: "⏳ Request for Assignment Extension",
    category: "Exams & Deadlines",
    subject: "Request for Extension: [Assignment / Project Name] - [Student Name]",
    body: `Respected [Professor / Teacher's Name],

I am writing to respectfully request a short extension on the submission deadline for [Assignment / Project Name], which is currently due on [Current Due Date].

Due to [Unforeseen Reason / Illness / Multiple Back-to-Back Practicals], I require additional time to complete the research and ensure high-quality work.

I would be extremely grateful if you could kindly grant me an extension until [Proposed New Date]. I have already completed [e.g., 70%] of the work and will submit the final file promptly.

Thank you for your understanding.

Yours sincerely,
[Student Name]
Class: [Class & Stream]
Roll No: [Roll Number]`,
  },
  {
    id: "recommendation_lor",
    title: "📜 Letter of Recommendation (LOR) Request",
    category: "Career & Recommendations",
    subject: "Letter of Recommendation Request for [College / Scholarship Application] - [Student Name]",
    body: `Dear [Teacher / Counselor Name],

I hope you are doing well.

I am currently preparing my application for [Target University / Program / Scholarship Name, e.g., B.Tech / CUET / National Scholarship] for the upcoming academic year.

Having enjoyed your [Subject Name] classes and benefited immensely from your mentorship, I would be deeply honored if you would consider writing a Letter of Recommendation supporting my application.

The deadline for submission is [Application Deadline Date]. I have attached my latest academic transcript, resume, and a brief statement of purpose for your review.

Please let me know if you need any additional details. Thank you very much for your continued support and guidance.

With warm regards,
[Student Name]
Class: [Class & Stream]
Email: [Your Email]
Phone: [Your Phone]`,
  },
  {
    id: "scholarship_query",
    title: "🎓 Scholarship / Admission Inquiry",
    category: "Career & Recommendations",
    subject: "Inquiry Regarding [Scholarship / Admission Name] - Eligibility & Documentation",
    body: `Dear Admissions / Scholarship Committee,

I am writing to inquire about the eligibility criteria and documentation process for the [Scholarship / Admission Program Name] for [Academic Year 2024-2025].

I am currently a student of [Class 12 / Stream] with an academic score of [Percentage / Grade] and keen interest in [Field of Study].

Could you please provide information on:
1. Exact deadline for submitting application forms and supporting certificates.
2. Whether merit criteria consider both Class 10 and Class 12 term assessments.
3. Portal links for document verification.

Thank you for your time and assistance.

Warm regards,
[Student Name]
[Contact Number]
[City / State]`,
  },
  {
    id: "study_group_invite",
    title: "👥 Study Group & Revision Schedule Invite",
    category: "Study Group",
    subject: "Group Study Session: [Subject / Exam Name] - [Proposed Date & Time]",
    body: `Hi [Classmate / Group Name],

I am organizing a collaborative group revision session for [Subject / Exam Name, e.g., CBSE Physics Term Exam] to practice high-yield PYQs and solve tricky numerical problems together.

📅 Date: [Proposed Date]
⏰ Time: [Proposed Time, e.g., 5:00 PM - 7:00 PM]
📍 Location / Link: [Google Meet Link / Library]
🎯 Focus Topics: [Topic 1, Topic 2, Topic 3]

Please let me know if this schedule works for you or if we should adjust the timing. Looking forward to productive study time!

Best,
[Your Name]
Class: [Class & Stream]`,
  },
];

/**
 * Base64URL encoding compliant with Gmail API
 */
export function base64UrlEncode(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Base64URL decoding for Gmail API message payload bodies
 */
export function base64UrlDecode(str: string): string {
  try {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (e) {
    console.error("Failed to decode base64url string:", e);
    return "";
  }
}

/**
 * Fetch Gmail user profile (email address, total messages, threads)
 */
export async function getGmailUserProfile(accessToken: string): Promise<{
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}> {
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || `Gmail Profile Error (${res.status})`);
  }

  return await res.json();
}

/**
 * List Gmail messages with filtering, query search, and pagination
 */
export async function listGmailMessages(
  accessToken: string,
  options: {
    maxResults?: number;
    q?: string;
    pageToken?: string;
    labelIds?: string[];
  } = {}
): Promise<{
  messages: GmailMessageSummary[];
  nextPageToken?: string;
  resultSizeEstimate: number;
}> {
  const params = new URLSearchParams();
  params.set("maxResults", String(options.maxResults || 20));
  if (options.q) params.set("q", options.q);
  if (options.pageToken) params.set("pageToken", options.pageToken);
  if (options.labelIds && options.labelIds.length > 0) {
    options.labelIds.forEach((id) => params.append("labelIds", id));
  }

  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );

  if (!listRes.ok) {
    const err = await listRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to fetch messages (${listRes.status})`);
  }

  const data = await listRes.json();
  const rawList: { id: string; threadId: string }[] = data.messages || [];

  if (rawList.length === 0) {
    return {
      messages: [],
      nextPageToken: data.nextPageToken,
      resultSizeEstimate: data.resultSizeEstimate || 0,
    };
  }

  // Fetch summaries in parallel (up to 20 messages)
  const summaries = await Promise.all(
    rawList.map(async (item) => {
      try {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          }
        );

        if (!msgRes.ok) return null;
        const msg = await msgRes.json();

        const headers: Record<string, string> = {};
        (msg.payload?.headers || []).forEach((h: { name: string; value: string }) => {
          headers[h.name.toLowerCase()] = h.value;
        });

        const isUnread = (msg.labelIds || []).includes("UNREAD");
        const isStarred = (msg.labelIds || []).includes("STARRED");

        return {
          id: msg.id,
          threadId: msg.threadId,
          snippet: msg.snippet || "",
          subject: headers["subject"] || "(No Subject)",
          from: headers["from"] || "Unknown Sender",
          to: headers["to"] || "",
          date: headers["date"] || new Date(parseInt(msg.internalDate || "0", 10)).toLocaleString(),
          timestamp: parseInt(msg.internalDate || "0", 10) || Date.now(),
          isUnread,
          isStarred,
          labelIds: msg.labelIds || [],
        } as GmailMessageSummary;
      } catch (e) {
        console.error("Error fetching message summary:", e);
        return null;
      }
    })
  );

  const validSummaries = summaries.filter(Boolean) as GmailMessageSummary[];

  return {
    messages: validSummaries,
    nextPageToken: data.nextPageToken,
    resultSizeEstimate: data.resultSizeEstimate || validSummaries.length,
  };
}

/**
 * Parse full message content including bodyHtml, bodyText, and headers
 */
export async function getGmailMessageDetails(
  accessToken: string,
  messageId: string
): Promise<GmailFullMessage> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to fetch message details (${res.status})`);
  }

  const msg = await res.json();
  const headers: Record<string, string> = {};
  (msg.payload?.headers || []).forEach((h: { name: string; value: string }) => {
    headers[h.name.toLowerCase()] = h.value;
  });

  let bodyText = "";
  let bodyHtml = "";

  function extractParts(part: any) {
    if (!part) return;

    if (part.mimeType === "text/plain" && part.body?.data) {
      bodyText += base64UrlDecode(part.body.data);
    } else if (part.mimeType === "text/html" && part.body?.data) {
      bodyHtml += base64UrlDecode(part.body.data);
    }

    if (part.parts && Array.isArray(part.parts)) {
      part.parts.forEach(extractParts);
    }
  }

  if (msg.payload?.body?.data) {
    const mime = msg.payload?.mimeType || "text/plain";
    if (mime.includes("html")) {
      bodyHtml = base64UrlDecode(msg.payload.body.data);
    } else {
      bodyText = base64UrlDecode(msg.payload.body.data);
    }
  } else if (msg.payload?.parts) {
    extractParts(msg.payload);
  }

  const isUnread = (msg.labelIds || []).includes("UNREAD");
  const isStarred = (msg.labelIds || []).includes("STARRED");

  return {
    id: msg.id,
    threadId: msg.threadId,
    snippet: msg.snippet || "",
    subject: headers["subject"] || "(No Subject)",
    from: headers["from"] || "Unknown Sender",
    to: headers["to"] || "",
    date: headers["date"] || new Date(parseInt(msg.internalDate || "0", 10)).toLocaleString(),
    timestamp: parseInt(msg.internalDate || "0", 10) || Date.now(),
    isUnread,
    isStarred,
    labelIds: msg.labelIds || [],
    bodyHtml: bodyHtml || undefined,
    bodyText: bodyText || msg.snippet || "",
    headers,
  };
}

/**
 * Send an email using standard RFC 2822 formatting
 */
export async function sendGmailMessage(
  accessToken: string,
  emailData: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
    inReplyTo?: string;
    threadId?: string;
  }
): Promise<{ id: string; threadId: string; labelIds: string[] }> {
  // Build RFC 2822 raw message
  const lines: string[] = [
    `To: ${emailData.to.trim()}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(emailData.subject)))}?=`,
    `Content-Type: text/plain; charset=UTF-8`,
    `MIME-Version: 1.0`,
  ];

  if (emailData.cc?.trim()) {
    lines.push(`Cc: ${emailData.cc.trim()}`);
  }
  if (emailData.bcc?.trim()) {
    lines.push(`Bcc: ${emailData.bcc.trim()}`);
  }
  if (emailData.inReplyTo?.trim()) {
    lines.push(`In-Reply-To: ${emailData.inReplyTo.trim()}`);
    lines.push(`References: ${emailData.inReplyTo.trim()}`);
  }

  lines.push("", emailData.body);

  const rawMessage = lines.join("\r\n");
  const encodedRaw = base64UrlEncode(rawMessage);

  const payload: any = { raw: encodedRaw };
  if (emailData.threadId) {
    payload.threadId = emailData.threadId;
  }

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to send email (${res.status})`);
  }

  return await res.json();
}

/**
 * Modify labels (e.g. Star, Mark Read/Unread, Archive)
 */
export async function modifyGmailMessageLabels(
  accessToken: string,
  messageId: string,
  addLabelIds: string[] = [],
  removeLabelIds: string[] = []
): Promise<{ id: string; labelIds: string[] }> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        addLabelIds,
        removeLabelIds,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to update labels (${res.status})`);
  }

  return await res.json();
}

/**
 * Move message to Trash
 */
export async function trashGmailMessage(
  accessToken: string,
  messageId: string
): Promise<{ id: string; threadId: string }> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to trash email (${res.status})`);
  }

  return await res.json();
}
