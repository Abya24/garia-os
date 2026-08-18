import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Unsubscribe,
} from "firebase/firestore";
import {
  db,
  auth,
  OperationType,
  handleFirestoreError,
} from "./firebase";
import {
  SharedWorkspace,
  SharedTask,
  ActivityLogItem,
  WorkspaceMember,
  CollaborationNotification,
  WorkspaceType,
  CollaborationRole,
} from "../types";

const LOCAL_STORAGE_WORKSPACES_KEY = "garia_shared_workspaces";
const LOCAL_STORAGE_ACTIVITIES_KEY = "garia_shared_activities";
const LOCAL_STORAGE_NOTIFS_KEY = "garia_collab_notifications";

/**
 * Generate a clean, human-friendly 6-character alphanumeric join code.
 * e.g. "GARIA-8X39" or "G7K2P9"
 */
export function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `G-${code}`;
}

/**
 * Generate random avatar color for collaborators
 */
export function getCollaboratorColor(index: number = 0): string {
  const colors = [
    "#3B82F6", // Blue
    "#10B981", // Emerald
    "#8B5CF6", // Purple
    "#F59E0B", // Amber
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#F97316", // Orange
    "#6366F1", // Indigo
  ];
  return colors[index % colors.length];
}

// Local storage fallback helpers
function getLocalWorkspaces(): SharedWorkspace[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_WORKSPACES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalWorkspaces(workspaces: SharedWorkspace[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_WORKSPACES_KEY, JSON.stringify(workspaces));
  } catch (e) {
    console.error("Failed to save local shared workspaces:", e);
  }
}

function getLocalActivities(workspaceId?: string): ActivityLogItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ACTIVITIES_KEY);
    const list: ActivityLogItem[] = raw ? JSON.parse(raw) : [];
    if (workspaceId) {
      return list.filter((item) => item.workspaceId === workspaceId);
    }
    return list;
  } catch {
    return [];
  }
}

function saveLocalActivity(activity: ActivityLogItem): void {
  try {
    const list = getLocalActivities();
    list.unshift(activity);
    localStorage.setItem(LOCAL_STORAGE_ACTIVITIES_KEY, JSON.stringify(list.slice(0, 100)));
  } catch (e) {
    console.error("Failed to save local activity log:", e);
  }
}

function getLocalNotifications(userId: string): CollaborationNotification[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_NOTIFS_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalNotification(notif: CollaborationNotification): void {
  try {
    const list = getLocalNotifications(notif.userId);
    list.unshift(notif);
    localStorage.setItem(
      `${LOCAL_STORAGE_NOTIFS_KEY}_${notif.userId}`,
      JSON.stringify(list.slice(0, 50))
    );
  } catch (e) {
    console.error("Failed to save local notification:", e);
  }
}

/**
 * Creates a new Shared Workspace in Firestore with offline localStorage sync
 */
export async function createSharedWorkspace(params: {
  type: WorkspaceType;
  title: string;
  description?: string;
  currentUser: {
    uid: string;
    displayName?: string | null;
    email?: string | null;
  };
  initialTasks?: SharedTask[];
  initialNoteContent?: string;
}): Promise<SharedWorkspace> {
  const wsId = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const joinCode = generateJoinCode();
  const timestamp = Date.now();
  const userId = params.currentUser.uid;
  const userName = params.currentUser.displayName || "Student User";
  const userEmail = params.currentUser.email || `${userId.slice(0, 8)}@student.garia.os`;

  const ownerMember: WorkspaceMember = {
    userId,
    name: userName,
    email: userEmail,
    role: "owner",
    avatarColor: getCollaboratorColor(0),
    joinedAt: timestamp,
  };

  const newWorkspace: SharedWorkspace = {
    id: wsId,
    type: params.type,
    title: params.title.trim(),
    description: params.description?.trim() || "",
    joinCode,
    ownerId: userId,
    ownerName: userName,
    ownerEmail: userEmail,
    members: {
      [userId]: ownerMember,
    },
    memberIds: [userId],
    allowInviteLink: true,
    tasks: params.initialTasks || [],
    noteContent: params.initialNoteContent || "",
    noteTags: [],
    isLocked: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastModifiedBy: {
      userId,
      name: userName,
      email: userEmail,
    },
  };

  // 1. Save locally first for instant UI response
  const localList = getLocalWorkspaces();
  const updatedLocal = [newWorkspace, ...localList.filter((w) => w.id !== wsId)];
  saveLocalWorkspaces(updatedLocal);

  // 2. Log initial creation activity
  const initialLog: ActivityLogItem = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    workspaceId: wsId,
    userId,
    userName,
    userEmail,
    action: "created_workspace",
    details: `Created collaborative ${params.type === "tasks" ? "task list" : "notes doc"} "${params.title}"`,
    timestamp,
  };
  saveLocalActivity(initialLog);

  // 3. Sync to Cloud Firestore if online
  if (auth.currentUser) {
    const wsPath = `shared_workspaces/${wsId}`;
    try {
      await setDoc(doc(db, "shared_workspaces", wsId), newWorkspace);
      // Save activity log subcollection
      const actRef = doc(db, "shared_workspaces", wsId, "activities", initialLog.id);
      await setDoc(actRef, initialLog);
    } catch (err) {
      console.warn("Could not immediately sync new workspace to Firestore:", err);
    }
  }

  return newWorkspace;
}

/**
 * Join an existing shared workspace using unique Join Code or Share ID
 */
export async function joinWorkspaceByCode(
  joinCodeOrId: string,
  currentUser: {
    uid: string;
    displayName?: string | null;
    email?: string | null;
  }
): Promise<{ success: boolean; workspace?: SharedWorkspace; error?: string }> {
  const cleanCode = joinCodeOrId.trim().toUpperCase();
  const userId = currentUser.uid;
  const userName = currentUser.displayName || "Collaborator";
  const userEmail = currentUser.email || `${userId.slice(0, 8)}@student.garia.os`;
  const timestamp = Date.now();

  try {
    let targetWorkspace: SharedWorkspace | null = null;

    // Search in Firestore if authenticated
    if (auth.currentUser) {
      try {
        // First try finding by joinCode
        const q = query(
          collection(db, "shared_workspaces"),
          where("joinCode", "==", cleanCode),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          targetWorkspace = snap.docs[0].data() as SharedWorkspace;
        } else {
          // Try direct document ID lookup
          const docRef = doc(db, "shared_workspaces", joinCodeOrId.trim());
          const directSnap = await getDoc(docRef);
          if (directSnap.exists()) {
            targetWorkspace = directSnap.data() as SharedWorkspace;
          }
        }
      } catch (err) {
        console.warn("Firestore lookup failed during join, checking local caches:", err);
      }
    }

    // Check local storage fallback
    if (!targetWorkspace) {
      const locals = getLocalWorkspaces();
      targetWorkspace =
        locals.find(
          (w) =>
            w.joinCode.toUpperCase() === cleanCode ||
            w.id.toLowerCase() === joinCodeOrId.trim().toLowerCase()
        ) || null;
    }

    if (!targetWorkspace) {
      return {
        success: false,
        error: "Workspace not found. Please verify the 6-character Join Code or invite link.",
      };
    }

    // Check if already a member
    if (targetWorkspace.memberIds.includes(userId)) {
      return { success: true, workspace: targetWorkspace };
    }

    // Check if invite link is allowed
    if (!targetWorkspace.allowInviteLink && targetWorkspace.ownerId !== userId) {
      return {
        success: false,
        error: "This workspace is currently private and invite links are disabled.",
      };
    }

    // Add user as Editor member
    const newMember: WorkspaceMember = {
      userId,
      name: userName,
      email: userEmail,
      role: "editor",
      avatarColor: getCollaboratorColor(targetWorkspace.memberIds.length),
      joinedAt: timestamp,
    };

    const updatedMembers = {
      ...targetWorkspace.members,
      [userId]: newMember,
    };
    const updatedMemberIds = Array.from(new Set([...targetWorkspace.memberIds, userId]));

    const updatedWs: SharedWorkspace = {
      ...targetWorkspace,
      members: updatedMembers,
      memberIds: updatedMemberIds,
      updatedAt: timestamp,
      lastModifiedBy: {
        userId,
        name: userName,
        email: userEmail,
      },
    };

    // Update Local
    const locals = getLocalWorkspaces();
    saveLocalWorkspaces([updatedWs, ...locals.filter((w) => w.id !== updatedWs.id)]);

    // Log Join Activity
    const joinLog: ActivityLogItem = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      workspaceId: updatedWs.id,
      userId,
      userName,
      userEmail,
      action: "joined_workspace",
      details: `${userName} joined the shared workspace as Editor`,
      timestamp,
    };
    saveLocalActivity(joinLog);

    // Notify workspace owner
    if (targetWorkspace.ownerId !== userId) {
      const ownerNotif: CollaborationNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: targetWorkspace.ownerId,
        fromUserId: userId,
        fromUserName: userName,
        workspaceId: updatedWs.id,
        workspaceTitle: updatedWs.title,
        workspaceType: updatedWs.type,
        type: "member_joined",
        title: "New Collaborator Joined",
        message: `${userName} joined your shared ${updatedWs.type === "tasks" ? "task list" : "notes document"} "${updatedWs.title}".`,
        read: false,
        timestamp,
      };
      saveLocalNotification(ownerNotif);

      if (auth.currentUser) {
        try {
          await setDoc(
            doc(
              db,
              "users",
              targetWorkspace.ownerId,
              "collaboration_notifications",
              ownerNotif.id
            ),
            ownerNotif
          );
        } catch (e) {
          console.warn("Could not save cloud notification:", e);
        }
      }
    }

    // Sync to Firestore
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, "shared_workspaces", updatedWs.id), {
          members: updatedMembers,
          memberIds: updatedMemberIds,
          updatedAt: timestamp,
          lastModifiedBy: {
            userId,
            name: userName,
            email: userEmail,
          },
        });
        const actRef = doc(db, "shared_workspaces", updatedWs.id, "activities", joinLog.id);
        await setDoc(actRef, joinLog);
      } catch (err) {
        console.warn("Could not update Firestore workspace membership:", err);
      }
    }

    return { success: true, workspace: updatedWs };
  } catch (error) {
    console.error("Error joining workspace:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to join workspace",
    };
  }
}

/**
 * Invite a collaborator by email/name and assign their permission role
 */
export async function inviteCollaboratorToWorkspace(
  workspace: SharedWorkspace,
  inviteeNameOrEmail: string,
  role: CollaborationRole,
  currentUser: {
    uid: string;
    displayName?: string | null;
    email?: string | null;
  }
): Promise<{ success: boolean; workspace: SharedWorkspace }> {
  const cleanInput = inviteeNameOrEmail.trim();
  const timestamp = Date.now();
  const simulatedUserId = `user_${cleanInput.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
  const inviterName = currentUser.displayName || "Collaborator";

  const newMember: WorkspaceMember = {
    userId: simulatedUserId,
    name: cleanInput.includes("@") ? cleanInput.split("@")[0] : cleanInput,
    email: cleanInput.includes("@") ? cleanInput : `${cleanInput.toLowerCase()}@student.garia.os`,
    role,
    avatarColor: getCollaboratorColor(Object.keys(workspace.members).length),
    joinedAt: timestamp,
  };

  const updatedMembers = {
    ...workspace.members,
    [simulatedUserId]: newMember,
  };
  const updatedMemberIds = Array.from(new Set([...workspace.memberIds, simulatedUserId]));

  const updatedWs: SharedWorkspace = {
    ...workspace,
    members: updatedMembers,
    memberIds: updatedMemberIds,
    updatedAt: timestamp,
    lastModifiedBy: {
      userId: currentUser.uid,
      name: inviterName,
      email: currentUser.email || "",
    },
  };

  // Save local
  const locals = getLocalWorkspaces();
  saveLocalWorkspaces([updatedWs, ...locals.filter((w) => w.id !== updatedWs.id)]);

  // Activity Log
  const actLog: ActivityLogItem = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    workspaceId: workspace.id,
    userId: currentUser.uid,
    userName: inviterName,
    userEmail: currentUser.email || "",
    action: "member_invited",
    details: `Invited ${newMember.name} as ${role.toUpperCase()}`,
    timestamp,
  };
  saveLocalActivity(actLog);

  // Collaboration Notification
  const notif: CollaborationNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: simulatedUserId,
    fromUserId: currentUser.uid,
    fromUserName: inviterName,
    workspaceId: workspace.id,
    workspaceTitle: workspace.title,
    workspaceType: workspace.type,
    type: "invite",
    title: `Invited to ${workspace.title}`,
    message: `${inviterName} invited you to collaborate on "${workspace.title}" as ${role.toUpperCase()}.`,
    read: false,
    timestamp,
  };
  saveLocalNotification(notif);

  // Firestore update
  if (auth.currentUser) {
    try {
      await updateDoc(doc(db, "shared_workspaces", workspace.id), {
        members: updatedMembers,
        memberIds: updatedMemberIds,
        updatedAt: timestamp,
      });
      await setDoc(
        doc(db, "shared_workspaces", workspace.id, "activities", actLog.id),
        actLog
      );
    } catch (e) {
      console.warn("Could not sync invite to Firestore:", e);
    }
  }

  return { success: true, workspace: updatedWs };
}

/**
 * Update member role (Owner / Editor / Viewer)
 */
export async function updateMemberRoleInWorkspace(
  workspace: SharedWorkspace,
  targetUserId: string,
  newRole: CollaborationRole,
  currentUser: {
    uid: string;
    displayName?: string | null;
  }
): Promise<SharedWorkspace> {
  const currentMember = workspace.members[targetUserId];
  if (!currentMember) return workspace;

  const timestamp = Date.now();
  const updatedMember: WorkspaceMember = {
    ...currentMember,
    role: newRole,
  };

  const updatedMembers = {
    ...workspace.members,
    [targetUserId]: updatedMember,
  };

  const updatedWs: SharedWorkspace = {
    ...workspace,
    members: updatedMembers,
    updatedAt: timestamp,
  };

  saveLocalWorkspaces([updatedWs, ...getLocalWorkspaces().filter((w) => w.id !== updatedWs.id)]);

  const actLog: ActivityLogItem = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    workspaceId: workspace.id,
    userId: currentUser.uid,
    userName: currentUser.displayName || "Admin",
    action: "member_role_changed",
    details: `Updated ${currentMember.name}'s role to ${newRole.toUpperCase()}`,
    timestamp,
  };
  saveLocalActivity(actLog);

  if (auth.currentUser) {
    try {
      await updateDoc(doc(db, "shared_workspaces", workspace.id), {
        members: updatedMembers,
        updatedAt: timestamp,
      });
      await setDoc(
        doc(db, "shared_workspaces", workspace.id, "activities", actLog.id),
        actLog
      );
    } catch (e) {
      console.warn("Firestore update role failed:", e);
    }
  }

  return updatedWs;
}

/**
 * Remove a collaborator from workspace
 */
export async function removeMemberFromWorkspace(
  workspace: SharedWorkspace,
  targetUserId: string,
  currentUser: {
    uid: string;
    displayName?: string | null;
  }
): Promise<SharedWorkspace> {
  const memberName = workspace.members[targetUserId]?.name || "Collaborator";
  const timestamp = Date.now();

  const newMembers = { ...workspace.members };
  delete newMembers[targetUserId];
  const newMemberIds = workspace.memberIds.filter((id) => id !== targetUserId);

  const updatedWs: SharedWorkspace = {
    ...workspace,
    members: newMembers,
    memberIds: newMemberIds,
    updatedAt: timestamp,
  };

  saveLocalWorkspaces([updatedWs, ...getLocalWorkspaces().filter((w) => w.id !== updatedWs.id)]);

  const actLog: ActivityLogItem = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    workspaceId: workspace.id,
    userId: currentUser.uid,
    userName: currentUser.displayName || "Admin",
    action: "member_removed",
    details: `Removed ${memberName} from workspace`,
    timestamp,
  };
  saveLocalActivity(actLog);

  if (auth.currentUser) {
    try {
      await updateDoc(doc(db, "shared_workspaces", workspace.id), {
        members: newMembers,
        memberIds: newMemberIds,
        updatedAt: timestamp,
      });
      await setDoc(
        doc(db, "shared_workspaces", workspace.id, "activities", actLog.id),
        actLog
      );
    } catch (e) {
      console.warn("Firestore remove member failed:", e);
    }
  }

  return updatedWs;
}

/**
 * Add a task to shared task list workspace
 */
export async function addSharedTaskToWorkspace(
  workspace: SharedWorkspace,
  taskData: Omit<SharedTask, "id" | "createdAt" | "updatedAt">,
  currentUser: {
    uid: string;
    displayName?: string | null;
    email?: string | null;
  }
): Promise<SharedWorkspace> {
  const taskId = `stask_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = Date.now();
  const authorName = currentUser.displayName || "Collaborator";

  const newTask: SharedTask = {
    ...taskData,
    id: taskId,
    createdBy: {
      userId: currentUser.uid,
      name: authorName,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const existingTasks = workspace.tasks || [];
  const updatedTasks = [newTask, ...existingTasks];

  const updatedWs: SharedWorkspace = {
    ...workspace,
    tasks: updatedTasks,
    updatedAt: timestamp,
    lastModifiedBy: {
      userId: currentUser.uid,
      name: authorName,
      email: currentUser.email || "",
    },
  };

  // Save local
  saveLocalWorkspaces([updatedWs, ...getLocalWorkspaces().filter((w) => w.id !== updatedWs.id)]);

  // Activity Log
  const details = taskData.assigneeName
    ? `Created task "${taskData.title}" and assigned to ${taskData.assigneeName}`
    : `Created task "${taskData.title}"`;

  const actLog: ActivityLogItem = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    workspaceId: workspace.id,
    userId: currentUser.uid,
    userName: authorName,
    userEmail: currentUser.email || "",
    action: taskData.assigneeName ? "task_assigned" : "task_created",
    details,
    targetId: taskId,
    timestamp,
  };
  saveLocalActivity(actLog);

  // If assigned to another user, send assignment notification
  if (taskData.assigneeId && taskData.assigneeId !== currentUser.uid) {
    const notif: CollaborationNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: taskData.assigneeId,
      fromUserId: currentUser.uid,
      fromUserName: authorName,
      workspaceId: workspace.id,
      workspaceTitle: workspace.title,
      workspaceType: "tasks",
      type: "task_assigned",
      title: "New Task Assigned to You",
      message: `${authorName} assigned "${taskData.title}" to you in "${workspace.title}".`,
      read: false,
      timestamp,
    };
    saveLocalNotification(notif);

    if (auth.currentUser) {
      try {
        await setDoc(
          doc(
            db,
            "users",
            taskData.assigneeId,
            "collaboration_notifications",
            notif.id
          ),
          notif
        );
      } catch (e) {
        console.warn("Could not send cloud assignment notification:", e);
      }
    }
  }

  // Firestore update
  if (auth.currentUser) {
    try {
      await updateDoc(doc(db, "shared_workspaces", workspace.id), {
        tasks: updatedTasks,
        updatedAt: timestamp,
        lastModifiedBy: updatedWs.lastModifiedBy,
      });
      await setDoc(
        doc(db, "shared_workspaces", workspace.id, "activities", actLog.id),
        actLog
      );
    } catch (e) {
      console.warn("Firestore add task failed:", e);
    }
  }

  return updatedWs;
}

/**
 * Update task in shared workspace
 */
export async function updateSharedTaskInWorkspace(
  workspace: SharedWorkspace,
  updatedTask: SharedTask,
  currentUser: {
    uid: string;
    displayName?: string | null;
    email?: string | null;
  }
): Promise<SharedWorkspace> {
  const timestamp = Date.now();
  const authorName = currentUser.displayName || "Collaborator";

  const existingTasks = workspace.tasks || [];
  const oldTask = existingTasks.find((t) => t.id === updatedTask.id);
  const updatedTasks = existingTasks.map((t) =>
    t.id === updatedTask.id ? { ...updatedTask, updatedAt: timestamp } : t
  );

  const updatedWs: SharedWorkspace = {
    ...workspace,
    tasks: updatedTasks,
    updatedAt: timestamp,
    lastModifiedBy: {
      userId: currentUser.uid,
      name: authorName,
      email: currentUser.email || "",
    },
  };

  saveLocalWorkspaces([updatedWs, ...getLocalWorkspaces().filter((w) => w.id !== updatedWs.id)]);

  let actionType: ActivityLogItem["action"] = "task_updated";
  let actionDetail = `Updated task "${updatedTask.title}"`;

  if (oldTask && !oldTask.completed && updatedTask.completed) {
    actionType = "task_completed";
    actionDetail = `Marked task "${updatedTask.title}" as completed`;
  } else if (oldTask && oldTask.completed && !updatedTask.completed) {
    actionType = "task_uncompleted";
    actionDetail = `Reopened task "${updatedTask.title}"`;
  } else if (oldTask && oldTask.assigneeId !== updatedTask.assigneeId && updatedTask.assigneeName) {
    actionType = "task_assigned";
    actionDetail = `Reassigned task "${updatedTask.title}" to ${updatedTask.assigneeName}`;
  }

  const actLog: ActivityLogItem = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    workspaceId: workspace.id,
    userId: currentUser.uid,
    userName: authorName,
    userEmail: currentUser.email || "",
    action: actionType,
    details: actionDetail,
    targetId: updatedTask.id,
    timestamp,
  };
  saveLocalActivity(actLog);

  // Notify assignee if reassigned
  if (
    updatedTask.assigneeId &&
    updatedTask.assigneeId !== currentUser.uid &&
    oldTask?.assigneeId !== updatedTask.assigneeId
  ) {
    const notif: CollaborationNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: updatedTask.assigneeId,
      fromUserId: currentUser.uid,
      fromUserName: authorName,
      workspaceId: workspace.id,
      workspaceTitle: workspace.title,
      workspaceType: "tasks",
      type: "task_assigned",
      title: "Task Assigned to You",
      message: `${authorName} assigned task "${updatedTask.title}" to you in "${workspace.title}".`,
      read: false,
      timestamp,
    };
    saveLocalNotification(notif);
  }

  if (auth.currentUser) {
    try {
      await updateDoc(doc(db, "shared_workspaces", workspace.id), {
        tasks: updatedTasks,
        updatedAt: timestamp,
        lastModifiedBy: updatedWs.lastModifiedBy,
      });
      await setDoc(
        doc(db, "shared_workspaces", workspace.id, "activities", actLog.id),
        actLog
      );
    } catch (e) {
      console.warn("Firestore update task failed:", e);
    }
  }

  return updatedWs;
}

/**
 * Delete a task from shared workspace
 */
export async function deleteSharedTaskFromWorkspace(
  workspace: SharedWorkspace,
  taskId: string,
  currentUser: {
    uid: string;
    displayName?: string | null;
  }
): Promise<SharedWorkspace> {
  const timestamp = Date.now();
  const existingTasks = workspace.tasks || [];
  const taskToDelete = existingTasks.find((t) => t.id === taskId);
  const updatedTasks = existingTasks.filter((t) => t.id !== taskId);

  const updatedWs: SharedWorkspace = {
    ...workspace,
    tasks: updatedTasks,
    updatedAt: timestamp,
  };

  saveLocalWorkspaces([updatedWs, ...getLocalWorkspaces().filter((w) => w.id !== updatedWs.id)]);

  const actLog: ActivityLogItem = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    workspaceId: workspace.id,
    userId: currentUser.uid,
    userName: currentUser.displayName || "Collaborator",
    action: "task_deleted",
    details: `Deleted task "${taskToDelete?.title || "Untitled"}"`,
    targetId: taskId,
    timestamp,
  };
  saveLocalActivity(actLog);

  if (auth.currentUser) {
    try {
      await updateDoc(doc(db, "shared_workspaces", workspace.id), {
        tasks: updatedTasks,
        updatedAt: timestamp,
      });
      await setDoc(
        doc(db, "shared_workspaces", workspace.id, "activities", actLog.id),
        actLog
      );
    } catch (e) {
      console.warn("Firestore delete task failed:", e);
    }
  }

  return updatedWs;
}

/**
 * Update collaborative notes document content and title
 */
export async function updateSharedNotesInWorkspace(
  workspace: SharedWorkspace,
  updates: {
    title?: string;
    noteContent?: string;
    noteTags?: string[];
  },
  currentUser: {
    uid: string;
    displayName?: string | null;
    email?: string | null;
  }
): Promise<SharedWorkspace> {
  const timestamp = Date.now();
  const authorName = currentUser.displayName || "Collaborator";

  const updatedWs: SharedWorkspace = {
    ...workspace,
    title: updates.title !== undefined ? updates.title : workspace.title,
    noteContent: updates.noteContent !== undefined ? updates.noteContent : workspace.noteContent,
    noteTags: updates.noteTags !== undefined ? updates.noteTags : workspace.noteTags,
    updatedAt: timestamp,
    lastModifiedBy: {
      userId: currentUser.uid,
      name: authorName,
      email: currentUser.email || "",
    },
  };

  saveLocalWorkspaces([updatedWs, ...getLocalWorkspaces().filter((w) => w.id !== updatedWs.id)]);

  const actLog: ActivityLogItem = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    workspaceId: workspace.id,
    userId: currentUser.uid,
    userName: authorName,
    userEmail: currentUser.email || "",
    action: "notes_updated",
    details: `Updated notes in "${updatedWs.title}"`,
    timestamp,
  };
  saveLocalActivity(actLog);

  // Notify other members (debounced / stored)
  Object.keys(workspace.members).forEach((memberId) => {
    if (memberId !== currentUser.uid) {
      const notif: CollaborationNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: memberId,
        fromUserId: currentUser.uid,
        fromUserName: authorName,
        workspaceId: workspace.id,
        workspaceTitle: updatedWs.title,
        workspaceType: "notes",
        type: "note_updated",
        title: "Shared Notes Updated",
        message: `${authorName} updated content in "${updatedWs.title}".`,
        read: false,
        timestamp,
      };
      saveLocalNotification(notif);
    }
  });

  if (auth.currentUser) {
    try {
      await updateDoc(doc(db, "shared_workspaces", workspace.id), {
        title: updatedWs.title,
        noteContent: updatedWs.noteContent,
        noteTags: updatedWs.noteTags,
        updatedAt: timestamp,
        lastModifiedBy: updatedWs.lastModifiedBy,
      });
      await setDoc(
        doc(db, "shared_workspaces", workspace.id, "activities", actLog.id),
        actLog
      );
    } catch (e) {
      console.warn("Firestore update notes failed:", e);
    }
  }

  return updatedWs;
}

/**
 * Delete an entire shared workspace (Owner only)
 */
export async function deleteSharedWorkspace(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const locals = getLocalWorkspaces();
  saveLocalWorkspaces(locals.filter((w) => w.id !== workspaceId));

  if (auth.currentUser) {
    try {
      await deleteDoc(doc(db, "shared_workspaces", workspaceId));
    } catch (e) {
      console.warn("Firestore delete workspace failed:", e);
    }
  }
  return true;
}

/**
 * Real-time subscription to user's shared workspaces
 */
export function subscribeToUserWorkspaces(
  userId: string,
  onUpdate: (workspaces: SharedWorkspace[]) => void
): () => void {
  // Always emit local data immediately
  const initialLocal = getLocalWorkspaces().filter(
    (w) => w.memberIds.includes(userId) || w.ownerId === userId
  );
  onUpdate(initialLocal);

  if (!auth.currentUser) {
    // Return empty cleanup if offline
    return () => {};
  }

  try {
    const q = query(
      collection(db, "shared_workspaces"),
      where("memberIds", "array-contains", userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const cloudWorkspaces: SharedWorkspace[] = [];
        snapshot.forEach((docSnap) => {
          cloudWorkspaces.push(docSnap.data() as SharedWorkspace);
        });

        // Merge with any local offline creations
        const locals = getLocalWorkspaces();
        const cloudIds = new Set(cloudWorkspaces.map((w) => w.id));
        const missingLocal = locals.filter((w) => !cloudIds.has(w.id) && (w.memberIds.includes(userId) || w.ownerId === userId));
        
        const merged = [...cloudWorkspaces, ...missingLocal].sort((a, b) => b.updatedAt - a.updatedAt);
        saveLocalWorkspaces(merged);
        onUpdate(merged);
      },
      (error) => {
        console.warn("Firestore workspaces subscription error, falling back to local:", error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Error setting up workspaces subscription:", err);
    return () => {};
  }
}

/**
 * Real-time subscription to a workspace's activity logs
 */
export function subscribeToWorkspaceActivities(
  workspaceId: string,
  onUpdate: (activities: ActivityLogItem[]) => void
): () => void {
  const localActs = getLocalActivities(workspaceId);
  onUpdate(localActs);

  if (!auth.currentUser) {
    return () => {};
  }

  try {
    const activitiesRef = collection(db, "shared_workspaces", workspaceId, "activities");
    const q = query(activitiesRef, orderBy("timestamp", "desc"), limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const cloudActs: ActivityLogItem[] = [];
        snapshot.forEach((docSnap) => {
          cloudActs.push(docSnap.data() as ActivityLogItem);
        });
        if (cloudActs.length > 0) {
          onUpdate(cloudActs);
        }
      },
      (error) => {
        console.warn("Activity logs subscription error:", error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Error setting up activity logs subscription:", err);
    return () => {};
  }
}

/**
 * Real-time subscription to user's collaboration notifications
 */
export function subscribeToCollaborationNotifications(
  userId: string,
  onUpdate: (notifications: CollaborationNotification[]) => void
): () => void {
  const localNotifs = getLocalNotifications(userId);
  onUpdate(localNotifs);

  if (!auth.currentUser) {
    return () => {};
  }

  try {
    const notifsRef = collection(db, "users", userId, "collaboration_notifications");
    const q = query(notifsRef, orderBy("timestamp", "desc"), limit(30));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const cloudNotifs: CollaborationNotification[] = [];
        snapshot.forEach((docSnap) => {
          cloudNotifs.push(docSnap.data() as CollaborationNotification);
        });
        if (cloudNotifs.length > 0) {
          onUpdate(cloudNotifs);
        }
      },
      (error) => {
        console.warn("Collaboration notifications subscription error:", error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Error subscribing to notifications:", err);
    return () => {};
  }
}

/**
 * Generate full shareable URL with unique join link
 */
export function generateShareableLink(joinCode: string): string {
  const origin = window.location.origin + window.location.pathname;
  return `${origin}?join=${encodeURIComponent(joinCode)}`;
}
